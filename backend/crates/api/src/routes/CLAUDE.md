# Routes Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**HTTP API endpoint definitions and request handlers** for the blog platform. Implements the complete REST API surface area including posts, comments, authentication, admin operations, and CMS functionality.

**Core Responsibilities:**
- RESTful endpoint implementation (GET, POST, PUT, PATCH, DELETE)
- Request validation and response formatting
- Business logic orchestration (delegates to services)
- OpenAPI/Swagger documentation
- Route-specific error handling

**Success Criteria:**
- All endpoints respond within SLA (P95 < 500ms for standard operations)
- Proper HTTP status codes and error responses
- OpenAPI spec 100% coverage
- Input validation on all endpoints

**Integration Points:**
- AppState (database, Redis, services)
- Middleware (authentication, rate limiting, CSRF)
- Database models (CRUD operations)
- External services (email, JWT, storage)

---

## Layer 2: Feature Layer

### Route Organization (15 Modules)

**Core Blog Features:**
1. **posts** - Blog post CRUD, viewing, liking (6,631 total lines across routes)
2. **comments** - Comment management, moderation
3. **reading_progress** - User reading tracking

**Authentication & Users:**
4. **auth** - Login, registration, token refresh, password reset

**Admin Operations:**
5. **admin** - Admin-only operations (user management, analytics)

**CMS Features:**
6. **categories** - Category management
7. **tags** - Tag management
8. **media** - File uploads, media library
9. **versions** - Content versioning

**Search & Sync:**
10. **search** - Basic search functionality
11. **search_optimized** - Enhanced search with caching
12. **mdx_sync** - MDX content synchronization

**API Documentation:**
13. **openapi** - Swagger UI, OpenAPI spec generation

---

## Layer 3: Module Layer

### Module Structure

```
routes/
├── mod.rs                  # Module exports (33 lines)
├── posts.rs                # Post management (largest module)
├── comments.rs             # Comment operations
├── auth.rs                 # Authentication endpoints
├── admin.rs                # Admin operations
├── reading_progress.rs     # Reading tracking
├── categories.rs           # Category CRUD
├── tags.rs                 # Tag CRUD
├── media.rs                # Media handling
├── versions.rs             # Version control
├── search.rs               # Basic search
├── search_optimized.rs     # Advanced search
├── mdx_sync.rs             # MDX synchronization
└── openapi.rs              # API documentation
```

### Endpoint Patterns

**Standard CRUD Pattern:**
```rust
// List resources
pub async fn list_posts(
    Query(params): Query<ListParams>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Post>>, StatusCode>

// Get single resource
pub async fn get_post(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<Json<Post>, StatusCode>

// Create resource
pub async fn create_post(
    AuthUser(auth_user): AuthUser,
    ValidatedJson(data): ValidatedJson<CreatePostRequest>,
    State(state): State<AppState>,
) -> Result<Json<Post>, StatusCode>

// Update resource
pub async fn update_post(
    Path(id): Path<Uuid>,
    AuthUser(auth_user): AuthUser,
    ValidatedJson(data): ValidatedJson<UpdatePostRequest>,
    State(state): State<AppState>,
) -> Result<Json<Post>, StatusCode>

// Delete resource
pub async fn delete_post(
    Path(id): Path<Uuid>,
    AuthUser(auth_user): AuthUser,
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode>
```

**Action Endpoints:**
```rust
// Like post
pub async fn like(
    Path(id): Path<Uuid>,
    AuthUser(auth_user): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<LikeResponse>, StatusCode>
```

---

## Layer 4: Integration Layer

### Handler Dependencies

**State Access:**
```rust
pub async fn handler(
    State(state): State<AppState>,  // Database, services, config
    AuthUser(user): AuthUser,        // From middleware
    Path(id): Path<Uuid>,            // URL params
    Query(params): Query<Params>,    // Query string
    ValidatedJson(data): ValidatedJson<T>,  // Request body (validated)
) -> Result<Json<Response>, Error>
```

**Common Integration Points:**
- **Database:** `state.db` (SQL queries, transactions)
- **Redis:** `state.redis` (caching, sessions)
- **JWT:** `state.jwt` (token operations)
- **Email:** `state.email_service` (notifications)
- **Storage:** `state.storage` (file uploads)

### Error Handling

**Error Response Pattern:**
```rust
pub async fn handler(
    ...
) -> Result<impl IntoResponse, StatusCode> {
    // Business logic
    match result {
        Ok(data) => Ok(Json(data)),
        Err(e) => {
            tracing::error!("Handler error: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
```

**Status Code Mapping:**
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid auth
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server errors

### OpenAPI Documentation

**Route Handler Annotations:**
```rust
#[utoipa::path(
    post,
    path = "/api/posts",
    tag = "posts",
    request_body = CreatePostRequest,
    responses(
        (status = 201, description = "Post created", body = Post),
        (status = 400, description = "Validation error"),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn create_post(...) { ... }
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `axum` - Web framework (extractors, routing, responses)
- `uuid` - UUID parsing (path parameters)
- `serde` - JSON serialization (request/response bodies)
- `validator` - Input validation (ValidatedJson extractor)
- `utoipa` - OpenAPI documentation generation

### Implementation Patterns

**1. Extractor Pattern**
```rust
// Path parameters
Path(id): Path<Uuid>

// Query parameters
Query(params): Query<ListParams>

// Request body (validated)
ValidatedJson(data): ValidatedJson<CreatePostRequest>

// Authentication
AuthUser(user): AuthUser  // From middleware
```

**2. Response Builder Pattern**
```rust
// JSON response
Ok(Json(response_data))

// Custom status code
Ok((StatusCode::CREATED, Json(response_data)))

