# Middleware Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**Request processing pipeline and security enforcement layer** for the blog platform API. Implements cross-cutting concerns including authentication, rate limiting, and CSRF protection for all HTTP requests.

**Core Responsibilities:**
- JWT-based authentication and authorization
- Distributed rate limiting using Redis
- CSRF token validation for state-changing operations
- Request enrichment with user context
- Security policy enforcement (authentication required vs optional)

**Success Criteria:**
- All middleware adds <10ms latency to requests
- Authentication failures are detected and rejected before business logic
- Rate limiting prevents abuse while allowing legitimate traffic
- CSRF protection blocks cross-site request forgery attacks

**Integration Points:**
- All route handlers (via Axum middleware layer)
- AppState (JWT service, Redis pool)
- Request extensions (user context passing)
- Error handling (AuthError, StatusCode conversion)

---

## Layer 2: Feature Layer

### Feature Organization

**1. Authentication Features** (`auth.rs`)
- **Required Authentication** (`auth_middleware`)
  - JWT access token validation
  - Bearer token extraction from Authorization header
  - User context enrichment in request extensions
  - Rejects unauthenticated requests with AuthError
  - Use case: Protected admin routes, user-specific data

- **Optional Authentication** (`optional_auth_middleware`)
  - Attempts JWT validation but doesn't fail
  - Enriches request with user context if token valid
  - Proceeds without user context if token missing/invalid
  - Use case: Public routes with personalized features (e.g., cached views vs personalized)

**2. Rate Limiting Features** (`rate_limit.rs`)
- **Fixed-Window Rate Limiting**
  - Redis-based distributed rate limiting
  - Per-IP, per-route rate limits
  - Time-bucketed keys (minute-level granularity)
  - Route-specific limits (auth endpoints stricter)
  - Use case: Preventing API abuse, brute force attacks

- **Route Compression**
  - Hash-based route identification (8-char hash)
  - Dynamic segment normalization (UUIDs → *)
  - Reduced Redis memory footprint
  - Use case: Efficient rate limit key storage

**3. CSRF Protection Features** (`csrf.rs`)
- **CSRF Token Validation** (`csrf_middleware`)
  - Token extraction from headers or cookies
  - Validation only for state-changing methods (POST, PUT, PATCH, DELETE)
  - UUID format validation (simplified)
  - Use case: Preventing cross-site request forgery

- **Token Generation** (`generate_csrf_token`)
  - UUID-based token generation
  - Secure cookie setting (HttpOnly, SameSite, Secure)
  - Use case: Initial token provision to clients

---

## Layer 3: Module Layer

### Module Structure

```
middleware/
├── mod.rs           # Module exports (auth, rate_limit, csrf)
├── auth.rs          # JWT authentication middleware (88 lines)
├── rate_limit.rs    # Redis-based rate limiting (103 lines)
└── csrf.rs          # CSRF protection middleware (143 lines)
```

### Key Components

**1. Authentication System** (`auth.rs`)

**Middleware Signatures:**
```rust
// Required authentication (fails if no valid token)
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AuthError>

// Optional authentication (continues if token invalid/missing)
pub async fn optional_auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response
```

**Authentication Flow:**
1. Extract `Authorization` header
2. Parse `Bearer <token>` format
3. Verify JWT token using `state.jwt.verify_access_token()`
4. Parse user ID from `claims.sub`
5. Create `AuthUser` struct with user data
6. Insert user context into request extensions
7. Pass to next middleware/handler

**Data Structures:**
- `AuthUser` - User context (id, email, username, profile, email_verified)
  - **Note:** Currently uses placeholder values for `profile` and `email_verified`
  - **Future:** Load full user profile from database

**Error Handling:**
- `AuthError::MissingToken` - No Authorization header
- `AuthError::InvalidHeaderFormat` - Malformed Authorization header
- `AuthError::InvalidToken` - JWT verification failed

**2. Rate Limiting System** (`rate_limit.rs`)

**Middleware Signature:**
```rust
pub async fn rate_limit_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode>
```

**Rate Limiting Algorithm:**
```lua
-- Redis Lua script (atomic execution)
local key = KEYS[1]           -- Rate limit key
local limit = tonumber(ARGV[1]) -- Max requests
local window = tonumber(ARGV[2]) -- Time window (seconds)
local current = redis.call("INCR", key)
if current == 1 then
    redis.call("EXPIRE", key, window)
end
if current > limit then
    return 0  -- Denied
end
return 1  -- Allowed
```

