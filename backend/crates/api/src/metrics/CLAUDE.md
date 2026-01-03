# Metrics Module - Multi-Layer Architecture Documentation

## Layer 1: Application Layer

### Purpose & Scope
**System observability and health monitoring infrastructure** for the blog platform API. Provides real-time metrics collection, health checks, and monitoring capabilities essential for production operations and DevOps workflows.

**Core Responsibilities:**
- Prometheus metrics collection and export
- System health monitoring (basic, detailed, readiness)
- Dependency service health tracking (database, Redis, JWT, email)
- Performance metrics tracking (requests, cache, user actions)
- Resource utilization monitoring (connections, memory, CPU)

**Success Criteria:**
- All health endpoints respond within 100ms
- Metrics collection adds <5ms overhead to requests
- Prometheus scrape format compliance
- Graceful degradation during service degradation

**Integration Points:**
- AppState (metrics storage)
- All route handlers (automatic instrumentation)
- Database pools (connection monitoring)
- Redis connections (cache metrics)
- External monitoring (Prometheus scraping)

---

## Layer 2: Feature Layer

### Feature Organization

**1. Health Check Features** (`health.rs`)
- **Basic Health Check** (`/health`)
  - Simple liveness probe
  - Returns service status, version, uptime
  - Use case: Kubernetes liveness probes

- **Detailed Health Check** (`/health/detailed`)
  - Comprehensive system status
  - All dependency service checks
  - Resource utilization metrics
  - Use case: Operational dashboards, troubleshooting

- **Readiness Check** (`/readyz`)
  - Dependency service validation
  - All-or-nothing health validation
  - Use case: Kubernetes readiness probes, traffic routing

**2. Prometheus Metrics Features** (`prometheus.rs`)
- **HTTP Request Metrics**
  - Request counter (method, endpoint, status)
  - Request duration histogram
  - Use case: Performance analysis, SLA monitoring

- **Connection Metrics**
  - Active connections gauge
  - Database pool connections
  - Redis connection count
  - Use case: Capacity planning, connection leak detection

- **Cache Metrics**
  - Cache hits/misses counters
  - Use case: Cache effectiveness analysis

- **Business Metrics**
  - User registrations, logins
  - Comments created
  - Post views, likes
  - Comment likes
  - Use case: Business intelligence, engagement tracking

**3. Metrics Collection Infrastructure**
- MetricsMiddleware wrapper
- Async metric tracking helpers
- Background metric updates (non-blocking)

---

## Layer 3: Module Layer

### Module Structure

```
metrics/
├── mod.rs              # Module exports (health, prometheus)
├── health.rs           # Health check endpoints (320 lines)
└── prometheus.rs       # Prometheus metrics (362 lines)
```

### Key Components

**1. Health Check System** (`health.rs`)

**Data Structures:**
- `HealthStatus` - Basic health response (status, timestamp, version, uptime)
- `DetailedHealth` - Comprehensive health (services + system metrics)
- `ServiceStatus` - Individual service status (status, message, response_time)
- `SystemMetrics` - Resource usage (memory, CPU, connections, pools)
- `DatabasePoolStatus` - Connection pool state (size, idle, active)

**Core Functions:**
- `health()` - Basic liveness endpoint (Lightweight)
- `health_detailed()` - Full system health check (All dependencies)
- `readyz()` - Dependency readiness validation (All-or-nothing)
- `check_database_health()` - PostgreSQL connection test
- `check_redis_health()` - Redis connection test (PING)
- `check_jwt_health()` - JWT service validation (test token creation)
- `check_email_health()` - Email service configuration check

**2. Prometheus Metrics System** (`prometheus.rs`)

**Metrics Structure:**
```rust
pub struct Metrics {
    // Registry
    pub registry: Registry,

    // HTTP Metrics
    pub http_requests_total: IntCounterVec,        // [method, endpoint, status]
    pub http_request_duration: Histogram,          // Buckets: 5ms-300s

    // Connection Metrics
    pub active_connections: Gauge,
    pub database_connections_active: Gauge,
    pub redis_connections_active: Gauge,

    // Cache Metrics
    pub cache_hits: Counter,
    pub cache_misses: Counter,

    // Business Metrics
    pub user_registrations_total: Counter,
    pub user_logins_total: Counter,
    pub comments_created_total: Counter,
    pub post_views_total: Counter,
    pub post_likes_total: Counter,
    pub comment_likes_total: Counter,
}
```

