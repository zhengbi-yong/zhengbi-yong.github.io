use axum::{
    extract::{Query, State, Path},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
};
use blog_db::cms::*;
use blog_shared::AppError;
use crate::state::AppState;
use utoipa;
use serde::{Serialize, Deserialize};
use sqlx::{FromRow, Row};
use uuid::Uuid;

/// 全文搜索文章
#[utoipa::path(
    get,
    path = "/search",
    tag = "search",
    params(
        ("q" = String, Query, description = "搜索关键词"),
        ("category_slug" = Option<String>, Query, description = "分类slug筛选"),
        ("tag_slug" = Option<String>, Query, description = "标签slug筛选"),
        ("author_id" = Option<String>, Query, description = "作者ID筛选"),
        ("limit" = Option<u32>, Query, description = "返回数量（默认10，最大50）"),
        ("offset" = Option<u32>, Query, description = "偏移量（分页用）")
    ),
    responses(
        (status = 200, description = "搜索成功", body = SearchResponse),
        (status = 400, description = "请求参数错误")
    )
)]
pub async fn search_posts(
    State(state): State<AppState>,
    Query(params): Query<SearchRequest>,
) -> Result<impl IntoResponse, AppError> {
    if params.q.is_empty() {
        return Err(AppError::BadRequest("Search query cannot be empty".to_string()));
    }

    let limit = params.limit.unwrap_or(10).min(50);
    let offset = params.offset.unwrap_or(0);

    // 转义搜索词
    let escaped_query = params.q.replace('\'', "''").replace('\\', "\\\\");

    // 构建搜索查询
    let mut where_conditions = vec![
        "p.deleted_at IS NULL".to_string(),
        "p.status = 'published'".to_string(),
        format!("p.search_vector @@ plainto_tsquery('simple', '{}')", escaped_query),
    ];

    if let Some(category_slug) = &params.category_slug {
        where_conditions.push(format!("c.slug = '{}'", category_slug.replace('\'', "''")));
    }

    if let Some(tag_slug) = &params.tag_slug {
        where_conditions.push(format!("t.slug = '{}'", tag_slug.replace('\'', "''")));
    }

    if let Some(author_id) = &params.author_id {
        where_conditions.push(format!("p.author_id = '{}'", author_id));
    }

    let where_clause = where_conditions.join(" AND ");

    // 查询总数（用于统计）
    let count_query = format!(
        r#"
        SELECT COUNT(DISTINCT p.id)
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE {}
        "#,
        where_clause
    );
    let total: i64 = sqlx::query_scalar(&count_query)
        .fetch_one(&state.db)
        .await?;

    if total == 0 {
        return Ok((
            [(header::CACHE_CONTROL, "public, s-maxage=60, stale-while-revalidate=300")],
            Json(SearchResponse {
                results: vec![],
                total: 0,
                query: params.q.clone(),
            }),
        ).into_response());
    }

    // 执行搜索查询（使用 ts_rank 排序）
    let search_query = format!(
        r#"
        SELECT
            p.id, p.slug, p.title, p.summary, p.published_at,
            ts_rank(p.search_vector, plainto_tsquery('simple', '{}')) as rank
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE {}
        GROUP BY p.id, p.search_vector
        ORDER BY rank DESC, p.published_at DESC
        LIMIT {} OFFSET {}
        "#,
        escaped_query, where_clause, limit, offset
    );

    let rows = sqlx::query(&search_query)
        .fetch_all(&state.db)
        .await?;

    let mut results = Vec::new();
    for row in rows {
        let id: Uuid = row.try_get("id")?;
        let slug: String = row.try_get("slug")?;
        let title: String = row.try_get("title")?;
        let summary: Option<String> = row.try_get("summary")?;
        let published_at: Option<chrono::DateTime<chrono::Utc>> = row.try_get("published_at")?;
        let rank: f32 = row.try_get("rank")?;

        results.push(SearchResult {
            id,
            slug,
            title,
            summary,
            published_at,
            rank,
        });
    }

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=60, stale-while-revalidate=300")],
        Json(SearchResponse {
            results,
            total,
            query: params.q,
        }),
    ).into_response())
}

/// 搜索建议（自动补全）
#[utoipa::path(
    get,
    path = "/search/suggest",
    tag = "search",
    params(
        ("q" = String, Query, description = "搜索关键词"),
        ("limit" = Option<u32>, Query, description = "返回数量（默认5，最大10）")
    ),
    responses(
        (status = 200, description = "获取成功", body = Vec<String>),
        (status = 400, description = "请求参数错误")
    )
)]
pub async fn search_suggest(
    State(state): State<AppState>,
    Query(params): Query<SuggestParams>,
) -> Result<impl IntoResponse, AppError> {
    if params.q.len() < 2 {
        return Ok(Json::<Vec<SearchResult>>(vec![]).into_response());
    }

    let limit = params.limit.unwrap_or(5).min(10);
    let search_term = format!("{}%", params.q.replace('\'', "''"));

    // 搜索标题匹配的文章
    let suggestions: Vec<String> = sqlx::query_scalar(
        r#"
        SELECT DISTINCT title
        FROM posts
        WHERE title ILIKE $1
            AND status = 'published'
            AND deleted_at IS NULL
        ORDER BY view_count DESC
        LIMIT $2
        "#
    )
    .bind(search_term)
    .bind(limit as i64)
    .fetch_all(&state.db)
    .await?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(suggestions),
    ).into_response())
}

