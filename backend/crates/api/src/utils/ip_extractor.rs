//! IP 地址提取工具
//!
//! 从 HTTP 请求中提取真实客户端 IP 地址
//!
//! 优先级:
//! 1. CF-Connecting-IP (Cloudflare)
//! 2. X-Real-IP
//! 3. X-Forwarded-For (取最后一个)
//! 4. 连接的远程地址

use axum::{
    extract::ConnectInfo,
    http::HeaderMap,
};
use std::net::{IpAddr, SocketAddr};
use crate::state::AppState;

/// Axum 提取器：从请求中提取真实客户端 IP 地址
///
/// # 使用示例
/// ```rust
/// pub async fn handler(
///     RealIp(client_ip): RealIp,
/// ) -> String {
///     format!("Client IP: {}", client_ip)
/// }
/// ```
pub struct RealIp(pub IpAddr);

impl axum::extract::FromRequestParts<AppState> for RealIp
where
    AppState: Clone + Send + Sync + 'static,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        Ok(Self(extract_real_ip_from_parts(&parts.headers, &parts.extensions)))
    }
}

/// 从请求头和扩展中提取真实 IP 地址
fn extract_real_ip_from_parts(headers: &HeaderMap, extensions: &axum::http::Extensions) -> IpAddr {
    // 1. 检查 Cloudflare IP
    if let Some(cf_ip) = headers
        .get("cf-connecting-ip")
        .and_then(|v| v.to_str().ok())
    {
        if let Ok(addr) = cf_ip.parse::<IpAddr>() {
            tracing::debug!("IP from CF-Connecting-IP: {}", addr);
            return addr;
        }
    }

    // 2. 检查 X-Real-IP
    if let Some(real_ip) = headers
        .get("x-real-ip")
        .and_then(|v| v.to_str().ok())
    {
        if let Ok(addr) = real_ip.parse::<IpAddr>() {
            tracing::debug!("IP from X-Real-IP: {}", addr);
            return addr;
        }
    }

    // 3. 检查 X-Forwarded-For (取最后一个 IP)
    if let Some(forwarded) = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
    {
        // X-Forwarded-For 可能包含多个 IP: "client, proxy1, proxy2"
        // 最后一个 IP 是最接近服务器的
        let last_ip = forwarded
            .split(',')
            .last()
            .map(|s| s.trim())
            .and_then(|s| s.parse::<IpAddr>().ok());

        if let Some(addr) = last_ip {
            tracing::debug!("IP from X-Forwarded-For: {}", addr);
            return addr;
        }
    }

    // 4. 回退到连接的远程地址
    if let Some(addr) = extensions.get::<ConnectInfo<SocketAddr>>().map(|info| info.0.ip()) {
        tracing::debug!("IP from connection: {}", addr);
        return addr;
    }

    // 5. 最后回退到未知 IP
    tracing::warn!("Could not extract real IP, using unknown");
    IpAddr::V4(std::net::Ipv4Addr::new(0, 0, 0, 0))
}

/// 从请求中提取真实 IP 地址（遗留函数，用于测试）
///
/// # 参数
/// * `req` - HTTP 请求
///
/// # 返回
/// 提取的 IP 地址
pub fn extract_real_ip(req: &axum::extract::Request) -> IpAddr {
    extract_real_ip_from_parts(req.headers(), req.extensions())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{HeaderValue, Request};
    use std::net::{Ipv4Addr, Ipv6Addr};

    #[test]
    fn test_extract_ip_from_cf_connecting_ip() {
        let mut req = Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        req.headers_mut().insert(
            "cf-connecting-ip",
            HeaderValue::from_static("203.0.113.1"),
        );

        let ip = extract_real_ip(&req);
        assert_eq!(ip, IpAddr::V4(Ipv4Addr::new(203, 0, 113, 1)));
    }

    #[test]
    fn test_extract_ip_from_x_real_ip() {
        let mut req = Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        req.headers_mut()
            .insert("x-real-ip", HeaderValue::from_static("198.51.100.1"));

        let ip = extract_real_ip(&req);
        assert_eq!(ip, IpAddr::V4(Ipv4Addr::new(198, 51, 100, 1)));
    }

    #[test]
    fn test_extract_ip_from_x_forwarded_for_single() {
        let mut req = Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        req.headers_mut().insert(
            "x-forwarded-for",
            HeaderValue::from_static("192.0.2.1"),
        );

        let ip = extract_real_ip(&req);
        assert_eq!(ip, IpAddr::V4(Ipv4Addr::new(192, 0, 2, 1)));
    }

    #[test]
    fn test_extract_ip_from_x_forwarded_for_multiple() {
        let mut req = Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        req.headers_mut().insert(
            "x-forwarded-for",
            HeaderValue::from_static("203.0.113.1, 198.51.100.1, 192.0.2.1"),
        );

        let ip = extract_real_ip(&req);
        // 应该取最后一个
        assert_eq!(ip, IpAddr::V4(Ipv4Addr::new(192, 0, 2, 1)));
    }

    #[test]
    fn test_extract_ipv6() {
        let mut req = Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        req.headers_mut().insert(
            "cf-connecting-ip",
            HeaderValue::from_static("2001:db8::1"),
        );

        let ip = extract_real_ip(&req);
        assert_eq!(
            ip,
            IpAddr::V6(Ipv6Addr::new(0x2001, 0xdb8, 0, 0, 0, 0, 0, 1))
        );
    }

    #[test]
    fn test_extract_ip_no_headers_returns_zero() {
        let req = Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        let ip = extract_real_ip(&req);
        assert_eq!(ip, IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)));
    }
}
