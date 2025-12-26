use axum::{
    extract::{State, Json, Extension},
    http::{header},
    response::IntoResponse,
};
use axum_extra::extract::cookie::{CookieJar, SameSite, Cookie};
use uuid::Uuid;
use time;
use blog_db::{
    RegisterRequest, LoginRequest, AuthResponse, UserInfo, User, RefreshToken,
};
use blog_shared::{AppError, AuthUser};
use crate::state::AppState;
use serde_json::json;

/// 用户注册
#[utoipa::path(
    post,
    path = "/auth/register",
    tag = "auth",
    request_body = RegisterRequest,
    responses(
        (status = 200, description = "注册成功", body = AuthResponse),
        (status = 400, description = "输入无效"),
        (status = 409, description = "邮箱或用户名已存在")
    )
)]
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 验证输入
    if payload.email.len() < 3 || payload.username.len() < 3 || payload.password.len() < 8 {
        return Err(AppError::InvalidInput);
    }

    // 使用事务确保原子性
    let mut tx = state.db.begin().await?;

    // 检查邮箱是否已存在
    let existing: Option<bool> = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)"
    )
    .bind(&payload.email)
    .fetch_one(&mut *tx)
    .await?;

    if existing.unwrap_or(false) {
        return Err(AppError::EmailAlreadyExists);
    }

    // 检查用户名是否已存在
    let existing: Option<bool> = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)"
    )
    .bind(&payload.username)
    .fetch_one(&mut *tx)
    .await?;

    if existing.unwrap_or(false) {
        return Err(AppError::UsernameAlreadyExists);
    }

    // 密码哈希

    // 使用 JWT 服务的密码哈希功能（它会自动使用 salt）
    let password_hash = state.jwt.hash_password(&payload.password)?;

    // 创建用户
    let row = sqlx::query!(
        "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, password_hash, profile, email_verified, role, created_at, updated_at",
        &payload.email,
        &payload.username,
        &password_hash
    )
    .fetch_one(&mut *tx)
    .await?;

    let user = User {
        id: row.id,
        email: row.email,
        username: row.username,
        password_hash: row.password_hash,
        profile: row.profile,
        email_verified: row.email_verified,
        role: match row.role.as_str() {
            "admin" => blog_db::UserRole::Admin,
            "moderator" => blog_db::UserRole::Moderator,
            _ => blog_db::UserRole::User,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
    };

    // 创建 refresh token
    let (refresh_token, family_id) = state.jwt.create_refresh_token(&user.id)?;
    let token_hash = state.jwt.hash_token(&refresh_token);

    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, created_ip)
        VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4::inet)
        "#
    )
    .bind(user.id)
    .bind(&token_hash)
    .bind(family_id)
    .bind("127.0.0.1") // TODO: 从请求中获取真实 IP
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 生成 JWT
    let access_token = state.jwt.create_access_token(&user.id, &user.email, &user.username)?;

    // 设置 refresh token cookie
    let cookie = CookieJar::new()
        .add(
            Cookie::build(("refresh_token", refresh_token))
                .path("/")
                .http_only(true)
                .secure(true)
                .same_site(SameSite::Lax)
                .max_age(time::Duration::days(7))
                .build(),
        );

    Ok((
        [(header::SET_COOKIE, cookie.get("refresh_token").unwrap().to_string())],
        Json(AuthResponse {
            access_token,
            user: user.into(),
        })
    ).into_response())
}

/// 用户登录
#[utoipa::path(
    post,
    path = "/auth/login",
    tag = "auth",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "登录成功", body = AuthResponse, headers(
            ("set-cookie", description = "HTTP-only refresh token cookie")
        )),
        (status = 401, description = "邮箱或密码错误")
    )
)]
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 查找用户
    let row = sqlx::query!(
        "SELECT id, email, username, password_hash, profile, email_verified, role, created_at, updated_at FROM users WHERE email = $1",
        &payload.email
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::InvalidCredentials)?;

    let user = User {
        id: row.id,
        email: row.email,
        username: row.username,
        password_hash: row.password_hash,
        profile: row.profile,
        email_verified: row.email_verified,
        role: match row.role.as_str() {
            "admin" => blog_db::UserRole::Admin,
            "moderator" => blog_db::UserRole::Moderator,
            _ => blog_db::UserRole::User,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
    };

    // 验证密码
    use argon2::{Argon2, PasswordHash, PasswordVerifier};

    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AppError::InternalError)?;
    let argon2 = Argon2::default();

    if argon2.verify_password(
        payload.password.as_bytes(),
        &parsed_hash
    ).is_err() {
        return Err(AppError::InvalidCredentials);
    }

    // 检查是否已有活跃的 refresh token
    let token_row = sqlx::query!(
        "SELECT id, user_id, token_hash, family_id, replaced_by_hash, revoked_at, expires_at, created_at, last_used_at, created_ip, user_agent_hash FROM refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        &user.id
    )
    .fetch_optional(&state.db)
    .await?;

    let (refresh_token, _family_id) = if let Some(token_row) = token_row {
        let token_record = RefreshToken {
            id: token_row.id,
            user_id: token_row.user_id,
            token_hash: token_row.token_hash,
            family_id: token_row.family_id,
            replaced_by_hash: token_row.replaced_by_hash,
            revoked_at: token_row.revoked_at,
            expires_at: token_row.expires_at,
            created_at: token_row.created_at,
            last_used_at: token_row.last_used_at,
            created_ip: token_row.created_ip.map(|ip| ip.to_string()),
            user_agent_hash: token_row.user_agent_hash,
        };
        // 生成新的 refresh token（基于现有的 family_id）
        let (new_token, _) = state.jwt.create_refresh_token(&user.id)?;
        (new_token, token_record.family_id)
    } else {
        // 创建新的 refresh token
        let (new_token, _) = state.jwt.create_refresh_token(&user.id)?;
        let new_family_id = Uuid::new_v4();
        let token_hash = state.jwt.hash_token(&new_token);

        sqlx::query(
            r#"
            INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, created_ip)
            VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4::inet)
            "#
        )
        .bind(user.id)
        .bind(&token_hash)
        .bind(new_family_id)
        .bind("127.0.0.1") // TODO: 从请求中获取真实 IP
        .execute(&state.db)
        .await?;

        (new_token, new_family_id)
    };

    // 生成 access token
    let access_token = state.jwt.create_access_token(&user.id, &user.email, &user.username)?;

    // 设置 refresh token cookie
    let cookie = CookieJar::new()
        .add(
            Cookie::build(("refresh_token", refresh_token))
                .path("/")
                .http_only(true)
                .secure(true)
                .same_site(SameSite::Lax)
                .max_age(time::Duration::days(7))
                .build(),
        );

    Ok((
        [(header::SET_COOKIE, cookie.get("refresh_token").unwrap().to_string())],
        Json(AuthResponse {
            access_token,
            user: user.into(),
        })
    ).into_response())
}

