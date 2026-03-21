//! CSRF保护中间件
//!
//! 为状态改变的操作提供CSRF保护
//! 使用 Redis 进行服务器端 token 存储和验证

use crate::AppState;
use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

/// CSRF token结构
#[derive(Debug, Clone)]
pub struct CsrfToken {
    pub token: String,
}

impl CsrfToken {
    /// 生成新的CSRF token
    pub fn new() -> Self {
        Self {
            token: Uuid::new_v4().to_string(),
        }
    }

    /// 从字符串创建
    pub fn from_string(token: String) -> Self {
        Self { token }
    }
}

impl Default for CsrfToken {
    fn default() -> Self {
        Self::new()
    }
}

/// CSRF错误类型
#[derive(Debug)]
pub enum CsrfError {
    MissingToken,
    InvalidToken,
    InvalidHeader,
    StorageError(String),
}

impl std::fmt::Display for CsrfError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CsrfError::MissingToken => write!(f, "CSRF token is missing"),
            CsrfError::InvalidToken => write!(f, "CSRF token is invalid"),
            CsrfError::InvalidHeader => write!(f, "CSRF header is invalid"),
            CsrfError::StorageError(msg) => write!(f, "CSRF storage error: {}", msg),
        }
    }
}

/// CSRF保护中间件
///
/// 使用 Redis 存储和验证 CSRF token
/// 实现双重提交 Cookie 模式的服务器端验证
pub async fn csrf_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let method = request.method();

    // 只对状态改变的操作进行CSRF检查
    if matches!(
        *method,
        axum::http::Method::POST
            | axum::http::Method::PUT
            | axum::http::Method::PATCH
            | axum::http::Method::DELETE
    ) {
        let headers = request.headers();

        // 检查CSRF token（从header或cookie）
        let token = extract_csrf_token(headers).map_err(|e| {
            tracing::warn!("CSRF token extraction failed: {}", e);
            StatusCode::FORBIDDEN
        })?;

        // 验证token（服务器端验证）
        match is_valid_csrf_token_server(&state, &token).await {
            Ok(true) => {}
            Ok(false) => {
                tracing::warn!("Invalid CSRF token: {}", token);
                return Err(StatusCode::FORBIDDEN);
            }
            Err(e) => {
                tracing::error!("CSRF validation error: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
    }

    Ok(next.run(request).await)
}

/// 从headers提取CSRF token
fn extract_csrf_token(headers: &HeaderMap) -> Result<String, CsrfError> {
    // 优先从X-CSRF-Token header获取
    if let Some(token) = headers.get("x-csrf-token") {
        return token
            .to_str()
            .map(|s| s.to_string())
            .map_err(|_| CsrfError::InvalidHeader);
    }

    // 其次从Cookie获取
    if let Some(cookie_header) = headers.get("cookie") {
        let cookie_str = cookie_header
            .to_str()
            .map_err(|_| CsrfError::InvalidHeader)?;

        for cookie in cookie_str.split(';') {
            let cookie = cookie.trim();
            if let Some((name, value)) = cookie.split_once('=') {
                if name.trim() == "csrf_token" {
                    return Ok(value.to_string());
                }
            }
        }
    }

    Err(CsrfError::MissingToken)
}

/// 验证CSRF token（服务器端验证）
/// 检查 token 是否存在于 Redis 中且未过期
async fn is_valid_csrf_token_server(state: &AppState, token: &str) -> Result<bool, CsrfError> {
    // 首先检查是否为有效的 UUID 格式
    if Uuid::parse_str(token).is_err() {
        return Ok(false);
    }

    // 从 Redis 获取存储的 token
    let key = format!("csrf:{}", token);

    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|e| CsrfError::StorageError(format!("Redis connection failed: {}", e)))?;

    use redis::AsyncCommands;
    let exists: bool = conn
        .exists(&key)
        .await
        .map_err(|e| CsrfError::StorageError(format!("Redis exists check failed: {}", e)))?;

    Ok(exists)
}

/// 生成 CSRF token 并存储到 Redis
/// 返回 token 字符串
pub async fn generate_csrf_token(state: &AppState) -> Result<CsrfToken, CsrfError> {
    let token = CsrfToken::new();

    // 存储到 Redis，有效期 1 小时
    let key = format!("csrf:{}", token.token);
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|e| CsrfError::StorageError(format!("Redis connection failed: {}", e)))?;

    use redis::AsyncCommands;
    conn.set_ex::<_, _, ()>(&key, "1", 3600)
        .await
        .map_err(|e| CsrfError::StorageError(format!("Failed to store CSRF token: {}", e)))?;

    tracing::debug!("Generated and stored CSRF token: {}", token.token);
    Ok(token)
}

/// 同步版本：生成 CSRF token（不存储到 Redis）
/// 用于向后兼容和非 Redis 场景
pub fn generate_csrf_token_sync() -> CsrfToken {
    CsrfToken::new()
}

/// 验证CSRF token格式（仅客户端格式验证）
/// 用于测试和快速格式检查
pub fn is_valid_csrf_token_format(token: &str) -> bool {
    Uuid::parse_str(token).is_ok()
}

/// 设置CSRF cookie的响应头
pub fn set_csrf_cookie(token: &str) -> String {
    format!(
        "csrf_token={}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600",
        token
    )
}

/// 删除CSRF token（用于登出等场景）
pub async fn revoke_csrf_token(state: &AppState, token: &str) -> Result<(), CsrfError> {
    let key = format!("csrf:{}", token);
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|e| CsrfError::StorageError(format!("Redis connection failed: {}", e)))?;

    use redis::AsyncCommands;
    let _: () = conn
        .del(&key)
        .await
        .map_err(|e| CsrfError::StorageError(format!("Failed to delete CSRF token: {}", e)))?;

    tracing::debug!("Revoked CSRF token: {}", token);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csrf_token_generation() {
        let token = CsrfToken::new();
        assert!(!token.token.is_empty());
        assert!(Uuid::parse_str(&token.token).is_ok());
    }

    #[test]
    fn test_csrf_token_format_validation() {
        let token = Uuid::new_v4().to_string();
        assert!(is_valid_csrf_token_format(&token));

        let invalid_token = "invalid-token";
        assert!(!is_valid_csrf_token_format(invalid_token));
    }

    #[test]
    fn test_extract_csrf_token_from_header() {
        let mut headers = HeaderMap::new();
        headers.insert("x-csrf-token", "test-token".parse().unwrap());

        let result = extract_csrf_token(&headers);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test-token");
    }

    #[test]
    fn test_extract_csrf_token_from_cookie() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "cookie",
            "session=abc; csrf_token=token-from-cookie".parse().unwrap(),
        );

        let result = extract_csrf_token(&headers);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "token-from-cookie");
    }

    #[test]
    fn test_extract_csrf_token_missing() {
        let headers = HeaderMap::new();
        let result = extract_csrf_token(&headers);
        assert!(matches!(result, Err(CsrfError::MissingToken)));
    }

    #[test]
    fn test_set_csrf_cookie() {
        let token = "test-token-123";
        let cookie = set_csrf_cookie(token);
        assert!(cookie.contains("csrf_token=test-token-123"));
        assert!(cookie.contains("HttpOnly"));
        assert!(cookie.contains("SameSite=Lax"));
        assert!(cookie.contains("Secure"));
    }
}
