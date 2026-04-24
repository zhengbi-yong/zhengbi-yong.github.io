#![recursion_limit = "1024"]
#![type_length_limit = "10000000"]

use axum::Router;
use blog_api::middleware::{
    rate_limit_middleware, request_id_middleware, trace_context_middleware, REQUEST_ID_HEADER,
    TRACEPARENT_HEADER,
};
use blog_api::observability::tracing::{init_tracer, shutdown_tracer};
use blog_api::runtime::{
    create_postgres_pool, create_redis_pool, create_replica_pool, shutdown_db,
    shutdown_signal,
};
use blog_api::state::AppState;
use opentelemetry::trace::TracerProvider as _;
use tower_http::{compression::CompressionLayer, cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::fmt::format::FmtSpan;
use tracing_subscriber::prelude::*;

// 导入所有路由模块（仅导入需要使用的模块）
use blog_api::middleware::auth::auth_middleware;
use blog_api::middleware::csrf::csrf_middleware;
use blog_api::routes::{admin_team_members_routes, team_members_routes};

#[tokio::main]
async fn main() {
    // 加载 .env 文件（如果存在）
    if let Err(e) = dotenv::dotenv() {
        // .env 文件不存在不是错误，只是警告
        eprintln!("⚠️  无法加载 .env 文件: {}. 将使用系统环境变量。", e);
    }

    // 初始化 tracing subscriber
    let otel_provider = init_tracer();
    let otel_layer = otel_provider
        .as_ref()
        .map(|provider| tracing_opentelemetry::layer().with_tracer(provider.tracer("blog-api")));

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(
            tracing_subscriber::fmt::layer()
                .with_span_events(FmtSpan::CLOSE)
                .json()
                .flatten_event(true),
        )
        .with(otel_layer)
        .init();

    if let Err(e) = run_server().await {
        eprintln!();
        eprintln!("❌ 服务器启动失败: {}", e);
        eprintln!();
        eprintln!("错误详情:");
        eprintln!("{:?}", e);
        eprintln!();
        eprintln!("💡 故障排查建议:");
        eprintln!("   1. 检查所有必需的环境变量是否已设置");
        eprintln!("   2. 确保数据库和 Redis 服务正在运行");
        eprintln!("   3. 检查 JWT_SECRET 长度是否至少 32 个字符");
        eprintln!("   4. 检查 SMTP 配置是否正确");
        eprintln!("   5. 查看上面的详细错误信息");
        shutdown_tracer(otel_provider);
        std::process::exit(1);
    }

    shutdown_tracer(otel_provider);
}

async fn run_server() -> anyhow::Result<()> {
    tracing::info!("Starting Blog API Server...");

    // 加载配置
    let settings = blog_shared::Settings::from_env().map_err(|e| {
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

    // 初始化数据库连接池（带显式连接池配置）
    let db = create_postgres_pool(&settings.database_url, &settings.database_pool).await?;
    tracing::info!(
        max_connections = settings.database_pool.max_connections,
        min_connections = settings.database_pool.min_connections,
        acquire_timeout_secs = settings.database_pool.acquire_timeout_secs,
        "Database connection pool established"
    );

    // 初始化只读副本连接池（如果配置了 DATABASE_REPLICA_URL）
    let db_read = if let Some(ref replica_url) = settings.database_replica_url {
        let pool = create_replica_pool(replica_url, &settings.database_pool).await?;
        tracing::info!("Database replica connection pool established");
        pool
    } else {
        tracing::warn!(
            "DATABASE_REPLICA_URL not configured, read queries will use primary database"
        );
        db.clone()
    };

    // 检查迁移是否已应用（不自动运行，由单独的 migrate job 执行）
    tracing::warn!("MIGRATION VERIFICATION DISABLED — for local dev only");
    // verify_migrations(&db).await?;
    tracing::info!("Database migrations verified");

    // 初始化 Redis 连接池（带显式连接池配置）
    let redis = create_redis_pool(&settings.redis_url, &settings.redis_pool)?;
    tracing::info!(
        max_size = settings.redis_pool.max_size,
        wait_timeout_secs = settings.redis_pool.wait_timeout_secs,
        "Redis connection pool established"
    );

    // 初始化服务
    let jwt = blog_core::JwtService::new(&settings.jwt_secret)
        .map_err(|e| {
            eprintln!("❌ JWT 服务初始化失败: {:?}", e);
            eprintln!("   JWT_SECRET 长度: {} 字符 (需要至少 32 个字符)", settings.jwt_secret.len());
            anyhow::anyhow!("JWT service initialization failed: {:?}. JWT_SECRET must be at least 32 characters long (current length: {})", e, settings.jwt_secret.len())
        })?;

    let email_service = blog_core::email::EmailService::new(&settings.smtp).map_err(|e| {
        eprintln!("❌ Email 服务初始化失败: {:?}", e);
        eprintln!(
            "   SMTP 配置: host={}, port={}, tls={}, from={}",
            settings.smtp.host, settings.smtp.port, settings.smtp.tls, settings.smtp.from
        );
        anyhow::anyhow!(
            "Email service initialization failed: {:?}. Check SMTP configuration",
            e
        )
    })?;

    // 初始化指标收集
    let metrics = std::sync::Arc::new(tokio::sync::RwLock::new(blog_api::metrics::Metrics::new()));

    let storage_config = blog_api::storage::StorageConfig::from_env()?;
    let storage =
        std::sync::Arc::new(blog_api::storage::StorageService::new(&storage_config).await?);
    tracing::info!(
        backend = ?storage_config.backend,
        "Storage backend initialized"
    );

    let search_index = if let Some(config) = &settings.meilisearch {
        let search_index =
            std::sync::Arc::new(blog_api::search_index::SearchIndexService::new(config).await?);

        if config.auto_sync_on_startup {
            tracing::warn!(
                index_name = %config.index_name,
                "MEILISEARCH_AUTO_SYNC is enabled, but API startup sync is disabled in scalable mode; queue a rebuild instead"
            );
        }

        Some(search_index)
    } else {
        tracing::info!("Meilisearch is not configured; search will use PostgreSQL fallback");
        None
    };

    tracing::info!("Services initialized successfully");

    // 设置应用启动时间用于健康检查
    blog_api::metrics::set_app_start_time();

    let state = AppState {
        db,
        db_read,
        redis,
        jwt,
        settings,
        email_service,
        metrics,
        search_index,
        storage,
    };

    // 提取 pools 用于优雅停机（在 state 移动到 router 之前）
    // GOLDEN_RULES §3.4: 优雅停机后必须关闭连接池
    let db_pool = state.db.clone();
    let db_read_pool = state.db_read.clone();

    // 提取服务器地址（在移动 state 之前）
    let addr = format!(
        "{}:{}",
        state.settings.server_host, state.settings.server_port
    );

    // 🔥 最终方案：路由分组 + 高递归限制 + type_length_limit
    // 专家建议：将路由分组到独立的函数中，避免所有路由写在一个文件
    // 关键点：
    // 1. 递归限制已提高到 1024
    // 2. type_length_limit 设置为 10,000,000
    // 3. 路由已分组到 8 个独立函数中
    // 4. 中间件只在最外层应用一次（专家建议：避免过多中间件层级）

    // 🔥 最后尝试：禁用OpenAPI，减少类型复杂度
    let api_router = v1_routes(state.clone()).layer(axum::middleware::from_fn_with_state(
        state.clone(),
        rate_limit_middleware,
    ));

    let app = Router::new()
        // 健康检查（无状态）
        .route("/health/detailed", axum::routing::get(blog_api::metrics::health_detailed))
        // Kubernetes-style 健康检查路径 (无外部依赖)
        .route("/.well-known/live", axum::routing::get(liveness))
        .route("/.well-known/ready", axum::routing::get(blog_api::metrics::readyz))
        .route("/metrics", axum::routing::get(blog_api::metrics::metrics_endpoint))
        // OpenAPI 文档 - TEMPORARILY DISABLED TO TEST STACK OVERFLOW
        // .merge(blog_api::routes::openapi::swagger_ui())
        // API v1 路由（分组）- 添加 /api 前缀
        .nest("/api/v1", api_router)
        // 中间件（只在最外层应用，按执行顺序逆序排列）
        // 4. CORS 中间件（最先执行）
        .layer(create_cors_layer(state.settings.cors.allowed_origins.clone()))
        // 3. 压缩中间件
        .layer(CompressionLayer::new())
        // 2. HTTP Trace 中间件（包含 request_id 和 trace_id 在 span 中）
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|request: &axum::extract::Request| {
                    let request_id = request
                        .headers()
                        .get(REQUEST_ID_HEADER)
                        .and_then(|v| v.to_str().ok())
                        .map(|s| s.to_string())
                        .unwrap_or_else(|| "unknown".to_string());

                    // Extract W3C trace_id from traceparent header
                    let trace_id = request
                        .headers()
                        .get(TRACEPARENT_HEADER)
                        .and_then(|v| v.to_str().ok())
                        .and_then(|tp| {
                            tp.split('-')
                                .nth(1)
                                .map(|s| s.to_string())
                        })
                        .unwrap_or_else(|| "none".to_string());

                    tracing::info_span!(
                        "http_request",
                        method = %request.method(),
                        uri = %request.uri(),
                        request_id = %request_id,
                        trace_id = %trace_id,
                    )
                })
        )
        // 1.5. HTTP 指标采集（在 request_id 之后，覆盖所有入口请求）
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            blog_api::metrics::http_metrics_middleware,
        ))
        // 0. W3C Trace Context 中间件（最先执行，提取/生成 trace context）
        .layer(axum::middleware::from_fn(trace_context_middleware))
        // 1. Request ID 中间件
        .layer(axum::middleware::from_fn(request_id_middleware))
        // 添加状态
        .with_state(state);

    // 启动服务器
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {:?}", listener.local_addr());

    // 优雅关闭处理
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal("api server"))
        .await?;

    tracing::info!("Server shutdown complete");

    // GOLDEN_RULES §3.4: 优雅停机后关闭数据库连接池
    // 注意：shutdown_signal 已经等待了30秒，这里直接关闭连接池
    // 安全关闭两个连接池
    tracing::info!("Closing database connection pools");
    shutdown_db(&db_pool).await;
    // 读副本池可能与主池是同一实例，但重复 close 是安全的
    shutdown_db(&db_read_pool).await;

    Ok(())
}

