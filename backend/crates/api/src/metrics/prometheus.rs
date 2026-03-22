use crate::utils::normalized_route_label;
use crate::AppState;
use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use prometheus::{Counter, Gauge, Histogram, IntCounterVec, Opts, Registry, TextEncoder};
use std::sync::Arc;
use tokio::sync::RwLock;

// Prometheus指标结构
#[derive(Clone)]
pub struct Metrics {
    pub registry: Registry,
    pub http_requests_total: prometheus::IntCounterVec,
    pub http_request_duration: Histogram,
    pub http_requests_in_flight: Gauge,
    pub active_connections: Gauge,
    pub database_connections_active: Gauge,
    pub redis_connections_active: Gauge,
    pub redis_connections_waiting: Gauge,
    pub rate_limit_decisions_total: IntCounterVec,
    pub cache_hits: Counter,
    pub cache_misses: Counter,
    pub user_registrations_total: Counter,
    pub user_logins_total: Counter,
    pub comments_created_total: Counter,
    pub post_views_total: Counter,
    pub post_likes_total: Counter,
    pub comment_likes_total: Counter,
    pub outbox_pending_events: Gauge,
    pub outbox_stale_locked_events: Gauge,
    pub outbox_dead_letter_events: Gauge,
    pub outbox_oldest_pending_age_seconds: Gauge,
}

impl Metrics {
    pub fn new() -> Self {
        let registry = Registry::new();

        let http_requests_total = prometheus::IntCounterVec::new(
            Opts::new("http_requests_total", "Total number of HTTP requests"),
            &["method", "endpoint", "status_code"],
        )
        .expect("Failed to create http_requests_total counter");

        let http_request_duration = Histogram::with_opts(
            prometheus::HistogramOpts::new(
                "http_request_duration_seconds",
                "HTTP request duration in seconds",
            )
            .buckets(vec![
                0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 300.0,
            ]),
        )
        .expect("Failed to create http_request_duration histogram");
        let http_requests_in_flight = Gauge::new(
            "http_requests_in_flight",
            "Number of HTTP requests currently being served",
        )
        .expect("Failed to create http_requests_in_flight gauge");

        let active_connections = Gauge::new("active_connections", "Number of active connections")
            .expect("Failed to create active_connections gauge");

        let database_connections_active = Gauge::new(
            "database_connections_active",
            "Number of active database connections",
        )
        .expect("Failed to create database_connections_active gauge");

        let redis_connections_active = Gauge::new(
            "redis_connections_active",
            "Number of active Redis connections",
        )
        .expect("Failed to create redis_connections_active gauge");
        let redis_connections_waiting = Gauge::new(
            "redis_connections_waiting",
            "Number of waiters blocked on the Redis pool",
        )
        .expect("Failed to create redis_connections_waiting gauge");
        let rate_limit_decisions_total = IntCounterVec::new(
            Opts::new(
                "rate_limit_decisions_total",
                "Total number of rate limiting decisions by route and outcome",
            ),
            &["route", "outcome"],
        )
        .expect("Failed to create rate_limit_decisions_total counter");

        let cache_hits = Counter::new("cache_hits_total", "Total number of cache hits")
            .expect("Failed to create cache_hits_total counter");

        let cache_misses = Counter::new("cache_misses_total", "Total number of cache misses")
            .expect("Failed to create cache_misses_total counter");

        let user_registrations_total = Counter::new(
            "user_registrations_total",
            "Total number of user registrations",
        )
        .expect("Failed to create user_registrations_total counter");

        let user_logins_total = Counter::new("user_logins_total", "Total number of user logins")
            .expect("Failed to create user_logins_total counter");

        let comments_created_total =
            Counter::new("comments_created_total", "Total number of comments created")
                .expect("Failed to create comments_created_total counter");

        let post_views_total = Counter::new("post_views_total", "Total number of post views")
            .expect("Failed to create post_views_total counter");

        let post_likes_total = Counter::new("post_likes_total", "Total number of post likes")
            .expect("Failed to create post_likes_total counter");

        let comment_likes_total =
            Counter::new("comment_likes_total", "Total number of comment likes")
                .expect("Failed to create comment_likes_total counter");
        let outbox_pending_events = Gauge::new(
            "outbox_pending_events",
            "Number of outbox events waiting to be processed",
        )
        .expect("Failed to create outbox_pending_events gauge");
        let outbox_stale_locked_events = Gauge::new(
            "outbox_stale_locked_events",
            "Number of stale locked outbox events",
        )
        .expect("Failed to create outbox_stale_locked_events gauge");
        let outbox_dead_letter_events = Gauge::new(
            "outbox_dead_letter_events",
            "Number of outbox events that exceeded retry threshold",
        )
        .expect("Failed to create outbox_dead_letter_events gauge");
        let outbox_oldest_pending_age_seconds = Gauge::new(
            "outbox_oldest_pending_age_seconds",
            "Age in seconds of the oldest pending outbox event",
        )
        .expect("Failed to create outbox_oldest_pending_age_seconds gauge");

        registry
            .register(Box::new(http_requests_total.clone()))
            .expect("Failed to register http_requests_total");
        registry
            .register(Box::new(http_request_duration.clone()))
            .expect("Failed to register http_request_duration");
        registry
            .register(Box::new(http_requests_in_flight.clone()))
            .expect("Failed to register http_requests_in_flight");
        registry
            .register(Box::new(active_connections.clone()))
            .expect("Failed to register active_connections");
        registry
            .register(Box::new(database_connections_active.clone()))
            .expect("Failed to register database_connections_active");
        registry
            .register(Box::new(redis_connections_active.clone()))
            .expect("Failed to register redis_connections_active");
        registry
            .register(Box::new(redis_connections_waiting.clone()))
            .expect("Failed to register redis_connections_waiting");
        registry
            .register(Box::new(rate_limit_decisions_total.clone()))
            .expect("Failed to register rate_limit_decisions_total");
        registry
            .register(Box::new(cache_hits.clone()))
            .expect("Failed to register cache_hits");
        registry
            .register(Box::new(cache_misses.clone()))
            .expect("Failed to register cache_misses");
        registry
            .register(Box::new(user_registrations_total.clone()))
            .expect("Failed to register user_registrations_total");
        registry
            .register(Box::new(user_logins_total.clone()))
            .expect("Failed to register user_logins_total");
        registry
            .register(Box::new(comments_created_total.clone()))
            .expect("Failed to register comments_created_total");
        registry
            .register(Box::new(post_views_total.clone()))
            .expect("Failed to register post_views_total");
        registry
            .register(Box::new(post_likes_total.clone()))
            .expect("Failed to register post_likes_total");
        registry
            .register(Box::new(comment_likes_total.clone()))
            .expect("Failed to register comment_likes_total");
        registry
            .register(Box::new(outbox_pending_events.clone()))
            .expect("Failed to register outbox_pending_events");
        registry
            .register(Box::new(outbox_stale_locked_events.clone()))
            .expect("Failed to register outbox_stale_locked_events");
        registry
            .register(Box::new(outbox_dead_letter_events.clone()))
            .expect("Failed to register outbox_dead_letter_events");
        registry
            .register(Box::new(outbox_oldest_pending_age_seconds.clone()))
            .expect("Failed to register outbox_oldest_pending_age_seconds");

        Self {
            registry,
            http_requests_total,
            http_request_duration,
            http_requests_in_flight,
            active_connections,
            database_connections_active,
            redis_connections_active,
            redis_connections_waiting,
            rate_limit_decisions_total,
            cache_hits,
            cache_misses,
            user_registrations_total,
            user_logins_total,
            comments_created_total,
            post_views_total,
            post_likes_total,
            comment_likes_total,
            outbox_pending_events,
            outbox_stale_locked_events,
            outbox_dead_letter_events,
            outbox_oldest_pending_age_seconds,
        }
    }

