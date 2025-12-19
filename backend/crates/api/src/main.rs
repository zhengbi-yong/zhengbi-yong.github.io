use axum::{Router, middleware};
use tower_http::{
    trace::TraceLayer,
    compression::CompressionLayer,
    cors::CorsLayer,
};
use tracing_subscriber::prelude::*;
use blog_api::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化 tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Blog API Server...");

    // 加载配置
    let settings = blog_shared::Settings::from_env()?;
    tracing::info!("Configuration loaded successfully");

    // 初始化数据库连接池
    let db = sqlx::PgPool::connect(&settings.database_url).await?;
    tracing::info!("Database connection established");

    // 运行迁移
    sqlx::migrate!("../../migrations").run(&db).await?;
    tracing::info!("Database migrations completed");

    // 初始化 Redis
    let redis = deadpool_redis::Config::from_url(&settings.redis_url)
        .create_pool(Some(deadpool_redis::Runtime::Tokio1))?;
    tracing::info!("Redis connection established");

    // 初始化服务
    let jwt = blog_core::JwtService::new(&settings.jwt_secret)?;
    let email_service = blog_core::email::EmailService::new(&settings.smtp)?;

    // 初始化指标收集
    let metrics = std::sync::Arc::new(tokio::sync::RwLock::new(blog_api::metrics::Metrics::new()));

    tracing::info!("Services initialized successfully");

    // 设置应用启动时间用于健康检查
    blog_api::metrics::set_app_start_time();

    let state = AppState {
        db,
        redis,
        jwt,
        settings,
        email_service,
        metrics,
    };

    // 构建路由
    let app = Router::new()
        // 健康检查
        .route("/healthz", axum::routing::get(blog_api::metrics::healthz))
        .route("/healthz/detailed", axum::routing::get(blog_api::metrics::healthz_detailed))
        .route("/readyz", axum::routing::get(blog_api::metrics::readyz))
        // Prometheus 指标
        .route("/metrics", axum::routing::get(blog_api::metrics::metrics_endpoint))
        // OpenAPI 文档
        .merge(blog_api::routes::openapi::swagger_ui())
        // API v1
        .nest("/v1", v1_routes(state.clone()))
        // 中间件
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(
            CorsLayer::new()
                .allow_origin(["https://yourdomain.com".parse().unwrap()])
                .allow_methods([
                    axum::http::Method::GET,
                    axum::http::Method::POST,
                    axum::http::Method::PUT,
                    axum::http::Method::DELETE,
                ])
                .allow_headers([
                    axum::http::header::AUTHORIZATION,
                    axum::http::header::ACCEPT,
                ])
                .allow_credentials(true),
        )
        .with_state(state);

    // 启动服务器
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("Server listening on {:?}", listener.local_addr());

    axum::serve(listener, app).await?;

    Ok(())
}


// v1 路由定义
fn v1_routes(state: AppState) -> Router<AppState> {
    use axum::routing::{get, post, delete};

    Router::new()
        // 认证路由
        .route("/auth/register", post(blog_api::routes::auth::register))
        .route("/auth/login", post(blog_api::routes::auth::login))
        .route("/auth/refresh", post(blog_api::routes::auth::refresh))
        .route("/auth/logout", post(blog_api::routes::auth::logout))
        .route("/auth/me", get(blog_api::routes::auth::me))

        // 文章相关路由
        .route("/posts/:slug/stats", get(blog_api::routes::posts::get_stats))
        .route("/posts/:slug/view", post(blog_api::routes::posts::view))
        .route("/posts/:slug/like", post(blog_api::routes::posts::like))
        .route("/posts/:slug/like", delete(blog_api::routes::posts::unlike))

        // 评论相关路由
        .route("/posts/:slug/comments", get(blog_api::routes::comments::list_comments))
        .route("/posts/:slug/comments", post(blog_api::routes::comments::create_comment))
        .route("/comments/:id/like", post(blog_api::routes::comments::like_comment))

        // 中间件
        .layer(middleware::from_fn_with_state(
            state.clone(),
            blog_api::middleware::rate_limit_middleware,
        ))
}

