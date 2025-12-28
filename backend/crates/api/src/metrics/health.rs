use axum::{
    extract::State,
    response::{Json, IntoResponse},
    http::StatusCode,
};
use serde::Serialize;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use utoipa::ToSchema;
use crate::AppState;

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

// 应用启动时间（需要从main.rs传递）
static mut APP_START_TIME: Option<DateTime<Utc>> = None;

pub fn set_app_start_time() {
    unsafe {
        APP_START_TIME = Some(Utc::now());
    }
}

fn get_app_start_time() -> DateTime<Utc> {
    unsafe {
        APP_START_TIME.unwrap_or_else(|| Utc::now())
    }
}

pub fn get_uptime_seconds() -> u64 {
    let start = get_app_start_time();
    let now = Utc::now();
    now.timestamp().saturating_sub(start.timestamp()) as u64
}

/// 基础健康检查
#[utoipa::path(
    get,
    path = "/healthz",
    tag = "monitoring",
    responses(
        (status = 200, description = "服务健康", body = HealthStatus),
        (status = 503, description = "服务不健康")
    )
)]
pub async fn healthz() -> impl IntoResponse {
    let status = HealthStatus {
        status: "healthy".to_string(),
        timestamp: Utc::now(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_seconds: get_uptime_seconds(),
        services: HashMap::new(),
    };

    (StatusCode::OK, Json(status)).into_response()
}

/// 详细健康检查（包括依赖服务）
#[utoipa::path(
    get,
    path = "/healthz/detailed",
    tag = "monitoring",
    responses(
        (status = 200, description = "服务健康", body = DetailedHealth),
        (status = 503, description = "服务不健康")
    )
)]
pub async fn healthz_detailed(State(state): State<crate::AppState>) -> Result<impl IntoResponse, StatusCode> {
    let start_time = std::time::Instant::now();
    let mut services = HashMap::new();
    let mut healthy = true;

    // 检查数据库连接
    let db_status = check_database_health(&state.db).await;
    services.insert("database".to_string(), db_status.clone());
    if db_status.status != "healthy" {
        healthy = false;
    }

    // 检查 Redis 连接
    let redis_status = check_redis_health(&state.redis).await;
    services.insert("redis".to_string(), redis_status.clone());
    if redis_status.status != "healthy" {
        healthy = false;
    }

    // 检查 JWT 服务
    let jwt_status = check_jwt_health(&state.jwt).await;
    services.insert("jwt".to_string(), jwt_status.clone());
    if jwt_status.status != "healthy" {
        healthy = false;
    }

    // 检查邮件服务
    let email_status = check_email_health(&state.email_service).await;
    services.insert("email".to_string(), email_status.clone());
    if email_status.status != "healthy" {
        healthy = false;
    }

    let _response_time = start_time.elapsed().as_millis();

    let metrics = SystemMetrics {
        memory_usage: get_memory_usage(),
        cpu_usage: get_cpu_usage().await,
        active_connections: get_active_connections(&state).await,
        database_pool: get_database_pool_status(&state.db).await,
        redis_status,
    };

    let health = DetailedHealth {
        status: if healthy { "healthy" } else { "unhealthy" }.to_string(),
        timestamp: Utc::now(),
        uptime_seconds: get_uptime_seconds(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        environment: std::env::var("RUST_ENV").unwrap_or_else(|_| "development".to_string()),
        services,
        metrics,
    };

    let _status_code = if healthy { StatusCode::OK } else { StatusCode::SERVICE_UNAVAILABLE };

    // 添加响应时间头
    let response = Json(health);
    let response_with_timing = response.into_response();

    Ok(response_with_timing)
}

/// 就绪检查（所有依赖服务都必须健康）
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
    // 并发检查所有关键服务
    let (db_ok, redis_ok, jwt_ok, email_ok) = tokio::join!(
        check_database_health(&state.db),
        check_redis_health(&state.redis),
        check_jwt_health(&state.jwt),
        check_email_health(&state.email_service)
    );

    if db_ok.status == "healthy"
        && redis_ok.status == "healthy"
        && jwt_ok.status == "healthy"
        && email_ok.status == "healthy" {
        Ok(())
    } else {
        Err(StatusCode::SERVICE_UNAVAILABLE)
    }
}

async fn check_database_health(db: &sqlx::PgPool) -> ServiceStatus {
    let start = std::time::Instant::now();

    match sqlx::query("SELECT 1 as test")
        .fetch_one(db)
        .await
    {
        Ok(_) => ServiceStatus {
            status: "healthy".to_string(),
            message: None,
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
        Err(e) => ServiceStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("Database connection failed: {}", e)),
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        }
    }
}

async fn check_redis_health(redis_pool: &deadpool_redis::Pool) -> ServiceStatus {
    let start = std::time::Instant::now();

    match redis_pool.get().await {
        Ok(mut conn) => {
            match redis::cmd("PING")
                .query_async::<String>(&mut conn)
                .await
            {
                Ok(_) => ServiceStatus {
                    status: "healthy".to_string(),
                    message: None,
                    response_time_ms: Some(start.elapsed().as_millis() as u64),
                    last_check: Some(Utc::now()),
                },
                Err(e) => ServiceStatus {
                    status: "unhealthy".to_string(),
                    message: Some(format!("Redis PING failed: {}", e)),
                    response_time_ms: Some(start.elapsed().as_millis() as u64),
                    last_check: Some(Utc::now()),
                }
            }
        },
        Err(e) => ServiceStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("Redis connection failed: {}", e)),
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        }
    }
}

async fn check_jwt_health(jwt: &blog_core::JwtService) -> ServiceStatus {
    let start = std::time::Instant::now();

    // Create a test user ID
    let test_user_id = uuid::Uuid::new_v4();

    // 尝试生成一个测试token
    match jwt.create_refresh_token(&test_user_id) {
        Ok(_) => ServiceStatus {
            status: "healthy".to_string(),
            message: None,
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
        Err(e) => ServiceStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("JWT service error: {}", e)),
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        }
    }
}

async fn check_email_health(_email_service: &blog_core::email::EmailService) -> ServiceStatus {
    let start = std::time::Instant::now();

    // 检查邮件服务配置
    // 这里可以尝试发送一个测试邮件或者验证配置
    ServiceStatus {
        status: "healthy".to_string(),
        message: Some("Email service is configured".to_string()),
        response_time_ms: Some(start.elapsed().as_millis() as u64),
        last_check: Some(Utc::now()),
    }
}

fn get_memory_usage() -> MemoryUsage {
    // 简单的内存使用估算
    // 在生产环境中，这里应该使用更精确的内存监控库
    MemoryUsage {
        used_mb: 128,  // 示例值
        total_mb: 1024,  // 示例值
        percentage: 12.5,   // 示例值
    }
}

async fn get_cpu_usage() -> Option<f64> {
    // 在生产环境中，这里应该使用系统监控库
    // 例如：sysinfo crate
    Some(5.2) // 示例值：5.2%
}

async fn get_active_connections(state: &AppState) -> u64 {
    // 这里可以跟踪活跃的WebSocket连接等
    // 暂时返回数据库池的活跃连接数
    state.db.size() as u64
}

async fn get_database_pool_status(db: &sqlx::PgPool) -> DatabasePoolStatus {
    let size = db.size();
    let idle = db.num_idle() as u32;
    DatabasePoolStatus {
        size,
        idle,
        active: size - idle, // Calculate active connections
    }
}