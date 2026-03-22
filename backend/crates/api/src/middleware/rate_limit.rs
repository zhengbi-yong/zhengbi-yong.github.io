use crate::utils::ip_extractor::extract_real_ip;
use crate::utils::normalized_route_label;
use crate::AppState;
use axum::{
    extract::{Request, State},
    http::{
        header::{HeaderName, RETRY_AFTER},
        HeaderValue, Method, StatusCode,
    },
    middleware::Next,
    response::Response,
};
use blog_shared::{RateLimitConfig, RateLimitFailureMode};
use redis::Script;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

const RATE_LIMIT_LIMIT_SECOND: HeaderName = HeaderName::from_static("x-ratelimit-limit-second");
const RATE_LIMIT_LIMIT_MINUTE: HeaderName = HeaderName::from_static("x-ratelimit-limit-minute");
const RATE_LIMIT_REMAINING_SECOND: HeaderName =
    HeaderName::from_static("x-ratelimit-remaining-second");
const RATE_LIMIT_REMAINING_MINUTE: HeaderName =
    HeaderName::from_static("x-ratelimit-remaining-minute");
const RATE_LIMIT_POLICY: HeaderName = HeaderName::from_static("x-ratelimit-policy");

const RATE_LIMIT_SCRIPT: &str = r#"
local second_key = KEYS[1]
local minute_key = KEYS[2]
local second_limit = tonumber(ARGV[1])
local minute_limit = tonumber(ARGV[2])
local second_window = tonumber(ARGV[3])
local minute_window = tonumber(ARGV[4])

local second_current = redis.call("INCR", second_key)
if second_current == 1 then
    redis.call("EXPIRE", second_key, second_window)
end

local minute_current = redis.call("INCR", minute_key)
if minute_current == 1 then
    redis.call("EXPIRE", minute_key, minute_window)
end

local second_ttl = redis.call("TTL", second_key)
if second_ttl < 0 then
    second_ttl = second_window
end

local minute_ttl = redis.call("TTL", minute_key)
if minute_ttl < 0 then
    minute_ttl = minute_window
end

local allowed = 1
local retry_after = 0

if second_current > second_limit then
    allowed = 0
    retry_after = second_ttl
end

if minute_current > minute_limit then
    allowed = 0
    if minute_ttl > retry_after then
        retry_after = minute_ttl
    end
end

return {allowed, second_current, minute_current, second_ttl, minute_ttl, retry_after}
"#;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct RateLimitPolicy {
    rps: u32,
    rpm: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct RateLimitOutcome {
    allowed: bool,
    second_current: u32,
    minute_current: u32,
    second_ttl_secs: u64,
    minute_ttl_secs: u64,
    retry_after_secs: u64,
}

pub async fn rate_limit_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let ip = extract_real_ip(&request).to_string();
    let route = normalized_route_label(&request);
    let route_hash = compress_route(&route);
    let policy = rate_limit_policy(&route, request.method(), &state.settings.rate_limit);
    let (second_key, minute_key) = build_rate_limit_keys(&ip, &route_hash, chrono::Utc::now());

    let mut conn = match state.redis.get().await {
        Ok(conn) => conn,
        Err(error) => {
            return handle_rate_limit_backend_failure(
                &state,
                request,
                next,
                &ip,
                &route,
                &route_hash,
                format!(
                    "Failed to get Redis connection for rate limiting: {}",
                    error
                ),
            )
            .await;
        }
    };

    let raw_result: (i64, i64, i64, i64, i64, i64) = match Script::new(RATE_LIMIT_SCRIPT)
        .key(second_key)
        .key(minute_key)
        .arg(policy.rps)
        .arg(policy.rpm)
        .arg(1)
        .arg(60)
        .invoke_async(&mut conn)
        .await
    {
        Ok(result) => result,
        Err(error) => {
            return handle_rate_limit_backend_failure(
                &state,
                request,
                next,
                &ip,
                &route,
                &route_hash,
                format!("Failed to evaluate rate limit script: {}", error),
            )
            .await;
        }
    };

    let outcome = RateLimitOutcome::from_redis_result(raw_result);

    if !outcome.allowed {
        record_rate_limit_outcome(&state, &route, "rejected").await;
        tracing::warn!(
            ip = %ip,
            route = %route,
            route_hash = %route_hash,
            rps = policy.rps,
            rpm = policy.rpm,
            second_current = outcome.second_current,
            minute_current = outcome.minute_current,
            retry_after_secs = outcome.retry_after_secs,
            "Rate limit exceeded"
        );

        return Ok(rate_limited_response(policy, outcome));
    }

    record_rate_limit_outcome(&state, &route, "allowed").await;
    let mut response = next.run(request).await;
    apply_rate_limit_headers(response.headers_mut(), policy, outcome);
    Ok(response)
}