**Key Format:**
```
r:{ip}:{route_hash}:{minute_bucket}
Example: r:192.168.1.1:a3f2e8d1:202501031530
```

**Rate Limit Strategies:**
```rust
("/v1/auth/login", "/v1/auth/register")     → 5 requests/minute
("/v1/posts/*/view")                         → 100 requests/minute
("/v1/posts/*/comments", POST)               → 10 requests/minute
(*)                                          → 1000 requests/minute (default)
```

**Route Compression:**
```rust
fn compress_route(route: &str) -> String {
    // Hash route to 8-character hex string
    // "/v1/posts/uuid-value/comments" → "a3f2e8d1"
    let mut hasher = DefaultHasher::new();
    route.hash(&mut hasher);
    format!("{:x}", hasher.finish())[..8].to_string()
}
```

**Route Normalization:**
```rust
// Extract and normalize route
"/v1/posts/a1b2c3d4-..." → "/v1/posts/*"
"/v1/users/123/profile"  → "/v1/users/*/profile"
```

**3. CSRF Protection System** (`csrf.rs`)

**Middleware Signature:**
```rust
pub async fn csrf_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode>
```

**CSRF Token Structure:**
```rust
pub struct CsrfToken {
    pub token: String,  // UUID v4
}
```

**Validation Logic:**
```rust
// Only validate state-changing methods
POST | PUT | PATCH | DELETE → Check CSRF token
GET | HEAD | OPTIONS         → Skip validation
```

**Token Extraction Priority:**
1. `X-CSRF-Token` header
2. `csrf_token` cookie
3. Return `CsrfError::MissingToken`

**Cookie Format:**
```
csrf_token={uuid}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600
```

**Error Types:**
- `CsrfError::MissingToken` - No token in headers or cookies
- `CsrfError::InvalidToken` - Token format invalid (not UUID)
- `CsrfError::InvalidHeader` - Header parsing failed

**Current Implementation:**
- **Validation:** UUID format checking only (simplified)
- **Security Note:** Does NOT verify token was generated by server
- **Production Risk:** Accepts any valid UUID as CSRF token
- **Recommended:** Implement server-side token storage and validation

---

## Layer 4: Integration Layer

### Middleware Registration

**Axum Router Setup:**
```rust
// Apply rate limiting globally
app.layer(tower::ServiceBuilder::new()
    .layer(axum::middleware::from_fn(
        rate_limit_middleware
    ))
)

// Apply authentication to specific routes
app.route("/api/admin/*",
    get(admin_handler)
        .layer(axum::middleware::from_fn(
            auth_middleware
        ))
)

// Apply optional authentication
app.route("/api/posts",
    get(posts_handler)
        .layer(axum::middleware::from_fn(
            optional_auth_middleware
        ))
)

// Apply CSRF to state-changing routes
app.route("/api/comments",
    post(create_comment)
        .layer(axum::middleware::from_fn(
            csrf_middleware
        ))
)
```

### User Context Extraction

**In Protected Route Handlers:**
```rust
pub async fn protected_handler(
    // Extract user from request extensions
    auth_user: axum::Extension<AuthUser>,
) -> Result<Json<Response>, StatusCode> {
    let user_id = auth_user.id;
    let email = auth_user.email;

    // Use authenticated user data
    Ok(Json(Response { user_id, email }))
}
```

**Error Response Mapping:**
```rust
impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AuthError::MissingToken =>
                (StatusCode::UNAUTHORIZED, "Missing token"),
            AuthError::InvalidHeaderFormat =>
                (StatusCode::BAD_REQUEST, "Invalid header format"),
            AuthError::InvalidToken =>
                (StatusCode::UNAUTHORIZED, "Invalid token"),
        };

        (status, Json(json!({ "error": message })))
            .into_response()
    }
}
```

### Redis Integration

**Rate Limit Script Execution:**
```rust
let mut conn = state.redis.get().await?;
let result: i32 = Script::new(RATE_LIMIT_SCRIPT)
    .key(&key)
    .arg(limit)
    .arg(window)
    .invoke_async(&mut conn)
    .await?;
```

