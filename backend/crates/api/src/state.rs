use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub db_read: sqlx::PgPool,
    pub redis: deadpool_redis::Pool,
    pub jwt: blog_core::JwtService,
    pub settings: blog_shared::Settings,
    pub email_service: blog_core::email::EmailService,
    pub metrics: Arc<tokio::sync::RwLock<crate::metrics::Metrics>>,
    pub search_index: Option<Arc<crate::search_index::SearchIndexService>>,
    pub storage: Arc<crate::storage::StorageService>,
}
