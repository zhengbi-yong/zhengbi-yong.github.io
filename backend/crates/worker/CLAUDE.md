# Worker Crate (backend/crates/worker)

## Overview
Background job processing system for async tasks with CDC (Change Data Capture) support for Meilisearch synchronization.

**Purpose**: Asynchronous task execution and real-time search index synchronization
**Language**: Rust
**Layer**: Layer 3 - Background Processing
**Runtime**: Tokio async runtime

## Architecture

```
src/
├── main.rs       # Standard worker entry point
└── cdc_main.rs   # CDC worker for Meilisearch sync (Phase 6.1)
```

## Binaries

### Worker (`worker`)
Standard outbox-based worker for background job processing.

**Usage**:
```bash
# Standard mode (5s polling)
cargo run -p blog-worker

# CDC mode (500ms polling)
CDC_POLL_INTERVAL_MS=500 cargo run -p blog-worker
```

### CDC Worker (`cdc-worker`)
PostgreSQL WAL → Meilisearch sub-second sync with exactly-once delivery.

**Usage**:
```bash
# Poll mode (default, 500ms interval)
cargo run -p blog-worker --bin cdc-worker

# WAL streaming mode (requires PostgreSQL logical replication)
CDC_USE_WAL=true cargo run -p blog-worker --bin cdc-worker
```

## Phase 6: MeiliBridge CDC

### Architecture
```
PostgreSQL (WAL) → CDC Worker (Rust) → Meilisearch
                      ↓
                   Redis (LSN persistence for crash recovery)
```

### Exactly-Once Delivery

The CDC worker maintains LSN (Log Sequence Number) persistence in Redis:
1. On startup, reads last committed LSN from Redis
2. Resumes processing from that LSN
3. After each event, updates LSN in Redis
4. On crash, restarts from last persisted LSN

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CDC_POLL_INTERVAL_MS` | 500 | Poll interval for CDC mode |
| `CDC_SLOT_NAME` | meilibridge_slot | PostgreSQL replication slot name |
| `CDC_USE_WAL` | false | Enable WAL streaming mode (requires `wal_level=logical`) |

### Redis Keys

| Key | Description |
|-----|-------------|
| `meilibridge:lsn` | Last processed LSN |
| `meilibridge:slot` | Replication slot name |

## Job Types

### Outbox Events
- `SearchIndexUpsert { slug }` - Sync post to Meilisearch
- `SearchIndexDelete { slug }` - Delete post from Meilisearch
- `SearchIndexRebuild` - Full index rebuild
- `PostViewed { slug, increment }` - Batched view count updates

### Content Jobs
- Generate post thumbnails
- Process MDX files
- Update search index

### Maintenance Jobs
- Database cleanup
- Cache warming
- Statistics aggregation

## Worker Loop (Standard)

```rust
#[tokio::main]
async fn main() -> Result<()> {
    // Initialize PostgreSQL pool
    let db = create_postgres_pool(&settings).await?;

    // Optional: Initialize Meilisearch
    let search_index = SearchIndexService::new(&config).await?;

    // Poll outbox table every N seconds
    let mut ticker = interval(Duration::from_secs(5));

    loop {
        let events = claim_pending_events(&db, worker_id, batch_size).await?;
        for event in events {
            process_event(&db, &search_index, event).await?;
        }
        ticker.tick().await;
    }
}
```

## CDC Worker Loop

```rust
async fn run_poll_mode(&self, poll_interval: Duration) -> Result<()> {
    let mut ticker = interval(poll_interval);

    loop {
        ticker.tick().await;
        self.process_pending_events().await?;
    }
}
```

## Error Handling

**Retry Strategy**:
- Exponential backoff
- Max retry attempts (3)
- Dead letter queue for failed jobs

**Logging**:
- Structured logging (tracing)
- Event IDs for tracking
- Error context capture

## Scaling

**Horizontal Scaling**:
- Multiple worker processes
- Outbox locking prevents duplicate processing
- Redis LSN for exactly-once delivery

## Dependencies

```toml
[dependencies]
tokio = { workspace = true }
sqlx = { workspace = true, features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono", "json"] }
deadpool-redis = { workspace = true }
redis = { workspace = true }
tracing = { workspace = true }
blog-api = { path = "../api" }
blog-core = { path = "../core" }
blog-db = { path = "../db" }
blog-shared = { path = "../shared" }
```

## Related

- `blog_api::outbox` - Outbox pattern implementation
- `blog_api::search_index` - Meilisearch integration
- `blog_shared::Settings` - Configuration management
- Redis - LSN persistence and queue backend