**Core Functions:**
- `Metrics::new()` - Initialize and register all metrics
- `metrics_endpoint()` - Export metrics for Prometheus scraping
- `track_request()` - Automatic request tracking (async, non-blocking)
- `track_cache_hit/miss()` - Cache performance tracking
- `track_user_registration/login()` - User activity tracking
- `track_comment/post_view/like()` - Engagement tracking
- Helper tracking functions for all business events

---

## Layer 4: Integration Layer

### External Service Integration

**Database (PostgreSQL):**
```rust
// Health check
sqlx::query("SELECT 1 as test").fetch_one(db)

// Pool status monitoring
db.size()           // Total connections
db.num_idle()       // Idle connections
size - idle         // Active connections
```

**Redis:**
```rust
// Health check
redis::cmd("PING").query_async::<String>(&mut conn)

// Connection pool monitoring
redis_pool.status() // Pool size, active, idle
```

**JWT Service:**
```rust
// Health check - test token creation
jwt.create_refresh_token(&test_user_id)
```

**Prometheus Integration:**
- **Endpoint:** `GET /metrics`
- **Format:** `text/plain; version=0.0.4`
- **Scrape Configuration:**
  ```yaml
  scrape_configs:
    - job_name: 'blog-api'
      metrics_path: '/metrics'
      scrape_interval: 15s
  ```

### Application State Integration

**AppState Dependencies:**
```rust
pub struct AppState {
    pub metrics: Arc<RwLock<Metrics>>,
    pub db: PgPool,
    pub redis: deadpool_redis::Pool,
    pub jwt: blog_core::JwtService,
    pub email_service: blog_core::email::EmailService,
}
```

### Middleware Integration

**Request Tracking Pattern:**
```rust
track_request(
    metrics,
    method,
    endpoint,
    handler_future  // Wrapped async handler
).await
```

**Non-Blocking Updates:**
```rust
tokio::spawn(async move {
    let metrics = metrics_clone.read().await;
    metrics.increment_http_requests(&method, &endpoint, status_code);
});
```

---

## Layer 5: Foundation Layer

### Dependencies

**Rust Crates:**
- `prometheus` - Metrics collection and registry
- `axum` - Web framework (State extractors, response builders)
- `tokio` - Async runtime (spawn, RwLock)
- `serde` - Serialization (JSON responses)
- `chrono` - Timestamps (DateTime<Utc>)
- `utoipa` - OpenAPI schema (ToSchema, path macros)

**Pattern Usage:**
- **Arc<RwLock<T>>** - Thread-safe shared metrics access
- **tokio::spawn** - Non-blocking metric updates
- **HashMap** - Dynamic service status collection
- **Unsafe static** - App start time tracking (consider refactor)

### Implementation Patterns

**Metric Naming Convention:**
- Counters: `_total` suffix (cumulative)
- Gauges: Current state (connections)
- Histograms: Duration distributions (request latency)

**Label Strategy:**
```rust
// HTTP request labels
&["method", "endpoint", "status_code"]

// Example values
["GET", "/api/posts", "200"]
["POST", "/api/comments", "500"]
```

**Histogram Buckets:**
```rust
[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0,
 2.5, 5.0, 10.0, 30.0, 60.0, 300.0] // 5ms to 5 minutes
```

**Error Handling:**
- Metric registration: `.expect()` (panic on init failure)
- Export errors: Return `StatusCode::INTERNAL_SERVER_ERROR`
- Health checks: Return `ServiceStatus` with error messages

### Performance Considerations

**Non-Blocking Design:**
- All metric updates use `tokio::spawn` for async fire-and-forget
- Read locks on metrics (no write contention)
- Background updates don't block request handling

**Memory Efficiency:**
- Metrics are singleton (one instance per application)
- Registry owns metric data
- Clones are cheap (Arc wrappers)

### Safety Notes