// No content response
Ok(StatusCode::NO_CONTENT)
```

**3. Error Propagation**
```rust
// Early return on error
let post = sqlx::query_as!(...)
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::NOT_FOUND)?;

// Custom error types
.map_err(|e| match e {
    ServiceError::NotFound => StatusCode::NOT_FOUND,
    ServiceError::Unauthorized => StatusCode::UNAUTHORIZED,
    _ => StatusCode::INTERNAL_SERVER_ERROR,
})?
```

### Performance Considerations

**Database Query Optimization:**
- Use `fetch_one` for single record lookups
- Use `fetch_all` for lists (with pagination)
- Implement connection pooling (via `state.db`)
- Use prepared statements (via `sqlx::query!` macros)

**Caching Strategy:**
```rust
// Try cache first
if let Some(cached) = redis.get(key).await? {
    return Ok(Json(cached));
}

// Cache miss: query database
let data = db.query(...).await?;

// Store in cache
redis.set_ex(key, &data, 3600).await?;

Ok(Json(data))
```

**Pagination:**
```rust
pub struct ListParams {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort: Option<String>,
}

// Default: page=1, limit=20
let page = params.page.unwrap_or(1);
let limit = params.limit.unwrap_or(20);
let offset = (page - 1) * limit;
```

---

## Development Guidelines

### Adding New Routes

**1. Define Request/Response Types:**
```rust
#[derive(Deserialize, ToSchema)]
pub struct CreatePostRequest {
    pub title: String,
    pub content: String,
    pub published: bool,
}

#[derive(Serialize, ToSchema)]
pub struct PostResponse {
    pub id: Uuid,
    pub title: String,
    pub created_at: DateTime<Utc>,
}
```

**2. Implement Route Handler:**
```rust
#[utoipa::path(
    post,
    path = "/api/posts",
    tag = "posts",
    request_body = CreatePostRequest,
    responses(
        (status = 201, description = "Post created", body = PostResponse)
    ),
    security(("bearer_auth" = []))
)]
pub async fn create_post(
    AuthUser(user): AuthUser,
    ValidatedJson(input): ValidatedJson<CreatePostRequest>,
    State(state): State<AppState>,
) -> Result<Json<PostResponse>, StatusCode> {
    // Implementation
}
```

**3. Register Route:**
```rust
app.route("/api/posts",
    posts::create_post.post()
        .layer(axum::middleware::from_fn(
            middleware::auth_middleware
        ))
)
```

### Input Validation

**Using Validator:**
```rust
#[derive(Deserialize, Validate)]
pub struct CreatePostRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,

    #[validate(length(min = 1))]
    pub content: String,

    #[validate(email)]
    pub email: String,
}
```

**Custom Validation:**
```rust
pub async fn create_post(
    ValidatedJson(input): ValidatedJson<CreatePostRequest>,
    ...
) -> Result<...> {
    // Additional validation
    if input.title.contains("banned") {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Process valid input
}
```

### Testing Routes

**Unit Test Example:**
```rust
#[tokio::test]
async fn test_create_post_success() {
    let app = create_test_app();

    let response = app
        .oneshot(Request::builder()
            .method("POST")
            .uri("/api/posts")
            .header("Authorization", "Bearer <token>")
            .body(Body::from(json!(request_data)))
            .unwrap()
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);
}
```

---

## Route Catalog

### Auth Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (invalidate refresh token)
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### Post Routes (`/api/posts`)
- `GET /posts` - List posts (paginated)
- `GET /posts/:id` - Get single post
- `POST /posts` - Create post (auth required)
- `PUT /posts/:id` - Update post (auth required, owner only)
- `DELETE /posts/:id` - Delete post (auth required, owner/admin)
- `POST /posts/:id/view` - Record post view
- `POST /posts/:id/like` - Like post
- `DELETE /posts/:id/like` - Unlike post

### Comment Routes (`/api/comments`)
- `GET /posts/:post_id/comments` - List comments
- `POST /posts/:post_id/comments` - Create comment
- `PUT /comments/:id` - Update comment (owner only)
- `DELETE /comments/:id` - Delete comment (owner/admin)
- `POST /comments/:id/like` - Like comment

### Admin Routes (`/api/admin`)
- `GET /users` - List users
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /analytics` - Platform analytics
- `POST /import` - Bulk import content

### Category Routes (`/api/categories`)
- `GET /categories` - List categories
- `POST /categories` - Create category (admin)
- `PUT /categories/:id` - Update category (admin)
- `DELETE /categories/:id` - Delete category (admin)

### Tag Routes (`/api/tags`)
- `GET /tags` - List tags
- `POST /tags` - Create tag (admin)
- `PUT /tags/:id` - Update tag (admin)
- `DELETE /tags/:id` - Delete tag (admin)

### Media Routes (`/api/media`)
- `POST /media/upload` - Upload file
- `GET /media/:id` - Get media metadata
- `DELETE /media/:id` - Delete media

### Search Routes (`/api/search`)
- `GET /search` - Full-text search
- `GET /search/optimized` - Enhanced search with caching

### Reading Progress Routes (`/api/reading`)
- `GET /reading/progress` - Get user's reading progress
- `POST /reading/progress/:post_id` - Update reading progress

### API Documentation Routes
- `GET /swagger-ui` - Swagger UI
- `GET /api-docs/openapi.json` - OpenAPI spec

---

## Future Improvements

**Technical Enhancements:**
1. GraphQL API alternative
2. WebSocket support for real-time features
3. Rate limiting per-route granularity
4. Request compression (gzip, brotli)

**API Features:**
1. Batch operations (bulk create/update)
2. Field filtering (partial response)
3. Sorting customization
4. Advanced filtering (operators, ranges)

**Documentation:**
1. Postman collection generation
2. SDK generation (TypeScript, Python)
3. API versioning strategy
4. Changelog documentation
