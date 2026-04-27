//! Articles API — 双轨存储（content_json + content_mdx）
//!
//! 写入侧: content_json (TipTap JSON AST) — Single Source of Truth
//! 读取侧: content_mdx (MDX text) — SSR 直读缓存
//!
//! 注意：本模块不导出 router()，所有 handler 直接由 main.rs 的 articles_routes() 调用。

use crate::state::AppState;
use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use blog_core::tiptap_json_to_mdx;
use blog_db::cms::{
    Article, ArticleVersion, CreateArticleRequest, CreateArticleVersionRequest,
    UpdateArticleRequest,
};
use blog_shared::{AppError, AuthUser};
use serde::Deserialize;
use uuid::Uuid;

#[derive(serde::Serialize)]
pub struct IdResponse {
    pub id: Uuid,
}

#[derive(serde::Serialize)]
pub struct CreateArticleResponse {
    pub id: Uuid,
    pub slug: String,
}

#[derive(serde::Serialize)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct ListArticlesQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub status: Option<String>,
}

pub async fn list_articles(
    State(state): State<AppState>,
    Query(q): Query<ListArticlesQuery>,
) -> Result<impl IntoResponse, AppError> {
    let page = q.page.unwrap_or(1).max(1);
    let limit = q.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    let articles: Vec<Article> = sqlx::query_as::<_, Article>(
        r#"
        SELECT id, title, slug, summary, cover_image_url,
               content_json, content_mdx, mdx_compiled_at,
               author_id, status, tags, layout,
               is_featured, view_count, word_count,
               published_at, created_at, updated_at
        FROM articles
        WHERE deleted_at IS NULL
        ORDER BY published_at DESC NULLS LAST
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(limit as i32)
    .bind(offset as i32)
    .fetch_all(&state.db)
    .await?;

    let total: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL")
            .fetch_one(&state.db)
            .await?;

    Ok(Json(serde_json::json!({
        "articles": articles,
        "total": total,
        "page": page,
        "limit": limit,
    })))
}

pub async fn get_article(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let article: Article = sqlx::query_as::<_, Article>(
        r#"
        SELECT id, title, slug, summary, cover_image_url,
               content_json, content_mdx, mdx_compiled_at,
               author_id, status, tags, layout,
               is_featured, view_count, word_count,
               published_at, created_at, updated_at
        FROM articles
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Article not found".to_string()))?;

    Ok(Json(article))
}

pub async fn create_article(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<CreateArticleRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 检查 slug 是否已存在
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM articles WHERE slug = $1)")
            .bind(&req.slug)
            .fetch_one(&state.db)
            .await?;

    if exists {
        return Err(AppError::Conflict("Slug already exists".to_string()));
    }

    // 双轨写入
    let content_mdx = req
        .content_mdx
        .clone()
        .unwrap_or_else(|| tiptap_json_to_mdx(&req.content_json));

    let status = req.status.unwrap_or_else(|| "draft".to_string());
    let layout = req.layout.unwrap_or_else(|| "standard".to_string());
    let is_featured = req.is_featured.unwrap_or(false);

    let article: Article = sqlx::query_as::<_, Article>(
        r#"
        INSERT INTO articles (
            title, slug, summary, cover_image_url,
            content_json, content_mdx, mdx_compiled_at,
            author_id, status, tags, layout,
            is_featured, view_count, word_count, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, 0, 0, $12)
        RETURNING
            id, title, slug, summary, cover_image_url,
            content_json, content_mdx, mdx_compiled_at,
            author_id, status, tags, layout,
            is_featured, view_count, word_count,
            published_at, created_at, updated_at
        "#,
    )
    .bind(&req.title)
    .bind(&req.slug)
    .bind(&req.summary)
    .bind(&req.cover_image_url)
    .bind(&req.content_json)
    .bind(&content_mdx)
    .bind(&auth_user.id)
    .bind(&status)
    .bind(&req.tags)
    .bind(&layout)
    .bind(is_featured)
    .bind(&req.published_at)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(CreateArticleResponse { id: article.id, slug: article.slug })))
}

