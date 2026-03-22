use crate::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use sysinfo::System;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
pub struct HealthStatus {
    pub status: String,
    pub timestamp: DateTime<Utc>,
    pub version: String,
    pub uptime_seconds: u64,
    pub services: HashMap<String, ServiceStatus>,
}

#[derive(Debug, Serialize, ToSchema, Clone)]
pub struct ServiceStatus {
    pub status: String,
    pub message: Option<String>,
    pub response_time_ms: Option<u64>,
    pub last_check: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DetailedHealth {
    pub status: String,
    pub timestamp: DateTime<Utc>,
    pub uptime_seconds: u64,
    pub version: String,
    pub environment: String,
    pub services: HashMap<String, ServiceStatus>,
    pub metrics: SystemMetrics,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct SystemMetrics {
    pub memory_usage: MemoryUsage,
    pub cpu_usage: Option<f64>,
    pub active_connections: u64,
    pub database_pool: DatabasePoolStatus,
    pub redis_status: ServiceStatus,
    pub outbox: OutboxQueueMetrics,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MemoryUsage {
    pub used_mb: u64,
    pub total_mb: u64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct DatabasePoolStatus {
    pub size: u32,
    pub idle: u32,
    pub active: u32,
}

#[derive(Debug, Serialize, ToSchema, Clone, Default)]
pub struct OutboxQueueMetrics {
    pub pending_events: i64,
    pub stale_locked_events: i64,
    pub dead_letter_events: i64,
    pub oldest_pending_age_seconds: Option<i64>,
}

static APP_START_TIME: OnceLock<DateTime<Utc>> = OnceLock::new();
static HEALTH_SYSTEM: OnceLock<Mutex<System>> = OnceLock::new();

pub fn set_app_start_time() {
    let _ = APP_START_TIME.get_or_init(Utc::now);
}

fn get_app_start_time() -> DateTime<Utc> {
    *APP_START_TIME.get_or_init(Utc::now)
}

pub fn get_uptime_seconds() -> u64 {
    let start = get_app_start_time();
    let now = Utc::now();
    now.timestamp().saturating_sub(start.timestamp()) as u64
}

#[utoipa::path(
    get,
    path = "/health",
    tag = "monitoring",
    responses(
        (status = 200, description = "服务健康", body = HealthStatus),
        (status = 503, description = "服务不健康")
    )
)]
pub async fn health() -> impl IntoResponse {
    let status = HealthStatus {
        status: "healthy".to_string(),
        timestamp: Utc::now(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: get_uptime_seconds(),
        services: HashMap::new(),
    };

    (StatusCode::OK, Json(status)).into_response()
}

#[utoipa::path(
    get,
    path = "/health/detailed",
    tag = "monitoring",
    responses(
        (status = 200, description = "服务健康", body = DetailedHealth),
        (status = 503, description = "服务不健康")
    )
)]
pub async fn health_detailed(State(state): State<crate::AppState>) -> Result<Response, StatusCode> {
    let mut services = HashMap::new();

    let db_status = check_database_health(&state.db).await;
    services.insert("database".to_string(), db_status.clone());

    let redis_status = check_redis_health(&state.redis).await;
    services.insert("redis".to_string(), redis_status.clone());

    let jwt_status = check_jwt_health(&state.jwt).await;
    services.insert("jwt".to_string(), jwt_status.clone());

    let email_status = check_email_health(&state.email_service).await;
    services.insert("email".to_string(), email_status.clone());

    let (outbox_status, outbox_metrics) = check_outbox_health(
        &state.db,
        &state.settings.health,
        state.settings.worker.lock_timeout_secs,
    )
    .await;
    services.insert("outbox".to_string(), outbox_status.clone());

    let overall_status = calculate_overall_status(&services);
    let status_code = match overall_status.as_str() {
        "unhealthy" => StatusCode::SERVICE_UNAVAILABLE,
        _ => StatusCode::OK,
    };

    let metrics = SystemMetrics {
        memory_usage: get_memory_usage(),
        cpu_usage: get_cpu_usage(),
        active_connections: get_active_connections(&state).await,
        database_pool: get_database_pool_status(&state.db).await,
        redis_status,
        outbox: outbox_metrics,
    };

    let health = DetailedHealth {
        status: overall_status,
        timestamp: Utc::now(),
        uptime_seconds: get_uptime_seconds(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        environment: std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
        services,
        metrics,
    };

    Ok((status_code, Json(health)).into_response())
}

#[utoipa::path(
    get,
    path = "/readyz",
    tag = "monitoring",
    responses(
        (status = 200, description = "服务就绪"),
        (status = 503, description = "服务未就绪")
    )
)]
pub async fn readyz(State(state): State<crate::AppState>) -> Result<(), StatusCode> {
    let (db_ok, redis_ok, jwt_ok, email_ok) = tokio::join!(
        check_database_health(&state.db),
        check_redis_health(&state.redis),
        check_jwt_health(&state.jwt),
        check_email_health(&state.email_service)
    );

    if db_ok.status == "healthy"
        && redis_ok.status == "healthy"
        && jwt_ok.status == "healthy"
        && email_ok.status == "healthy"
    {
        Ok(())
    } else {
        Err(StatusCode::SERVICE_UNAVAILABLE)
    }
}

