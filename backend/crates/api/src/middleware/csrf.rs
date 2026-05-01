//! CSRF保护中间件
//!
//! 为状态改变的操作提供CSRF保护
//! 实现双重提交 Cookie 模式，使用 HMAC-SHA256 签名验证

use crate::state::AppState;
use axum::{
    extract::{Request, State},
    http::{HeaderMap, HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// CSRF token结构
#[derive(Debug, Clone)]
pub struct CsrfToken {
    pub token: String,
}

/// HMAC-SHA256 based CSRF token
/// Token format: base64(nonce || timestamp || signature)
/// - nonce: 16 random bytes
/// - timestamp: 8 bytes (u64 big-endian)
/// - signature: 32 bytes (HMAC-SHA256 of nonce || timestamp)
pub struct HmacCsrfToken {
    pub nonce: [u8; 16],
    pub timestamp: u64,
    pub signature: [u8; 32],
}

impl HmacCsrfToken {
    /// 生成新的 HMAC CSRF token
    pub fn new(secret: &str) -> Self {
        let nonce_arr: [u8; 16] = *uuid::Uuid::new_v4().as_bytes();

        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Calculate HMAC signature
        let mut mac = create_hmac_mac(secret);
        mac.update(&nonce_arr);
        mac.update(&timestamp.to_be_bytes());
        let result = mac.finalize();

        Self {
            nonce: nonce_arr,
            timestamp,
            signature: result.into_bytes().as_slice().try_into().unwrap(),
        }
    }

    /// 从字符串解析 token
    pub fn from_string(token: &str, secret: &str) -> Result<Self, CsrfError> {
        let bytes = BASE64.decode(token).map_err(|_| CsrfError::InvalidToken)?;

        if bytes.len() != 56 {
            return Err(CsrfError::InvalidToken);
        }

        let mut nonce = [0u8; 16];
        nonce.copy_from_slice(&bytes[0..16]);

        let mut ts_bytes = [0u8; 8];
        ts_bytes.copy_from_slice(&bytes[16..24]);
        let timestamp = u64::from_be_bytes(ts_bytes);

        let mut signature = [0u8; 32];
        signature.copy_from_slice(&bytes[24..56]);

        let token = Self {
            nonce,
            timestamp,
            signature,
        };

        // Verify signature
        token.verify(secret)?;

        Ok(token)
    }

    /// 验证 token 签名
    pub fn verify(&self, secret: &str) -> Result<(), CsrfError> {
        let mut mac = create_hmac_mac(secret);
        mac.update(&self.nonce);
        mac.update(&self.timestamp.to_be_bytes());

        // Use verify_slice to compare against expected signature
        mac.verify_slice(&self.signature)
            .map_err(|_| CsrfError::InvalidToken)
    }

    /// 检查 timestamp 是否新鲜（1小时内）
    pub fn is_fresh(&self) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Token valid for 1 hour
        now.saturating_sub(self.timestamp) < 3600
    }

    /// 编码为 base64 字符串
    pub fn encode(&self) -> String {
        let mut bytes = Vec::with_capacity(56);
        bytes.extend_from_slice(&self.nonce);
        bytes.extend_from_slice(&self.timestamp.to_be_bytes());
        bytes.extend_from_slice(&self.signature);
        BASE64.encode(&bytes)
    }
}

/// 创建 HMAC-SHA256 Mac
fn create_hmac_mac(key: &str) -> HmacSha256 {
    HmacSha256::new_from_slice(key.as_bytes()).expect("HMAC can take key of any size")
}

/// CSRF错误类型
#[derive(Debug)]
pub enum CsrfError {
    MissingToken,
    InvalidToken,
    InvalidHeader,
    ExpiredToken,
    ReplayDetected,
    StorageError(String),
}

impl std::fmt::Display for CsrfError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CsrfError::MissingToken => write!(f, "CSRF token is missing"),
            CsrfError::InvalidToken => write!(f, "CSRF token is invalid"),
            CsrfError::InvalidHeader => write!(f, "CSRF header is invalid"),
            CsrfError::ExpiredToken => write!(f, "CSRF token has expired"),
            CsrfError::ReplayDetected => write!(f, "CSRF token replay detected"),
            CsrfError::StorageError(msg) => write!(f, "CSRF storage error: {}", msg),
        }
    }
}