    pub fn increment_http_requests(&self, method: &str, endpoint: &str, status_code: u16) {
        self.http_requests_total
            .with_label_values(&[method, endpoint, &status_code.to_string()])
            .inc();
    }

    pub fn record_request_duration(&self, duration: f64) {
        self.http_request_duration.observe(duration);
    }

    pub fn increment_http_requests_in_flight(&self) {
        self.http_requests_in_flight.inc();
    }

    pub fn decrement_http_requests_in_flight(&self) {
        self.http_requests_in_flight.dec();
    }

    pub fn record_rate_limit_decision(&self, route: &str, outcome: &str) {
        self.rate_limit_decisions_total
            .with_label_values(&[route, outcome])
            .inc();
    }

    pub fn increment_cache_hits(&self) {
        self.cache_hits.inc();
    }

    pub fn increment_cache_misses(&self) {
        self.cache_misses.inc();
    }

    pub fn increment_user_registrations(&self) {
        self.user_registrations_total.inc();
    }

    pub fn increment_user_logins(&self) {
        self.user_logins_total.inc();
    }

    pub fn increment_comments_created(&self) {
        self.comments_created_total.inc();
    }

    pub fn increment_post_views(&self) {
        self.post_views_total.inc();
    }

    pub fn increment_post_likes(&self) {
        self.post_likes_total.inc();
    }

    pub fn increment_comment_likes(&self) {
        self.comment_likes_total.inc();
    }

    pub fn set_active_connections(&self, count: u64) {
        self.active_connections.set(count as f64);
    }

    pub fn set_database_connections(&self, active: i32) {
        self.database_connections_active.set(active as f64);
    }

    pub fn set_redis_connections(&self, active: i32, waiting: i32) {
        self.redis_connections_active.set(active as f64);
        self.redis_connections_waiting.set(waiting as f64);
    }

    pub fn set_outbox_metrics(
        &self,
        pending: i64,
        stale_locked: i64,
        dead_letter: i64,
        oldest_pending_age_seconds: Option<i64>,
    ) {
        self.outbox_pending_events.set(pending as f64);
        self.outbox_stale_locked_events.set(stale_locked as f64);
        self.outbox_dead_letter_events.set(dead_letter as f64);
        self.outbox_oldest_pending_age_seconds
            .set(oldest_pending_age_seconds.unwrap_or_default() as f64);
    }