async fn check_database_health(db: &sqlx::PgPool) -> ServiceStatus {
    let start = std::time::Instant::now();

    match sqlx::query("SELECT 1 as test").fetch_one(db).await {
        Ok(_) => ServiceStatus {
            status: "healthy".to_string(),
            message: None,
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
        Err(error) => ServiceStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("Database connection failed: {}", error)),
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
    }
}

async fn check_redis_health(redis_pool: &deadpool_redis::Pool) -> ServiceStatus {
    let start = std::time::Instant::now();

    match redis_pool.get().await {
        Ok(mut conn) => match redis::cmd("PING").query_async::<String>(&mut conn).await {
            Ok(_) => ServiceStatus {
                status: "healthy".to_string(),
                message: None,
                response_time_ms: Some(start.elapsed().as_millis() as u64),
                last_check: Some(Utc::now()),
            },
            Err(error) => ServiceStatus {
                status: "unhealthy".to_string(),
                message: Some(format!("Redis PING failed: {}", error)),
                response_time_ms: Some(start.elapsed().as_millis() as u64),
                last_check: Some(Utc::now()),
            },
        },
        Err(error) => ServiceStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("Redis connection failed: {}", error)),
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
    }
}

async fn check_jwt_health(jwt: &blog_core::JwtService) -> ServiceStatus {
    let start = std::time::Instant::now();
    let test_user_id = uuid::Uuid::new_v4();

    match jwt.create_refresh_token(&test_user_id) {
        Ok(_) => ServiceStatus {
            status: "healthy".to_string(),
            message: None,
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
        Err(error) => ServiceStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("JWT service error: {}", error)),
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
    }
}

async fn check_email_health(_email_service: &blog_core::email::EmailService) -> ServiceStatus {
    let start = std::time::Instant::now();

    ServiceStatus {
        status: "healthy".to_string(),
        message: Some("Email service is configured".to_string()),
        response_time_ms: Some(start.elapsed().as_millis() as u64),
        last_check: Some(Utc::now()),
    }
}

async fn check_outbox_health(
    db: &sqlx::PgPool,
    health_config: &blog_shared::HealthConfig,
    lock_timeout_secs: i32,
) -> (ServiceStatus, OutboxQueueMetrics) {
    let start = std::time::Instant::now();

    match fetch_outbox_metrics(db, lock_timeout_secs).await {
        Ok(metrics_row) => {
            let metrics: OutboxQueueMetrics = metrics_row.into();
            let now = Utc::now();
            let status = evaluate_outbox_status(&metrics, health_config);

            (
                ServiceStatus {
                    status: status.to_string(),
                    message: Some(format!(
                        "pending={}, stale_locked={}, dead_letter={}",
                        metrics.pending_events,
                        metrics.stale_locked_events,
                        metrics.dead_letter_events
                    )),
                    response_time_ms: Some(start.elapsed().as_millis() as u64),
                    last_check: Some(now),
                },
                metrics,
            )
        }
        Err(error) => (
            ServiceStatus {
                status: "unhealthy".to_string(),
                message: Some(format!("Outbox query failed: {}", error)),
                response_time_ms: Some(start.elapsed().as_millis() as u64),
                last_check: Some(Utc::now()),
            },
            OutboxQueueMetrics::default(),
        ),
    }
}

pub(crate) async fn collect_outbox_metrics(
    db: &sqlx::PgPool,
    lock_timeout_secs: i32,
) -> Result<OutboxQueueMetrics, sqlx::Error> {
    fetch_outbox_metrics(db, lock_timeout_secs)
        .await
        .map(Into::into)
}

async fn fetch_outbox_metrics(
    db: &sqlx::PgPool,
    lock_timeout_secs: i32,
) -> Result<OutboxMetricsRow, sqlx::Error> {
    sqlx::query_as::<_, OutboxMetricsRow>(
        r#"
        SELECT
            COUNT(*) FILTER (
                WHERE processed_at IS NULL
                    AND retry_count < 3
            ) AS pending_events,
            COUNT(*) FILTER (
                WHERE processed_at IS NULL
                    AND retry_count < 3
                    AND locked_at IS NOT NULL
                    AND locked_at < NOW() - make_interval(secs => $1)
            ) AS stale_locked_events,
            COUNT(*) FILTER (
                WHERE processed_at IS NULL
                    AND retry_count >= 3
            ) AS dead_letter_events,
            MAX(
                FLOOR(EXTRACT(EPOCH FROM NOW() - created_at))
            ) FILTER (
                WHERE processed_at IS NULL
                    AND retry_count < 3
            ) AS oldest_pending_age_seconds
        FROM outbox_events
        "#,
    )
    .bind(lock_timeout_secs)
    .fetch_one(db)
    .await
}

fn calculate_overall_status(services: &HashMap<String, ServiceStatus>) -> String {
    if services
        .values()
        .any(|service| service.status == "unhealthy")
    {
        "unhealthy".to_string()
    } else if services
        .values()
        .any(|service| service.status == "degraded")
    {
        "degraded".to_string()
    } else {
        "healthy".to_string()
    }
}

