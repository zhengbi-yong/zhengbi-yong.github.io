use crate::middleware::csrf::{generate_csrf_token, set_csrf_cookie};
use crate::state::AppState;
use crate::utils::ip_extractor::RealIp;
use axum::{
    extract::{Extension, Json, State},
    http::{header, HeaderMap, HeaderValue},
    response::IntoResponse,
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use blog_db::{AuthResponse, LoginRequest, RefreshToken, RegisterRequest, User, UserInfo};
use blog_shared::{AppError, AuthUser, PasswordValidator};
use serde::{Deserialize, Serialize};
use serde_json::json;
use time;
use uuid::Uuid;

/// 安全地将 cookie 字符串解析为 HeaderValue
/// Cookie 由 axum Cookie builder 生成，理论上不会解析失败，
/// 但为防御起见记录错误日志并提供 fallback
fn cookie_to_header_value(cookie_str: &str) -> HeaderValue {
    cookie_str.parse().unwrap_or_else(|e| {
        tracing::error!(error = %e, cookie = %cookie_str, "Failed to parse cookie as HeaderValue");
        // 返回一个空的 Set-Cookie 作为安全兜底
        HeaderValue::from_static("")
    })
}

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
    RealIp(client_ip): RealIp,
    Json(payload): Json<RegisterRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 验证输入 - 邮箱和用户名
    if payload.email.len() < 3 || payload.email.len() > 255 {
        return Err(AppError::InvalidInput);
    }
    if payload.username.len() < 3 || payload.username.len() > 50 {
        return Err(AppError::InvalidInput);
    }

    // 验证密码强度
    PasswordValidator::default()
        .validate(&payload.password)
        .map_err(|_e| AppError::InvalidInput)?;

    // 密码哈希
    let password_hash = state.jwt.hash_password(&payload.password)?;

    // 使用事务确保原子性
    let mut tx = state.db.begin().await?;

    // 检查邮箱是否已存在（数据库用部分唯一索引，无法使用 ON CONFLICT）
    let email_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)",
    )
    .bind(&payload.email)
    .fetch_one(&mut *tx)
    .await?;

    if email_exists {
        return Err(AppError::Conflict("该邮箱已被注册".to_string()));
    }

    // 插入用户
    let row = sqlx::query!(
        r#"
        INSERT INTO users (email, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, email, username, password_hash, profile, email_verified, role, created_at, updated_at
        "#,
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

    // 保存 refresh token 到数据库
    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, created_ip)
        VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4::inet)
        "#,
    )
    .bind(user.id)
    .bind(&token_hash)
    .bind(family_id)
    .bind(client_ip.to_string())
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 生成 JWT
    let access_token = state
        .jwt
        .create_access_token(&user.id, &user.email, &user.username)?;

    // 设置 refresh token cookie
    // GOLDEN_RULES 1.1: secure=true 仅在生产环境启用
    let is_production = std::env::var("ENVIRONMENT").unwrap_or_default() == "production";

    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .path("/")
        .http_only(true)
        .secure(is_production)
        .same_site(SameSite::Lax)
        .max_age(time::Duration::days(7))
        .build();

    // GOLDEN_RULES 1.1: 同时设置 access_token cookie
    // 前端使用 credentials: 'include' 自动发送，无需手动设置 Authorization header
    let access_cookie = Cookie::build(("access_token", access_token.clone()))
        .path("/")
        .http_only(true)
        .secure(is_production)
        .same_site(SameSite::Lax)
        .max_age(time::Duration::minutes(15)) // Access token 15分钟有效期
        .build();

    // 使用 HeaderMap 设置多个 Set-Cookie 头
    let mut headers = HeaderMap::new();
    headers.append(
        header::SET_COOKIE,
        cookie_to_header_value(&refresh_cookie.to_string()),
    );
    headers.append(
        header::SET_COOKIE,
        cookie_to_header_value(&access_cookie.to_string()),
    );

    // 生成 CSRF token 并设置 XSRF-TOKEN cookie（HttpOnly=false，前端可读）
    let csrf_token = generate_csrf_token(&state).await.map_err(|e| {
        tracing::error!("Failed to generate CSRF token: {}", e);
        AppError::InternalError
    })?;
    let (csrf_cookie, xsrf_cookie) = set_csrf_cookie(&csrf_token.token);
    headers.append(header::SET_COOKIE, cookie_to_header_value(&csrf_cookie));
    headers.append(header::SET_COOKIE, cookie_to_header_value(&xsrf_cookie));

    Ok((
        headers,
        Json(AuthResponse {
            access_token,
            user: user.into(),
        }),
    )
        .into_response())
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
    RealIp(client_ip): RealIp,
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

    let parsed_hash =
        PasswordHash::new(&user.password_hash).map_err(|_| AppError::InternalError)?;
    let argon2 = Argon2::default();

    if argon2
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .is_err()
    {
        return Err(AppError::InvalidCredentials);
    }

    // 使用事务确保原子性：吊销所有旧 token，创建新 token family
    let mut tx = state.db.begin().await?;

    // 吊销用户所有活跃的 refresh token（安全改进：登录时吊销旧 token）
    let revoked_count = sqlx::query!(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()",
        &user.id
    )
    .execute(&mut *tx)
    .await?
    .rows_affected();

    if revoked_count > 0 {
        tracing::info!("吊销了 {} 个旧 token（用户重新登录）", revoked_count);
    }

    // 创建新的 refresh token family
    let (new_token, _) = state.jwt.create_refresh_token(&user.id)?;
    let new_family_id = Uuid::new_v4();
    let new_token_hash = state.jwt.hash_token(&new_token);

    // 插入新的 refresh token（使用 sqlx::query 以支持字符串 IP）
    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, created_ip)
        VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', $4::inet)
        "#,
    )
    .bind(user.id)
    .bind(&new_token_hash)
    .bind(new_family_id)
    .bind(client_ip.to_string())
    .execute(&mut *tx)
    .await?;

    // 提交事务
    tx.commit().await?;

    // 生成 access token
    let access_token = state
        .jwt
        .create_access_token(&user.id, &user.email, &user.username)?;

    // 设置 refresh token cookie
    // GOLDEN_RULES 1.1: secure=true 仅在生产环境启用
    // 开发环境 (localhost) 使用 HTTP，cookie 需要能在 HTTP 下工作
    let is_production = std::env::var("ENVIRONMENT").unwrap_or_default() == "production";

    // 开发环境使用更宽松的 Cookie 策略，允许跨域子请求携带 Cookie
    // 生产环境使用严格策略：SameSite=Lax + Secure（HTTPS）
    let (refresh_cookie, access_cookie) = if is_production {
        (
            Cookie::build(("refresh_token", new_token))
                .path("/")
                .http_only(true)
                .secure(true)
                .same_site(SameSite::Lax)
                .max_age(time::Duration::days(7))
                .build(),
            Cookie::build(("access_token", access_token.clone()))
                .path("/")
                .http_only(true)
                .secure(true)
                .same_site(SameSite::Lax)
                .max_age(time::Duration::minutes(15))
                .build(),
        )
    } else {
        // 开发环境: SameSite=Lax (不需要 Secure)，允许同源子请求携带 Cookie
        // 不使用 SameSite=None，因为那需要 Secure 标志（浏览器强制要求）
        (
            Cookie::build(("refresh_token", new_token))
                .path("/")
                .http_only(true)
                .secure(false)
                .same_site(SameSite::Lax)
                .max_age(time::Duration::days(7))
                .build(),
            Cookie::build(("access_token", access_token.clone()))
                .path("/")
                .http_only(true)
                .secure(false)
                .same_site(SameSite::Lax)
                .max_age(time::Duration::minutes(15))
                .build(),
        )
    };

    // 使用 HeaderMap 设置多个 Set-Cookie 头
    let mut headers = HeaderMap::new();
    headers.append(
        header::SET_COOKIE,
        cookie_to_header_value(&refresh_cookie.to_string()),
    );
    headers.append(
        header::SET_COOKIE,
        cookie_to_header_value(&access_cookie.to_string()),
    );

    // 生成 CSRF token 并设置 XSRF-TOKEN cookie（HttpOnly=false，前端可读）
    let csrf_token = generate_csrf_token(&state).await.map_err(|e| {
        tracing::error!("Failed to generate CSRF token: {}", e);
        AppError::InternalError
    })?;
    let (csrf_cookie, xsrf_cookie) = set_csrf_cookie(&csrf_token.token);
    headers.append(header::SET_COOKIE, cookie_to_header_value(&csrf_cookie));
    headers.append(header::SET_COOKIE, cookie_to_header_value(&xsrf_cookie));

    Ok((
        headers,
        Json(AuthResponse {
            access_token,
            user: user.into(),
        }),
    )
        .into_response())
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
    let access_token = state
        .jwt
        .create_access_token(&user.id, &user.email, &user.username)?;

    // 更新 token 的最后使用时间
    sqlx::query("UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1")
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
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
) -> Result<Json<UserInfo>, AppError> {
    // 从数据库查询用户信息以获取最新的role
    let user = sqlx::query!(
        "SELECT id, email, username, profile, email_verified, role FROM users WHERE id = $1",
        auth_user.id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    Ok(Json(UserInfo {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
        email_verified: user.email_verified,
        role: user.role,
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
pub async fn logout(State(state): State<AppState>, jar: CookieJar) -> Result<(), AppError> {
    if let Some(refresh_token) = jar.get("refresh_token") {
        let token_hash = state.jwt.hash_token(refresh_token.value());
        sqlx::query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1")
            .bind(&token_hash)
            .execute(&state.db)
            .await?;
    }

    let is_production = std::env::var("ENVIRONMENT").unwrap_or_default() == "production";

    let _clear_cookie = Cookie::build(("refresh_token", ""))
        .path("/")
        .http_only(true)
        .secure(is_production)
        .same_site(SameSite::Lax)
        .max_age(time::Duration::seconds(0))
        .build();

    Ok(())
}

#[derive(Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Deserialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub new_password: String,
}

#[derive(Serialize)]
pub struct AuthMessageResponse {
    pub message: String,
}

/// 请求密码重置邮件
pub async fn forgot_password(
    State(state): State<AppState>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> Result<Json<AuthMessageResponse>, AppError> {
    // Always return success to avoid email enumeration
    let user = sqlx::query!(
        "SELECT id, email FROM users WHERE email = $1",
        &payload.email
    )
    .fetch_optional(&state.db)
    .await?;

    if let Some(user) = user {
        let reset_token = Uuid::new_v4().to_string();
        let token_hash = state.jwt.hash_token(&reset_token);

        sqlx::query!(
            r#"
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '1 hour')
            ON CONFLICT (user_id) DO UPDATE
              SET token_hash = EXCLUDED.token_hash,
                  expires_at = EXCLUDED.expires_at,
                  created_at = NOW()
            "#,
            user.id,
            token_hash,
        )
        .execute(&state.db)
        .await?;

        let _ = state
            .email_service
            .send_password_reset_email(&user.email, &reset_token)
            .await;
    }

    Ok(Json(AuthMessageResponse {
        message: "如果该邮箱已注册,您将收到密码重置邮件".to_string(),
    }))
}

/// 使用重置令牌更新密码
pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<Json<AuthMessageResponse>, AppError> {
    PasswordValidator::default()
        .validate(&payload.new_password)
        .map_err(|_| AppError::InvalidInput)?;

    let token_hash = state.jwt.hash_token(&payload.token);

    let row = sqlx::query!(
        "SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()",
        token_hash
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::BadRequest("无效或已过期的重置令牌".to_string()))?;

    let new_hash = state.jwt.hash_password(&payload.new_password)?;

    let mut tx = state.db.begin().await?;

    // 更新密码（事务内使用 query() 而非 query!）
    // GOLDEN_RULES §3.5: query! 在事务上下文中不工作
    sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2")
        .bind(&new_hash)
        .bind(row.user_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query("DELETE FROM password_reset_tokens WHERE user_id = $1")
        .bind(row.user_id)
        .execute(&mut *tx)
        .await?;

    // Revoke all refresh tokens for security
    sqlx::query!(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        row.user_id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(AuthMessageResponse {
        message: "密码已成功重置".to_string(),
    }))
}