**Unsafe Code:**
```rust
static mut APP_START_TIME: Option<DateTime<Utc>> = None;

pub fn set_app_start_time() {
    unsafe { APP_START_TIME = Some(Utc::now()); }
}
```
**Risk:** Data race if called concurrently
**Mitigation:** Only call once during application startup
**Future:** Consider using `std::sync::OnceLock` (Rust 1.70+)

---

## Development Guidelines

### Adding New Metrics

**1. Define Metric in `Metrics::new()`:**
```rust
let new_metric = Counter::new(
    "new_metric_total",
    "Description of what this tracks"
).expect("Failed to create new_metric");

registry.register(Box::new(new_metric.clone()))
    .expect("Failed to register new_metric");
```

**2. Add to Metrics Struct:**
```rust
pub struct Metrics {
    // ... existing metrics
    pub new_metric: Counter,
}
```

**3. Create Tracking Helper:**
```rust
pub fn track_new_event(metrics: &Arc<RwLock<Metrics>>) {
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        let metrics = metrics_clone.read().await;
        metrics.new_metric.inc();
    });
}
```

### Adding Health Checks

**1. Create Check Function:**
```rust
async fn check_service_health(
    service: &ServiceType
) -> ServiceStatus {
    let start = std::time::Instant::now();

    match service.test_connection().await {
        Ok(_) => ServiceStatus {
            status: "healthy".to_string(),
            message: None,
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        },
        Err(e) => ServiceStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("Service error: {}", e)),
            response_time_ms: Some(start.elapsed().as_millis() as u64),
            last_check: Some(Utc::now()),
        }
    }
}
```

**2. Integrate into `health_detailed()`:**
```rust
let service_status = check_service_health(&state.service).await;
services.insert("service_name".to_string(), service_status.clone());
if service_status.status != "healthy" {
    healthy = false;
}
```

### Testing Considerations

**Unit Tests:**
- Metric initialization and registration
- Health check logic with mock services
- Service status aggregation

**Integration Tests:**
- Endpoint responses (`/health`, `/health/detailed`, `/readyz`, `/metrics`)
- Prometheus format compliance
- Concurrent metric updates (thread safety)

**Load Tests:**
- Metrics overhead under high request volume
- Health check response times under load
- Memory usage over time (metric accumulation)

---

## Monitoring & Alerting

### Key Metrics to Monitor

**SLI/SLO Metrics:**
- `http_request_duration_seconds` - P95 < 500ms, P99 < 1s
- `http_requests_total{status="500"}` - Error rate < 0.1%
- `database_connections_active` - Pool exhaustion alerts
- `cache_hits_total / (cache_hits_total + cache_misses_total)` - Hit rate > 80%

**Business Metrics:**
- `user_registrations_total` - Growth tracking
- `post_views_total` - Content engagement
- `comments_created_total` - Community activity

### Recommended Grafana Dashboards

**1. API Performance Dashboard:**
- Request rate (requests/sec by endpoint)
- Error rate (5xx responses)
- Latency (P50, P95, P99)
- Active connections

**2. Infrastructure Health:**
- Database pool status
- Redis connection status
- Memory usage trend
- CPU usage trend

**3. Business Metrics Dashboard:**
- User registrations over time
- Post views trend
- Engagement metrics (likes, comments)

### Alert Examples

**Prometheus Alert Rules:**
```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  for: 5m

# Database pool exhaustion
- alert: DatabasePoolExhausted
  expr: database_connections_active / database_pool_size > 0.9
  for: 2m

# Service unhealthy
- alert: ServiceUnhealthy
  expr: up{job="blog-api"} == 0
  for: 1m
```

---

## Future Improvements

**Technical Debt:**
1. Replace unsafe `APP_START_TIME` with `OnceLock`
2. Add configurable metric buckets (env-based)
3. Implement metric labels for user tiers, content types

**Enhancements:**
1. Add distributed tracing integration (OpenTelemetry)
2. Custom metric export formats (JSON, InfluxDB)
3. Metric aggregation and rollups
4. Real-time alerting via webhooks

**Observability:**
1. Structured logging integration
2. Request correlation IDs
3. Performance profiling endpoints
4. On-demand profiling (pprof)