fn evaluate_outbox_status(
    metrics: &OutboxQueueMetrics,
    health_config: &blog_shared::HealthConfig,
) -> &'static str {
    if metrics.dead_letter_events > 0
        || metrics.pending_events >= health_config.outbox_pending_fail_threshold
        || metrics.oldest_pending_age_seconds.unwrap_or_default()
            >= health_config.outbox_oldest_fail_secs
    {
        "unhealthy"
    } else if metrics.stale_locked_events > 0
        || metrics.pending_events >= health_config.outbox_pending_warn_threshold
        || metrics.oldest_pending_age_seconds.unwrap_or_default()
            >= health_config.outbox_oldest_warn_secs
    {
        "degraded"
    } else {
        "healthy"
    }
}

fn get_memory_usage() -> MemoryUsage {
    let mut system = health_system()
        .lock()
        .expect("health system mutex should not be poisoned");
    system.refresh_memory();

    let used_mb = system.used_memory() / 1024 / 1024;
    let total_mb = system.total_memory() / 1024 / 1024;
    let percentage = if total_mb == 0 {
        0.0
    } else {
        (used_mb as f64 / total_mb as f64) * 100.0
    };

    MemoryUsage {
        used_mb,
        total_mb,
        percentage,
    }
}

fn get_cpu_usage() -> Option<f64> {
    let mut system = health_system()
        .lock()
        .expect("health system mutex should not be poisoned");
    system.refresh_cpu_usage();
    Some(system.global_cpu_usage() as f64)
}

async fn get_active_connections(state: &AppState) -> u64 {
    let size = state.db.size();
    let idle = state.db.num_idle() as u32;
    u64::from(size.saturating_sub(idle))
}

async fn get_database_pool_status(db: &sqlx::PgPool) -> DatabasePoolStatus {
    let size = db.size();
    let idle = db.num_idle() as u32;
    DatabasePoolStatus {
        size,
        idle,
        active: size.saturating_sub(idle),
    }
}

#[derive(sqlx::FromRow)]
struct OutboxMetricsRow {
    pending_events: i64,
    stale_locked_events: i64,
    dead_letter_events: i64,
    oldest_pending_age_seconds: Option<i64>,
}

impl From<OutboxMetricsRow> for OutboxQueueMetrics {
    fn from(value: OutboxMetricsRow) -> Self {
        Self {
            pending_events: value.pending_events,
            stale_locked_events: value.stale_locked_events,
            dead_letter_events: value.dead_letter_events,
            oldest_pending_age_seconds: value.oldest_pending_age_seconds,
        }
    }
}

fn health_system() -> &'static Mutex<System> {
    HEALTH_SYSTEM.get_or_init(|| {
        let mut system = System::new();
        system.refresh_memory();
        system.refresh_cpu_usage();
        Mutex::new(system)
    })
}

#[cfg(test)]
mod tests {
    use super::{
        calculate_overall_status, evaluate_outbox_status, OutboxQueueMetrics, ServiceStatus,
    };
    use blog_shared::HealthConfig;
    use chrono::Utc;
    use std::collections::HashMap;

    fn health_config() -> HealthConfig {
        HealthConfig {
            outbox_pending_warn_threshold: 100,
            outbox_pending_fail_threshold: 500,
            outbox_oldest_warn_secs: 60,
            outbox_oldest_fail_secs: 300,
        }
    }

    #[test]
    fn outbox_status_degrades_before_it_fails() {
        let config = health_config();
        let degraded = OutboxQueueMetrics {
            pending_events: 150,
            stale_locked_events: 0,
            dead_letter_events: 0,
            oldest_pending_age_seconds: Some(30),
        };
        let unhealthy = OutboxQueueMetrics {
            pending_events: 50,
            stale_locked_events: 0,
            dead_letter_events: 1,
            oldest_pending_age_seconds: Some(10),
        };

        assert_eq!(evaluate_outbox_status(&degraded, &config), "degraded");
        assert_eq!(evaluate_outbox_status(&unhealthy, &config), "unhealthy");
    }

    #[test]
    fn overall_status_prefers_unhealthy_over_degraded() {
        let mut services = HashMap::new();
        services.insert(
            "database".to_string(),
            ServiceStatus {
                status: "healthy".to_string(),
                message: None,
                response_time_ms: Some(1),
                last_check: Some(Utc::now()),
            },
        );
        services.insert(
            "outbox".to_string(),
            ServiceStatus {
                status: "degraded".to_string(),
                message: None,
                response_time_ms: Some(1),
                last_check: Some(Utc::now()),
            },
        );
        assert_eq!(calculate_overall_status(&services), "degraded");

        services.insert(
            "redis".to_string(),
            ServiceStatus {
                status: "unhealthy".to_string(),
                message: None,
                response_time_ms: Some(1),
                last_check: Some(Utc::now()),
            },
        );
        assert_eq!(calculate_overall_status(&services), "unhealthy");
    }
}
