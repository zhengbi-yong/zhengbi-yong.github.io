use crate::state::AppState;
use axum::{
    extract::{Query, State},
    http::header,
    response::{IntoResponse, Json},
};
use blog_shared::AppError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use utoipa;

/// 优化后的搜索请求参数
#[derive(Debug, Deserialize, utoipa::IntoParams)]
pub struct OptimizedSearchRequest {
    /// 搜索关键词
    #[param()]
    pub q: String,

    /// 分类筛选
    #[param()]
    pub category: Option<String>,

    /// 标签筛选（多个标签用逗号分隔）
    #[param()]
    pub tags: Option<String>,

    /// 返回数量限制
    #[param()]
    pub limit: Option<u32>,

    /// 偏移量
    #[param()]
    pub offset: Option<u32>,
}

/// 优化后的搜索结果（带高亮）
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct OptimizedSearchResult {
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    /// 高亮的标题
    pub title_highlight: String,
    /// 高亮的摘要
    pub summary_highlight: String,
    /// 内容预览
    pub content_preview: String,
    /// 相关性分数
    pub rank: f64,
    pub category: String,
    pub tags: Vec<String>,
}

/// 搜索响应（带高亮）
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct OptimizedSearchResponse {
    pub results: Vec<OptimizedSearchResult>,
    pub total: i64,
    pub query: String,
    pub took_ms: u64, // 搜索耗时（毫秒）
}

/// 全文搜索文章（优化版，带高亮）
#[utoipa::path(
    get,
    path = "/v1/search",
    tag = "search",
    params(
        OptimizedSearchRequest
    ),
    responses(
        (status = 200, description = "搜索成功", body = OptimizedSearchResponse),
        (status = 400, description = "请求参数错误")
    )
)]
pub async fn search_posts_optimized(
    State(state): State<AppState>,
    Query(params): Query<OptimizedSearchRequest>,
) -> Result<impl IntoResponse, AppError> {
    let start = std::time::Instant::now();

    if params.q.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Search query cannot be empty".to_string(),
        ));
    }

    let limit = params.limit.unwrap_or(20).min(50);
    let offset = params.offset.unwrap_or(0);

    // 解析标签筛选
    let filter_tags: Option<Vec<String>> = params.tags.as_ref().map(|tags| {
        tags.split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect()
    });

    // 转义搜索词以防止SQL注入
    let escaped_query = params.q.replace('\'', "''").replace('\\', "\\\\");
    let escaped_category = params.category.as_ref().map(|c| c.replace('\'', "''"));

    // 使用数据库函数进行全文搜索（带高亮）
    let search_query = r#"
        SELECT * FROM search_posts_with_highlights(
            $1::text,
            $2::integer,
            $3::integer
        )
        "#
    .to_string();

    let rows = sqlx::query(&search_query)
        .bind(&escaped_query)
        .bind(limit as i64)
        .bind(offset as i64)
        .bind(escaped_category.as_deref())
        .bind(filter_tags)
        .fetch_all(&state.db)
        .await?;

    let mut results = Vec::new();
    for row in rows {
        results.push(OptimizedSearchResult {
            slug: row.try_get("slug")?,
            title: row.try_get("title")?,
            summary: row.try_get("summary").inspect_err(|e| tracing::warn!("search: failed to get summary: {}", e)).ok(),
            title_highlight: row.try_get("title_highlight")?,
            summary_highlight: row.try_get("summary_highlight")?,
            content_preview: row.try_get("content_preview")?,
            rank: row.try_get("rank")?,
            category: row.try_get("category")?,
            tags: row.try_get::<Vec<String>, _>("tags").unwrap_or_default(),
        });
    }

    // 获取总数（需要单独查询）
    let count_query = r#"
        SELECT COUNT(*) as count
        FROM posts p
        WHERE p.search_vector @@ plainto_tsquery('simple', $1)
        AND p.draft = false
    "#;

    let total: i64 = if let Some(category) = &escaped_category {
        sqlx::query_scalar(&format!("{} AND p.category = '{}'", count_query, category))
            .bind(&escaped_query)
            .fetch_one(&state.db)
            .await?
    } else {
        sqlx::query_scalar(count_query)
            .bind(&escaped_query)
            .fetch_one(&state.db)
            .await?
    };

    // 记录搜索关键词（异步，不阻塞响应）
    let state_clone = state.clone();
    let query_clone = params.q.clone();
    let results_count = results.len() as i32;
    tokio::spawn(async move {
        if let Err(e) = record_search_keyword(&state_clone, &query_clone, results_count).await {
            tracing::warn!("Failed to record search keyword: {}", e);
        }
    });

    let took_ms = start.elapsed().as_millis() as u64;

    Ok((
        [(
            header::CACHE_CONTROL,
            "public, s-maxage=60, stale-while-revalidate=300",
        )],
        Json(OptimizedSearchResponse {
            results,
            total,
            query: params.q,
            took_ms,
        }),
    )
        .into_response())
}

