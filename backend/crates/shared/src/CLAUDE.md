# Blog Shared Crate (backend/crates/shared)

## Overview
Shared utilities, error types, configuration, and middleware used across all backend crates. Provides common functionality for API responses, validation, authentication, and configuration management.

**Purpose**: Shared code for backend crates
**Language**: Rust
**Layer**: Layer 3 - Shared Utilities

## Module Structure

```
src/
├── lib.rs              # Public API exports
├── api_response.rs     # Standardized API response types
├── config.rs           # Configuration from environment
├── error.rs            # Error types and handling
├── middleware/         # Auth middleware
│   ├── mod.rs
│   └── auth.rs
├── query_params.rs     # Query parameter parsing
└── validators.rs       # Input validation
```

## Public API (lib.rs)

**Re-exports**:
```rust
pub use api_response::{
    ApiError, ApiResponse, Link, PaginatedResponse, PaginationMeta, ResourceResponse,
};
pub use config::Settings;
pub use error::AppError;
pub use middleware::{AuthUser, AuthError};
pub use query_params::{PaginatedQuery, ResourceQuery, SearchQuery};
pub use validators::PasswordValidator;
```

## API Response Types (api_response.rs)

### Purpose
Standardized JSON API response format

### ApiResponse
```rust
pub struct ApiResponse<T> {
    pub data: T,
    pub message: Option<String>,
}
```

**Usage**:
```rust
Json(ApiResponse {
    data: post,
    message: Some("Post retrieved successfully".to_string()),
})
```

**JSON Output**:
```json
{
  "data": { "id": "...", "title": "..." },
  "message": "Post retrieved successfully"
}
```

### ResourceResponse
```rust
pub struct ResourceResponse<T> {
    pub data: T,
    pub links: Vec<Link>,
}
```

**HATEOAS-style links**:
```rust
Json(ResourceResponse {
    data: post,
    links: vec![
        Link { rel: "self".to_string(), href: "/v1/posts/my-post".to_string() },
        Link { rel: "comments".to_string(), href: "/v1/posts/my-post/comments".to_string() },
    ],
})
```

### PaginatedResponse
```rust
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub meta: PaginationMeta,
    pub links: Vec<Link>,
}
```

**Pagination metadata**:
```rust
pub struct PaginationMeta {
    pub current_page: u32,
    pub per_page: u32,
    pub total_items: u32,
    pub total_pages: u32,
}
```

**Usage**:
```rust
Json(PaginatedResponse {
    data: posts,
    meta: PaginationMeta {
        current_page: 1,
        per_page: 20,
        total_items: 100,
        total_pages: 5,
    },
    links: pagination_links,
})
```

### ApiError
```rust
pub struct ApiError {
    pub error: String,
    pub message: String,
    pub status_code: u16,
}
```

**Usage**:
```rust
Json(ApiError {
    error: "validation_error".to_string(),
    message: "Email is required".to_string(),
    status_code: 400,
})
```

### Link
```rust
pub struct Link {
    pub rel: String,   // Relationship ("self", "next", "prev")
    pub href: String,  // URL
}
```

## Configuration (config.rs)

### Settings
```rust
pub struct Settings {
    pub server_host: String,
    pub server_port: u16,
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub password_pepper: String,
    pub smtp: SmtpConfig,
    pub cors: CorsConfig,
}
```

### SmtpConfig
```rust
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub tls: bool,
    pub username: String,
    pub password: String,
    pub from: String,
}
```

### CorsConfig
```rust
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
}
```

### Loading from Environment
```rust
impl Settings {
    pub fn from_env() -> Result<Self, ConfigError>
}
```

**Environment Variables**:
- `SERVER_HOST` (default: "0.0.0.0")
- `SERVER_PORT` (default: "3000")
- `DATABASE_URL` (required)
- `REDIS_URL` (required)
- `JWT_SECRET` (required, min 32 chars)
- `PASSWORD_PEPPER` (required)
- `SMTP_HOST` (required)
- `SMTP_PORT` (default: "587")
- `SMTP_TLS` (default: "true")
- `SMTP_USERNAME` (required)
- `SMTP_PASSWORD` (required)
- `SMTP_FROM` (required)
- `CORS_ALLOWED_ORIGINS` (comma-separated, or "*")

## Error Types (error.rs)

### AppError
```rust
pub enum AppError {
    InternalError,
    Database(String),
    Auth(String),
    Validation(String),
    NotFound(String),
    Conflict(String),
    Unauthorized,
    Forbidden,
    PasswordHashError,
    TokenCreationError,
    EmailError(String),
}
```

### Error Responses
```rust
impl AppError {
    pub fn status_code(&self) -> u16 {
        match self {
            AppError::InternalError => 500,
            AppError::Database(_) => 500,
            AppError::Auth(_) => 401,
            AppError::Validation(_) => 400,
            AppError::NotFound(_) => 404,
            AppError::Conflict(_) => 409,
            AppError::Unauthorized => 401,
            AppError::Forbidden => 403,
            AppError::PasswordHashError => 500,
            AppError::TokenCreationError => 500,
            AppError::EmailError(_) => 500,
        }
    }

    pub fn to_api_error(&self) -> ApiError {
        ApiError {
            error: self.error_type().to_string(),
            message: self.to_string(),
            status_code: self.status_code(),
        }
    }
}
```

## Authentication Middleware (middleware/auth.rs)

