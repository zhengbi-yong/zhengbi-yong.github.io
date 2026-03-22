use crate::utils::ip_extractor::extract_real_ip;
use crate::AppState;
use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use redis::Script;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

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
    let ip = extract_real_ip(&request).to_string();
    let route = extract_route(&request);

    // 构建压缩的限流键：r:{ip}:{route_hash}:{bucket}
    // 压缩后的键名更短，节省 Redis 内存
    let minute_bucket = chrono::Utc::now().format("%Y%m%d%H%M");
    let route_hash = compress_route(&route);
    let key = format!("r:{}:{}:{}", ip, route_hash, minute_bucket);

    // 根据路由设置不同的限流策略
    // 注意：这里的 route 已经通过 extract_route 标准化，移除了 /api/v1 前缀
    let (limit, window) = match route.as_str() {
        "/auth/login" | "/auth/register" => (5, 60), // 5次/分钟
        "/posts/*/view" => (100, 60),                // 100次/分钟
        "/posts/*/comments" if request.method().as_str() == "POST" => (10, 60), // 10次/分钟
        _ => (1000, 60),                             // 默认
    };

    // 执行 Redis 脚本
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result: i32 = Script::new(RATE_LIMIT_SCRIPT)
        .key(&key)
        .arg(limit)
        .arg(window)
        .invoke_async(&mut conn)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result == 0 {
        tracing::warn!(
            "Rate limit exceeded for IP: {}, Route: {} (hash: {})",
            ip,
            route,
            route_hash
        );
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    Ok(next.run(request).await)
}

/// 压缩路由名称为 8 位哈希值
fn compress_route(route: &str) -> String {
    let mut hasher = DefaultHasher::new();
    route.hash(&mut hasher);
    format!("{:x}", hasher.finish())[..8].to_string()
}

fn extract_route(request: &Request) -> String {
    // 使用 MatchedPath 获取路由模式，并标准化（移除 /api/v1 前缀）
    request
        .extensions()
        .get::<axum::extract::MatchedPath>()
        .map(|m| {
            let path = m.as_str();
            // 移除 /api/v1 前缀以标准化路由
            let normalized = path.strip_prefix("/api/v1").unwrap_or(path);

            // 将动态路径段替换为通配符
            normalized
                .split('/')
                .map(|segment| {
                    if segment
                        .chars()
                        .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
                    {
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