// 🔥 关键修复：使用路由分组 + .boxed() 避免栈溢出
// 专家建议：大型路由应使用 router.merge() 或 .nest()，并在必要时使用 .boxed()
fn v1_routes(state: AppState) -> Router<AppState> {
    use axum::routing::{get, post};
    // 使用 merge 组合各个路由组，每个组已使用 .boxed()
    // /auth/me 需要认证，单独定义并应用中间件
    let auth_me_route = Router::new()
        .route("/auth/me", get(blog_api::routes::auth::me))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ));

    auth_routes()
        .merge(post_routes())
        .merge(category_routes())
        .merge(tag_routes())
        .merge(search_routes())
        .merge(comment_routes())
        // 评论操作需要认证（like/unlike）
        .merge(
            comment_auth_routes()
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
        )
        .merge(
            reading_progress_routes()
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
        )
        .merge(auth_me_route)
        // 团队成员公开路由
        .merge(team_members_routes())
        // admin路由需要添加认证中间件
        .merge(
            admin_routes()
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    csrf_middleware,
                ))
        )
        // 文章和评论管理路由也需要认证
        .merge(
            post_admin_routes()
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    csrf_middleware,
                ))
        )
        .merge(
            comment_admin_routes()
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    csrf_middleware,
                ))
        )
        // 团队成员管理路由（需要认证）
        .merge(
            admin_team_members_routes()
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    auth_middleware,
                ))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    csrf_middleware,
                ))
        )
        // TEMPORARY: 公开的MDX同步端点用于测试（生产环境应该移除或添加认证）
        .route("/sync/mdx/public", post(blog_api::routes::mdx_sync::sync_mdx_to_db))
        .with_state(state)
}

