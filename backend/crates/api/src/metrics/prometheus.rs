use crate::AppState;
use axum::{extract::State, http::StatusCode, response::Response};
use prometheus::{Counter, Gauge, Histogram, Opts, Registry, TextEncoder};
use std::sync::Arc;
use tokio::sync::RwLock;

// Prometheus指标结构
#[derive(Clone)]
pub struct Metrics {
    pub registry: Registry,
    pub http_requests_total: prometheus::IntCounterVec,
    pub http_request_duration: Histogram,
    pub active_connections: Gauge,
    pub database_connections_active: Gauge,
    pub redis_connections_active: Gauge,
    pub cache_hits: Counter,
    pub cache_misses: Counter,
    pub user_registrations_total: Counter,
    pub user_logins_total: Counter,
    pub comments_created_total: Counter,
    pub post_views_total: Counter,
    pub post_likes_total: Counter,
    pub comment_likes_total: Counter,
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

        registry
            .register(Box::new(http_requests_total.clone()))
            .expect("Failed to register http_requests_total");
        registry
            .register(Box::new(http_request_duration.clone()))
            .expect("Failed to register http_request_duration");
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

        Self {
            registry,
            http_requests_total,
            http_request_duration,
            active_connections,
            database_connections_active,
            redis_connections_active,
            cache_hits,
            cache_misses,
            user_registrations_total,
            user_logins_total,
            comments_created_total,
            post_views_total,
            post_likes_total,
            comment_likes_total,
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

    pub fn set_redis_connections(&self, active: i32) {
        self.redis_connections_active.set(active as f64);
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
    let metrics = state.metrics.read().await;

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
