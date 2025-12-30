use axum::{Router, middleware};
use tower_http::{
    trace::TraceLayer,
    compression::CompressionLayer,
    cors::CorsLayer,
};
use tracing_subscriber::prelude::*;
use blog_api::state::AppState;

// 导入所有路由模块
use blog_api::routes::{self, categories, tags, posts, media, versions, search};

#[tokio::main]
async fn main() {
    // 加载 .env 文件（如果存在）
    if let Err(e) = dotenv::dotenv() {
        // .env 文件不存在不是错误，只是警告
        eprintln!("⚠️  无法加载 .env 文件: {}. 将使用系统环境变量。", e);
    }

    // 初始化 tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    if let Err(e) = run_server().await {
        eprintln!("");
        eprintln!("❌ 服务器启动失败: {}", e);
        eprintln!("");
        eprintln!("错误详情:");
        eprintln!("{:?}", e);
        eprintln!("");
        eprintln!("💡 故障排查建议:");
        eprintln!("   1. 检查所有必需的环境变量是否已设置");
        eprintln!("   2. 确保数据库和 Redis 服务正在运行");
        eprintln!("   3. 检查 JWT_SECRET 长度是否至少 32 个字符");
        eprintln!("   4. 检查 SMTP 配置是否正确");
        eprintln!("   5. 查看上面的详细错误信息");
        std::process::exit(1);
    }
}

async fn run_server() -> anyhow::Result<()> {
    tracing::info!("Starting Blog API Server...");

    // 加载配置
    let settings = blog_shared::Settings::from_env()
        .map_err(|e| {
            eprintln!("❌ 配置加载失败: {}", e);
            eprintln!("💡 请确保设置了以下环境变量:");
            eprintln!("   - DATABASE_URL");
            eprintln!("   - REDIS_URL");
            eprintln!("   - JWT_SECRET (至少32个字符)");
            eprintln!("   - PASSWORD_PEPPER");
            eprintln!("   - SMTP_USERNAME");
            eprintln!("   - SMTP_PASSWORD");
            eprintln!("   - SMTP_FROM");
            e
        })?;
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
    let jwt = blog_core::JwtService::new(&settings.jwt_secret)
        .map_err(|e| {
            eprintln!("❌ JWT 服务初始化失败: {:?}", e);
            eprintln!("   JWT_SECRET 长度: {} 字符 (需要至少 32 个字符)", settings.jwt_secret.len());
            anyhow::anyhow!("JWT service initialization failed: {:?}. JWT_SECRET must be at least 32 characters long (current length: {})", e, settings.jwt_secret.len())
        })?;
    
    let email_service = blog_core::email::EmailService::new(&settings.smtp)
        .map_err(|e| {
            eprintln!("❌ Email 服务初始化失败: {:?}", e);
            eprintln!("   SMTP 配置: host={}, port={}, tls={}, from={}", 
                settings.smtp.host, settings.smtp.port, settings.smtp.tls, settings.smtp.from);
            anyhow::anyhow!("Email service initialization failed: {:?}. Check SMTP configuration", e)
        })?;

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

    // 提取服务器地址（在移动 state 之前）
    let addr = format!("{}:{}", state.settings.server_host, state.settings.server_port);

    // 构建路由
    let app = Router::new()
        // 健康检查
        .route("/healthz", axum::routing::get(blog_api::metrics::healthz))
        .route("/healthz/detailed", axum::routing::get(blog_api::metrics::healthz_detailed))
        .route("/readyz", axum::routing::get(blog_api::metrics::readyz))
        // Prometheus 指标
        .route("/metrics", axum::routing::get(blog_api::metrics::metrics_endpoint))
        // OpenAPI 文档 - disabled due to utoipa stack overflow issue
        // TODO: Fix utoipa derive macro causing stack overflow
        // .merge(blog_api::routes::openapi::swagger_ui())
        // API v1
        .nest("/v1", v1_routes(state.clone()))
        // 中间件
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(create_cors_layer(state.settings.cors.allowed_origins.clone()))
        .with_state(state);

    // 启动服务器
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {:?}", listener.local_addr());

    axum::serve(listener, app).await?;

    Ok(())
}

