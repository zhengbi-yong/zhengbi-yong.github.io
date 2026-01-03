# Blog API Crate (backend/crates/api)

## Overview
HTTP API implementation using Axum framework for blog backend services. Provides RESTful endpoints for authentication, posts, comments, categories, tags, search, and admin operations.

**Purpose**: Web API layer for blog application
**Language**: Rust
**Framework**: Axum 0.8, Tokio, Tower
**Layer**: Layer 3 - HTTP API Handler

## Architecture

### Main Components
- **main.rs** - Application entry point, server initialization, route composition
- **lib.rs** - Public API exports (routes, middleware, state, utils)
- **routes/** - Endpoint handlers (auth, posts, comments, categories, tags, admin, media)
- **middleware/** - Auth, CSRF, rate limiting middleware
- **metrics/** - Health checks, Prometheus metrics
- **state/** - Application state (DB, Redis, JWT, email, config)
- **utils/** - IP extraction, helper functions

### Server Initialization Flow
```
main()
  ↓ Load .env
  ↓ Initialize tracing
  ↓ Load Settings (from env)
  ↓ Connect PostgreSQL (PgPool)
  ↓ Run migrations
  ↓ Connect Redis
  ↓ Initialize services (JWT, Email)
  ↓ Create AppState
  ↓ Build Router (v1_routes)
  ↓ Apply middleware (CORS, Compression, Trace)
  ↓ Bind TCP listener
  ↓ Serve (axum::serve)
```

### Route Organization

**Route Groups** (to avoid stack overflow):
1. `auth_routes()` - Authentication endpoints
2. `post_routes()` - Public post endpoints
3. `post_admin_routes()` - Protected post management
4. `category_routes()` - Category CRUD
5. `tag_routes()` - Tag CRUD
6. `search_routes()` - Search endpoints
7. `comment_routes()` - Public comments
8. `comment_admin_routes()` - Protected comment moderation
9. `reading_progress_routes()` - Reading progress tracking
10. `admin_routes()` - Admin panel, users, media, versions, MDX sync

**Route Composition**:
```rust
fn v1_routes(state: AppState) -> Router<AppState> {
    auth_routes()
        .merge(post_routes())
        .merge(category_routes())
        // ... more routes
        .with_state(state)
}
```

**Protected Routes** (require auth):
```rust
admin_routes()
    .layer(axum::middleware::from_fn_with_state(
        state.clone(),
        auth_middleware,
    ))
```

## Middleware Stack

### Applied Globally (in main.rs)
1. **TraceLayer** - HTTP request/response tracing
2. **CompressionLayer** - Gzip compression
3. **CorsLayer** - CORS (configurable dev/prod)

### Applied Per-Route
- **auth_middleware** - JWT validation for admin routes

## State Management

```rust
pub struct AppState {
    pub db: PgPool,                        // PostgreSQL pool
    pub redis: deadpool_redis::Pool,       // Redis pool
    pub jwt: blog_core::JwtService,        // JWT signing/verification
    pub settings: blog_shared::Settings,   // Configuration
    pub email_service: blog_core::email::EmailService,
    pub metrics: Arc<RwLock<Metrics>>,     // Metrics collection
}
```

## API Endpoints

### Authentication (`/v1/auth`)
- `POST /register` - User registration
- `POST /login` - Login (returns access + refresh tokens)
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (invalidate refresh token)
- `GET /me` - Get current user info

### Posts (`/v1/posts`)
- `GET /posts` - List posts (paginated, filterable)
- `GET /posts/{slug}` - Get single post
- `GET /posts/{slug}/stats` - Post statistics
- `POST /posts/{slug}/view` - Record view
- `POST /posts/{slug}/like` - Like post
- `DELETE /posts/{slug}/like` - Unlike post

### Post Management (`/v1/admin/posts`)
- `GET /admin/posts` - List all posts (admin)
- `POST /admin/posts` - Create post
- `PATCH /admin/posts/{slug}` - Update post
- `DELETE /admin/posts/{slug}` - Delete post

### Comments (`/v1/posts/{slug}/comments`)
- `GET /posts/{slug}/comments` - List comments
- `POST /posts/{slug}/comments` - Create comment
- `POST /comments/{id}/like` - Like comment
- `POST /comments/{id}/unlike` - Unlike comment

### Comment Moderation (`/v1/admin/comments`)
- `GET /admin/comments` - List all comments
- `PUT /admin/comments/{id}/status` - Update status
- `DELETE /admin/comments/{id}` - Delete comment

### Categories (`/v1/categories`)
- `GET /categories` - List categories
- `GET /categories/tree` - Category tree
- `GET /categories/{slug}` - Get category
- `GET /categories/{slug}/posts` - Posts in category
- `POST /admin/categories` - Create category
- `PATCH /admin/categories/{slug}` - Update category
- `DELETE /admin/categories/{slug}` - Delete category

### Tags (`/v1/tags`)
- `GET /tags` - List tags
- `GET /tags/popular` - Popular tags
- `GET /tags/autocomplete` - Autocomplete suggestions
- `GET /tags/{slug}` - Get tag
- `GET /tags/{slug}/posts` - Posts with tag
- `POST /admin/tags` - Create tag
- `PATCH /admin/tags/{slug}` - Update tag
- `DELETE /admin/tags/{slug}` - Delete tag

### Search (`/v1/search`)
- `GET /search` - Full-text search
- `GET /search/suggest` - Search suggestions
- `GET /search/trending` - Trending keywords

### Reading Progress (`/v1/posts/{slug}/reading-progress`)
- `GET /posts/{slug}/reading-progress` - Get progress
- `POST /posts/{slug}/reading-progress` - Update progress
- `DELETE /posts/{slug}/reading-progress` - Reset progress
- `GET /reading-progress/history` - User reading history

### Admin (`/v1/admin`)
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/users` - List users
- `PUT /admin/users/{id}/role` - Update user role
- `DELETE /admin/users/{id}` - Delete user
- `GET /admin/users/growth` - User growth analytics

### Media (`/v1/admin/media`)
- `GET /admin/media` - List media
- `GET /admin/media/unused` - Unused media
- `GET /admin/media/{id}` - Get media
- `PATCH /admin/media/{id}` - Update media
- `DELETE /admin/media/{id}` - Delete media

### Version Control (`/v1/admin/posts/{post_id}/versions`)
- `POST /versions` - Create version
- `GET /versions` - List versions
- `GET /versions/{version_number}` - Get version
- `POST /versions/{version_number}/restore` - Restore version
- `DELETE /versions/{version_number}` - Delete version
- `GET /versions/compare` - Compare versions

### MDX Sync (`/v1`)
- `POST /admin/sync/mdx` - Sync MDX files to database (admin)
- `POST /sync/mdx/public` - Public sync endpoint (testing)

### Health/Metrics
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Dependencies

**Core**:
- axum 0.8 - Web framework
- tokio - Async runtime
- tower-http - HTTP middleware (CORS, compression, trace)

**Database**:
- sqlx - PostgreSQL driver (with migrations)

**Caching**:
- deadpool-redis - Redis connection pool

**Auth**:
- blog_core - JWT service
- blog_shared - Auth middleware, error types

**Config**:
- blog_shared::Settings - Configuration from environment

**Observability**:
- tracing-subscriber - Logging
- blog_api::metrics - Metrics collection

## Compilation Settings

```rust
#![recursion_limit = "1024"]
#![type_length_limit = "10000000"]
```

**Purpose**: Prevent compiler stack overflow with large route types

## CORS Configuration

### Development Mode (`allowed_origins` contains "*")
```rust
CorsLayer::new()
    .allow_origin(Any)
    .allow_methods([...])
    .allow_headers([...])
    .allow_credentials(true)
```

### Production Mode (strict origins)
```rust
CorsLayer::new()
    .allow_origin(parsed_origins)  // Vec<HeaderValue>
    .allow_methods([...])
    .allow_headers([...])
    .allow_credentials(true)
```

## Error Handling

**Main Function**:
```rust
if let Err(e) = run_server().await {
    eprintln!("❌ 服务器启动失败: {}", e);
    eprintln!("💡 故障排查建议: ...");
    std::process::exit(1);
}
```

**Configuration Errors**:
- DATABASE_URL missing
- REDIS_URL missing
- JWT_SECRET too short (< 32 chars)
- SMTP configuration invalid

## Migration Strategy

**Run on Startup**:
```rust
sqlx::migrate!("../../migrations").run(&db).await?;
```

**Location**: `backend/migrations/`

## Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing key (>= 32 chars)
- `PASSWORD_PEPPER` - Password hashing pepper
- `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` - Email config

**Optional**:
- `SERVER_HOST` - Server host (default: 0.0.0.0)
- `SERVER_PORT` - Server port (default: 3000)
- `CORS_ALLOWED_ORIGINS` - Comma-separated origins (or "*" for dev)

## Binary Targets

**Main binary**: `src/main.rs`
- Entry point for API server

**Utility binaries** (in `src/bin/`):
- `create_admin.rs` - Create admin user
- `export_openapi.rs` - Export OpenAPI spec

**Alternate mains** (for testing):
- `main_minimal.rs` - Minimal server
- `main_simple.rs` - Simplified server

## Known Issues

### OpenAPI Disabled
```rust
// TEMPORARILY DISABLED TO TEST STACK OVERFLOW
// .merge(blog_api::routes::openapi::swagger_ui())
```

**Reason**: Stack overflow from complex type inference

**Workaround**: Route grouping + increased recursion limit

## Performance Optimizations

1. **Route Grouping** - Reduces type complexity
2. **Connection Pooling** - PostgreSQL and Redis
3. **Middleware Layering** - Applied once globally
4. **Compression** - Gzip response compression
5. **Metrics** - Prometheus metrics for monitoring

## Testing

**Run server**:
```bash
cd backend
cargo run --bin api
```

**Test health endpoint**:
```bash
curl http://localhost:3000/health
```

**Test API**:
```bash
curl http://localhost:3000/v1/posts
```

## Deployment

**Build**:
```bash
cargo build --release
```

**Run**:
```bash
./target/release/api
```

**Docker**:
See `deployments/docker/compose-files/backend/`

## Related Modules
- `blog_core` - JWT, email services
- `blog_shared` - Shared types, config, errors
- `blog_db` - Database models
- `migrations/` - SQL migrations
