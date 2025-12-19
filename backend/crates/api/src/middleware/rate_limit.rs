use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use redis::Script;
use crate::AppState;

// Redis Lua 脚本：固定窗口限流
const RATE_LIMIT_SCRIPT: &str = r#"
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local current = redis.call("INCR", key)
if current == 1 then
    redis.call("EXPIRE", key, window)
end
if current > limit then
    return 0
end
return 1
"#;

// 限流中间件
pub async fn rate_limit_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let ip = extract_real_ip(&request);
    let route = extract_route(&request);

    // 构建限流键：rl:{ip}:{route}:{minute_bucket}
    let minute_bucket = chrono::Utc::now().format("%Y%m%d%H%M");
    let key = format!("rl:{}:{}:{}", ip, route, minute_bucket);

    // 根据路由设置不同的限流策略
    let (limit, window) = match route.as_str() {
        "/v1/auth/login" | "/v1/auth/register" => (5, 60),     // 5次/分钟
        "/v1/posts/*/view" => (100, 60),                         // 100次/分钟
        "/v1/posts/*/comments" if request.method().as_str() == "POST" => (10, 60), // 10次/分钟
        _ => (1000, 60),                                         // 默认
    };

    // 执行 Redis 脚本
    let mut conn = state.redis.get().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result: i32 = Script::new(RATE_LIMIT_SCRIPT)
        .key(&key)
        .arg(limit)
        .arg(window)
        .invoke_async(&mut conn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result == 0 {
        tracing::warn!("Rate limit exceeded for IP: {}, Route: {}", ip, route);
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    Ok(next.run(request).await)
}

fn extract_real_ip(request: &Request) -> String {
    // Cloudflare 优先
    if let Some(ip) = request.headers().get("cf-connecting-ip") {
        return ip.to_str().unwrap_or("unknown").to_string();
    }

    // 其次 x-real-ip
    if let Some(ip) = request.headers().get("x-real-ip") {
        return ip.to_str().unwrap_or("unknown").to_string();
    }

    // 最后 x-forwarded-for (取第一个)
    if let Some(xff) = request.headers().get("x-forwarded-for") {
        return xff.to_str()
            .ok()
            .and_then(|s| s.split(',').next())
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| "unknown".to_string());
    }

    "unknown".to_string()
}

fn extract_route(request: &Request) -> String {
    // 使用 MatchedPath 获取路由模式
    request
        .extensions()
        .get::<axum::extract::MatchedPath>()
        .map(|m| {
            // 将动态路径段替换为通配符
            m.as_str()
                .split('/')
                .map(|segment| {
                    if segment.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
                        // 看起来像静态路径
                        segment
                    } else if segment.parse::<uuid::Uuid>().is_ok() {
                        // UUID
                        "*"
                    } else {
                        // 其他动态内容
                        "*"
                    }
                })
                .collect::<Vec<_>>()
                .join("/")
        })
        .unwrap_or_else(|| "unknown".to_string())
}