pub async fn update_article(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateArticleRequest>,
) -> Result<impl IntoResponse, AppError> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM articles WHERE id = $1 AND deleted_at IS NULL)",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Article not found".to_string()));
    }

    // 双轨更新逻辑：content_mdx 从 content_json 派生或直接使用传入值
    let content_mdx: String = match (&req.content_json, &req.content_mdx) {
        (Some(_json), Some(mdx)) => mdx.clone(),
        (Some(json), None) => tiptap_json_to_mdx(json),
        (None, Some(mdx)) => mdx.clone(),
        (None, None) => return Err(AppError::BadRequest("No content provided".to_string())),
    };

    // 动态构建 UPDATE（避免 Option<T> 绑定到 non-Option 列）
    let mut updates = Vec::new();
    let mut param_idx: i32 = 1;

    if req.title.is_some() {
        updates.push(format!("title = ${}", param_idx));
        param_idx += 1;
    }
    if req.summary.is_some() {
        updates.push(format!("summary = ${}", param_idx));
        param_idx += 1;
    }
    if req.cover_image_url.is_some() {
        updates.push(format!("cover_image_url = ${}", param_idx));
        param_idx += 1;
    }
    if req.content_json.is_some() {
        updates.push(format!("content_json = ${}", param_idx));
        param_idx += 1;
    }
    if req.content_mdx.is_some() || req.content_json.is_some() {
        updates.push(format!("content_mdx = ${}", param_idx));
        param_idx += 1;
        updates.push("mdx_compiled_at = NOW()".to_string());
    }
    if req.status.is_some() {
        updates.push(format!("status = ${}", param_idx));
        param_idx += 1;
    }
    if req.tags.is_some() {
        updates.push(format!("tags = ${}", param_idx));
        param_idx += 1;
    }
    if req.layout.is_some() {
        updates.push(format!("layout = ${}", param_idx));
        param_idx += 1;
    }
    if req.is_featured.is_some() {
        updates.push(format!("is_featured = ${}", param_idx));
        param_idx += 1;
    }
    if req.published_at.is_some() {
        updates.push(format!("published_at = ${}", param_idx));
        param_idx += 1;
    }
    updates.push("updated_at = NOW()".to_string());

    let set_clause = updates.join(", ");
    let query_str = format!(
        "UPDATE articles SET {} WHERE id = ${} AND deleted_at IS NULL",
        set_clause,
        param_idx
    );

    // 构建参数
    let mut q = sqlx::query(&query_str);
    if let Some(ref v) = req.title {
        q = q.bind(v);
    }
    if let Some(ref v) = req.summary {
        q = q.bind(v);
    }
    if let Some(ref v) = req.cover_image_url {
        q = q.bind(v);
    }
    if let Some(ref v) = req.content_json {
        q = q.bind(v);
    }
    if req.content_mdx.is_some() || req.content_json.is_some() {
        q = q.bind(&content_mdx);
    }
    if let Some(ref v) = req.status {
        q = q.bind(v);
    }
    if let Some(ref v) = req.tags {
        q = q.bind(v);
    }
    if let Some(ref v) = req.layout {
        q = q.bind(v);
    }
    if let Some(v) = req.is_featured {
        q = q.bind(v);
    }
    if let Some(ref v) = req.published_at {
        q = q.bind(v);
    }
    q = q.bind(id);
    q.execute(&state.db).await?;

    Ok(Json(IdResponse { id }))
}

pub async fn delete_article(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let affected =
        sqlx::query!("DELETE FROM articles WHERE id = $1 AND deleted_at IS NULL", id)
            .execute(&state.db)
            .await?
            .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Article not found".to_string()));
    }

    Ok(Json(MessageResponse {
        message: "Article deleted".to_string(),
    }))
}

pub async fn list_article_versions(
    State(state): State<AppState>,
    Path(article_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let versions: Vec<ArticleVersion> = sqlx::query_as::<_, ArticleVersion>(
        r#"
        SELECT id, article_id, version_number, content_json,
               title, editor_id, change_summary, created_at
        FROM article_versions
        WHERE article_id = $1
        ORDER BY version_number DESC
        "#,
    )
    .bind(article_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(versions))
}

pub async fn create_article_version(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(article_id): Path<Uuid>,
    Json(req): Json<CreateArticleVersionRequest>,
) -> Result<impl IntoResponse, AppError> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM articles WHERE id = $1 AND deleted_at IS NULL)",
    )
    .bind(article_id)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Article not found".to_string()));
    }

    let max_version: Option<i32> = sqlx::query_scalar(
        "SELECT MAX(version_number) FROM article_versions WHERE article_id = $1",
    )
    .bind(article_id)
    .fetch_one(&state.db)
    .await?;

    let new_version = max_version.unwrap_or(0) + 1;

    let version: ArticleVersion = sqlx::query_as::<_, ArticleVersion>(
        r#"
        INSERT INTO article_versions (article_id, version_number, content_json, title, editor_id, change_summary)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, article_id, version_number, content_json, title, editor_id, change_summary, created_at
        "#,
    )
    .bind(article_id)
    .bind(new_version)
    .bind(&req.content_json)
    .bind(&req.title)
    .bind(&auth_user.id)
    .bind(&req.change_summary)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(version)))
}
