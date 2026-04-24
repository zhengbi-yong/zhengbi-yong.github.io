use axum::{Router, Json};
use tower_http::{
    trace::TraceLayer,
    compression::CompressionLayer,
    cors::CorsLayer,
};
use tracing_subscriber::prelude::*;
use blog_api::state::AppState;
use std::sync::Arc;
use tokio::sync::RwLock;
use axum::http::{HeaderValue, Method};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化 tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Blog API Server...");

    // 使用环境变量或默认值
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://blog_user:blog_password@localhost:5432/blog_db".to_string());
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://localhost:6379".to_string());
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "dev-secret-key-for-testing-only-x".to_string());

    // 初始化数据库连接
    // GOLDEN_RULES §3.3: 必须配置 acquire_timeout, idle_timeout, max_lifetime, fetch_dynamic_timeout
    let db = sqlx::postgres::PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .idle_timeout(std::time::Duration::from_secs(600))
        .max_lifetime(std::time::Duration::from_secs(1800))
        .fetch_dynamic_timeout(true)
        .connect(&database_url)
        .await?;
    tracing::info!("Database connection established");

    // 初始化 Redis 连接
    let redis = deadpool_redis::Config::from_url(&redis_url).create_pool(None)?;
    tracing::info!("Redis connection established");

    // 初始化服务
    let jwt = blog_core::JwtService::new(&jwt_secret)?;
    let email_service = blog_core::email::EmailService::new(&blog_core::config::SmtpConfig {
        host: "localhost".to_string(),
        port: 587,
        username: None,
        password: None,
        from: "noreply@localhost".to_string(),
    })?;

    // 创建metrics
    let metrics = Arc::new(RwLock::new(blog_api::metrics::Metrics::new()));

    // 创建应用状态
    let state = AppState {
        db,
        redis,
        jwt,
        settings: blog_shared::Settings {
            jwt_secret,
            database_url,
            redis_url,
            smtp: blog_core::config::SmtpConfig {
                host: "localhost".to_string(),
                port: 587,
                username: None,
                password: None,
                from: "noreply@localhost".to_string(),
            },
            cors_origin: "http://localhost:3001".to_string(),
            password_pepper: "dev-pepper".to_string(),
            environment: "development".to_string(),
            rate_limit_per_minute: 1000,
            session_secret: "dev-session-secret".to_string(),
            session_timeout_hours: 24,
            prometheus_enabled: true,
        },
        email_service,
        metrics,
    };

    // 构建路由
    let app = Router::new()
        .route("/", axum::routing::get(|| async { Json("Blog API is running!") }))
        .route("/health", axum::routing::get(health_check))
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(
            CorsLayer::new()
                .allow_origin("http://localhost:3001".parse::<HeaderValue>()
                    .expect("Failed to parse CORS origin"))
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::PUT,
                    Method::DELETE,
                ])
                .allow_headers([
                    "authorization".parse().expect("Failed to parse authorization header"),
                    "content-type".parse().expect("Failed to parse content-type header"),
                ])
        );

    // 启动服务器
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("Server listening on {:?}", listener.local_addr());

    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now()
    }))
}