use utoipa::OpenApi;
use utoipa::openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme};

#[derive(OpenApi)]
#[openapi(
    paths(
        // 认证相关
        crate::routes::auth::register,
        crate::routes::auth::login,
        crate::routes::auth::refresh,
        crate::routes::auth::logout,
        crate::routes::auth::me,

        // 文章相关
        crate::routes::posts::get_stats,
        crate::routes::posts::view,
        crate::routes::posts::like,
        crate::routes::posts::unlike,

        // 评论相关
        crate::routes::comments::list_comments,
        crate::routes::comments::create_comment,
        crate::routes::comments::like_comment,

        // 管理员相关
        crate::routes::admin::list_users,
        crate::routes::admin::update_user_role,
        crate::routes::admin::delete_user,
        crate::routes::admin::list_comments_admin,
        crate::routes::admin::update_comment_status,
        crate::routes::admin::delete_comment_admin,
        crate::routes::admin::get_admin_stats,
        crate::routes::admin::list_posts_admin,
        crate::routes::admin::get_user_growth,

        // 监控相关
        crate::metrics::health,
        crate::metrics::health_detailed,
        crate::metrics::readyz,
        crate::metrics::metrics_endpoint,
    ),
    components(
        schemas(
            // Schemas are auto-discovered from paths
        )
    ),
    tags(
        (name = "auth", description = "Authentication & Authorization - User registration, login, token management"),
        (name = "posts", description = "Blog Posts Management - CRUD operations, statistics, likes"),
        (name = "comments", description = "Comments System - Create, list, and manage comments"),
        (name = "admin", description = "Admin Panel APIs - User and content management (requires admin role)"),
        (name = "monitoring", description = "Health Checks & Metrics - System monitoring and observability"),
    ),
    info(
        title = "Blog Platform API",
        description = "
# Blog Platform RESTful API

Welcome to the Blog Platform API documentation. This API provides access to all blog platform features with world-class design standards.

## Features

- **JWT-based Authentication**: Secure token-based authentication with refresh token support
- **RESTful Resource Management**: Standard HTTP methods for CRUD operations
- **Advanced Querying**: Support for pagination, sorting, filtering, and field selection
- **HATEOAS Links**: Hypermedia links for resource navigation
- **Rate Limiting**: Configurable rate limits per endpoint
- **Caching**: Redis-based caching for improved performance

## Authentication

Most endpoints require authentication. Include your JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All errors follow a consistent format:

```json
{
  \"success\": false,
  \"error\": {
    \"code\": \"ERROR_CODE\",
    \"message\": \"Human-readable error message\",
    \"type\": \"400\"
  }
}
```

## Pagination

List endpoints support pagination:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:

```json
{
  \"success\": true,
  \"data\": {
    \"items\": [...],
    \"meta\": {
      \"page\": 1,
      \"limit\": 20,
      \"total\": 100,
      \"total_pages\": 5,
      \"has_next\": true,
      \"has_prev\": false
    }
  }
}
```

## Rate Limiting

- **Anonymous**: 100 requests/minute
- **Authenticated**: 1000 requests/minute

Rate limit headers are included in every response.

## SDK & Libraries

Official SDKs:
- JavaScript/TypeScript: Coming soon
- Python: Coming soon
- Rust: See this repository

## Support

- Documentation: https://docs.yourdomain.com
- GitHub: https://github.com/your-org/blog-api
- Issues: https://github.com/your-org/blog-api/issues
        ",
        version = "1.0.0",
        contact(
            name = "API Support",
            email = "api@example.com"
        ),
        license(
            name = "MIT",
            url = "https://opensource.org/licenses/MIT"
        )
    ),
    servers(
        (url = "https://api.example.com/v1", description = "Production server"),
        (url = "https://staging-api.example.com/v1", description = "Staging server"),
        (url = "http://localhost:3000/v1", description = "Development server"),
    ),
    modifiers(&SecurityAddon),
    security(
        ("BearerAuth" = [])
    )
)]
pub struct ApiDoc;

/// 安全方案附加组件
struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "BearerAuth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                )
            )
        }
    }
}

/// 获取 OpenAPI 规范
pub fn openapi_spec() -> utoipa::openapi::OpenApi {
    ApiDoc::openapi()
}

/// 创建 Swagger UI 路由
pub fn swagger_ui() -> utoipa_swagger_ui::SwaggerUi {
    utoipa_swagger_ui::SwaggerUi::new("/swagger-ui")
        .url("/api-docs/openapi.json", openapi_spec())
}