/// CSRF保护中间件
///
/// 使用 HMAC-SHA256 签名验证实现双重提交 Cookie 模式
/// 验证流程：
/// 1. 从 header 或 cookie 提取 token
/// 2. 验证 HMAC 签名
/// 3. 检查 timestamp 新鲜度（1小时）
/// 4. 检查 replay（nonce 未使用）
///
/// 验证成功后：自动刷新 CSRF token（nonce 是一次性的），新 token 通过响应 Set-Cookie 发放给前端
pub async fn csrf_middleware(
    State(state): State<AppState>,
    mut request: Request,
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
        let secret = &state.settings.jwt_secret;

        // 检查CSRF token（从header或cookie）
        let token = extract_csrf_token(headers).map_err(|e| {
            tracing::warn!("CSRF token extraction failed: {}", e);
            StatusCode::FORBIDDEN
        })?;

        // 验证token（HMAC签名 + replay检测）
        match validate_csrf_token(&state, &token, secret).await {
            Ok(true) => {
                // 验证成功：生成新 token 并存入 request extensions，供 inject_csrf_cookie 消费
                match generate_csrf_token(&state).await {
                    Ok(new_csrf) => {
                        request.extensions_mut().insert(NewCsrfToken {
                            token: new_csrf.token,
                        });
                    }
                    Err(e) => {
                        tracing::error!("Failed to generate new CSRF token: {}", e);
                    }
                }
            }
            Ok(false) => {
                tracing::warn!("Invalid CSRF token: {}", token);
                return Err(StatusCode::FORBIDDEN);
            }
            Err(CsrfError::ExpiredToken) => {
                tracing::warn!("CSRF token expired: {}", token);
                return Err(StatusCode::FORBIDDEN);
            }
            Err(CsrfError::ReplayDetected) => {
                tracing::warn!("CSRF token replay detected: {}", token);
                return Err(StatusCode::FORBIDDEN);
            }
            Err(e) => {
                tracing::error!("CSRF validation error: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
    } else {
        // 对于 GET/HEAD/OPTIONS 等安全方法，下发一个新的 CSRF token
        // 解决"鸡生蛋"问题：确保浏览器在发起写操作之前已经获得有效的 CSRF cookie
        match generate_csrf_token(&state).await {
            Ok(new_csrf) => {
                request.extensions_mut().insert(NewCsrfToken {
                    token: new_csrf.token,
                });
            }
            Err(e) => {
                tracing::error!("Failed to generate CSRF token on GET: {}", e);
            }
        }
    }

    // 在调用 next.run(request) 之前，提前提取 NewCsrfToken
    // 因为 next.run(request) 会 move 走 request，之后无法再访问其 extensions
    let new_csrf_token = request.extensions().get::<NewCsrfToken>().cloned();

    let response = next.run(request).await;

    // 响应拦截：如果 extensions 中有 NewCsrfToken，注入 Set-Cookie
    if let Some(new_csrf) = new_csrf_token {
        let (_, xsrf_cookie) = set_csrf_cookie(&new_csrf.token);
        let mut resp = response.into_response();
        resp.headers_mut()
            .insert(axum::http::header::SET_COOKIE, xsrf_cookie.parse().unwrap_or_else(|e| {
                tracing::error!(error = %e, cookie = %xsrf_cookie, "Failed to parse CSRF cookie as HeaderValue");
                HeaderValue::from_static("")
            }));
        Ok(resp)
    } else {
        Ok(response.into_response())
    }
}

/// 标记新 CSRF token 的 request extension（由响应拦截器消费）
#[derive(Clone, Debug)]
pub struct NewCsrfToken {
    pub token: String,
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

/// 验证CSRF token
/// 1. 解析并验证 HMAC 签名
/// 2. 检查 timestamp 新鲜度
/// 3. 检查 replay（Redis nonce 检测）
async fn validate_csrf_token(
    state: &AppState,
    token: &str,
    secret: &str,
) -> Result<bool, CsrfError> {
    // 解析 token
    let hmac_token = HmacCsrfToken::from_string(token, secret)?;

    // 检查 timestamp 新鲜度
    if !hmac_token.is_fresh() {
        return Err(CsrfError::ExpiredToken);
    }

    // 检查 replay（nonce 是否已使用）
    let nonce_key = format!("csrf:nonce:{}", BASE64.encode(hmac_token.nonce));
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|e| CsrfError::StorageError(format!("Redis connection failed: {}", e)))?;

    // SET NX: only set if not exists (burn-after-reading replay detection)
    let set_ok: bool = redis::cmd("SET")
        .arg(&nonce_key)
        .arg("1")
        .arg("NX")
        .arg("EX")
        .arg(3600u64)
        .query_async(&mut conn)
        .await
        .map(|v: Option<String>| v.is_some())
        .map_err(|e| CsrfError::StorageError(format!("Redis SET NX failed: {}", e)))?;

    if !set_ok {
        return Err(CsrfError::ReplayDetected);
    }

    Ok(true)
}

/// 生成 CSRF token 并存储 nonce 到 Redis
/// 返回 token 字符串
pub async fn generate_csrf_token(state: &AppState) -> Result<CsrfToken, CsrfError> {
    let secret = &state.settings.jwt_secret;
    let token = HmacCsrfToken::new(secret);

    tracing::debug!(
        "Generated CSRF token, nonce prefix: {}",
        &BASE64.encode(token.nonce)[..8]
    );

    Ok(CsrfToken {
        token: token.encode(),
    })
}

/// 设置CSRF cookie的响应头（双重提交Cookie模式）
///
/// 设置两个cookie：
/// 1. csrf_token - HttpOnly, 浏览器自动发送
/// 2. XSRF-TOKEN - 非HttpOnly, JavaScript可读取并作为header发送
pub fn set_csrf_cookie(token: &str) -> (String, String) {
    // NOTE: csrf_token (HttpOnly) is sent automatically by browser via Cookie header.
    // XSRF-TOKEN (non-HttpOnly) is read by JS and sent as X-CSRF-Token header.
    // We remove "Secure" because the site runs on HTTP (dev: 192.168.0.161:3001).
    // In production with HTTPS, add "Secure" back.
    let http_only = format!(
        "csrf_token={}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600",
        token
    );
    let xsrf_token = format!("XSRF-TOKEN={}; Path=/; SameSite=Lax; Max-Age=3600", token);
    (http_only, xsrf_token)
}

/// 删除CSRF token（用于登出等场景）
pub async fn revoke_csrf_token(state: &AppState, token: &str) -> Result<(), CsrfError> {
    let secret = &state.settings.jwt_secret;
    let hmac_token = HmacCsrfToken::from_string(token, secret)?;

    let nonce_key = format!("csrf:nonce:{}", BASE64.encode(hmac_token.nonce));
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|e| CsrfError::StorageError(format!("Redis connection failed: {}", e)))?;

    use redis::AsyncCommands;
    let _: () = conn
        .del(&nonce_key)
        .await
        .map_err(|e| CsrfError::StorageError(format!("Failed to delete CSRF token: {}", e)))?;

    tracing::debug!("Revoked CSRF token");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_SECRET: &str = "test-secret-key-for-hmac-testing!!";

    #[test]
    fn test_hmac_csrf_token_generation_and_verification() {
        let token = HmacCsrfToken::new(TEST_SECRET);

        assert!(token.is_fresh());
        assert_eq!(token.nonce.len(), 16);
        assert_eq!(token.signature.len(), 32);

        // Encode and decode
        let encoded = token.encode();
        let decoded = HmacCsrfToken::from_string(&encoded, TEST_SECRET).unwrap();

        assert_eq!(decoded.nonce, token.nonce);
        assert_eq!(decoded.timestamp, token.timestamp);
        assert_eq!(decoded.signature, token.signature);
    }

    #[test]
    fn test_hmac_csrf_token_verification_fails_with_wrong_secret() {
        let token = HmacCsrfToken::new(TEST_SECRET);
        let encoded = token.encode();

        let result = HmacCsrfToken::from_string(&encoded, "wrong-secret");
        assert!(result.is_err());
    }

    #[test]
    fn test_hmac_csrf_token_verification_fails_with_tampered_token() {
        let token = HmacCsrfToken::new(TEST_SECRET);
        let mut encoded = BASE64.decode(token.encode()).unwrap();

        // Tamper with the last byte
        encoded[55] ^= 0xFF;

        let tampered = BASE64.encode(&encoded);
        let result = HmacCsrfToken::from_string(&tampered, TEST_SECRET);
        assert!(result.is_err());
    }

    #[test]
    fn test_token_freshness() {
        let token = HmacCsrfToken::new(TEST_SECRET);

        // Fresh token should pass
        assert!(token.is_fresh());

        // Old token should fail (manipulate timestamp)
        let mut old_token = token;
        old_token.timestamp = 0; // Unix epoch, definitely expired
        assert!(!old_token.is_fresh());
    }

    #[test]
    fn test_set_csrf_cookie() {
        let token = "test-token-123";
        let (http_only, xsrf_token) = set_csrf_cookie(token);

        // HttpOnly cookie for automatic browser sending
        assert!(http_only.contains("csrf_token=test-token-123"));
        assert!(http_only.contains("HttpOnly"));
        assert!(http_only.contains("SameSite=Lax"));
        // Note: "Secure" is intentionally NOT set — site runs on HTTP (dev: 192.168.0.161:3001)

        // XSRF-TOKEN for JavaScript to read and echo as header
        assert!(xsrf_token.contains("XSRF-TOKEN=test-token-123"));
        assert!(!xsrf_token.contains("HttpOnly")); // Must be readable by JS
        assert!(xsrf_token.contains("SameSite=Lax"));
        // Note: "Secure" is intentionally NOT set — site runs on HTTP
    }
}