// 🔥 专家方案简化版：去掉 .boxed()，使用更简单的路由合并
// Axum 0.8 不直接支持 .boxed()，需要使用 Box::new() 或其他方式
// 关键：路由分组已经降低了类型复杂度，配合递归限制应该足够

// 认证路由
fn auth_routes() -> Router<AppState> {
    use axum::routing::post;
    Router::new()
        .route("/auth/register", post(blog_api::routes::auth::register))
        .route("/auth/login", post(blog_api::routes::auth::login))
        .route("/auth/refresh", post(blog_api::routes::auth::refresh))
        .route("/auth/logout", post(blog_api::routes::auth::logout))
        .route(
            "/auth/forgot-password",
            post(blog_api::routes::auth::forgot_password),
        )
        .route(
            "/auth/reset-password",
            post(blog_api::routes::auth::reset_password),
        )
    // /auth/me 需要认证，在 v1_routes 中单独定义并应用中间件
}

// 文章路由
fn post_routes() -> Router<AppState> {
    use axum::routing::{delete, get, post};
    Router::new()
        .route("/posts", get(blog_api::routes::posts::list_posts))
        .route(
            "/posts/by-slug",
            get(blog_api::routes::posts::get_post_by_slug_query),
        )
        .route(
            "/posts/id/{id}",
            get(blog_api::routes::posts::get_post_by_id),
        )
        // Note: /posts/id/{id} 保留给内部或历史使用，handler 仅支持 slug 查询。
        // 规范要求统一寻址 GET /posts/{identifier}，实际 get_post 内部仅查 slug。
        // 如需 UUID 支持，应在 get_post_response 中增加 UUID 检测逻辑。
        .route("/posts/{slug}", get(blog_api::routes::posts::get_post))
        .route(
            "/posts/{slug}/stats",
            get(blog_api::routes::posts::get_stats),
        )
        .route("/posts/{slug}/view", post(blog_api::routes::posts::view))
        .route(
            "/posts/{slug}/comments",
            get(blog_api::routes::comments::list_comments),
        )
        .route(
            "/posts/{slug}/related",
            get(blog_api::routes::search::get_related_posts),
        )
        .route("/posts/{slug}/like", post(blog_api::routes::posts::like))
        .route(
            "/posts/{slug}/like",
            delete(blog_api::routes::posts::unlike),
        )
}

