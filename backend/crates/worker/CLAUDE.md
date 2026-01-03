# Worker Crate (backend/crates/worker)

## Overview
Background job processing system for async tasks.

**Purpose**: Asynchronous task execution
**Language**: Rust
**Layer**: Layer 3 - Background Processing
**Runtime**: Tokio async runtime

## Architecture

```
src/
└── main.rs    # Worker entry point
```

## Job Types

### Email Jobs
- Send verification emails
- Send password reset emails
- Send notification emails

### Content Jobs
- Generate post thumbnails
- Process MDX files
- Update search index

### Maintenance Jobs
- Database cleanup
- Cache warming
- Statistics aggregation

## Worker Loop

```rust
#[tokio::main]
async fn main() -> Result<()> {
    // Connect to Redis
    // Subscribe to job queue
    // Process jobs
    loop {
        let job = redis.blpop("jobs:queue", 0).await?;
        process_job(job).await?;
    }
}
```

## Job Queue

**Backend**: Redis lists

**Job Format** (JSON):
```json
{
  "type": "email",
  "data": {
    "to": "user@example.com",
    "template": "verification",
    "context": { "code": "123456" }
  }
}
```

## Error Handling

**Retry Strategy**:
- Exponential backoff
- Max retry attempts
- Dead letter queue for failed jobs

**Logging**:
- Structured logging (tracing)
- Job IDs for tracking
- Error context capture

## Scaling

**Horizontal Scaling**:
- Multiple worker processes
- Redis queue distribution
- Idempotent job handlers

## Monitoring

**Metrics**:
- Jobs processed
- Job duration
- Error rate
- Queue depth

## Dependencies

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
redis = { version = "0.25", features = ["tokio-comp", "connection-manager"] }
tracing = "0.1"
tracing-subscriber = "0.3"
blog_core = { path = "../core" }
blog_shared = { path = "../shared" }
```

## Related

- `blog_api` - Job enqueueing
- `blog_core` - Email service
- Redis - Queue backend
