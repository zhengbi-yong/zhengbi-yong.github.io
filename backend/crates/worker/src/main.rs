//! Blog worker binary
//!
//! Background job processor for outbox events and async tasks.

use blog_api::outbox::{
    claim_pending_events, mark_event_failed, mark_event_processed, OutboxEventType,
};
use blog_api::runtime::{create_postgres_pool, shutdown_signal, verify_migrations};
use blog_api::search_index::SearchIndexService;
use blog_shared::Settings;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::interval;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 加载 .env 文件
    if let Err(e) = dotenv::dotenv() {
        eprintln!("⚠️  无法加载 .env 文件: {}. 将使用系统环境变量。", e);
    }

    // 初始化日志
    tracing_subscriber::fmt::init();

    tracing::info!("Starting Blog Worker...");

    // 加载配置
    let settings = Settings::from_env()?;
    let worker_id = format!("worker-{}-{}", std::process::id(), uuid::Uuid::new_v4());

    // 初始化数据库连接池
    let db = create_postgres_pool(&settings.database_url, &settings.database_pool).await?;
    tracing::info!(
        max_connections = settings.database_pool.max_connections,
        min_connections = settings.database_pool.min_connections,
        "Database connection pool established"
    );
    verify_migrations(&db).await?;
    tracing::info!("Database migrations verified");

    // 可选：初始化 Meilisearch 服务
    let search_index: Option<SearchIndexService> =
        if let Some(meilisearch_config) = &settings.meilisearch {
            match SearchIndexService::new(meilisearch_config).await {
                Ok(service) => {
                    tracing::info!("Meilisearch service initialized");
                    Some(service)
                }
                Err(e) => {
                    tracing::warn!(
                        "Failed to initialize Meilisearch: {}. Continuing without search indexing.",
                        e
                    );
                    None
                }
            }
        } else {
            tracing::info!("Meilisearch not configured, skipping search indexing");
            None
        };

    let search_index = Arc::new(search_index);

    // 启动 outbox 事件处理器
    let mut ticker = interval(Duration::from_secs(settings.worker.poll_interval_secs));

    tracing::info!(
        poll_interval_secs = settings.worker.poll_interval_secs,
        batch_size = settings.worker.batch_size,
        lock_timeout_secs = settings.worker.lock_timeout_secs,
        "Worker ready"
    );
    let shutdown = shutdown_signal("worker");
    tokio::pin!(shutdown);

    loop {
        tokio::select! {
            _ = ticker.tick() => {
                if let Err(e) = process_outbox_events(
                    &db,
                    &worker_id,
                    i64::from(settings.worker.batch_size),
                    settings.worker.lock_timeout_secs,
                    search_index.clone(),
                ).await {
                    tracing::error!("Error processing outbox events: {}", e);
                }
            }
            _ = &mut shutdown => {
                tracing::info!("Worker shutdown complete");
                break;
            }
        }
    }

    Ok(())
}

async fn process_outbox_events(
    db: &sqlx::PgPool,
    worker_id: &str,
    batch_size: i64,
    lock_timeout_secs: i32,
    search_index: Arc<Option<SearchIndexService>>,
) -> anyhow::Result<()> {
    let events = claim_pending_events(db, worker_id, batch_size, lock_timeout_secs).await?;

    if events.is_empty() {
        return Ok(());
    }

    tracing::info!("Processing {} outbox events", events.len());

    for event in events {
        let result = match serde_json::from_value::<OutboxEventType>(event.payload.clone()) {
            Ok(OutboxEventType::SearchIndexUpsert { slug }) => {
                handle_search_index_upsert(db, search_index.clone(), &slug).await
            }
            Ok(OutboxEventType::SearchIndexDelete { slug }) => {
                handle_search_index_delete(search_index.clone(), &slug).await
            }
            Ok(OutboxEventType::SearchIndexRebuild) => {
                handle_search_index_rebuild(db, search_index.clone()).await
            }
            Ok(OutboxEventType::PostViewed { slug, increment }) => {
                handle_post_viewed(db, &slug, increment).await
            }
            Ok(other) => {
                tracing::warn!(
                    event_type = %event.event_type,
                    payload = %event.payload,
                    "Unhandled outbox event: {:?}",
                    other
                );
                Ok(())
            }
            Err(error) => Err(error.into()),
        };

        match result {
            Ok(()) => {
                mark_event_processed(db, event.id).await?;
                tracing::debug!("Event {} processed successfully", event.id);
            }
            Err(e) => {
                let error_msg = format!("{}", e);
                mark_event_failed(db, event.id, &error_msg).await?;
                tracing::error!("Event {} failed: {}", event.id, error_msg);
            }
        }
    }

    Ok(())
}

async fn handle_search_index_upsert(
    db: &sqlx::PgPool,
    search_index: Arc<Option<SearchIndexService>>,
    slug: &str,
) -> anyhow::Result<()> {
    if let Some(index) = search_index.as_ref() {
        index.sync_post_by_slug(db, slug).await?;
        tracing::info!("Synced post {} to Meilisearch", slug);
    } else {
        tracing::debug!("Meilisearch not available, skipping sync for {}", slug);
    }

    Ok(())
}

async fn handle_search_index_delete(
    search_index: Arc<Option<SearchIndexService>>,
    slug: &str,
) -> anyhow::Result<()> {
    if let Some(index) = search_index.as_ref() {
        index.delete_post_by_slug(slug).await?;
        tracing::info!("Deleted post {} from Meilisearch", slug);
    } else {
        tracing::debug!("Meilisearch not available, skipping delete for {}", slug);
    }

    Ok(())
}

async fn handle_search_index_rebuild(
    db: &sqlx::PgPool,
    search_index: Arc<Option<SearchIndexService>>,
) -> anyhow::Result<()> {
    if let Some(index) = search_index.as_ref() {
        let indexed_documents = index.sync_all(db).await?;
        tracing::info!(
            "Rebuilt Meilisearch index with {} documents",
            indexed_documents
        );
    } else {
        tracing::debug!("Meilisearch not available, skipping full rebuild");
    }

    Ok(())
}

async fn handle_post_viewed(db: &sqlx::PgPool, slug: &str, increment: i64) -> anyhow::Result<()> {
    sqlx::query(
        r#"
        UPDATE post_stats
        SET view_count = view_count + $1,
            updated_at = NOW()
        WHERE slug = $2
        "#,
    )
    .bind(increment)
    .bind(slug)
    .execute(db)
    .await?;

    tracing::info!("Applied {} batched views to {}", increment, slug);
    Ok(())
}