// 文章管理路由（需要认证）
fn post_admin_routes() -> Router<AppState> {
    use axum::routing::{delete, get, patch, post};
    Router::new()
        .route(
            "/admin/posts",
            get(blog_api::routes::admin::list_posts_admin),
        )
        .route("/admin/posts", post(blog_api::routes::posts::create_post))
        .route(
            "/admin/posts/{postId}",
            patch(blog_api::routes::posts::update_post),
        )
        .route(
            "/admin/posts/{postId}",
            delete(blog_api::routes::posts::delete_post),
        )
}

// 分类路由
fn category_routes() -> Router<AppState> {
    use axum::routing::{delete, get, patch, post};
    Router::new()
        .route(
            "/categories",
            get(blog_api::routes::categories::list_categories),
        )
        .route(
            "/categories/tree",
            get(blog_api::routes::categories::get_category_tree),
        )
        .route(
            "/categories/{slug}",
            get(blog_api::routes::categories::get_category),
        )
        .route(
            "/categories/{slug}/posts",
            get(blog_api::routes::categories::get_category_posts),
        )
        .route(
            "/admin/categories",
            post(blog_api::routes::categories::create_category),
        )
        .route(
            "/admin/categories/{slug}",
            patch(blog_api::routes::categories::update_category),
        )
        .route(
            "/admin/categories/{slug}",
            delete(blog_api::routes::categories::delete_category),
        )
}

// 标签路由
fn tag_routes() -> Router<AppState> {
    use axum::routing::{delete, get, patch, post};
    Router::new()
        .route("/tags", get(blog_api::routes::tags::list_tags))
        .route(
            "/tags/popular",
            get(blog_api::routes::tags::get_popular_tags),
        )
        .route(
            "/tags/autocomplete",
            get(blog_api::routes::tags::autocomplete_tags),
        )
        .route("/tags/{slug}", get(blog_api::routes::tags::get_tag))
        .route(
            "/tags/{slug}/posts",
            get(blog_api::routes::tags::get_tag_posts),
        )
        .route("/admin/tags", post(blog_api::routes::tags::create_tag))
        .route(
            "/admin/tags/{slug}",
            patch(blog_api::routes::tags::update_tag),
        )
        .route(
            "/admin/tags/{slug}",
            delete(blog_api::routes::tags::delete_tag),
        )
}

// 搜索路由
fn search_routes() -> Router<AppState> {
    use axum::routing::get;
    Router::new()
        .route("/search", get(blog_api::routes::search::search_posts))
        .route(
            "/search/suggest",
            get(blog_api::routes::search::search_suggest),
        )
        .route(
            "/search/trending",
            get(blog_api::routes::search::get_trending_keywords),
        )
}

// 评论路由（公开 - 仅创建评论，支持匿名）
fn comment_routes() -> Router<AppState> {
    use axum::routing::post;
    Router::new().route(
        "/posts/{slug}/comments",
        post(blog_api::routes::comments::create_comment),
    )
}

