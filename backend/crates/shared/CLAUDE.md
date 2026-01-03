# Shared Crate (backend/crates/shared)

## Overview
Shared types, utilities, and configurations used across all backend crates.

**Purpose**: Common functionality layer
**Language**: Rust
**Layer**: Layer 3 - Cross-Cutting Utilities

## Module Structure

```
src/
├── lib.rs                  # Public API exports
├── config.rs               # Settings and configuration
├── error.rs                # Error types and handling
├── api_response.rs         # API response wrappers
├── query_params.rs         # Pagination and filtering
├── validators.rs           # Input validation
└── middleware/
    ├── mod.rs              # Middleware exports
    └── auth.rs             # Authentication middleware
```

## Configuration (config.rs)

### Settings Struct
```rust
pub struct Settings {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub jwt: JwtConfig,
    pub smtp: SmtpConfig,
    pub cors: CorsConfig,
}
```

**Environment Variables**:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `SMTP_*`
- `CORS_ALLOWED_ORIGINS`

**From Environment**:
```rust
impl Settings {
    pub fn from_env() -> Result<Self, ConfigError>
}
```

## Error Handling (error.rs)

### AppError Enum
```rust
pub enum AppError {
    Database(sqlx::Error),
    Auth(String),
    Validation(String),
    NotFound(String),
    InternalError,
    // ... more variants
}
```

**IntoResponse** for Axum:
```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Auth(msg) => (StatusCode::UNAUTHORIZED, msg),
            // ...
        };
        (status, Json(json!({"error": message}))).into_response()
    }
}
```

## API Response (api_response.rs)

### Standardized Response
```rust
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}
```

### Pagination Wrapper
```rust
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}
```

## Query Parameters (query_params.rs)

### Pagination
```rust
pub struct Pagination {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

impl Pagination {
    pub fn limit(&self) -> i64 { /* ... */ }
    pub fn offset(&self) -> i64 { /* ... */ }
}
```

**Extractor for Axum**:
```rust
#[axum::async_trait]
impl<S> FromRequestParts<S> for Pagination
```

### Filtering
```rust
pub struct PostFilter {
    pub published: Option<bool>,
    pub category: Option<String>,
    pub tag: Option<String>,
    pub search: Option<String>,
}
```

## Validators (validators.rs)

### PasswordValidator
```rust
pub struct PasswordValidator;

impl PasswordValidator {
    pub fn validate(password: &str) -> Result<(), PasswordError>
}
```

**Rules**:
- Minimum 8 characters
- Contains uppercase
- Contains lowercase
- Contains number
- Contains special character

### EmailValidator
```rust
pub fn validate_email(email: &str) -> Result<(), EmailError>
```

## Middleware (middleware/)

### Auth Middleware
```rust
pub async fn auth_middleware<B>(
    State(state): State<AppState>,
    mut req: Request<B>,
    next: Next<B>,
) -> Result<Response, AppError>
```

**Flow**:
1. Extract `Authorization: Bearer <token>` header
2. Decode and validate JWT
3. Attach claims to request extensions
4. Pass to next handler

**Usage**:
```rust
.post("/admin/posts")
.layer(axum::middleware::from_fn_with_state(
    state.clone(),
    auth_middleware,
))
```

## Dependencies

```toml
[dependencies]
config = "0.14"             # Configuration management
serde = { version = "1", features = ["derive"] }
validator = { version = "0.18", features = ["derive"] }
axum = "0.8"               # Web framework
sqlx = { version = "0.8", features = ["postgres"] }
```

## Related Modules

- `blog_api` - HTTP handlers
- `blog_core` - Authentication, email
- `blog_db` - Database models