impl RateLimitOutcome {
    fn from_redis_result(value: (i64, i64, i64, i64, i64, i64)) -> Self {
        Self {
            allowed: value.0 == 1,
            second_current: value.1.max(0) as u32,
            minute_current: value.2.max(0) as u32,
            second_ttl_secs: value.3.max(0) as u64,
            minute_ttl_secs: value.4.max(0) as u64,
            retry_after_secs: value.5.max(0) as u64,
        }
    }

    fn remaining_second(self, policy: RateLimitPolicy) -> u32 {
        policy
            .rps
            .saturating_sub(self.second_current.min(policy.rps))
    }

    fn remaining_minute(self, policy: RateLimitPolicy) -> u32 {
        policy
            .rpm
            .saturating_sub(self.minute_current.min(policy.rpm))
    }
}

fn rate_limit_policy(route: &str, method: &Method, limits: &RateLimitConfig) -> RateLimitPolicy {
    match route {
        "/auth/login" | "/auth/register" => RateLimitPolicy {
            rps: limits.auth_rps,
            rpm: limits.auth_rpm,
        },
        "/posts/*/view" => RateLimitPolicy {
            rps: limits.view_rps,
            rpm: limits.view_rpm,
        },
        "/posts/*/comments" if *method == Method::POST => RateLimitPolicy {
            rps: limits.comment_rps,
            rpm: limits.comment_rpm,
        },
        _ => RateLimitPolicy {
            rps: limits.default_rps,
            rpm: limits.default_rpm,
        },
    }
}

fn build_rate_limit_keys(
    ip: &str,
    route_hash: &str,
    now: chrono::DateTime<chrono::Utc>,
) -> (String, String) {
    let second_bucket = now.format("%Y%m%d%H%M%S");
    let minute_bucket = now.format("%Y%m%d%H%M");

    (
        format!("rl:s:{}:{}:{}", ip, route_hash, second_bucket),
        format!("rl:m:{}:{}:{}", ip, route_hash, minute_bucket),
    )
}

fn rate_limited_response(policy: RateLimitPolicy, outcome: RateLimitOutcome) -> Response {
    let mut response = Response::new(axum::body::Body::empty());
    *response.status_mut() = StatusCode::TOO_MANY_REQUESTS;
    apply_rate_limit_headers(response.headers_mut(), policy, outcome);

    if outcome.retry_after_secs > 0 {
        response.headers_mut().insert(
            RETRY_AFTER,
            HeaderValue::from_str(&outcome.retry_after_secs.to_string())
                .expect("retry-after header should be valid"),
        );
    }

    response
}

fn apply_rate_limit_headers(
    headers: &mut axum::http::HeaderMap,
    policy: RateLimitPolicy,
    outcome: RateLimitOutcome,
) {
    headers.insert(
        RATE_LIMIT_LIMIT_SECOND,
        HeaderValue::from_str(&policy.rps.to_string()).expect("rate-limit second should be valid"),
    );
    headers.insert(
        RATE_LIMIT_LIMIT_MINUTE,
        HeaderValue::from_str(&policy.rpm.to_string()).expect("rate-limit minute should be valid"),
    );
    headers.insert(
        RATE_LIMIT_REMAINING_SECOND,
        HeaderValue::from_str(&outcome.remaining_second(policy).to_string())
            .expect("remaining second should be valid"),
    );
    headers.insert(
        RATE_LIMIT_REMAINING_MINUTE,
        HeaderValue::from_str(&outcome.remaining_minute(policy).to_string())
            .expect("remaining minute should be valid"),
    );
}

