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
    PostViewed { slug: String, increment: i64 },
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

/// Add a full search index rebuild event to the outbox
pub async fn add_search_index_rebuild(db: &PgPool) -> Result<(), sqlx::Error> {
    let event = OutboxEventType::SearchIndexRebuild;

    sqlx::query(
        r#"
        INSERT INTO outbox_events (id, event_type, payload, created_at, retry_count)
        VALUES ($1, $2, $3, $4, 0)
        "#,
    )
    .bind(Uuid::new_v4())
    .bind("search_index_rebuild")
    .bind(serde_json::to_value(&event).unwrap_or_default())
    .bind(Utc::now())
    .execute(db)
    .await?;

    Ok(())
}

/// Add a batched post view event to the outbox
pub async fn add_post_viewed(db: &PgPool, slug: &str, increment: i64) -> Result<(), sqlx::Error> {
    let event = OutboxEventType::PostViewed {
        slug: slug.to_string(),
        increment,
    };

    sqlx::query(
        r#"
        INSERT INTO outbox_events (id, event_type, payload, created_at, retry_count)
        VALUES ($1, $2, $3, $4, 0)
        "#,
    )
    .bind(Uuid::new_v4())
    .bind("post_viewed")
    .bind(serde_json::to_value(&event).unwrap_or_default())
    .bind(Utc::now())
    .execute(db)
    .await?;

    Ok(())
}

/// Atomically claim pending outbox events for processing.
pub async fn claim_pending_events(
    db: &PgPool,
    worker_id: &str,
    limit: i64,
    lock_timeout_secs: i32,
) -> Result<Vec<OutboxEvent>, sqlx::Error> {
    let rows = sqlx::query_as::<_, OutboxEventRow>(
        r#"
        WITH candidates AS (
            SELECT id
            FROM outbox_events
            WHERE processed_at IS NULL
                AND retry_count < 3
                AND (
                    locked_at IS NULL
                    OR locked_at < NOW() - make_interval(secs => $2)
                )
            ORDER BY created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        )
        UPDATE outbox_events AS outbox
        SET locked_at = NOW(),
            locked_by = $3,
            error = NULL
        FROM candidates
        WHERE outbox.id = candidates.id
        RETURNING outbox.id, outbox.event_type, outbox.payload, outbox.created_at,
            outbox.processed_at, outbox.retry_count, outbox.error
        "#,
    )
    .bind(limit)
    .bind(lock_timeout_secs)
    .bind(worker_id)
    .fetch_all(db)
    .await?;

    Ok(rows.into_iter().map(Into::into).collect())
}

/// Mark an event as processed
pub async fn mark_event_processed(db: &PgPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE outbox_events
        SET processed_at = $1,
            locked_at = NULL,
            locked_by = NULL,
            error = NULL
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
        SET retry_count = retry_count + 1,
            error = $1,
            locked_at = NULL,
            locked_by = NULL
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

#[cfg(test)]
mod tests {
    use super::OutboxEventType;

    #[test]
    fn serializes_search_upsert_payload_with_snake_case_tag() {
        let payload = serde_json::to_value(OutboxEventType::SearchIndexUpsert {
            slug: "rust-axum".to_string(),
        })
        .unwrap();

        assert_eq!(
            payload,
            serde_json::json!({
                "search_index_upsert": {
                    "slug": "rust-axum"
                }
            })
        );
    }

    #[test]
    fn serializes_rebuild_payload_as_string() {
        let payload = serde_json::to_value(OutboxEventType::SearchIndexRebuild).unwrap();

        assert_eq!(payload, serde_json::json!("search_index_rebuild"));
    }
}