**Redis Operations:**
- `INCR` - Atomic counter increment
- `EXPIRE` - Set time window on first increment
- Lua script ensures atomicity (no race conditions)

### JWT Service Integration

**Token Verification:**
```rust
// In auth_middleware
match state.jwt.verify_access_token(token) {
    Ok(claims) => {
        // Extract user data from claims
        let user_id = uuid::Uuid::parse_str(&claims.sub)?;
        let email = claims.email;
        let username = claims.username;
    }
    Err(_) => return Err(AuthError::InvalidToken)
}
```

**JWT Claims Structure:**
```rust
pub struct Claims {
    pub sub: String,      // User ID (UUID)
    pub email: String,
    pub username: String,
    pub exp: usize,       // Expiration time
    pub iat: usize,       // Issued at
}
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `axum` - Web framework (Request, State, Next, Response, middleware)
- `blog_shared` - Shared types (AuthUser, AuthError)
- `redis` - Redis client (Script for Lua execution)
- `chrono` - Time handling (UTC time for bucketing)
- `uuid` - UUID generation and parsing (CSRF tokens)
- `tokio` - Async runtime (Redis connections)

**Pattern Usage:**
- **Middleware Pattern** - Request/response interception and transformation
- **Extension Pattern** - Request enrichment (user context)
- **Lua Scripting** - Atomic Redis operations
- **Hash-based Compression** - Memory-efficient key storage

### Implementation Patterns

**1. Middleware Pattern (Axum)**
```rust
pub async fn middleware_name(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, Error> {
    // Pre-processing
    // ...

    // Call next handler/middleware
    let response = next.run(request).await;

    // Post-processing
    // ...

    Ok(response)
}
```

**2. Request Extension Pattern**
```rust
// Insert data into request
request.extensions_mut().insert(auth_user);

// Extract data in handler
let auth_user = request.extensions().get::<AuthUser>();
```

**3. Error Propagation**
```rust
// Early return on error
let token = extract_token()
    .map_err(|_| AuthError::MissingToken)?;

// Chaining transformations
let user_id = parse_uuid(&claims.sub)
    .map_err(|_| AuthError::InvalidToken)?;
```

### Performance Considerations

**Rate Limiting:**
- **Redis Lua Script** - Single roundtrip, atomic execution
- **Route Compression** - Reduced key size (50%+ memory savings)
- **Time Bucketing** - Automatic key expiration (no cleanup needed)

**Authentication:**
- **JWT Verification** - Cryptographic validation (~1-5ms)
- **No Database Lookup** - User claims embedded in token
- **Extension Storage** - Zero-copy user context passing

**CSRF Protection:**
- **UUID Generation** - Fast (~100ns)
- **Header Validation** - String parsing only (~1μs)
- **Stateless** - No server-side token storage (current implementation)

### Security Considerations

**Authentication:**
- ✅ JWT signature verification prevents token tampering
- ✅ Token expiration enforced
- ⚠️ No token revocation mechanism (stateless JWT)
- ⚠️ `AuthUser` uses placeholder values (not loaded from DB)

**Rate Limiting:**
- ✅ Distributed (Redis) - prevents bypass via load balancer
- ✅ IP-based identification (consider proxy/X-Forwarded-For)
- ✅ Route-specific limits (stricter for auth endpoints)
- ⚠️ No user-based rate limiting (IP can be shared/NAT)
- ⚠️ Time bucketing allows bursts at window boundaries

**CSRF Protection:**
- ✅ Validates state-changing methods only
- ✅ Secure cookie attributes (HttpOnly, SameSite, Secure)
- ❌ **CRITICAL:** Any valid UUID is accepted (server doesn't verify)
- ❌ **CRITICAL:** No token storage or per-session validation
- ❌ **RECOMMENDATION:** Implement server-side token storage

**Recommended CSRF Implementation:**
```rust
// Store CSRF tokens in Redis with session association
redis.set_ex(
    format!("csrf:{}", session_id),
    token,
    3600  // 1 hour
);

// Validate token against session
let stored = redis.get(format!("csrf:{}", session_id))?;
if stored != provided_token {
    return Err(CsrfError::InvalidToken);
}
```

---

## Development Guidelines

### Adding New Middleware

**1. Create Middleware Function:**
```rust
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};

