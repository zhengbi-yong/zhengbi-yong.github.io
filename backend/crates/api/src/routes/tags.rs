use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
};
use blog_db::cms::*;
use blog_shared::AppError;
use crate::state::AppState;
use utoipa;
use uuid::Uuid;

/// 创建标签
#[utoipa::path(
    post,
    path = "/admin/tags",
    tag = "admin/tags",
    request_body = CreateTagRequest,
    responses(
        (status = 201, description = "创建成功", body = IdResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 409, description = "slug已存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn create_tag(
    State(state): State<AppState>,
    Json(req): Json<CreateTagRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 检查 slug 是否已存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM tags WHERE slug = $1)"
    )
    .bind(&req.slug)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(AppError::Conflict("Slug already exists".to_string()));
    }

    let id = sqlx::query_scalar!(
        r#"
        INSERT INTO tags (slug, name, description)
        VALUES ($1, $2, $3)
        RETURNING id
        "#,
        req.slug,
        req.name,
        req.description
    )
    .fetch_one(&state.db)
    .await?;

    // 清除缓存
    clear_tags_cache(&state).await;

    Ok((
        StatusCode::CREATED,
        Json(IdResponse { id }),
    ))
}

/// 获取标签详情
#[utoipa::path(
    get,
    path = "/tags/{slug}",
    tag = "tags",
    params(
        ("slug" = String, Path, description = "标签slug")
    ),
    responses(
        (status = 200, description = "获取成功", body = Tag),
        (status = 404, description = "标签不存在")
    )
)]
pub async fn get_tag(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let tag = sqlx::query_as!(
        Tag,
        r#"
        SELECT id, slug, name, description, post_count, created_at
        FROM tags
        WHERE slug = $1
        "#,
        slug
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Tag not found".to_string()))?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(tag),
    ).into_response())
}

/// 更新标签
#[utoipa::path(
    patch,
    path = "/admin/tags/{slug}",
    tag = "admin/tags",
    params(
        ("slug" = String, Path, description = "标签slug")
    ),
    request_body = UpdateTagRequest,
    responses(
        (status = 200, description = "更新成功", body = MessageResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 404, description = "标签不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn update_tag(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Json(req): Json<UpdateTagRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 检查标签是否存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM tags WHERE slug = $1)"
    )
    .bind(&slug)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Tag not found".to_string()));
    }

    // 构建更新查询
    let mut update_fields = Vec::new();
    let mut param_index = 2;

    if req.name.is_some() {
        update_fields.push(format!("name = ${}", param_index));
        param_index += 1;
    }
    if req.description.is_some() {
        update_fields.push(format!("description = ${}", param_index));
        param_index += 1;
    }

    if update_fields.is_empty() {
        return Ok(Json(MessageResponse {
            message: "No fields to update".to_string(),
        }).into_response());
    }

    let query = format!(
        "UPDATE tags SET {} WHERE slug = $1",
        update_fields.join(", ")
    );

    let mut query_builder = sqlx::query(&query).bind(&slug);

    if let Some(name) = req.name {
        query_builder = query_builder.bind(name);
    }
    if let Some(description) = req.description {
        query_builder = query_builder.bind(description);
    }

    query_builder.execute(&state.db).await?;

    // 清除缓存
    clear_tags_cache(&state).await;

    Ok(Json(MessageResponse {
        message: "Tag updated successfully".to_string(),
    }).into_response())
}

/// 删除标签
#[utoipa::path(
    delete,
    path = "/admin/tags/{slug}",
    tag = "admin/tags",
    params(
        ("slug" = String, Path, description = "标签slug")
    ),
    responses(
        (status = 200, description = "删除成功", body = MessageResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "标签不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn delete_tag(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let affected = sqlx::query!(
        "DELETE FROM tags WHERE slug = $1",
        slug
    )
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Tag not found".to_string()));
    }

    // 清除缓存
    clear_tags_cache(&state).await;

    Ok(Json(MessageResponse {
        message: "Tag deleted successfully".to_string(),
    }))
}

/// 获取标签列表
#[utoipa::path(
    get,
    path = "/tags",
    tag = "tags",
    params(
        ("sort_by" = Option<String>, Query, description = "排序字段：name, post_count, created_at"),
        ("sort_order" = Option<String>, Query, description = "排序方向：asc, desc")
    ),
    responses(
        (status = 200, description = "获取成功", body = Vec<Tag>)
    )
)]
pub async fn list_tags(
    State(state): State<AppState>,
    Query(params): Query<SearchParams>,
) -> Result<impl IntoResponse, AppError> {
    let sort_by = params.sort_by.unwrap_or_else(|| "post_count".to_string());
    let sort_order = params.sort_order.unwrap_or_else(|| "desc".to_string());

    // 验证排序字段
    let valid_sort_fields = vec!["name", "post_count", "created_at"];
    if !valid_sort_fields.contains(&sort_by.as_str()) {
        return Err(AppError::BadRequest("Invalid sort field".to_string()));
    }

    let query = format!(
        "SELECT id, slug, name, description, post_count, created_at FROM tags ORDER BY {} {}",
        sort_by, sort_order
    );

    let tags: Vec<Tag> = sqlx::query_as(&query)
        .fetch_all(&state.db)
        .await?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(tags),
    ).into_response())
}