### AuthUser
```rust
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub role: String,
}
```

**Extracted from JWT claims**, injected into request state.

### AuthError
```rust
pub enum AuthError {
    MissingToken,
    InvalidToken,
    ExpiredToken,
    InsufficientPermissions(String),
}
```

### Middleware Function
```rust
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode>
```

**Process**:
1. Extract `Authorization` header
2. Validate Bearer token format
3. Decode and verify JWT
4. Extract user claims
5. Check permissions (optional)
6. Inject `AuthUser` into request extensions
7. Call next handler

**Usage in routes**:
```rust
.use_axum::middleware::from_fn_with_state(state, auth_middleware)
```

**Access in handlers**:
```rust
let auth_user = req
    .extensions()
    .get::<AuthUser>()
    .ok_or(AppError::Unauthorized)?;
```

## Query Parameters (query_params.rs)

### PaginatedQuery
```rust
#[derive(Debug, Deserialize)]
pub struct PaginatedQuery {
    pub page: Option<u32>,      // Default: 1
    pub per_page: Option<u32>,  // Default: 20, Max: 100
}

impl PaginatedQuery {
    pub fn offset(&self) -> u32 {
        let page = self.page.unwrap_or(1).max(1);
        let per_page = self.per_page.unwrap_or(20).min(100);
        (page - 1) * per_page
    }

    pub fn limit(&self) -> u32 {
        self.per_page.unwrap_or(20).min(100)
    }
}
```

**Usage**:
```rust
#[axum::extract::Query(params)]
Query(params): PaginatedQuery,
```

### ResourceQuery
```rust
#[derive(Debug, Deserialize)]
pub struct ResourceQuery {
    pub slug: String,
    pub id: Option<Uuid>,
}
```

### SearchQuery
```rust
#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,              // Search query
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub sort: Option<String>,   // "relevance" | "date" | "popularity"
    pub order: Option<String>,  // "asc" | "desc"
}
```

## Validators (validators.rs)

### PasswordValidator
```rust
pub struct PasswordValidator {
    pub min_length: usize,
    pub require_uppercase: bool,
    pub require_lowercase: bool,
    pub require_digit: bool,
    pub require_special: bool,
}

impl Default for PasswordValidator {
    fn default() -> Self {
        Self {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_digit: true,
            require_special: true,
        }
    }
}

impl PasswordValidator {
    pub fn validate(&self, password: &str) -> Result<(), PasswordError>
}
```

**Validation Rules**:
- Minimum length: 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*)

**PasswordError**:
```rust
pub enum PasswordError {
    TooShort,
    MissingUppercase,
    MissingLowercase,
    MissingDigit,
    MissingSpecial,
}
```

## Dependencies

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
config = "0.14"             # Config from env/files
uuid = { version = "1", features = ["serde"] }
chrono = { version = "0.4", features = ["serde"] }
validator = { version = "0.18", features = ["derive"] }
regex = "1"
```

## Usage Examples

### Standard API Response
```rust
use blog_shared::ApiResponse;

Json(ApiResponse {
    data: post,
    message: Some("Success".to_string()),
})
```

### Paginated Response
```rust
use blog_shared::{PaginatedResponse, PaginationMeta};

Json(PaginatedResponse {
    data: posts,
    meta: PaginationMeta {
        current_page: 1,
        per_page: 20,
        total_items: 100,
        total_pages: 5,
    },
    links: vec![],
})
```

### Error Response
```rust
use blog_shared::{AppError, ApiError};

let err = AppError::NotFound("Post".to_string());
let api_err = err.to_api_error();
Json(api_err) // Returns ApiError JSON
```

### Load Configuration
```rust
use blog_shared::Settings;

let settings = Settings::from_env()?;
println!("Server: {}:{}", settings.server_host, settings.server_port);
```

### Auth Middleware
```rust
use blog_shared::middleware::auth_middleware;

Router::new()
    .route("/protected", get(protected_handler))
    .layer(axum::middleware::from_fn_with_state(state, auth_middleware))
```

### Access Authenticated User
```rust
use blog_shared::AuthUser;

fn handler(req: Request) -> Result<Response, AppError> {
    let auth_user = req.extensions().get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?;
    Ok(Json(format!("Hello, {}", auth_user.username)))
}
```

### Validate Password
```rust
use blog_shared::PasswordValidator;

let validator = PasswordValidator::default();
match validator.validate("password123") {
    Ok(()) => println!("Password valid"),
    Err(e) => eprintln!("Invalid password: {:?}", e),
}
```

## Best Practices

### 1. Always Use Typed Responses
```rust
// ✓ Good
Json(ApiResponse { data: post, message: None })

// ✗ Bad - inconsistent format
Json(post)
```

### 2. Handle Errors Consistently
```rust
// Convert AppError to Axum response
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let api_err = self.to_api_error();
        (StatusCode::from_u16(api_err.status_code).unwrap(), Json(api_err)).into_response()
    }
}
```

### 3. Validate Input Early
```rust
// In handler or middleware
let query = Query::<SearchQuery>::from_query(query_str)?;
query.q.validate()?;
```

### 4. Use Config Struct
```rust
// Pass settings, not individual env vars
let AppState { settings, .. } = state;
let db = connect(&settings.database_url)?;
```

## Related Modules
- `blog_api` - Uses shared types for API responses
- `blog_core` - Uses shared errors and config
- `blog_db` - Database models use shared types