// v1 路由定义
fn v1_routes(state: AppState) -> Router<AppState> {
    use axum::routing::{get, post, delete, patch};

    // 公开路由 (无需认证)
    // 前端需要对包含斜杠的 slug 进行 URL 编码（如 chemistry/tutorial -> chemistry%2Ftutorial）
    let public_routes = Router::new()
        // 认证路由
        .route("/auth/register", post(blog_api::routes::auth::register))
        .route("/auth/login", post(blog_api::routes::auth::login))
        .route("/auth/refresh", post(blog_api::routes::auth::refresh))
        .route("/auth/logout", post(blog_api::routes::auth::logout))
        // 文章统计和浏览
        .route("/posts/{slug}/stats", get(blog_api::routes::posts::get_stats))
        .route("/posts/{slug}/view", post(blog_api::routes::posts::view))
        .route("/posts/{slug}/comments", get(blog_api::routes::comments::list_comments))
        // CMS 公开 API
        .route("/posts", get(blog_api::routes::posts::list_posts))
        .route("/posts/{slug}", get(blog_api::routes::posts::get_post))
        .route("/categories", get(blog_api::routes::categories::list_categories))
        .route("/categories/tree", get(blog_api::routes::categories::get_category_tree))
        .route("/categories/{slug}", get(blog_api::routes::categories::get_category))
        .route("/categories/{slug}/posts", get(blog_api::routes::categories::get_category_posts))
        .route("/tags", get(blog_api::routes::tags::list_tags))
        .route("/tags/popular", get(blog_api::routes::tags::get_popular_tags))
        .route("/tags/autocomplete", get(blog_api::routes::tags::autocomplete_tags))
        .route("/tags/{slug}", get(blog_api::routes::tags::get_tag))
        .route("/tags/{slug}/posts", get(blog_api::routes::tags::get_tag_posts))
        // 搜索 API
        .route("/search", get(blog_api::routes::search::search_posts))
        .route("/search/suggest", get(blog_api::routes::search::search_suggest))
        .route("/search/trending", get(blog_api::routes::search::get_trending_keywords))
        .route("/posts/{slug}/related", get(blog_api::routes::search::get_related_posts));

    // 需要认证的路由
    let protected_routes = Router::new()
        .route("/auth/me", get(blog_api::routes::auth::me))
        .route("/posts/{slug}/like", post(blog_api::routes::posts::like))
        .route("/posts/{slug}/like", delete(blog_api::routes::posts::unlike))
        .route("/posts/{slug}/comments", post(blog_api::routes::comments::create_comment))
        .route("/comments/{id}/like", post(blog_api::routes::comments::like_comment))
        .route("/comments/{id}/unlike", post(blog_api::routes::comments::unlike_comment))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            blog_api::middleware::auth::auth_middleware,
        ));

    // 管理员路由 (需要认证+管理员权限)
    let admin_routes = Router::new()
        // 原有管理员路由
        .route("/stats", get(blog_api::routes::admin::get_admin_stats))
        .route("/users", get(blog_api::routes::admin::list_users))
        .route("/users/{id}/role", axum::routing::put(blog_api::routes::admin::update_user_role))
        .route("/users/{id}", axum::routing::delete(blog_api::routes::admin::delete_user))
        .route("/users/growth", get(blog_api::routes::admin::get_user_growth))
        .route("/comments", get(blog_api::routes::admin::list_comments_admin))
        .route("/comments/{id}/status", axum::routing::put(blog_api::routes::admin::update_comment_status))
        .route("/comments/{id}", axum::routing::delete(blog_api::routes::admin::delete_comment_admin))
        .route("/posts", get(blog_api::routes::admin::list_posts_admin))
        // CMS 管理路由 - 文章管理
        .route("/posts", post(blog_api::routes::posts::create_post))
        .route("/posts/{slug}", patch(blog_api::routes::posts::update_post))
        .route("/posts/{slug}", axum::routing::delete(blog_api::routes::posts::delete_post))
        // 分类管理
        .route("/categories", post(blog_api::routes::categories::create_category))
        .route("/categories/{slug}", patch(blog_api::routes::categories::update_category))
        .route("/categories/{slug}", axum::routing::delete(blog_api::routes::categories::delete_category))
        // 标签管理
        .route("/tags", post(blog_api::routes::tags::create_tag))
        .route("/tags/{slug}", patch(blog_api::routes::tags::update_tag))
        .route("/tags/{slug}", axum::routing::delete(blog_api::routes::tags::delete_tag))
        // 媒体管理（upload 暂时禁用，需要 multipart feature）
        // .route("/media/upload", post(blog_api::routes::media::upload_media))
        .route("/media", get(blog_api::routes::media::list_media))
        .route("/media/unused", get(blog_api::routes::media::get_unused_media))
        .route("/media/{id}", get(blog_api::routes::media::get_media))
        .route("/media/{id}", patch(blog_api::routes::media::update_media))
        .route("/media/{id}", axum::routing::delete(blog_api::routes::media::delete_media))
        // 版本控制
        .route("/posts/{post_id}/versions", post(blog_api::routes::versions::create_version))
        .route("/posts/{post_id}/versions", get(blog_api::routes::versions::list_versions))
        .route("/posts/{post_id}/versions/{version_number}", get(blog_api::routes::versions::get_version))
        .route("/posts/{post_id}/versions/{version_number}/restore", post(blog_api::routes::versions::restore_version))
        .route("/posts/{post_id}/versions/{version_number}", axum::routing::delete(blog_api::routes::versions::delete_version))
        .route("/posts/{post_id}/versions/compare", get(blog_api::routes::versions::compare_versions));

    // 合并路由并应用限流中间件
    public_routes
        .merge(protected_routes)
        .nest("/admin", admin_routes)  // 管理员路由需要 /admin 前缀
        .layer(middleware::from_fn_with_state(
            state.clone(),
            blog_api::middleware::rate_limit_middleware,
        ))
}

