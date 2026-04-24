use crate::AppState;
use axum::{
    extract::{Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use blog_shared::middleware::auth::{AuthError, AuthUser};

/// 从请求中提取 JWT token
///
/// 优先从 Authorization header 提取（兼容旧客户端）
/// 如果没有，则从 access_token cookie 提取（HttpOnly Cookie 方式）
///
/// GOLDEN_RULES 1.1: 前端通过 credentials: 'include' 自动发送 HttpOnly Cookie
fn extract_token(request: &Request) -> Option<String> {
    // 1. 首先尝试从 Authorization header 提取
    let token = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|auth_header| {
            let (scheme, token) = auth_header.split_once(' ')?;
            if scheme.to_lowercase() == "bearer" {
                Some(token.to_string())
            } else {
                None
            }
        });

    if token.is_some() {
        return token;
    }

    // 2. 如果没有 Authorization header，则从 access_token cookie 提取
    // Axum 的 CookieJar 需要通过 extractor 获取，这里用手动解析 cookie header
    request
        .headers()
        .get(header::COOKIE)
        .and_then(|cookie_header| cookie_header.to_str().ok())
        .and_then(|cookie_str| {
            cookie_str.split(';').find_map(|cookie| {
                let cookie = cookie.trim();
                cookie.strip_prefix("access_token=").map(|s| s.to_string())
            })
        })
}

/// 认证中间件 (CPU-bound only)
///
/// 仅验证 JWT token，不执行任何 DB/Redis I/O 操作
/// 用于需要认证的路由，保护公共端点不被未授权访问
///
/// GOLDEN_RULES 1.1: 支持从 HttpOnly Cookie 自动携带 token
/// 前端使用 credentials: 'include' 自动发送 Cookie
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    // GOLDEN_RULES 1.1: 优先从 Authorization header 提取（兼容旧客户端）
    // 如果没有，则从 access_token cookie 提取（HttpOnly Cookie 方式）
    let token = extract_token(&request);

    let token = token.ok_or(AuthError::MissingToken)?;

    // 仅验证 JWT token (CPU-bound operation)
    // GOLDEN_RULES §3.2: 禁止在提取器里做外部I/O，提取器运行在请求主路径上会把认证变成外部依赖可用性的放大器
    match state.jwt.verify_access_token(&token) {
        Ok(claims) => {
            let user_id =
                uuid::Uuid::parse_str(&claims.sub).map_err(|_| AuthError::InvalidToken)?;

            // 从 JWT claims 构建 AuthUser（不查 DB，符合 GOLDEN_RULES §3.2）
            // 注：JWT 不包含 role，role 验证在具体 handler 中按需调用 load_user_from_db()
            // 此处 role 仅用于中间件路径的占位值
            let auth_user = AuthUser {
                id: user_id,
                email: claims.email,
                username: claims.username,
                profile: serde_json::Value::Null,
                email_verified: false,
                role: "user".to_string(),
            };
            request.extensions_mut().insert(auth_user);
            Ok(next.run(request).await)
        }
        Err(e) => {
            tracing::warn!("JWT verification failed: {}", e);
            Err(AuthError::InvalidToken)
        }
    }
}

/// 从数据库加载完整用户信息
///
/// 仅在处理器需要完整用户数据时调用 (如 profile, email_verified)
pub async fn load_user_from_db(
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

/// 检查 token 是否在黑名单中 (I/O-bound)
///
/// 注意: 此函数执行 Redis I/O，不应在中间件的关键路径中调用
/// 建议在后台任务或处理器中调用
pub async fn is_token_blacklisted(state: &AppState, token: &str) -> Result<bool, AuthError> {
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

/// 可选的认证中间件 (CPU-bound only)
///
/// 尝试验证 token 但不会因无效 token 而拒绝请求
/// 仅执行 JWT 验证，不进行任何 DB/Redis I/O 操作
/// 用于需要区分已登录/未登录用户的公开路由
///
/// 注意: 此中间件不会检查 token 黑名单，也不会从数据库加载完整用户信息
/// 如需完整用户信息，请在处理器中使用 `load_user_from_db` 函数
pub async fn optional_auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    // 使用 extract_token 从 header 或 cookie 获取 token
    if let Some(token) = extract_token(&request) {
        if let Ok(claims) = state.jwt.verify_access_token(&token) {
            if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
                // 从 JWT claims 构建轻量级 AuthUser (不查 DB/Redis)
                let auth_user = AuthUser {
                    id: user_id,
                    email: claims.email,
                    username: claims.username,
                    profile: serde_json::Value::Null,
                    email_verified: false,
                    role: "user".to_string(),
                };
                request.extensions_mut().insert(auth_user);
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