    pub fn export(&self) -> std::result::Result<Vec<u8>, prometheus::Error> {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        encoder
            .encode_to_string(&metric_families)
            .map(|data| data.into_bytes())
    }
}

// 中间件用于收集指标
pub struct MetricsMiddleware {
    metrics: Arc<RwLock<Metrics>>,
}

impl MetricsMiddleware {
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(Metrics::new())),
        }
    }

    pub fn get_metrics(&self) -> Arc<RwLock<Metrics>> {
        self.metrics.clone()
    }
}

/// Prometheus指标导出端点
#[utoipa::path(
    get,
    path = "/metrics",
    tag = "monitoring",
    responses(
        (status = 200, description = "Prometheus指标", content_type = "text/plain; version=0.0.4"),
        (status = 500, description = "指标导出失败")
    )
)]
pub async fn metrics_endpoint(
    State(state): State<AppState>,
) -> std::result::Result<Response, StatusCode> {
    let outbox_metrics = match super::health::collect_outbox_metrics(
        &state.db,
        state.settings.worker.lock_timeout_secs,
    )
    .await
    {
        Ok(metrics) => metrics,
        Err(error) => {
            tracing::warn!(
                "Failed to collect outbox metrics for Prometheus export: {}",
                error
            );
            super::health::OutboxQueueMetrics::default()
        }
    };
    let db_size = state.db.size();
    let db_idle = state.db.num_idle() as u32;
    let redis_status = state.redis.status();

    let metrics = state.metrics.read().await;
    metrics.set_active_connections(u64::from(db_size.saturating_sub(db_idle)));
    metrics.set_database_connections(db_size.saturating_sub(db_idle) as i32);
    metrics.set_redis_connections(
        redis_status.size.saturating_sub(redis_status.available) as i32,
        redis_status.waiting as i32,
    );
    metrics.set_outbox_metrics(
        outbox_metrics.pending_events,
        outbox_metrics.stale_locked_events,
        outbox_metrics.dead_letter_events,
        outbox_metrics.oldest_pending_age_seconds,
    );

    match metrics.export() {
        Ok(data) => {
            let response = Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "text/plain; version=0.0.4")
                .body(axum::body::Body::from(data))
                .expect("Failed to build metrics response");
            Ok(response)
        }
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn http_metrics_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let method = request.method().to_string();
    let route = normalized_route_label(&request);
    let metrics = state.metrics.clone();

    {
        let metrics = metrics.read().await;
        metrics.increment_http_requests_in_flight();
    }

    let started = std::time::Instant::now();
    let response = next.run(request).await;
    let status_code = response.status().as_u16();
    let duration = started.elapsed().as_secs_f64();

    {
        let metrics = metrics.read().await;
        metrics.decrement_http_requests_in_flight();
        metrics.increment_http_requests(&method, &route, status_code);
        metrics.record_request_duration(duration);
    }

    response
}

// 指标收集辅助函数
pub async fn track_request<F, R>(
    metrics: Arc<RwLock<Metrics>>,
    method: &str,
    endpoint: &str,
    future: F,
) -> std::result::Result<R, StatusCode>
where
    F: std::future::Future<Output = std::result::Result<R, StatusCode>>,
{
    let start_time = std::time::Instant::now();

    let result = future.await;

    let status_code = match &result {
        Ok(_) => StatusCode::OK,
        Err(code) => *code,
    };

    let duration = start_time.elapsed().as_secs_f64();

    // 在后台更新指标，避免阻塞响应
    let metrics_clone = metrics.clone();
    let method_owned = method.to_string();
    let endpoint_owned = endpoint.to_string();

    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_http_requests(&method_owned, &endpoint_owned, status_code.as_u16());
        metrics.record_request_duration(duration);
    });

    result
}

pub fn track_cache_hit(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_cache_hits();
    });
}

pub fn track_cache_miss(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_cache_misses();
    });
}

pub fn track_user_registration(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_user_registrations();
    });
}

pub fn track_user_login(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_user_logins();
    });
}

pub fn track_comment_created(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_comments_created();
    });
}

pub fn track_post_view(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_post_views();
    });
}

pub fn track_post_like(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_post_likes();
    });
}

pub fn track_comment_like(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.increment_comment_likes();
    });
}

#[cfg(test)]
mod tests {
    use super::Metrics;

    #[test]
    fn export_contains_http_and_rate_limit_metrics() {
        let metrics = Metrics::new();
        metrics.increment_http_requests("GET", "/search", 200);
        metrics.increment_http_requests_in_flight();
        metrics.decrement_http_requests_in_flight();
        metrics.record_rate_limit_decision("/auth/login", "rejected");
        metrics.set_outbox_metrics(12, 1, 0, Some(42));

        let exported = String::from_utf8(metrics.export().expect("metrics should export"))
            .expect("metrics should be valid utf-8");

        assert!(exported.contains("http_requests_total"));
        assert!(exported.contains("http_requests_in_flight"));
        assert!(exported.contains("rate_limit_decisions_total"));
        assert!(exported.contains("outbox_pending_events 12"));
    }
}
