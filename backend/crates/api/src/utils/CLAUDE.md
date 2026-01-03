# Utils Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**Utility functions and extractors** supporting the API layer. Provides reusable components for common operations like IP address extraction from proxied requests.

**Core Responsibilities:**
- Real client IP extraction from various proxy headers
- Support for Cloudflare, Nginx, and standard proxy configurations
- Custom Axum extractors for clean handler signatures
- Fallback mechanisms for missing headers

**Success Criteria:**
- Correctly identifies real client IP in all proxy configurations
- Graceful fallback when headers are missing
- Zero performance overhead (<1ms per extraction)
- Comprehensive test coverage

**Integration Points:**
- Rate limiting middleware (IP-based limits)
- Security logging (audit trails)
- Analytics (geolocation, fraud detection)
- Request handlers (via RealIp extractor)

---

## Layer 2: Feature Layer

### Feature Organization

**IP Address Extraction** (`ip_extractor.rs`)
- **Multi-Source IP Detection**
  - Cloudflare CDN (`CF-Connecting-IP`)
  - Standard proxy (`X-Real-IP`)
  - Forwarded chain (`X-Forwarded-For`)
  - Direct connection fallback
  - Use case: Accurate rate limiting, security logging

- **Priority-Based Extraction**
  - Cloudflare header checked first (if present)
  - X-Real-IP for Nginx/Apache proxies
  - X-Forwarded-For for multi-hop proxies (takes last IP)
  - Connection remote address as final fallback
  - Use case: Works across various deployment architectures

---

## Layer 3: Module Layer

### Module Structure

```
utils/
├── mod.rs           # Module exports (9 lines)
└── ip_extractor.rs  # IP address extraction (209 lines)
```

### Key Components

**1. RealIp Extractor** (`ip_extractor.rs`)

**Custom Extractor Type:**
```rust
pub struct RealIp(pub IpAddr);

// Implements Axum extractor trait
impl axum::extract::FromRequestParts<AppState> for RealIp
where
    AppState: Clone + Send + Sync + 'static,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        Ok(Self(extract_real_ip_from_parts(
            &parts.headers,
            &parts.extensions
        )))
    }
}
```

**Usage in Handlers:**
```rust
pub async fn handler(
    RealIp(client_ip): RealIp,  // Clean extraction
) -> String {
    format!("Client IP: {}", client_ip)
}
```

**2. IP Extraction Logic**

**Priority Order:**
```rust
fn extract_real_ip_from_parts(
    headers: &HeaderMap,
    extensions: &axum::http::Extensions
) -> IpAddr {
    // 1. Cloudflare (highest priority)
    if let Some(cf_ip) = headers.get("cf-connecting-ip") {
        return parse_ip(cf_ip);
    }

    // 2. X-Real-IP (Nginx, Apache)
    if let Some(real_ip) = headers.get("x-real-ip") {
        return parse_ip(real_ip);
    }

    // 3. X-Forwarded-For (proxy chain)
    if let Some(forwarded) = headers.get("x-forwarded-for") {
        // Take last IP (closest to server)
        let last_ip = forwarded
            .split(',')
            .last()
            .map(|s| s.trim())
            .and_then(|s| s.parse::<IpAddr>().ok());

        if let Some(addr) = last_ip {
            return addr;
        }
    }

    // 4. Connection remote address (fallback)
    if let Some(addr) = extensions
        .get::<ConnectInfo<SocketAddr>>()
        .map(|info| info.0.ip())
    {
        return addr;
    }

    // 5. Unknown IP (0.0.0.0)
    IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0))
}
```

**3. Legacy Function**

**Backward-Compatible API:**
```rust
pub fn extract_real_ip(req: &axum::extract::Request) -> IpAddr {
    extract_real_ip_from_parts(req.headers(), req.extensions())
}
```

---

## Layer 4: Integration Layer

### Middleware Integration

**Rate Limiting Usage:**
```rust
pub async fn rate_limit_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract real IP
    let ip = extract_real_ip(&request).to_string();
    let route = extract_route(&request);

    // Use IP for rate limit key
    let key = format!("r:{}:{}:{}", ip, route_hash, bucket);

    // ... rate limit logic
}
```

**Handler Usage:**
```rust
pub async fn login(
    RealIp(client_ip): RealIp,  // Direct extraction
    Json(creds): Json<LoginRequest>,
    State(state): State<AppState>,
) -> Result<Json<LoginResponse>, StatusCode> {
    // Log IP for security
    tracing::info!("Login attempt from IP: {}", client_ip);

    // ... login logic
}
```

### Deployment Scenarios

**Scenario 1: Cloudflare CDN**
```
Client → Cloudflare → API Server
Headers:
  CF-Connecting-IP: 203.0.113.1
  X-Forwarded-For: 203.0.113.1
Result: Uses CF-Connecting-IP (priority 1)
```

**Scenario 2: Nginx Reverse Proxy**
```
Client → Nginx → API Server
Headers:
  X-Real-IP: 198.51.100.1
  X-Forwarded-For: 198.51.100.1
Result: Uses X-Real-IP (priority 2)
```

**Scenario 3: Multi-Hop Proxy**
```
Client → Proxy1 → Proxy2 → API Server
Headers:
  X-Forwarded-For: 203.0.113.1, 198.51.100.1, 192.0.2.1
Result: Uses 192.0.2.1 (last IP, priority 3)
```