pub async fn new_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, Error> {
    // Pre-processing logic
    tracing::info!("Request: {:?}", request.uri());

    // Call next handler
    let response = next.run(request).await;

    // Post-processing logic
    tracing::info!("Response: {:?}", response.status());

    Ok(response)
}
```

**2. Register Middleware:**
```rust
app.layer(axum::middleware::from_fn(new_middleware))
```

**3. Apply Selectively (if needed):**
```rust
app.route("/api/protected",
    get(handler)
        .layer(axum::middleware::from_fn(new_middleware))
)
```

### Customizing Rate Limits

**Add New Route Rules:**
```rust
let (limit, window) = match route.as_str() {
    "/v1/auth/login" => (5, 60),
    "/v1/auth/register" => (5, 60),
    "/v1/admin/import" => (2, 60),  // New: restrict bulk imports
    "/v1/api/search" => (20, 60),    // New: limit expensive searches
    _ => (1000, 60),
};
```

**User-Based Rate Limiting:**
```rust
// After authentication
let user_id = auth_user.id.to_string();
let key = format!("u:{}:{}", user_id, route_hash);

// Different limits per user tier
let limit = match user_tier {
    UserTier::Free => 100,
    UserTier::Pro => 1000,
    UserTier::Enterprise => 10000,
};
```

### Testing Middleware

**Unit Tests:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_auth_middleware_rejects_missing_token() {
        // Create test request without Authorization header
        let request = Request::builder()
            .uri("/api/protected")
            .body(Body::empty())
            .unwrap();

        // Run middleware
        let result = auth_middleware(State(state), request, next).await;

        // Assert rejection
        assert!(matches!(result, Err(AuthError::MissingToken)));
    }
}
```

**Integration Tests:**
```rust
#[tokio::test]
async fn test_rate_limit_enforcement() {
    // Send 100 requests (limit is 5)
    for _ in 0..100 {
        let resp = app
            .oneshot(Request::post("/api/login"))
            .await
            .unwrap();

        if i < 5 {
            assert_eq!(resp.status(), StatusCode::OK);
        } else {
            assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
        }
    }
}
```

---

## Troubleshooting

### Common Issues

**1. Authentication Failing for Valid Tokens**
- **Cause:** Token expired, signature mismatch, issuer mismatch
- **Debug:** Check JWT configuration (secret, expiration, issuer)
- **Solution:** Verify token generation and validation use same keys

**2. Rate Limiting Too Aggressive**
- **Cause:** Shared IP (NAT, proxy), time bucket bursts
- **Debug:** Check Redis keys: `redis.keys("r:*")`
- **Solution:** Increase limits, use user-based rate limiting

**3. CSRF Validation Always Failing**
- **Cause:** Token format mismatch, cookie not sent
- **Debug:** Check request headers for `X-CSRF-Token` or `Cookie`
- **Solution:** Ensure client includes token in requests

**4. Middleware Not Executing**
- **Cause:** Order of middleware registration
- **Debug:** Add logging to middleware entry point
- **Solution:** Check middleware layering (global vs route-specific)

### Monitoring

**Key Metrics:**
- Authentication failures (AuthError types)
- Rate limit rejections (TOO_MANY_REQUESTS responses)
- CSRF validation failures
- Middleware execution time

**Logging:**
```rust
tracing::warn!(
    "Rate limit exceeded for IP: {}, Route: {}",
    ip, route
);

tracing::error!(
    "Authentication failed: {}",
    error
);
```

---

## Future Improvements

**Technical Debt:**
1. Implement server-side CSRF token storage and validation
2. Load full user profile in `auth_middleware` (database lookup)
3. Add token revocation mechanism for JWT (Redis blocklist)
4. Implement user-based rate limiting (not just IP-based)

**Enhancements:**
1. Add role-based access control (RBAC) middleware
2. Implement request ID generation and tracing
3. Add request/response logging middleware
4. Support API key authentication (for service accounts)

**Performance:**
1. Cache JWT verification results (short-term)
2. Implement sliding window rate limiting (smoother limits)
3. Add rate limit headers to responses (`X-RateLimit-*`)
4. Optimize route compression algorithm

**Security:**
1. Add device fingerprinting for rate limiting
2. Implement IP whitelist for admin routes
3. Add security headers middleware (CSP, HSTS, etc.)
4. Support 2FA (two-factor authentication)