/// 刷新访问令牌
#[utoipa::path(
    post,
    path = "/auth/refresh",
    tag = "auth",
    responses(
        (status = 200, description = "Token刷新成功", body = serde_json::Value, example = json!({"access_token": "new_access_token"})),
        (status = 401, description = "无效或过期的refresh token"),
        (status = 400, description = "缺少refresh token cookie")
    )
)]
pub async fn refresh(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<Json<serde_json::Value>, AppError> {
    let refresh_token = jar
        .get("refresh_token")
        .ok_or(AppError::MissingRefreshToken)?
        .value();

    // 验证 refresh token
    let token_hash = state.jwt.hash_token(refresh_token);
    let token_row = sqlx::query!(
        "SELECT id, user_id, token_hash, family_id, replaced_by_hash, revoked_at, expires_at, created_at, last_used_at, created_ip, user_agent_hash FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL",
        &token_hash
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::InvalidToken)?;

    let token_record = RefreshToken {
        id: token_row.id,
        user_id: token_row.user_id,
        token_hash: token_row.token_hash,
        family_id: token_row.family_id,
        replaced_by_hash: token_row.replaced_by_hash,
        revoked_at: token_row.revoked_at,
        expires_at: token_row.expires_at,
        created_at: token_row.created_at,
        last_used_at: token_row.last_used_at,
        created_ip: token_row.created_ip.map(|ip| ip.to_string()),
        user_agent_hash: token_row.user_agent_hash,
    };

    if token_record.expires_at < chrono::Utc::now() {
        return Err(AppError::TokenExpired);
    }

    // 获取用户信息
    let user_row = sqlx::query!(
        "SELECT id, email, username, password_hash, profile, email_verified, role, created_at, updated_at FROM users WHERE id = $1",
        &token_record.user_id
    )
    .fetch_one(&state.db)
    .await?;

    let user = User {
        id: user_row.id,
        email: user_row.email,
        username: user_row.username,
        password_hash: user_row.password_hash,
        profile: user_row.profile,
        email_verified: user_row.email_verified,
        role: match user_row.role.as_str() {
            "admin" => blog_db::UserRole::Admin,
            "moderator" => blog_db::UserRole::Moderator,
            _ => blog_db::UserRole::User,
        },
        created_at: user_row.created_at,
        updated_at: user_row.updated_at,
    };

    // 生成新的 access token
    let access_token = state.jwt.create_access_token(&user.id, &user.email, &user.username)?;

    // 更新 token 的最后使用时间
    sqlx::query(
        "UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1"
    )
    .bind(token_record.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "access_token": access_token,
    })))
}

/// 获取当前用户信息
#[utoipa::path(
    get,
    path = "/auth/me",
    tag = "auth",
    responses(
        (status = 200, description = "获取用户信息成功", body = UserInfo),
        (status = 401, description = "未认证")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn me(
    State(_state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
) -> Result<Json<UserInfo>, AppError> {
    Ok(Json(UserInfo {
        id: auth_user.id,
        email: auth_user.email,
        username: auth_user.username,
        profile: auth_user.profile,
        email_verified: auth_user.email_verified,
    }))
}

/// 用户登出
#[utoipa::path(
    post,
    path = "/auth/logout",
    tag = "auth",
    responses(
        (status = 200, description = "登出成功"),
        (status = 401, description = "未认证")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(), AppError> {
    if let Some(refresh_token) = jar.get("refresh_token") {
        // 吊销 token
        let token_hash = state.jwt.hash_token(refresh_token.value());
        sqlx::query(
            "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1"
        )
        .bind(&token_hash)
        .execute(&state.db)
        .await?;
    }

    // 清除 cookie
    let _cookie = Cookie::build(("refresh_token", ""))
        .path("/")
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Lax)
        .max_age(time::Duration::seconds(0))
        .build();

    Ok(())
}