/// 热门搜索关键词
#[utoipa::path(
    get,
    path = "/search/trending",
    tag = "search",
    responses(
        (status = 200, description = "获取成功", body = Vec<TrendingKeyword>)
    )
)]
pub async fn get_trending_keywords(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    // 尝试从缓存获取
    let cache_key = "search:trending";

    let mut conn = state.redis.get().await
        .map_err(|_| AppError::InternalError)?;

    if let Ok(cached) = redis::cmd("GET")
        .arg(cache_key)
        .query_async::<Option<String>>(&mut conn)
        .await
    {
        if let Some(cached_str) = cached {
            if let Ok(keywords) = serde_json::from_str::<Vec<TrendingKeyword>>(&cached_str) {
                return Ok((
                    [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
                    Json(keywords),
                ).into_response());
            }
        }
    }

    // 从数据库获取最近 7 天浏览量最高的文章的标题词
    let keywords: Vec<TrendingKeyword> = sqlx::query_as!(
        TrendingKeyword,
        r#"
        SELECT
            COALESCE(split_part(title, ' ', 1), '') as "keyword!",
            SUM(view_count)::BIGINT as "count!"
        FROM posts
        WHERE
            published_at > NOW() - INTERVAL '7 days'
            AND status = 'published'
            AND deleted_at IS NULL
            AND title IS NOT NULL
        GROUP BY COALESCE(split_part(title, ' ', 1), '')
        ORDER BY "count!" DESC
        LIMIT 20
        "#
    )
    .fetch_all(&state.db)
    .await?;

    // 缓存 10 分钟
    if let Ok(json) = serde_json::to_string(&keywords) {
        let _: () = redis::cmd("SETEX")
            .arg(cache_key)
            .arg(600)
            .arg(&json)
            .query_async(&mut conn)
            .await?;
    }

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(keywords),
    ).into_response())
}

/// 相关文章推荐
#[utoipa::path(
    get,
    path = "/posts/{slug}/related",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug"),
        ("limit" = Option<u32>, Query, description = "返回数量（默认5，最大10）")
    ),
    responses(
        (status = 200, description = "获取成功", body = Vec<RelatedPost>),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn get_related_posts(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(params): Query<RelatedParams>,
) -> Result<impl IntoResponse, AppError> {
    // 获取当前文章的分类和标签
    let post_info = sqlx::query!(
        r#"
        SELECT
            p.id,
            p.category_id,
            p.title,
            ARRAY_AGG(DISTINCT t.id) FILTER (WHERE t.id IS NOT NULL) as tag_ids
        FROM posts p
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.slug = $1 AND p.deleted_at IS NULL
        GROUP BY p.id
        "#,
        slug
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::PostNotFound)?;

    let limit = params.limit.unwrap_or(5).min(10);

    // 查找相关文章（同分类或有相同标签）
    let related_posts: Vec<RelatedPost> = sqlx::query_as!(
        RelatedPost,
        r#"
        SELECT
            p.slug,
            p.title,
            p.summary,
            p.published_at,
            p.view_count,
            m.cdn_url as "cover_image_url?"
        FROM posts p
        LEFT JOIN media m ON p.cover_image_id = m.id
        WHERE
            p.id != $1
            AND p.status = 'published'
            AND p.deleted_at IS NULL
            AND (
                p.category_id = $2
                OR EXISTS (
                    SELECT 1 FROM post_tags pt
                    WHERE pt.post_id = p.id
                    AND pt.tag_id = ANY($3)
                )
            )
        ORDER BY
            p.view_count DESC,
            p.published_at DESC
        LIMIT $4
        "#,
        post_info.id,
        post_info.category_id,
        &post_info.tag_ids.unwrap_or_default(),
        limit as i64
    )
    .fetch_all(&state.db)
    .await?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(related_posts),
    ).into_response())
}

// ===== 辅助结构体 =====

#[derive(serde::Deserialize)]
pub struct SuggestParams {
    pub q: String,
    pub limit: Option<u32>,
}

#[derive(serde::Deserialize)]
pub struct RelatedParams {
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct TrendingKeyword {
    pub keyword: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, utoipa::ToSchema)]
pub struct RelatedPost {
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub published_at: Option<chrono::DateTime<chrono::Utc>>,
    pub view_count: i64,
    pub cover_image_url: Option<String>,
}

// NOTE: Cannot implement IntoResponse for Vec<RelatedPost> due to orphan rule
// Instead, manually add cache headers in the handler function