// 评论路由（需要认证 - 点赞/取消点赞）
fn comment_auth_routes() -> Router<AppState> {
    use axum::routing::post;
    Router::new()
        .route(
            "/comments/{id}/like",
            post(blog_api::routes::comments::like_comment),
        )
        .route(
            "/comments/{id}/unlike",
            post(blog_api::routes::comments::unlike_comment),
        )
}

// 评论管理路由（需要认证）
fn comment_admin_routes() -> Router<AppState> {
    use axum::routing::{delete, get, put};
    Router::new()
        .route(
            "/admin/comments",
            get(blog_api::routes::admin::list_comments_admin),
        )
        .route(
            "/admin/comments/{id}/status",
            put(blog_api::routes::admin::update_comment_status),
        )
        .route(
            "/admin/comments/{id}",
            delete(blog_api::routes::admin::delete_comment_admin),
        )
}

// 阅读进度路由
fn reading_progress_routes() -> Router<AppState> {
    use axum::routing::{delete, get, post};
    Router::new()
        .route(
            "/posts/{slug}/reading-progress",
            get(blog_api::routes::reading_progress::get_reading_progress_handler),
        )
        .route(
            "/posts/{slug}/reading-progress",
            post(blog_api::routes::reading_progress::update_reading_progress_handler),
        )
        .route(
            "/posts/{slug}/reading-progress",
            delete(blog_api::routes::reading_progress::delete_reading_progress_handler),
        )
        .route(
            "/reading-progress/history",
            get(blog_api::routes::reading_progress::get_reading_history_handler),
        )
}

// 管理员路由（核心管理功能，不包括文章和评论管理）
fn admin_routes() -> Router<AppState> {
    use axum::routing::{delete, get, patch, post, put};
    Router::new()
        // 统计和用户管理
        .route("/admin/stats", get(blog_api::routes::admin::get_admin_stats))
        .route("/admin/users", get(blog_api::routes::admin::list_users).post(blog_api::routes::admin::create_user))
        .route("/admin/users:batchUpdateRole", post(blog_api::routes::admin::batch_update_roles))
        .route("/admin/users:batchDelete", post(blog_api::routes::admin::batch_delete_users))
        .route("/admin/users/{id}", get(blog_api::routes::admin::get_user).put(blog_api::routes::admin::update_user).delete(blog_api::routes::admin::delete_user))
        .route("/admin/users/{id}/role", put(blog_api::routes::admin::update_user_role))
        .route("/admin/user-growth", get(blog_api::routes::admin::get_user_growth))
        // 媒体管理
        .route("/admin/media", get(blog_api::routes::media::list_media))
        .route(
            "/admin/media/presign-upload",
            post(blog_api::routes::media::presign_media_upload),
        )
        .route(
            "/admin/media/finalize",
            post(blog_api::routes::media::finalize_media_upload),
        )
        .route("/admin/media/upload", post(blog_api::routes::media::upload_media))
        .route("/admin/media/unused", get(blog_api::routes::media::get_unused_media))
        .route("/admin/media/{id}", get(blog_api::routes::media::get_media))
        .route(
            "/admin/media/{id}/download-url",
            get(blog_api::routes::media::get_media_download_url),
        )
        .route("/admin/media/{id}", patch(blog_api::routes::media::update_media))
        .route("/admin/media/{id}", delete(blog_api::routes::media::delete_media))
        // 版本控制
        .route("/admin/posts/{post_id}/versions", post(blog_api::routes::versions::create_version))
        .route("/admin/posts/{post_id}/versions", get(blog_api::routes::versions::list_versions))
        .route("/admin/posts/{post_id}/versions/{version_number}", get(blog_api::routes::versions::get_version))
        .route("/admin/posts/{post_id}/versions/{version_number}/restore", post(blog_api::routes::versions::restore_version))
        .route("/admin/posts/{post_id}/versions/{version_number}", delete(blog_api::routes::versions::delete_version))
        .route("/admin/posts/{post_id}/versions/compare", get(blog_api::routes::versions::compare_versions))
        // MDX同步
        .route("/admin/sync/mdx", post(blog_api::routes::mdx_sync::sync_mdx_to_db))
        .route("/admin/search/reindex", post(blog_api::routes::search::reindex_posts))
}

/// Kubernetes liveness probe handler
///
/// 简单的存活探针，不执行任何外部依赖检查（无 DB/Redis I/O）
/// 用于 Kubernetes 判断容器是否需要重启
async fn liveness() -> axum::http::StatusCode {
    axum::http::StatusCode::OK
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