/// 搜索建议（优化版，使用模糊搜索）
#[utoipa::path(
    get,
    path = "/v1/search/suggest",
    tag = "search",
    params(
        ("q" = String, Query, description = "搜索关键词"),
        ("limit" = Option<u32>, Query, description = "返回数量（默认5，最大10）")
    ),
    responses(
        (status = 200, description = "获取成功", body = Vec<SearchSuggestion>),
        (status = 400, description = "请求参数错误")
    )
)]
pub async fn search_suggest_optimized(
    State(state): State<AppState>,
    Query(params): Query<SuggestParams>,
) -> Result<impl IntoResponse, AppError> {
    if params.q.len() < 2 {
        return Ok(Json::<Vec<SearchSuggestion>>(vec![]).into_response());
    }

    let limit = params.limit.unwrap_or(5).min(10);
    let escaped_query = params.q.replace('\'', "''");

    // 使用数据库的模糊搜索函数
    let suggestions = sqlx::query(
        r#"
        SELECT
            slug,
            title,
            category,
            similarity_score
        FROM fuzzy_search_suggestions($1::text, $2::integer)
        "#,
    )
    .bind(&escaped_query)
    .bind(limit as i64)
    .fetch_all(&state.db)
    .await?;

    let mut results = Vec::new();
    for row in suggestions {
        results.push(SearchSuggestion {
            title: row.try_get("title")?,
            category: row.try_get("category")?,
            score: row.try_get("similarity_score")?,
        });
    }

    Ok((
        [(
            header::CACHE_CONTROL,
            "public, s-maxage=300, stale-while-revalidate=600",
        )],
        Json(results),
    )
        .into_response())
}

/// 热门搜索关键词（从search_keywords表）
#[utoipa::path(
    get,
    path = "/v1/search/trending",
    tag = "search",
    responses(
        (status = 200, description = "获取成功", body = Vec<TrendingKeyword>)
    )
)]
pub async fn get_trending_keywords_optimized(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    // 尝试从Redis缓存获取
    let cache_key = "search:trending:v2";

    if let Ok(mut conn) = state.redis.get().await {
        if let Ok(Some(cached_str)) = redis::cmd("GET")
            .arg(cache_key)
            .query_async::<Option<String>>(&mut conn)
            .await
        {
            if let Ok(keywords) = serde_json::from_str::<Vec<TrendingKeyword>>(&cached_str) {
                return Ok((
                    [(
                        header::CACHE_CONTROL,
                        "public, s-maxage=300, stale-while-revalidate=600",
                    )],
                    Json(keywords),
                )
                    .into_response());
            }
        }
    }

    // 从数据库获取热门关键词
    let keywords: Vec<TrendingKeyword> = sqlx::query_as!(
        TrendingKeyword,
        r#"
        SELECT
            keyword as "keyword!",
            search_count as "count!",
            COALESCE(last_searched_at, NOW()) as "last_searched_at!"
        FROM trending_keywords
        ORDER BY search_count DESC, last_searched_at DESC
        LIMIT 20
        "#
    )
    .fetch_all(&state.db)
    .await?;

    // 缓存10分钟
    if let Ok(mut conn) = state.redis.get().await {
        if let Ok(json) = serde_json::to_string(&keywords) {
            let _: () = redis::cmd("SETEX")
                .arg(cache_key)
                .arg(600)
                .arg(&json)
                .query_async(&mut conn)
                .await?;
        }
    }

    Ok((
        [(
            header::CACHE_CONTROL,
            "public, s-maxage=300, stale-while-revalidate=600",
        )],
        Json(keywords),
    )
        .into_response())
}

/// 记录搜索关键词（辅助函数）
async fn record_search_keyword(
    state: &AppState,
    keyword: &str,
    _results_count: i32,
) -> Result<(), AppError> {
    let escaped_keyword = keyword.replace('\'', "''");

    // 使用数据库触发器自动更新计数
    sqlx::query(
        r#"
        INSERT INTO search_keywords (keyword, search_count, last_searched_at)
        VALUES ($1, 1, NOW())
        ON CONFLICT (keyword) DO UPDATE SET
            search_count = search_keywords.search_count + 1,
            last_searched_at = NOW()
        "#,
    )
    .bind(&escaped_keyword)
    .execute(&state.db)
    .await?;

    // 如果用户已登录，记录到搜索历史
    // TODO: 从请求中获取user_id
    // sqlx::query(
    //     "INSERT INTO search_history (user_id, keyword, results_count) VALUES ($1, $2, $3)"
    // )
    // .bind(user_id)
    // .bind(keyword)
    // .bind(results_count)
    // .execute(&state.db)
    // .await?;

    Ok(())
}

// ===== 辅助结构体 =====

#[derive(Debug, Deserialize)]
pub struct SuggestParams {
    pub q: String,
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct SearchSuggestion {
    pub title: String,
    pub category: String,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct TrendingKeyword {
    pub keyword: String,
    #[serde(rename = "count")]
    pub count: i64,
    #[serde(rename = "lastSearchedAt")]
    pub last_searched_at: DateTime<Utc>,
}
