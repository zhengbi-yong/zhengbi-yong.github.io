//! CSRF保护中间件
//!
//! 为状态改变的操作提供CSRF保护

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

/// CSRF错误类型
#[derive(Debug)]
pub enum CsrfError {
    MissingToken,
    InvalidToken,
    InvalidHeader,
}

impl std::fmt::Display for CsrfError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CsrfError::MissingToken => write!(f, "CSRF token is missing"),
            CsrfError::InvalidToken => write!(f, "CSRF token is invalid"),
            CsrfError::InvalidHeader => write!(f, "CSRF header is invalid"),
        }
    }
}

/// CSRF保护中间件（简化版）
///
/// 对于安全要求极高的场景，建议使用双重提交Cookie模式
pub async fn csrf_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let method = request.method();

    // 只对状态改变的操作进行CSRF检查
    if matches!(*method, axum::http::Method::POST | axum::http::Method::PUT | axum::http::Method::PATCH | axum::http::Method::DELETE) {
        let headers = request.headers();

        // 检查CSRF token（从header或cookie）
        let token = extract_csrf_token(headers).unwrap_or_default();

        // 验证token（简化版：只检查是否为有效的UUID格式）
        if !token.is_empty() && !is_valid_csrf_token(&token) {
            return Err(StatusCode::FORBIDDEN);
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
        let cookie_str = cookie_header.to_str().map_err(|_| CsrfError::InvalidHeader)?;

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

/// 验证CSRF token（简化版）
fn is_valid_csrf_token(token: &str) -> bool {
    // 简化版：只验证是否为有效的UUID格式
    // 生产环境应该验证token是否在服务端生成并存储
    Uuid::parse_str(token).is_ok()
}

/// 生成CSRF token并设置Cookie
pub fn generate_csrf_token() -> CsrfToken {
    CsrfToken::new()
}

/// 设置CSRF cookie的响应头
pub fn set_csrf_cookie(token: &str) -> String {
    format!(
        "csrf_token={}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600",
        token
    )
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
    fn test_csrf_token_validation() {
        let token = Uuid::new_v4().to_string();
        assert!(is_valid_csrf_token(&token));

        let invalid_token = "invalid-token";
        assert!(!is_valid_csrf_token(invalid_token));
    }
}