**Scenario 4: Direct Connection (No Proxy)**
```
Client → API Server
Headers: (none)
Connection: 198.51.100.1:54321
Result: Uses connection remote address (priority 4)
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `axum` - Web framework (extractors, request parts)
- `std::net` - IP address types (IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr)

### Implementation Patterns

**1. Axum Extractor Pattern**
```rust
// Define wrapper type
pub struct RealIp(pub IpAddr);

// Implement FromRequestParts trait
impl FromRequestParts<S> for RealIp {
    type Rejection = Infallible;  // Never fails

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        // Extraction logic
        Ok(Self(ip))
    }
}

// Use in handlers
pub async fn handler(RealIp(ip): RealIp) { ... }
```

**2. Fallback Pattern**
```rust
// Try source 1
if let Some(value) = try_source_1() {
    return value;
}

// Try source 2
if let Some(value) = try_source_2() {
    return value;
}

// Try source 3
if let Some(value) = try_source_3() {
    return value;
}

// Final fallback
default_value()
```

**3. Header Parsing Pattern**
```rust
headers
    .get("header-name")
    .and_then(|v| v.to_str().ok())  // Convert to string
    .and_then(|s| s.parse::<T>().ok())  // Parse to type
```

### Security Considerations

**IP Spoofing Risks:**
- ❌ **X-Forwarded-For** can be spoofed by client (contains client-provided IPs)
- ✅ **X-Real-IP** should be set by trusted proxy (Nginx/Apache configuration required)
- ✅ **CF-Connecting-IP** set by Cloudflare (trusted)

**Production Configuration:**
```nginx
# Nginx configuration: Trust only proxy IPs
set_real_ip_from 10.0.0.0/8;  # Proxy network
set_real_ip_from 172.16.0.0/12;
real_ip_header X-Real-IP;
real_ip_recursive on;
```

**Security Best Practices:**
1. Never trust client-provided headers without validation
2. Configure reverse proxies to overwrite X-Forwarded-For
3. Use Cloudflare's authenticated IP headers if available
4. Log all extraction attempts for audit trails

### Test Coverage

**Unit Tests (6 tests):**
```rust
#[test]
fn test_extract_ip_from_cf_connecting_ip() { ... }

#[test]
fn test_extract_ip_from_x_real_ip() { ... }

#[test]
fn test_extract_ip_from_x_forwarded_for_single() { ... }

#[test]
fn test_extract_ip_from_x_forwarded_for_multiple() { ... }

#[test]
fn test_extract_ipv6() { ... }

#[test]
fn test_extract_ip_no_headers_returns_zero() { ... }
```

**Test Coverage:**
- All header sources tested
- IPv4 and IPv6 support verified
- Multi-hop proxy chain handling
- Fallback to 0.0.0.0 when no headers

---

## Development Guidelines

### Adding New Extractors

**Pattern: Custom Extractor**
```rust
// 1. Define wrapper type
pub struct CustomExtractor(pub CustomType);

// 2. Implement FromRequestParts
impl<S> FromRequestParts<S> for CustomExtractor
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        // Extraction logic
        let value = extract_from_headers(&parts.headers)
            .ok_or(StatusCode::BAD_REQUEST)?;

        Ok(Self(value))
    }
}

// 3. Use in handlers
pub async fn handler(
    CustomExtractor(value): CustomExtractor,
) -> Result<Json<Response>, StatusCode> {
    Ok(Json(Response { value }))
}
```

### Adding New IP Sources

**Extending IP Extraction:**
```rust
fn extract_real_ip_from_parts(
    headers: &HeaderMap,
    extensions: &axum::http::Extensions
) -> IpAddr {
    // New source: Custom CDN header
    if let Some(custom_ip) = headers.get("x-cdn-ip") {
        if let Ok(addr) = custom_ip.to_str()?.parse() {
            tracing::debug!("IP from custom CDN: {}", addr);
            return addr;
        }
    }

    // ... existing sources
}
```

### Testing Extractors

**Integration Test:**
```rust
#[tokio::test]
async fn test_real_ip_extractor_in_handler() {
    let app = Router::new()
        .route("/test", get(handler))
        .into_make_service();

    let request = Request::builder()
        .header("cf-connecting-ip", "203.0.113.1")
        .body(Body::empty())
        .unwrap();

    let response = app
        .oneshot(request)
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}
```

---

## Future Improvements

**Technical Enhancements:**
1. Add IPv4-mapped IPv6 address handling
2. Support for custom header configuration
3. IP address validation (private ranges, reserved IPs)
4. GeoIP integration (country, city detection)

**Security:**
1. IP reputation checking (known bad IPs)
2. Tor exit node detection
3. VPN/proxy detection
4. Rate limiting based on IP risk score

**Features:**
1. IP anonymization (GDPR compliance)
2. IP blocklist/allowlist support
3. Per-user IP tracking (session security)
4. Suspicious activity alerts

---

## Troubleshooting

**Issue: All requests show same IP**
- **Cause:** Reverse proxy not setting headers
- **Solution:** Configure Nginx/Apache to set X-Real-IP

**Issue: Rate limiting not working**
- **Cause:** IP extraction returns 0.0.0.0
- **Debug:** Check headers with `tracing::debug!("Headers: {:?}", headers);`
- **Solution:** Ensure proxy sets recognized headers

**Issue: Spoofed IPs bypassing rate limit**
- **Cause:** Trusting client-provided X-Forwarded-For
- **Solution:** Configure reverse proxy to overwrite X-Forwarded-For
