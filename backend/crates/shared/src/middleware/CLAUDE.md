# Shared Middleware Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**Shared middleware types and utilities** used across multiple backend services. Provides common authentication types and error handling for request processing.

**Core Responsibilities:**
- Shared authentication types (AuthUser, AuthError)
- Common middleware errors
- Type definitions used across services

**Success Criteria:**
- Zero code duplication across services
- Type-safe authentication context
- Consistent error handling

**Integration Points:**
- API crate middleware
- Other backend services
- Authentication system

---

## Layer 2: Feature Layer

### Shared Components

**1. Authentication Types** (`auth.rs`)
- `AuthUser` - Authenticated user context
- `AuthError` - Authentication error types

---

## Layer 3: Module Layer

### Module Structure

```
middleware/
├── mod.rs      # Module exports
└── auth.rs     # Authentication types
```

### Key Types

**AuthUser Structure:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
}
```

**AuthError Enum:**
```rust
#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidHeaderFormat,
    InvalidToken,
}
```

---

## Layer 4: Integration Layer

### Usage in API Middleware

```rust
use blog_shared::middleware::auth::{AuthUser, AuthError};

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    // ... JWT verification

    let auth_user = AuthUser {
        id: user_id,
        email: claims.email,
        username: claims.username,
        profile: serde_json::Value::Null,
        email_verified: false,
    };

    request.extensions_mut().insert(auth_user);
    Ok(next.run(request).await)
}
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `serde` - Serialization support
- `uuid` - User identification

---

## Future Improvements

**Enhancements:**
1. Add role-based access control types
2. Add permission types
3. Add session types
4. Add audit context types
