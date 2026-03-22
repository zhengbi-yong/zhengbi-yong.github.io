use anyhow::Context;
use chrono::{DateTime, Utc};
use meilisearch_sdk::{client::Client, indexes::Index, task_info::TaskInfo};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};

#[derive(Clone)]
pub struct SearchIndexService {
    client: Client,
    index: Index,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchDocument {
    pub slug: String,
    pub id: String,
    pub title: String,
    pub summary: Option<String>,
    pub content: String,
    pub category_slug: Option<String>,
    pub category_name: Option<String>,
    pub tags: Vec<String>,
    pub published_at: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone)]
pub struct SearchOptions {
    pub query: String,
    pub category_slug: Option<String>,
    pub tag_slug: Option<String>,
    pub limit: usize,
    pub offset: usize,
}

#[derive(Debug, Clone)]
pub struct SearchHit {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub category_slug: Option<String>,
    pub category_name: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct SearchIndexResponse {
    pub hits: Vec<SearchHit>,
    pub total: usize,
}

impl SearchHit {
    fn from_document(document: SearchDocument) -> Self {
        let published_at = document
            .published_at
            .as_deref()
            .and_then(|value| DateTime::parse_from_rfc3339(value).ok())
            .map(|value| value.with_timezone(&Utc));

        Self {
            id: document.id,
            slug: document.slug,
            title: document.title,
            summary: document.summary,
            published_at,
            category_slug: document.category_slug,
            category_name: document.category_name,
            tags: document.tags,
        }
    }
}

impl SearchIndexService {
    pub async fn new(config: &blog_shared::MeilisearchConfig) -> anyhow::Result<Self> {
        let client = Client::new(&config.url, Some(&config.master_key))
            .with_context(|| format!("failed to create Meilisearch client for {}", config.url))?;
        let index = client.index(&config.index_name);

        let service = Self { client, index };
        service.ensure_index().await?;
        service.configure().await?;

        Ok(service)
    }

    pub async fn sync_all(&self, db: &PgPool) -> anyhow::Result<usize> {
        let documents = fetch_all_documents(db).await?;
        self.rebuild_index(&documents).await?;
        Ok(documents.len())
    }

    pub async fn sync_post_by_slug(&self, db: &PgPool, slug: &str) -> anyhow::Result<()> {
        match fetch_document_by_slug(db, slug).await? {
            Some(document) => {
                let task = self.index.add_documents(&[document], Some("slug")).await?;
                self.wait_for_task(task).await?;
            }
            None => {
                self.delete_post_by_slug(slug).await?;
            }
        }

        Ok(())
    }

    pub async fn delete_post_by_slug(&self, slug: &str) -> anyhow::Result<()> {
        let task = self.index.delete_document(slug).await?;
        self.wait_for_task(task).await?;
        Ok(())
    }

    pub async fn search(&self, options: &SearchOptions) -> anyhow::Result<SearchIndexResponse> {
        let mut query = self.index.search();
        query.with_query(&options.query);
        query.with_limit(options.limit);
        query.with_offset(options.offset);

        let filter = build_filter(
            options.category_slug.as_deref(),
            options.tag_slug.as_deref(),
        );

        if let Some(ref filter) = filter {
            query.with_filter(filter);
        }

        let response = query.execute::<SearchDocument>().await?;
        let hits = response
            .hits
            .into_iter()
            .map(|hit| SearchHit::from_document(hit.result))
            .collect();

        Ok(SearchIndexResponse {
            hits,
            total: response.estimated_total_hits.unwrap_or(0),
        })
    }

    pub async fn suggest_titles(
        &self,
        query_text: &str,
        limit: usize,
    ) -> anyhow::Result<Vec<String>> {
        let response = self
            .index
            .search()
            .with_query(query_text)
            .with_limit(limit)
            .execute::<SearchDocument>()
            .await?;

        let mut seen = std::collections::HashSet::new();
        let mut titles = Vec::new();

        for hit in response.hits {
            if seen.insert(hit.result.title.clone()) {
                titles.push(hit.result.title);
            }
        }

        Ok(titles)
    }

    async fn ensure_index(&self) -> anyhow::Result<()> {
        if self.index.get_stats().await.is_ok() {
            return Ok(());
        }

        let task = self
            .client
            .create_index(&self.index.uid, Some("slug"))
            .await?;
        self.wait_for_task(task).await?;
        Ok(())
    }

