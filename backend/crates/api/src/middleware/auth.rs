use crate::AppState;
use axum::{
    extract::{Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use blog_shared::middleware::auth::{AuthError, AuthUser};

/// 认证中间件
///
/// 验证 JWT token 并从数据库加载完整用户信息
/// 同时检查 token 是否在黑名单中
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    if let Some(auth_header) = auth_header {
        let (scheme, token) = auth_header
            .split_once(' ')
            .ok_or(AuthError::InvalidHeaderFormat)?;

        if scheme.to_lowercase() != "bearer" {
            return Err(AuthError::InvalidHeaderFormat);
        }

        // 验证 JWT token
        match state.jwt.verify_access_token(token) {
            Ok(claims) => {
                let user_id =
                    uuid::Uuid::parse_str(&claims.sub).map_err(|_| AuthError::InvalidToken)?;

                // 检查 token 是否在黑名单中
                if is_token_blacklisted(&state, token).await? {
                    tracing::warn!("Token is blacklisted for user: {}", user_id);
                    return Err(AuthError::InvalidToken);
                }

                // 从数据库加载完整用户信息
                let auth_user = load_user_from_db(&state.db, user_id).await.map_err(|e| {
                    tracing::error!("Failed to load user from database: {}", e);
                    AuthError::InvalidToken
                })?;

                // 将用户信息添加到请求扩展中
                request.extensions_mut().insert(auth_user);
                Ok(next.run(request).await)
            }
            Err(e) => {
                tracing::warn!("JWT verification failed: {}", e);
                Err(AuthError::InvalidToken)
            }
        }
    } else {
        Err(AuthError::MissingToken)
    }
}

/// 从数据库加载完整用户信息
async fn load_user_from_db(
    db: &sqlx::PgPool,
    user_id: uuid::Uuid,
) -> Result<AuthUser, sqlx::Error> {
    let row = sqlx::query!(
        r#"
        SELECT 
            id, 
            email, 
            username, 
            profile, 
            email_verified, 
            role
        FROM users 
        WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(db)
    .await?;

    Ok(AuthUser {
        id: row.id,
        email: row.email,
        username: row.username,
        profile: row.profile,
        email_verified: row.email_verified,
        role: row.role,
    })
}

/// 检查 token 是否在黑名单中
async fn is_token_blacklisted(state: &AppState, token: &str) -> Result<bool, AuthError> {
    let token_hash = state.jwt.hash_token(token);
    let key = format!("blacklist:{}", token_hash);

    let mut conn = state.redis.get().await.map_err(|e| {
        tracing::error!("Failed to get Redis connection: {}", e);
        AuthError::InvalidToken
    })?;

    use redis::AsyncCommands;
    let exists: bool = conn.exists(&key).await.map_err(|e| {
        tracing::error!("Redis blacklist check failed: {}", e);
        AuthError::InvalidToken
    })?;

    Ok(exists)
}

/// 将 token 加入黑名单
///
/// 在用户登出时调用，使 token 失效
/// token 在黑名单中的有效期与 token 本身的有效期相同（15分钟）
pub async fn blacklist_token(
    state: &AppState,
    token: &str,
    expires_in_seconds: i64,
) -> Result<(), AuthError> {
    let token_hash = state.jwt.hash_token(token);
    let key = format!("blacklist:{}", token_hash);

    let mut conn = state.redis.get().await.map_err(|e| {
        tracing::error!("Failed to get Redis connection: {}", e);
        AuthError::InvalidToken
    })?;

    use redis::AsyncCommands;
    conn.set_ex::<_, _, ()>(&key, "1", expires_in_seconds as u64)
        .await
        .map_err(|e| {
            tracing::error!("Failed to blacklist token: {}", e);
            AuthError::InvalidToken
        })?;

    tracing::debug!("Token blacklisted for {} seconds", expires_in_seconds);
    Ok(())
}

/// 将用户的所有 token 加入黑名单（强制登出所有设备）
///
/// 在用户修改密码或账户被锁定时调用
/// 通过记录一个时间戳，在此之前签发的所有 token 都无效
pub async fn blacklist_all_user_tokens(
    state: &AppState,
    user_id: uuid::Uuid,
) -> Result<(), AuthError> {
    let key = format!("user_tokens_invalid:{}", user_id);

    let mut conn = state.redis.get().await.map_err(|e| {
        tracing::error!("Failed to get Redis connection: {}", e);
        AuthError::InvalidToken
    })?;

    use redis::AsyncCommands;
    let now = chrono::Utc::now().timestamp();
    // 有效期 7 天（与 refresh token 有效期相同）
    conn.set_ex::<_, _, ()>(&key, now, 86400 * 7)
        .await
        .map_err(|e| {
            tracing::error!("Failed to invalidate user tokens: {}", e);
            AuthError::InvalidToken
        })?;

    tracing::info!("All tokens invalidated for user: {}", user_id);
    Ok(())
}

/// 检查用户是否被强制登出
async fn is_user_force_logged_out(
    state: &AppState,
    user_id: uuid::Uuid,
    token_issued_at: i64,
) -> Result<bool, AuthError> {
    let key = format!("user_tokens_invalid:{}", user_id);

    let mut conn = state.redis.get().await.map_err(|e| {
        tracing::error!("Failed to get Redis connection: {}", e);
        AuthError::InvalidToken
    })?;

    use redis::AsyncCommands;
    let invalid_since: Option<i64> = conn.get(&key).await.map_err(|e| {
        tracing::error!("Redis user invalidation check failed: {}", e);
        AuthError::InvalidToken
    })?;

    // 如果存在强制登出记录，且 token 签发时间早于强制登出时间，则 token 无效
    if let Some(invalid_since) = invalid_since {
        if token_issued_at < invalid_since {
            return Ok(true);
        }
    }

    Ok(false)
}

/// 可选的认证中间件
///
/// 尝试验证 token 但不会因无效 token 而拒绝请求
/// 用于需要区分已登录/未登录用户的公开路由
pub async fn optional_auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some((scheme, token)) = auth_header.split_once(' ') {
            if scheme.to_lowercase() == "bearer" {
                if let Ok(claims) = state.jwt.verify_access_token(token) {
                    if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
                        // 检查 token 是否在黑名单中（忽略错误）
                        if let Ok(false) = is_token_blacklisted(&state, token).await {
                            // 尝试从数据库加载完整用户信息
                            match load_user_from_db(&state.db, user_id).await {
                                Ok(auth_user) => {
                                    // 将用户信息添加到请求扩展中
                                    request.extensions_mut().insert(auth_user);
                                }
                                Err(e) => {
                                    tracing::warn!("Failed to load user in optional auth: {}", e);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    next.run(request).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auth_user_structure() {
        let user = AuthUser {
            id: uuid::Uuid::nil(),
            email: "test@example.com".to_string(),
            username: "testuser".to_string(),
            profile: serde_json::json!({"avatar": null}),
            email_verified: true,
            role: "user".to_string(),
        };

        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.username, "testuser");
        assert!(user.email_verified);
        assert_eq!(user.role, "user");
    }
}