/// 标签自动补全
#[utoipa::path(
    get,
    path = "/tags/autocomplete",
    tag = "tags",
    params(
        ("q" = String, Query, description = "搜索关键词")
    ),
    responses(
        (status = 200, description = "获取成功", body = Vec<TagBasic>)
    )
)]
pub async fn autocomplete_tags(
    State(state): State<AppState>,
    Query(params): Query<AutocompleteParams>,
) -> Result<impl IntoResponse, AppError> {
    let search_term = format!("{}%", params.q);

    let tags: Vec<TagBasic> = sqlx::query_as!(
        TagBasic,
        r#"
        SELECT id, slug, name
        FROM tags
        WHERE name LIKE $1 OR slug LIKE $1
        ORDER BY post_count DESC, name ASC
        LIMIT 10
        "#,
        search_term
    )
    .fetch_all(&state.db)
    .await?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(tags),
    ).into_response())
}

/// 获取标签的文章列表
#[utoipa::path(
    get,
    path = "/tags/{slug}/posts",
    tag = "tags",
    params(
        ("slug" = String, Path, description = "标签slug"),
        ("page" = Option<u32>, Query, description = "页码（从1开始）"),
        ("limit" = Option<u32>, Query, description = "每页数量（默认20）")
    ),
    responses(
        (status = 200, description = "获取成功", body = PostListResponse),
        (status = 404, description = "标签不存在")
    )
)]
pub async fn get_tag_posts(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(params): Query<PostListParams>,
) -> Result<impl IntoResponse, AppError> {
    // 检查标签是否存在
    let tag_id: Uuid = sqlx::query_scalar(
        "SELECT id FROM tags WHERE slug = $1"
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Tag not found".to_string()))?;

    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    // 查询总数
    let total: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(DISTINCT p.id)
        FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        WHERE pt.tag_id = $1 AND p.deleted_at IS NULL
        "#
    )
    .bind(tag_id)
    .fetch_one(&state.db)
    .await?;

    // 查询文章列表
    let posts: Vec<PostListItem> = sqlx::query_as!(
        PostListItem,
        r#"
        SELECT
            p.id, p.slug, p.title, p.summary,
            m.cdn_url as "cover_image_url?",
            p.status as "status!: blog_db::cms::PostStatus",
            p.published_at,
            c.name as "category_name?", c.slug as "category_slug?",
            u.username as "author_name?",
            p.view_count, p.like_count, p.comment_count,
            p.created_at, p.reading_time,
            COUNT(DISTINCT pt2.tag_id) as "tag_count!"
        FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN media m ON p.cover_image_id = m.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN post_tags pt2 ON p.id = pt2.post_id
        WHERE pt.tag_id = $1 AND p.deleted_at IS NULL
        GROUP BY p.id, m.cdn_url, c.name, c.slug, u.username
        ORDER BY p.published_at DESC
        LIMIT $2 OFFSET $3
        "#,
        tag_id,
        limit as i64,
        offset as i64
    )
    .fetch_all(&state.db)
    .await?;

    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=60, stale-while-revalidate=300")],
        Json(PostListResponse {
            posts,
            total,
            page,
            limit,
            total_pages,
        }),
    ).into_response())
}

/// 获取热门标签
#[utoipa::path(
    get,
    path = "/tags/popular",
    tag = "tags",
    params(
        ("limit" = Option<u32>, Query, description = "返回数量（默认20）")
    ),
    responses(
        (status = 200, description = "获取成功", body = Vec<Tag>)
    )
)]
pub async fn get_popular_tags(
    State(state): State<AppState>,
    Query(params): Query<LimitParams>,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.unwrap_or(20).min(100);

    let tags: Vec<Tag> = sqlx::query_as!(
        Tag,
        r#"
        SELECT id, slug, name, description, post_count, created_at
        FROM tags
        WHERE post_count > 0
        ORDER BY post_count DESC, name ASC
        LIMIT $1
        "#,
        limit as i64
    )
    .fetch_all(&state.db)
    .await?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(tags),
    ).into_response())
}

// ===== 辅助结构体 =====

#[derive(serde::Deserialize)]
pub struct SearchParams {
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct AutocompleteParams {
    pub q: String,
}

#[derive(serde::Deserialize)]
pub struct LimitParams {
    pub limit: Option<u32>,
}

// ===== 缓存辅助函数 =====

async fn clear_tags_cache(state: &AppState) {
    if let Ok(mut conn) = state.redis.get().await {
        let _: () = redis::cmd("DEL")
            .arg("tags:list")
            .arg("tags:popular")
            .query_async(&mut conn)
            .await
            .unwrap_or(());
    }
}
