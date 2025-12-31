use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        crate::routes::auth::register,
        crate::routes::auth::login,
        crate::routes::auth::refresh,
        crate::routes::auth::logout,
        crate::routes::auth::me,
        crate::routes::posts::get_stats,
        crate::routes::posts::view,
        crate::routes::posts::like,
        crate::routes::posts::unlike,
        crate::routes::comments::list_comments,
        crate::routes::comments::create_comment,
        crate::routes::comments::like_comment,
        crate::routes::admin::list_users,
        crate::routes::admin::update_user_role,
        crate::routes::admin::delete_user,
        crate::routes::admin::list_comments_admin,
        crate::routes::admin::update_comment_status,
        crate::routes::admin::delete_comment_admin,
        crate::routes::admin::get_admin_stats,
        crate::routes::admin::list_posts_admin,
        crate::routes::admin::get_user_growth,
        crate::metrics::health,
        crate::metrics::health_detailed,
        crate::metrics::readyz,
        crate::metrics::metrics_endpoint,
    ),
    components(
        // Schemas are auto-discovered from paths
    ),
    tags(
        (name = "auth", description = "Authentication endpoints"),
        (name = "posts", description = "Post related endpoints"),
        (name = "comments", description = "Comment related endpoints"),
        (name = "admin", description = "Admin management endpoints - requires admin role"),
        (name = "monitoring", description = "Health check and monitoring endpoints"),
    ),
    info(
        title = "Blog API",
        description = "API for Zhengbi Yong's Blog Platform - High-performance blog backend with authentication, posts management, and comment system",
        version = "1.0.0",
        contact(
            name = "API Support",
            email = "support@yourdomain.com"
        ),
        license(
            name = "MIT",
            url = "https://opensource.org/licenses/MIT"
        )
    ),
    servers(
        (url = "https://api.yourdomain.com/v1", description = "Production server"),
        (url = "http://localhost:3000/v1", description = "Development server"),
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub struct ApiDoc;

pub fn openapi_spec() -> utoipa::openapi::OpenApi {
    ApiDoc::openapi()
}

pub fn swagger_ui() -> utoipa_swagger_ui::SwaggerUi {
    utoipa_swagger_ui::SwaggerUi::new("/swagger-ui")
        .url("/api-docs/openapi.json", openapi_spec())
}