/// 创建安全的 CORS 层
///
/// 根据环境变量配置决定 CORS 策略：
/// - 开发环境（允许所有）：allowed_origins 包含 "*"
/// - 生产环境（严格验证）：allowed_origins 包含具体域名列表
fn create_cors_layer(allowed_origins: Vec<String>) -> CorsLayer {
    use axum::http::HeaderValue;
    use tower_http::cors::Any;

    // 检查是否为开发环境（允许所有来源）
    let is_dev = allowed_origins.iter().any(|origin| origin.trim() == "*");

    if is_dev {
        // 开发环境：允许所有来源
        tracing::warn!("⚠️  CORS 开发模式已启用：允许所有来源（仅用于本地开发）");
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods([
                axum::http::Method::GET,
                axum::http::Method::POST,
                axum::http::Method::PUT,
                axum::http::Method::DELETE,
                axum::http::Method::PATCH,
                axum::http::Method::OPTIONS,
            ])
            .allow_headers([
                axum::http::header::AUTHORIZATION,
                axum::http::header::ACCEPT,
                axum::http::header::CONTENT_TYPE,
            ])
            .allow_credentials(true)
    } else {
        // 生产环境：严格验证允许的来源
        let origins: Result<Vec<HeaderValue>, _> = allowed_origins
            .iter()
            .map(|s| s.parse::<HeaderValue>())
            .collect();

        match origins {
            Ok(parsed_origins) => {
                tracing::info!("CORS 生产模式已启用：允许 {} 个来源", parsed_origins.len());
                for origin in &parsed_origins {
                    tracing::info!("  - {}", origin.to_str().unwrap_or("(invalid)"));
                }

                CorsLayer::new()
                    .allow_origin(parsed_origins)
                    .allow_methods([
                        axum::http::Method::GET,
                        axum::http::Method::POST,
                        axum::http::Method::PUT,
                        axum::http::Method::DELETE,
                        axum::http::Method::PATCH,
                        axum::http::Method::OPTIONS,
                    ])
                    .allow_headers([
                        axum::http::header::AUTHORIZATION,
                        axum::http::header::ACCEPT,
                        axum::http::header::CONTENT_TYPE,
                    ])
                    .allow_credentials(true)
            }
            Err(e) => {
                tracing::error!("❌ CORS 配置无效：{}", e);
                tracing::error!("请检查 CORS_ALLOWED_ORIGINS 环境变量格式");
                // 降级为严格模式：拒绝所有请求
                CorsLayer::new()
            }
        }
    }
}