async fn handle_rate_limit_backend_failure(
    state: &AppState,
    request: Request,
    next: Next,
    ip: &str,
    route: &str,
    route_hash: &str,
    error: String,
) -> Result<Response, StatusCode> {
    tracing::error!(
        ip = %ip,
        route = %route,
        route_hash = %route_hash,
        failure_mode = ?state.settings.rate_limit.failure_mode,
        "{}",
        error
    );

    match state.settings.rate_limit.failure_mode {
        RateLimitFailureMode::FailOpen => {
            record_rate_limit_outcome(state, route, "bypassed").await;

            let mut response = next.run(request).await;
            response
                .headers_mut()
                .insert(RATE_LIMIT_POLICY, HeaderValue::from_static("bypassed"));
            Ok(response)
        }
        RateLimitFailureMode::FailClosed => {
            record_rate_limit_outcome(state, route, "error").await;
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn record_rate_limit_outcome(state: &AppState, route: &str, outcome: &str) {
    let metrics = state.metrics.read().await;
    metrics.record_rate_limit_decision(route, outcome);
}

fn compress_route(route: &str) -> String {
    let mut hasher = DefaultHasher::new();
    route.hash(&mut hasher);
    format!("{:x}", hasher.finish())[..8].to_string()
}

#[cfg(test)]
mod tests {
    use super::{
        apply_rate_limit_headers, build_rate_limit_keys, rate_limit_policy, RateLimitOutcome,
        RateLimitPolicy, RATE_LIMIT_LIMIT_MINUTE, RATE_LIMIT_LIMIT_SECOND,
        RATE_LIMIT_REMAINING_MINUTE, RATE_LIMIT_REMAINING_SECOND,
    };
    use crate::utils::normalize_route_pattern;
    use axum::http::{HeaderMap, Method};
    use blog_shared::{RateLimitConfig, RateLimitFailureMode};
    use chrono::{TimeZone, Utc};

    fn test_limits() -> RateLimitConfig {
        RateLimitConfig {
            auth_rps: 2,
            auth_rpm: 20,
            view_rps: 5,
            view_rpm: 50,
            comment_rps: 3,
            comment_rpm: 30,
            default_rps: 10,
            default_rpm: 100,
            failure_mode: RateLimitFailureMode::FailClosed,
        }
    }

    #[test]
    fn route_patterns_are_normalized() {
        assert_eq!(
            normalize_route_pattern("/api/v1/posts/{slug}/comments"),
            "/posts/*/comments"
        );
        assert_eq!(
            normalize_route_pattern("/api/v1/comments/550e8400-e29b-41d4-a716-446655440000/like"),
            "/comments/*/like"
        );
        assert_eq!(
            normalize_route_pattern("/api/v1/posts/42/view"),
            "/posts/*/view"
        );
    }

    #[test]
    fn policies_use_route_specific_limits() {
        let limits = test_limits();
        assert_eq!(
            rate_limit_policy("/auth/login", &Method::POST, &limits),
            RateLimitPolicy { rps: 2, rpm: 20 }
        );
        assert_eq!(
            rate_limit_policy("/posts/*/view", &Method::POST, &limits),
            RateLimitPolicy { rps: 5, rpm: 50 }
        );
        assert_eq!(
            rate_limit_policy("/posts/*/comments", &Method::POST, &limits),
            RateLimitPolicy { rps: 3, rpm: 30 }
        );
        assert_eq!(
            rate_limit_policy("/search", &Method::GET, &limits),
            RateLimitPolicy { rps: 10, rpm: 100 }
        );
    }

    #[test]
    fn bucket_keys_separate_second_and_minute_windows() {
        let now = Utc.with_ymd_and_hms(2026, 3, 22, 15, 4, 5).unwrap();
        let (second_key, minute_key) = build_rate_limit_keys("127.0.0.1", "abcd1234", now);

        assert_eq!(second_key, "rl:s:127.0.0.1:abcd1234:20260322150405");
        assert_eq!(minute_key, "rl:m:127.0.0.1:abcd1234:202603221504");
    }

    #[test]
    fn headers_report_limits_and_remaining_quota() {
        let mut headers = HeaderMap::new();
        let policy = RateLimitPolicy { rps: 5, rpm: 60 };
        let outcome = RateLimitOutcome {
            allowed: true,
            second_current: 2,
            minute_current: 10,
            second_ttl_secs: 1,
            minute_ttl_secs: 30,
            retry_after_secs: 0,
        };

        apply_rate_limit_headers(&mut headers, policy, outcome);

        assert_eq!(headers.get(RATE_LIMIT_LIMIT_SECOND).unwrap(), "5");
        assert_eq!(headers.get(RATE_LIMIT_LIMIT_MINUTE).unwrap(), "60");
        assert_eq!(headers.get(RATE_LIMIT_REMAINING_SECOND).unwrap(), "3");
        assert_eq!(headers.get(RATE_LIMIT_REMAINING_MINUTE).unwrap(), "50");
    }

    #[test]
    fn redis_script_result_is_converted_safely() {
        let outcome = RateLimitOutcome::from_redis_result((0, 9, 70, 1, 45, 45));
        let policy = RateLimitPolicy { rps: 5, rpm: 60 };

        assert!(!outcome.allowed);
        assert_eq!(outcome.remaining_second(policy), 0);
        assert_eq!(outcome.remaining_minute(policy), 0);
        assert_eq!(outcome.retry_after_secs, 45);
    }
}