    async fn configure(&self) -> anyhow::Result<()> {
        let filterable_task = self
            .index
            .set_filterable_attributes(&["category_slug", "tags"])
            .await?;
        self.wait_for_task(filterable_task).await?;

        let searchable_task = self
            .index
            .set_searchable_attributes(&["title", "summary", "content", "tags", "category_name"])
            .await?;
        self.wait_for_task(searchable_task).await?;

        let sortable_task = self
            .index
            .set_sortable_attributes(&["published_at"])
            .await?;
        self.wait_for_task(sortable_task).await?;

        Ok(())
    }

    async fn rebuild_index(&self, documents: &[SearchDocument]) -> anyhow::Result<()> {
        let delete_task = self.index.delete_all_documents().await?;
        self.wait_for_task(delete_task).await?;

        if documents.is_empty() {
            return Ok(());
        }

        let add_task = self.index.add_documents(documents, Some("slug")).await?;
        self.wait_for_task(add_task).await?;

        Ok(())
    }

    async fn wait_for_task(&self, task: TaskInfo) -> anyhow::Result<()> {
        task.wait_for_completion(&self.client, None, None).await?;
        Ok(())
    }
}

fn build_filter(category_slug: Option<&str>, tag_slug: Option<&str>) -> Option<String> {
    let mut filters = Vec::new();

    if let Some(category_slug) = category_slug {
        filters.push(format!("category_slug = {}", quoted(category_slug)));
    }

    if let Some(tag_slug) = tag_slug {
        filters.push(format!("tags = {}", quoted(tag_slug)));
    }

    if filters.is_empty() {
        None
    } else {
        Some(filters.join(" AND "))
    }
}

fn quoted(value: &str) -> String {
    serde_json::to_string(value).unwrap_or_else(|_| "\"\"".to_string())
}

async fn fetch_all_documents(db: &PgPool) -> anyhow::Result<Vec<SearchDocument>> {
    let rows = sqlx::query(
        r#"
        SELECT
            p.id,
            p.slug,
            p.title,
            p.summary,
            p.content,
            p.published_at,
            p.updated_at,
            c.slug AS category_slug,
            c.name AS category_name,
            COALESCE(
                ARRAY_AGG(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL),
                ARRAY[]::TEXT[]
            ) AS tags
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE
            p.deleted_at IS NULL
            AND p.status = 'published'
        GROUP BY p.id, c.slug, c.name
        ORDER BY p.published_at DESC NULLS LAST, p.updated_at DESC
        "#,
    )
    .fetch_all(db)
    .await?;

    Ok(rows
        .into_iter()
        .map(row_to_document)
        .collect::<anyhow::Result<_>>()?)
}

async fn fetch_document_by_slug(db: &PgPool, slug: &str) -> anyhow::Result<Option<SearchDocument>> {
    let row = sqlx::query(
        r#"
        SELECT
            p.id,
            p.slug,
            p.title,
            p.summary,
            p.content,
            p.published_at,
            p.updated_at,
            c.slug AS category_slug,
            c.name AS category_name,
            COALESCE(
                ARRAY_AGG(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL),
                ARRAY[]::TEXT[]
            ) AS tags
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE
            p.slug = $1
            AND p.deleted_at IS NULL
            AND p.status = 'published'
        GROUP BY p.id, c.slug, c.name
        "#,
    )
    .bind(slug)
    .fetch_optional(db)
    .await?;

    row.map(row_to_document).transpose()
}

fn row_to_document(row: sqlx::postgres::PgRow) -> anyhow::Result<SearchDocument> {
    let published_at = row
        .try_get::<Option<DateTime<Utc>>, _>("published_at")?
        .map(|value| value.to_rfc3339());

    let updated_at = row.try_get::<DateTime<Utc>, _>("updated_at")?.to_rfc3339();

    Ok(SearchDocument {
        slug: row.try_get("slug")?,
        id: row.try_get::<uuid::Uuid, _>("id")?.to_string(),
        title: row.try_get("title")?,
        summary: row.try_get("summary")?,
        content: row.try_get("content")?,
        category_slug: row.try_get("category_slug")?,
        category_name: row.try_get("category_name")?,
        tags: row.try_get::<Vec<String>, _>("tags").unwrap_or_default(),
        published_at,
        updated_at,
    })
}

#[cfg(test)]
mod tests {
    use super::build_filter;

    #[test]
    fn builds_compound_filter() {
        let filter = build_filter(Some("rust"), Some("axum"));
        assert_eq!(
            filter.as_deref(),
            Some("category_slug = \"rust\" AND tags = \"axum\"")
        );
    }

    #[test]
    fn omits_missing_filter_parts() {
        assert_eq!(build_filter(None, None), None);
        assert_eq!(
            build_filter(Some("notes"), None).as_deref(),
            Some("category_slug = \"notes\"")
        );
    }
}
