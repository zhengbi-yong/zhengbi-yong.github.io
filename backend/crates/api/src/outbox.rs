use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

/// Outbox event types for asynchronous processing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutboxEventType {
    SearchIndexUpsert { slug: String },
    SearchIndexDelete { slug: String },
    SearchIndexRebuild,
    EmailSend { template: String, to: String },
}

/// Outbox event stored in database for reliable async processing
#[derive(Debug, Clone)]
pub struct OutboxEvent {
    pub id: Uuid,
    pub event_type: String,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
    pub retry_count: i32,
    pub error: Option<String>,
}

/// Add a search index upsert event to the outbox
pub async fn add_search_index_upsert(db: &PgPool, slug: &str) -> Result<(), sqlx::Error> {
    let event = OutboxEventType::SearchIndexUpsert {
        slug: slug.to_string(),
    };

    sqlx::query(
        r#"
        INSERT INTO outbox_events (id, event_type, payload, created_at, retry_count)
        VALUES ($1, $2, $3, $4, 0)
        "#,
    )
    .bind(Uuid::new_v4())
    .bind("search_index_upsert")
    .bind(serde_json::to_value(&event).unwrap_or_default())
    .bind(Utc::now())
    .execute(db)
    .await?;

    Ok(())
}

/// Add a search index delete event to the outbox
pub async fn add_search_index_delete(db: &PgPool, slug: &str) -> Result<(), sqlx::Error> {
    let event = OutboxEventType::SearchIndexDelete {
        slug: slug.to_string(),
    };

    sqlx::query(
        r#"
        INSERT INTO outbox_events (id, event_type, payload, created_at, retry_count)
        VALUES ($1, $2, $3, $4, 0)
        "#,
    )
    .bind(Uuid::new_v4())
    .bind("search_index_delete")
    .bind(serde_json::to_value(&event).unwrap_or_default())
    .bind(Utc::now())
    .execute(db)
    .await?;

    Ok(())
}

/// Fetch pending outbox events for processing
pub async fn fetch_pending_events(
    db: &PgPool,
    limit: i64,
) -> Result<Vec<OutboxEvent>, sqlx::Error> {
    let rows = sqlx::query_as::<_, OutboxEventRow>(
        r#"
        SELECT id, event_type, payload, created_at, processed_at, retry_count, error
        FROM outbox_events
        WHERE processed_at IS NULL AND retry_count < 3
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
        "#,
    )
    .bind(limit)
    .fetch_all(db)
    .await?;

    Ok(rows.into_iter().map(Into::into).collect())
}

/// Mark an event as processed
pub async fn mark_event_processed(db: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE outbox_events
        SET processed_at = $1
        WHERE id = $2
        "#,
    )
    .bind(Utc::now())
    .bind(id)
    .execute(db)
    .await?;

    Ok(())
}

/// Mark an event as failed (increment retry count and record error)
pub async fn mark_event_failed(db: &PgPool, id: Uuid, error: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE outbox_events
        SET retry_count = retry_count + 1, error = $1
        WHERE id = $2
        "#,
    )
    .bind(error)
    .bind(id)
    .execute(db)
    .await?;

    Ok(())
}

/// Database row structure for outbox events
#[derive(sqlx::FromRow)]
struct OutboxEventRow {
    id: Uuid,
    event_type: String,
    payload: serde_json::Value,
    created_at: DateTime<Utc>,
    processed_at: Option<DateTime<Utc>>,
    retry_count: i32,
    error: Option<String>,
}

impl From<OutboxEventRow> for OutboxEvent {
    fn from(row: OutboxEventRow) -> Self {
        Self {
            id: row.id,
            event_type: row.event_type,
            payload: row.payload,
            created_at: row.created_at,
            processed_at: row.processed_at,
            retry_count: row.retry_count,
            error: row.error,
        }
    }
}
