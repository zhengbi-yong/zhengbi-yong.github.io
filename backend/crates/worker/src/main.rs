//! Blog worker binary
//!
//! Background job processor for outbox events and async tasks.

use blog_api::outbox::{fetch_pending_events, mark_event_failed, mark_event_processed};
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

    // 初始化数据库连接池
    let db = sqlx::PgPool::connect(&settings.database_url).await?;
    tracing::info!("Database connection established");

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
    let mut ticker = interval(Duration::from_secs(5));

    tracing::info!("Worker ready, processing outbox events every 5 seconds...");

    loop {
        ticker.tick().await;

        if let Err(e) = process_outbox_events(&db, search_index.clone()).await {
            tracing::error!("Error processing outbox events: {}", e);
        }
    }
}

async fn process_outbox_events(
    db: &sqlx::PgPool,
    search_index: Arc<Option<SearchIndexService>>,
) -> anyhow::Result<()> {
    let events = fetch_pending_events(db, 100).await?;

    if events.is_empty() {
        return Ok(());
    }

    tracing::info!("Processing {} outbox events", events.len());

    for event in events {
        let result = match event.event_type.as_str() {
            "search_index_upsert" => {
                handle_search_index_upsert(db, search_index.clone(), &event.payload).await
            }
            "search_index_delete" => {
                handle_search_index_delete(db, search_index.clone(), &event.payload).await
            }
            _ => {
                tracing::warn!("Unknown event type: {}", event.event_type);
                Ok(())
            }
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
    payload: &serde_json::Value,
) -> anyhow::Result<()> {
    #[derive(serde::Deserialize)]
    struct UpsertPayload {
        #[serde(rename = "SearchIndexUpsert")]
        data: SearchIndexUpsertData,
    }

    #[derive(serde::Deserialize)]
    struct SearchIndexUpsertData {
        slug: String,
    }

    let payload: UpsertPayload = serde_json::from_value(payload.clone())?;
    let slug = payload.data.slug;

    if let Some(index) = search_index.as_ref() {
        index.sync_post_by_slug(db, &slug).await?;
        tracing::info!("Synced post {} to Meilisearch", slug);
    } else {
        tracing::debug!("Meilisearch not available, skipping sync for {}", slug);
    }

    Ok(())
}

async fn handle_search_index_delete(
    _db: &sqlx::PgPool,
    search_index: Arc<Option<SearchIndexService>>,
    payload: &serde_json::Value,
) -> anyhow::Result<()> {
    #[derive(serde::Deserialize)]
    struct DeletePayload {
        #[serde(rename = "SearchIndexDelete")]
        data: SearchIndexDeleteData,
    }

    #[derive(serde::Deserialize)]
    struct SearchIndexDeleteData {
        slug: String,
    }

    let payload: DeletePayload = serde_json::from_value(payload.clone())?;
    let slug = payload.data.slug;

    if let Some(index) = search_index.as_ref() {
        index.delete_post_by_slug(&slug).await?;
        tracing::info!("Deleted post {} from Meilisearch", slug);
    } else {
        tracing::debug!("Meilisearch not available, skipping delete for {}", slug);
    }

    Ok(())
}
