use crate::state::AppState;
use axum::{
    extract::{Extension, Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
};
use blog_core::tiptap_json_to_mdx;
use blog_db::{cms::*, PostStatsResponse};
use blog_shared::{middleware::AuthUser, AppError};
use serde::Deserialize;
use utoipa;
use uuid::Uuid;

/// 获取文章统计
#[utoipa::path(
    get,
    path = "/posts/{slug}/stats",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug")
    ),
    responses(
        (status = 200, description = "获取文章统计成功", body = PostStatsResponse, headers(
            ("cache-control", description = "缓存控制头"),
            ("etag", description = "ETag用于缓存验证")
        )),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn get_stats(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // 尝试从 Redis 缓存获取
    let cache_key = format!("post_stats:{}", slug);

    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| AppError::InternalError)?;

    if let Ok(Some(cached_str)) = redis::cmd("GET")
        .arg(&cache_key)
        .query_async::<Option<String>>(&mut conn)
        .await
    {
        if let Ok(stats) = serde_json::from_str::<PostStatsResponse>(&cached_str) {
            return Ok((
                [
                    (
                        header::CACHE_CONTROL,
                        "public, s-maxage=5, stale-while-revalidate=60",
                    ),
                    (
                        header::ETAG,
                        format!("\"{}\"", compute_etag(&stats)).as_str(),
                    ),
                ],
                Json(stats),
            )
                .into_response());
        }
    }

    // 从数据库获取（使用读副本）
    let stats_row = sqlx::query!(
        "SELECT slug, view_count, like_count, comment_count, updated_at FROM post_stats WHERE slug = $1",
        slug
    )
    .fetch_optional(&state.db_read)
    .await?;

    if let Some(stats_row) = stats_row {
        let stats = blog_db::PostStats {
            slug: stats_row.slug,
            view_count: stats_row.view_count,
            like_count: stats_row.like_count,
            comment_count: stats_row.comment_count,
            updated_at: stats_row.updated_at,
        };
        let response = PostStatsResponse::from(stats);

        // 缓存 5 秒
        if let Ok(json) = serde_json::to_string(&response) {
            let _: () = redis::cmd("SETEX")
                .arg(&cache_key)
                .arg(5)
                .arg(&json)
                .query_async(&mut conn)
                .await?;
        }

        Ok((
            [
                (
                    header::CACHE_CONTROL,
                    "public, s-maxage=5, stale-while-revalidate=60",
                ),
                (
                    header::ETAG,
                    format!("\"{}\"", compute_etag(&response)).as_str(),
                ),
            ],
            Json(response),
        )
            .into_response())
    } else {
        // 如果统计不存在，创建默认值
        let default_stats = PostStatsResponse {
            slug: slug.clone(),
            view_count: 0,
            like_count: 0,
            comment_count: 0,
            updated_at: chrono::Utc::now(),
        };

        sqlx::query!("INSERT INTO post_stats (slug) VALUES ($1)", slug)
            .execute(&state.db)
            .await?;

        Ok(Json(default_stats).into_response())
    }
}

/// 记录文章浏览
#[utoipa::path(
    post,
    path = "/posts/{slug}/view",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug")
    ),
    responses(
        (status = 200, description = "浏览记录成功"),
        (status = 404, description = "文章不存在"),
        (status = 429, description = "限流")
    )
)]
pub async fn view(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // 检查文章是否存在
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM post_stats WHERE slug = $1)")
            .bind(&slug)
            .fetch_one(&state.db)
            .await?;

    if !exists {
        return Err(AppError::PostNotFound);
    }

    // Redis 计数
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| AppError::InternalError)?;
    let pv_key = format!("pv:{}", slug);
    let count: i64 = redis::cmd("INCR")
        .arg(&pv_key)
        .query_async(&mut conn)
        .await?;

    // 每 10 次浏览写入一次 outbox
    if count % 10 == 0 {
        crate::outbox::add_post_viewed(&state.db, &slug, 10)
            .await
            .map_err(|_| AppError::InternalError)?;
    }

    Ok(StatusCode::NO_CONTENT)
}

/// 点赞文章
#[utoipa::path(
    post,
    path = "/posts/{slug}/like",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug")
    ),
    responses(
        (status = 200, description = "点赞成功"),
        (status = 401, description = "未认证"),
        (status = 404, description = "文章不存在"),
        (status = 409, description = "已经点赞过")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn like(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // 使用事务确保原子性
    let mut tx = state.db.begin().await?;

    // 检查文章是否存在
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM post_stats WHERE slug = $1)")
            .bind(&slug)
            .fetch_one(&mut *tx)
            .await?;

    if !exists {
        tx.rollback().await?;
        return Err(AppError::PostNotFound);
    }

    // 检查是否已点赞
    let already_liked: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM post_likes WHERE slug = $1 AND user_id = $2)",
    )
    .bind(&slug)
    .bind(auth_user.id)
    .fetch_one(&mut *tx)
    .await?;

    if already_liked {
        tx.rollback().await?;
        return Err(AppError::AlreadyLiked);
    }

    // 添加点赞记录（事务内使用 query() 而非 query!）
    // GOLDEN_RULES §3.5 / ultradesign §4.6: 事务内禁止外部 I/O，但 query! 在事务上下文中不工作
    sqlx::query("INSERT INTO post_likes (slug, user_id) VALUES ($1, $2)")
        .bind(&slug)
        .bind(auth_user.id)
        .execute(&mut *tx)
        .await?;

    // 更新计数
    sqlx::query("UPDATE post_stats SET like_count = like_count + 1 WHERE slug = $1")
        .bind(&slug)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    // 清除缓存
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| AppError::InternalError)?;
    let cache_key = format!("post_stats:{}", slug);
    let _: () = redis::cmd("DEL")
        .arg(&cache_key)
        .query_async(&mut conn)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

/// 取消点赞文章
#[utoipa::path(
    delete,
    path = "/posts/{slug}/like",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug")
    ),
    responses(
        (status = 200, description = "取消点赞成功"),
        (status = 401, description = "未认证"),
        (status = 404, description = "文章不存在"),
        (status = 409, description = "未点赞过")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn unlike(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // 使用事务确保原子性
    let mut tx = state.db.begin().await?;

    // 检查是否已点赞
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM post_likes WHERE slug = $1 AND user_id = $2)",
    )
    .bind(&slug)
    .bind(auth_user.id)
    .fetch_one(&mut *tx)
    .await?;

    if !exists {
        tx.rollback().await?;
        return Err(AppError::NotLiked);
    }

    // 删除点赞记录
    sqlx::query!(
        "DELETE FROM post_likes WHERE slug = $1 AND user_id = $2",
        slug,
        auth_user.id
    )
    .execute(&mut *tx)
    .await?;

    // 更新计数
    sqlx::query!(
        "UPDATE post_stats SET like_count = like_count - 1 WHERE slug = $1",
        slug
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 清除缓存
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| AppError::InternalError)?;
    let cache_key = format!("post_stats:{}", slug);
    let _: () = redis::cmd("DEL")
        .arg(&cache_key)
        .query_async(&mut conn)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

// 计算 ETag
fn compute_etag(stats: &PostStatsResponse) -> String {
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    stats.view_count.hash(&mut hasher);
    stats.like_count.hash(&mut hasher);
    stats.comment_count.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

// ===== CMS 文章 CRUD API =====

/// 创建文章
#[utoipa::path(
    post,
    path = "/admin/posts",
    tag = "admin/posts",
    request_body = CreatePostRequest,
    responses(
        (status = 201, description = "创建成功", body = SlugResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 409, description = "slug已存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn create_post(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<CreatePostRequest>,
) -> Result<impl IntoResponse, AppError> {
    let created_slug = req.slug.clone();
    let mut tx = state.db.begin().await?;

    // 检查 slug 是否已存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM posts WHERE slug = $1 AND deleted_at IS NULL)",
    )
    .bind(&req.slug)
    .fetch_one(&mut *tx)
    .await?;

    if exists {
        tx.rollback().await?;
        return Err(AppError::Conflict("Slug already exists".to_string()));
    }

    // Phase 4: 如果提供了 content_json 但没有 content_mdx，自动派生 MDX
    let content_mdx = match (&req.content_json, &req.content_mdx) {
        (Some(json), None) => Some(tiptap_json_to_mdx(json)),
        (_, mdx) => mdx.clone(),
    };

    // 计算阅读时间
    let reading_time_obj = ReadingTime::from_content(&req.content);
    let reading_time = reading_time_obj.minutes as i32;

    // 插入文章
    let post_id = sqlx::query_scalar!(
        r#"
        INSERT INTO posts (
            slug, title, content, summary, cover_image_id,
            status, published_at, scheduled_at,
            meta_title, meta_description, canonical_url,
            category_id, author_id, show_toc, layout,
            is_featured, content_format, reading_time,
            content_json, content_mdx
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18,
            $19, $20
        )
        RETURNING id
        "#,
        created_slug,
        req.title,
        req.content,
        req.summary,
        req.cover_image_id,
        req.status as PostStatus,
        req.published_at,
        req.scheduled_at,
        req.meta_title,
        req.meta_description,
        req.canonical_url,
        req.category_id,
        auth_user.id,
        req.show_toc.unwrap_or(true),
        req.layout.unwrap_or_else(|| "PostSimple".to_string()),
        req.is_featured.unwrap_or(false),
        req.content_format,
        reading_time as i32,
        req.content_json,
        content_mdx,
    )
    .fetch_one(&mut *tx)
    .await?;

    // 关联标签
    if let Some(tag_ids) = req.tag_ids {
        for tag_id in tag_ids {
            sqlx::query!(
                "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)",
                post_id,
                tag_id
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    // 创建初始版本
    sqlx::query!(
        r#"
        INSERT INTO post_versions (post_id, version_number, title, content, summary, created_by)
        VALUES ($1, 1, $2, $3, $4, $5)
        "#,
        post_id,
        req.title,
        req.content,
        req.summary,
        auth_user.id
    )
    .execute(&mut *tx)
    .await?;

    // 创建 post_stats 记录
    sqlx::query!(
        r#"
        INSERT INTO post_stats (slug, view_count, like_count, comment_count, updated_at)
        VALUES ($1, 0, 0, 0, NOW())
        ON CONFLICT (slug) DO NOTHING
        "#,
        created_slug
    )
    .execute(&mut *tx)
    .await?;

    // 同步 post_media 关联
    sync_post_media(&mut tx, post_id, &req.content).await?;

    if let Some(cover_id) = req.cover_image_id {
        sqlx::query(
            "INSERT INTO post_media (post_id, media_id, position) VALUES ($1, $2, 0) ON CONFLICT (post_id, media_id) DO NOTHING"
        )
        .bind(post_id)
        .bind(cover_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    // 清除列表缓存
    clear_posts_cache(&state).await;

    // 异步写入 outbox，由 worker 处理搜索索引同步
    if let Err(error) = crate::outbox::add_search_index_upsert(&state.db, &created_slug).await {
        tracing::warn!("Failed to add search index upsert to outbox: {error:#}");
    }

    Ok((
        StatusCode::CREATED,
        Json(SlugResponse { slug: created_slug }),
    ))
}

/// 获取文章详情
#[utoipa::path(
    get,
    path = "/posts/{slug}",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug")
    ),
    responses(
        (status = 200, description = "获取成功", body = PostDetail),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn get_post(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    get_post_response(&state, &slug).await
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct PostSlugQuery {
    pub slug: String,
}

#[utoipa::path(
    get,
    path = "/posts/by-slug",
    tag = "posts",
    params(
        ("slug" = String, Query, description = "文章 slug，支持多级路径")
    ),
    responses(
        (status = 200, description = "获取成功", body = PostDetail),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn get_post_by_slug_query(
    State(state): State<AppState>,
    Query(params): Query<PostSlugQuery>,
) -> Result<impl IntoResponse, AppError> {
    get_post_response(&state, &params.slug).await
}

async fn get_post_response(
    state: &AppState,
    slug: &str,
) -> Result<axum::response::Response, AppError> {
    // 尝试从缓存获取
    let cache_key = format!("post:{}", slug);

    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| AppError::InternalError)?;

    if let Ok(Some(cached_str)) = redis::cmd("GET")
        .arg(&cache_key)
        .query_async::<Option<String>>(&mut conn)
        .await
    {
        if let Ok(post) = serde_json::from_str::<PostDetail>(&cached_str) {
            return Ok((
                [(
                    header::CACHE_CONTROL,
                    "public, s-maxage=300, stale-while-revalidate=600",
                )],
                Json(post),
            )
                .into_response());
        }
    }

    // 从数据库获取（使用读副本）
    let post_row = sqlx::query!(
        r#"
        SELECT
            p.id, p.slug, p.title, p.content, p.content_html, p.summary,
            m.cdn_url as "cover_image_url?",
            p.status as "status!: blog_db::cms::PostStatus",
            p.published_at, p.scheduled_at,
            p.meta_title, p.meta_description, p.canonical_url,
            p.category_id, c.name as "category_name?", c.slug as "category_slug?",
            p.author_id, u.username as "author_name?",
            p.show_toc, p.layout,
            p.view_count, p.like_count, p.comment_count,
            p.created_at, p.updated_at, p.lastmod_at,
            p.reading_time as "reading_time?: i32",
            p.content_json, p.content_mdx
        FROM posts p
        LEFT JOIN media m ON p.cover_image_id = m.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.slug = $1 AND p.deleted_at IS NULL
        "#,
        slug
    )
    .fetch_optional(&state.db_read)
    .await?;

    match post_row {
        Some(row) => {
            // 解析 content：处理三种情况
            // 1. content_mdx 为 NULL → 从 content_json 转换
            // 2. content_mdx 是 TipTap JSON 格式（脏数据）→ 实时转换
            // 3. content_mdx 是真正 MDX → 直接使用
            let content = {
                let raw = row
                    .content_mdx
                    .clone()
                    .unwrap_or_else(|| tiptap_json_to_mdx(&row.content_json));
                let trimmed = raw.trim_start();
                if trimmed.starts_with("{\"type\":\"doc\"") {
                    serde_json::from_str::<serde_json::Value>(&raw)
                        .ok()
                        .map(|v| tiptap_json_to_mdx(&v))
                        .unwrap_or_default()
                } else {
                    raw
                }
            };

            // 手动构造 PostDetail
            let mut post_detail = PostDetail {
                id: row.id,
                slug: row.slug,
                title: row.title,
                content,
                content_html: row.content_html,
                summary: row.summary,
                cover_image_url: row.cover_image_url,
                status: row.status,
                published_at: row.published_at,
                scheduled_at: row.scheduled_at,
                meta_title: row.meta_title,
                meta_description: row.meta_description,
                canonical_url: row.canonical_url,
                category_id: row.category_id,
                category_name: row.category_name,
                category_slug: row.category_slug,
                author_id: row.author_id,
                author_name: row.author_name,
                show_toc: row.show_toc,
                layout: row.layout,
                view_count: row.view_count,
                like_count: row.like_count,
                comment_count: row.comment_count,
                created_at: row.created_at,
                updated_at: row.updated_at,
                lastmod_at: row.lastmod_at,
                reading_time: row.reading_time,
                content_json: Some(row.content_json),
                content_mdx: row.content_mdx,
                tags: Vec::new(), // 将在下面填充
            };
            // 获取标签（使用读副本）
            let tags = sqlx::query_as!(
                TagBasic,
                r#"
                SELECT t.id, t.slug, t.name
                FROM tags t
                JOIN post_tags pt ON t.id = pt.tag_id
                JOIN posts p ON pt.post_id = p.id
                WHERE p.slug = $1
                "#,
                slug
            )
            .fetch_all(&state.db_read)
            .await?;

            post_detail.tags = tags;

            // 缓存
            if let Ok(json) = serde_json::to_string(&post_detail) {
                let _: () = redis::cmd("SETEX")
                    .arg(&cache_key)
                    .arg(300) // 5 分钟
                    .arg(&json)
                    .query_async(&mut conn)
                    .await?;
            }

            Ok((
                [(
                    header::CACHE_CONTROL,
                    "public, s-maxage=300, stale-while-revalidate=600",
                )],
                Json(post_detail),
            )
                .into_response())
        }
        None => Err(AppError::PostNotFound),
    }
}

/// 根据ID获取文章详情（新增）
#[utoipa::path(
    get,
    path = "/posts/id/{id}",
    tag = "posts",
    params(
        ("id" = Uuid, Path, description = "文章UUID")
    ),
    responses(
        (status = 200, description = "获取文章成功", body = PostDetail, headers(
            ("cache-control", description = "缓存控制头")
        )),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn get_post_by_id(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    // 尝试从缓存获取
    let cache_key = format!("post:id:{}", id);

    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| AppError::InternalError)?;

    if let Ok(Some(cached_str)) = redis::cmd("GET")
        .arg(&cache_key)
        .query_async::<Option<String>>(&mut conn)
        .await
    {
        if let Ok(post) = serde_json::from_str::<PostDetail>(&cached_str) {
            return Ok((
                [(
                    header::CACHE_CONTROL,
                    "public, s-maxage=300, stale-while-revalidate=600",
                )],
                Json(post),
            )
                .into_response());
        }
    }

    // 从数据库获取（使用读副本）
    let post_row = sqlx::query!(
        r#"
        SELECT
            p.id, p.slug, p.title, p.content, p.content_html, p.summary,
            m.cdn_url as "cover_image_url?",
            p.status as "status!: blog_db::cms::PostStatus",
            p.published_at, p.scheduled_at,
            p.meta_title, p.meta_description, p.canonical_url,
            p.category_id, c.name as "category_name?", c.slug as "category_slug?",
            p.author_id, u.username as "author_name?",
            p.show_toc, p.layout,
            p.view_count, p.like_count, p.comment_count,
            p.created_at, p.updated_at, p.lastmod_at,
            p.reading_time as "reading_time?: i32",
            p.content_json, p.content_mdx
        FROM posts p
        LEFT JOIN media m ON p.cover_image_id = m.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = $1 AND p.deleted_at IS NULL
        "#,
        id
    )
    .fetch_optional(&state.db_read)
    .await?;

    match post_row {
        Some(row) => {
            // 解析 content：处理三种情况
            // 1. content_mdx 为 NULL → 从 content_json 转换
            // 2. content_mdx 是 TipTap JSON 格式（脏数据）→ 实时转换
            // 3. content_mdx 是真正 MDX → 直接使用
            let content = {
                let raw = row
                    .content_mdx
                    .clone()
                    .unwrap_or_else(|| tiptap_json_to_mdx(&row.content_json));
                let trimmed = raw.trim_start();
                if trimmed.starts_with("{\"type\":\"doc\"") {
                    serde_json::from_str::<serde_json::Value>(&raw)
                        .ok()
                        .map(|v| tiptap_json_to_mdx(&v))
                        .unwrap_or_default()
                } else {
                    raw
                }
            };

            // 手动构造 PostDetail
            let mut post_detail = PostDetail {
                id: row.id,
                slug: row.slug,
                title: row.title,
                content,
                content_html: row.content_html,
                summary: row.summary,
                cover_image_url: row.cover_image_url,
                status: row.status,
                published_at: row.published_at,
                scheduled_at: row.scheduled_at,
                meta_title: row.meta_title,
                meta_description: row.meta_description,
                canonical_url: row.canonical_url,
                category_id: row.category_id,
                category_name: row.category_name,
                category_slug: row.category_slug,
                author_id: row.author_id,
                author_name: row.author_name,
                show_toc: row.show_toc,
                layout: row.layout,
                view_count: row.view_count,
                like_count: row.like_count,
                comment_count: row.comment_count,
                created_at: row.created_at,
                updated_at: row.updated_at,
                lastmod_at: row.lastmod_at,
                reading_time: row.reading_time,
                content_json: Some(row.content_json),
                content_mdx: row.content_mdx,
                tags: Vec::new(), // 将在下面填充
            };

            // 获取标签（使用读副本）
            let tags = sqlx::query_as!(
                TagBasic,
                r#"
                SELECT t.id, t.slug, t.name
                FROM tags t
                JOIN post_tags pt ON t.id = pt.tag_id
                JOIN posts p ON pt.post_id = p.id
                WHERE p.id = $1
                "#,
                id
            )
            .fetch_all(&state.db_read)
            .await?;

            post_detail.tags = tags;

            // 缓存
            if let Ok(json) = serde_json::to_string(&post_detail) {
                let _: () = redis::cmd("SETEX")
                    .arg(&cache_key)
                    .arg(300) // 5 分钟
                    .arg(&json)
                    .query_async(&mut conn)
                    .await?;
            }

            Ok((
                [(
                    header::CACHE_CONTROL,
                    "public, s-maxage=300, stale-while-revalidate=600",
                )],
                Json(post_detail),
            )
                .into_response())
        }
        None => Err(AppError::PostNotFound),
    }
}

/// 更新文章
#[utoipa::path(
    patch,
    path = "/admin/posts/{postId}",
    tag = "admin/posts",
    params(
        ("postId" = Uuid, Path, description = "文章数据库ID (UUID)")
    ),
    request_body = UpdatePostRequest,
    responses(
        (status = 200, description = "更新成功", body = MessageResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 404, description = "文章不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn update_post(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
    Json(req): Json<UpdatePostRequest>,
) -> Result<impl IntoResponse, AppError> {
    let mut tx = state.db.begin().await?;

    // 检查文章是否存在
    let post_id: Uuid =
        sqlx::query_scalar("SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL")
            .bind(post_id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or(AppError::PostNotFound)?;

    // 获取当前 slug（用于缓存清理和搜索索引更新）
    let current_slug: String = sqlx::query_scalar("SELECT slug FROM posts WHERE id = $1")
        .bind(post_id)
        .fetch_one(&mut *tx)
        .await?;

    // 构建更新查询（动态）
    let mut update_fields = Vec::new();
    let mut param_index = 2;

    // Phase 4: 自动派生 content_mdx（当 content_json 被更新但 content_mdx 未指定时）
    let derived_mdx: Option<String> = if req.content_json.is_some() && req.content_mdx.is_none() {
        req.content_json.as_ref().map(|j| tiptap_json_to_mdx(j))
    } else {
        None
    };

    if req.title.is_some() {
        update_fields.push(format!("title = ${}", param_index));
        param_index += 1;
    }
    if req.content.is_some() {
        update_fields.push(format!("content = ${}", param_index));
        param_index += 1;
    }
    if req.content_html.is_some() {
        update_fields.push(format!("content_html = ${}", param_index));
        param_index += 1;
    }
    if req.summary.is_some() {
        update_fields.push(format!("summary = ${}", param_index));
        param_index += 1;
    }
    if req.cover_image_id.is_some() {
        update_fields.push(format!("cover_image_id = ${}", param_index));
        param_index += 1;
    }
    if req.status.is_some() {
        update_fields.push(format!("status = ${}", param_index));
        param_index += 1;
    }
    if req.published_at.is_some() {
        update_fields.push(format!("published_at = ${}", param_index));
        param_index += 1;
    }
    if req.scheduled_at.is_some() {
        update_fields.push(format!("scheduled_at = ${}", param_index));
        param_index += 1;
    }
    if req.meta_title.is_some() {
        update_fields.push(format!("meta_title = ${}", param_index));
        param_index += 1;
    }
    if req.meta_description.is_some() {
        update_fields.push(format!("meta_description = ${}", param_index));
        param_index += 1;
    }
    if req.canonical_url.is_some() {
        update_fields.push(format!("canonical_url = ${}", param_index));
        param_index += 1;
    }
    if req.category_id.is_some() {
        update_fields.push(format!("category_id = ${}", param_index));
        param_index += 1;
    }
    if req.show_toc.is_some() {
        update_fields.push(format!("show_toc = ${}", param_index));
        param_index += 1;
    }
    if req.layout.is_some() {
        update_fields.push(format!("layout = ${}", param_index));
        param_index += 1;
    }
    if req.is_featured.is_some() {
        update_fields.push(format!("is_featured = ${}", param_index));
        param_index += 1;
    }
    if req.content_format.is_some() {
        update_fields.push(format!("content_format = ${}", param_index));
        param_index += 1;
    }
    if req.content_json.is_some() {
        update_fields.push(format!("content_json = ${}", param_index));
        param_index += 1;
    }
    if req.content_mdx.is_some() {
        update_fields.push(format!("content_mdx = ${}", param_index));
        param_index += 1;
    } else if derived_mdx.is_some() {
        // Phase 4: 自动派生的 content_mdx
        update_fields.push(format!("content_mdx = ${}", param_index));
        param_index += 1;
    }

    if update_fields.is_empty() {
        tx.rollback().await?;
        return Ok(Json(MessageResponse {
            message: "No fields to update".to_string(),
        })
        .into_response());
    }

    let query = format!(
        "UPDATE posts SET {} WHERE id = $1 RETURNING id",
        update_fields.join(", ")
    );

    let mut query_builder = sqlx::query(&query).bind(post_id);

    if let Some(title) = req.title {
        query_builder = query_builder.bind(title);
    }
    if let Some(ref content) = req.content {
        query_builder = query_builder.bind(content);
    }
    if let Some(content_html) = req.content_html {
        query_builder = query_builder.bind(content_html);
    }
    if let Some(summary) = req.summary {
        query_builder = query_builder.bind(summary);
    }
    if let Some(cover_image_id) = req.cover_image_id {
        query_builder = query_builder.bind(cover_image_id);
    }
    if let Some(status) = req.status {
        query_builder = query_builder.bind(status as PostStatus);
    }
    if let Some(published_at) = req.published_at {
        query_builder = query_builder.bind(published_at);
    }
    if let Some(scheduled_at) = req.scheduled_at {
        query_builder = query_builder.bind(scheduled_at);
    }
    if let Some(meta_title) = req.meta_title {
        query_builder = query_builder.bind(meta_title);
    }
    if let Some(meta_description) = req.meta_description {
        query_builder = query_builder.bind(meta_description);
    }
    if let Some(canonical_url) = req.canonical_url {
        query_builder = query_builder.bind(canonical_url);
    }
    if let Some(category_id) = req.category_id {
        query_builder = query_builder.bind(category_id);
    }
    if let Some(show_toc) = req.show_toc {
        query_builder = query_builder.bind(show_toc);
    }
    if let Some(layout) = req.layout {
        query_builder = query_builder.bind(layout);
    }
    if let Some(is_featured) = req.is_featured {
        query_builder = query_builder.bind(is_featured);
    }
    if let Some(content_format) = req.content_format {
        query_builder = query_builder.bind(content_format);
    }
    if let Some(content_json) = req.content_json {
        query_builder = query_builder.bind(content_json);
    }
    if let Some(content_mdx) = req.content_mdx {
        query_builder = query_builder.bind(content_mdx);
    } else if let Some(ref derived) = derived_mdx {
        query_builder = query_builder.bind(derived.clone());
    }

    query_builder.fetch_one(&mut *tx).await?;

    // 更新标签（如果提供）
    if let Some(tag_ids) = req.tag_ids {
        // 删除现有标签关联
        sqlx::query!("DELETE FROM post_tags WHERE post_id = $1", post_id)
            .execute(&mut *tx)
            .await?;

        // 添加新标签关联
        for tag_id in tag_ids {
            sqlx::query!(
                "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)",
                post_id,
                tag_id
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    // 同步媒体关联
    if req.content.is_some() {
        sync_post_media(&mut tx, post_id, req.content.as_deref().unwrap_or("")).await?;
    }

    tx.commit().await?;

    // 清除缓存
    clear_post_cache(&state, &current_slug).await;
    clear_posts_cache(&state).await;

    // 异步写入 outbox，由 worker 处理搜索索引同步
    if let Err(error) = crate::outbox::add_search_index_upsert(&state.db, &current_slug).await {
        tracing::warn!("Failed to add search index upsert to outbox: {error:#}");
    }

    Ok(Json(MessageResponse {
        message: "Post updated successfully".to_string(),
    })
    .into_response())
}

/// 删除文章（软删除）
#[utoipa::path(
    delete,
    path = "/admin/posts/{postId}",
    tag = "admin/posts",
    params(
        ("postId" = Uuid, Path, description = "文章数据库ID (UUID)")
    ),
    responses(
        (status = 200, description = "删除成功", body = MessageResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "文章不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn delete_post(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    // 先查询 slug（用于缓存清理和搜索索引删除）
    let slug: String =
        sqlx::query_scalar("SELECT slug FROM posts WHERE id = $1 AND deleted_at IS NULL")
            .bind(post_id)
            .fetch_optional(&state.db)
            .await?
            .ok_or(AppError::PostNotFound)?;

    // 软删除
    let affected = sqlx::query!(
        "UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
        post_id
    )
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::PostNotFound);
    }

    // 清除缓存
    clear_post_cache(&state, &slug).await;
    clear_posts_cache(&state).await;

    // 异步写入 outbox，由 worker 处理搜索索引删除
    if let Err(error) = crate::outbox::add_search_index_delete(&state.db, &slug).await {
        tracing::warn!("Failed to add search index delete to outbox: {error:#}");
    }

    Ok(Json(MessageResponse {
        message: "Post deleted successfully".to_string(),
    }))
}

/// 获取文章列表
#[utoipa::path(
    get,
    path = "/posts",
    tag = "posts",
    params(
        ("page" = Option<u32>, Query, description = "页码（从1开始）"),
        ("limit" = Option<u32>, Query, description = "每页数量（默认20）"),
        ("status" = Option<PostStatus>, Query, description = "文章状态"),
        ("category_id" = Option<Uuid>, Query, description = "分类ID"),
        ("tag_id" = Option<Uuid>, Query, description = "标签ID"),
        ("author_id" = Option<Uuid>, Query, description = "作者ID"),
        ("search" = Option<String>, Query, description = "搜索关键词"),
        ("sort_by" = Option<String>, Query, description = "排序字段：published_at, created_at, view_count, like_count"),
        ("sort_order" = Option<String>, Query, description = "排序方向：asc, desc")
    ),
    responses(
        (status = 200, description = "获取成功", body = PostListResponse)
    )
)]
pub async fn list_posts(
    State(state): State<AppState>,
    Query(params): Query<PostListParams>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).min(500);
    let offset = (page - 1) * limit;

    // 白名单验证 sort_by 和 sort_order 防止 SQL 注入
    let sort_by = match params.sort_by.as_deref() {
        Some("published_at") | Some("created_at") | Some("view_count") | Some("title") => {
            params.sort_by.unwrap()
        }
        _ => "published_at".to_string(),
    };
    let sort_order = match params.sort_order.as_deref() {
        Some("asc") | Some("desc") => params.sort_order.unwrap(),
        _ => "desc".to_string(),
    };

    // 使用参数化查询防止 SQL 注入
    let mut query_args: Vec<String> = Vec::new();
    let mut param_idx = 1;

    let mut where_clause = "p.deleted_at IS NULL".to_string();

    if let Some(ref status) = params.status {
        // Cast to post_status enum type since p.status is an enum but we're binding a string
        where_clause.push_str(&format!(" AND p.status = ${}::post_status", param_idx));
        query_args.push(status.as_str().to_string());
        param_idx += 1;
    }
    if let Some(ref category_id) = params.category_id {
        where_clause.push_str(&format!(" AND p.category_id = ${}", param_idx));
        query_args.push(category_id.to_string());
        param_idx += 1;
    }
    if let Some(ref tag_id) = params.tag_id {
        where_clause.push_str(&format!(
            " AND EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ${})",
            param_idx
        ));
        query_args.push(tag_id.to_string());
        param_idx += 1;
    }
    if let Some(ref author_id) = params.author_id {
        where_clause.push_str(&format!(" AND p.author_id = ${}", param_idx));
        query_args.push(author_id.to_string());
        param_idx += 1;
    }
    if let Some(ref search) = params.search {
        where_clause.push_str(&format!(
            " AND p.search_vector @@ plainto_tsquery('simple', ${})",
            param_idx
        ));
        query_args.push(search.to_string());
    }

    // 查询总数（使用读副本）
    let count_query = format!("SELECT COUNT(*) FROM posts p WHERE {}", where_clause);
    let mut count_q = sqlx::query_scalar::<_, i64>(&count_query);
    for arg in &query_args {
        count_q = count_q.bind(arg);
    }
    let total = count_q.fetch_one(&state.db_read).await?;

    // 查询列表（使用读副本）
    let list_query = format!(
        r#"
        SELECT
            p.id, p.slug, p.title, p.summary,
            m.cdn_url,
            p.status, p.published_at,
            c.name as category_name, c.slug as category_slug,
            u.username,
            p.view_count::bigint, p.like_count::bigint, p.comment_count::bigint,
            p.created_at, p.reading_time,
            COALESCE(COUNT(DISTINCT pt.tag_id), 0)::bigint as tag_count
        FROM posts p
        LEFT JOIN media m ON p.cover_image_id = m.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        WHERE {}
        GROUP BY p.id, m.cdn_url, p.status, p.published_at, c.name, c.slug, u.username, p.view_count, p.like_count, p.comment_count, p.created_at, p.reading_time
        ORDER BY {} {}
        LIMIT {} OFFSET {}
        "#,
        where_clause, sort_by, sort_order, limit, offset
    );

    let mut list_q = sqlx::query(&list_query);
    for arg in &query_args {
        list_q = list_q.bind(arg);
    }
    let rows = list_q.fetch_all(&state.db_read).await?;

    use sqlx::Row;
    let posts: Vec<PostListItem> = rows
        .into_iter()
        .map(|row| PostListItem {
            id: row.get("id"),
            slug: row.get("slug"),
            title: row.get("title"),
            summary: row.get("summary"),
            cover_image_url: row.get::<Option<String>, _>("cdn_url"),
            status: row.get::<blog_db::cms::PostStatus, _>("status"),
            published_at: row.get::<Option<chrono::DateTime<chrono::Utc>>, _>("published_at"),
            category_name: row.get::<Option<String>, _>("category_name"),
            category_slug: row.get::<Option<String>, _>("category_slug"),
            author_name: row.get::<Option<String>, _>("username"),
            view_count: row.get("view_count"),
            like_count: row.get("like_count"),
            comment_count: row.get("comment_count"),
            created_at: row.get("created_at"),
            reading_time: row.get::<Option<i32>, _>("reading_time"),
            tag_count: row.get("tag_count"),
        })
        .collect();

    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok((
        [(
            header::CACHE_CONTROL,
            "public, s-maxage=60, stale-while-revalidate=300",
        )],
        Json(PostListResponse {
            posts,
            total,
            page,
            limit,
            total_pages,
        }),
    )
        .into_response())
}

// ===== 缓存辅助函数 =====

async fn clear_post_cache(state: &AppState, slug: &str) {
    if let Ok(mut conn) = state.redis.get().await {
        let _: () = redis::cmd("DEL")
            .arg(format!("post:{}", slug))
            .query_async(&mut conn)
            .await
            .unwrap_or(());
    }
}

async fn clear_posts_cache(state: &AppState) {
    if let Ok(mut conn) = state.redis.get().await {
        // 清除文章列表缓存
        let _: () = redis::cmd("DEL")
            .arg("posts:list:*")
            .query_async(&mut conn)
            .await
            .unwrap_or(());
    }
}

/// Extract media references from post content and sync post_media associations.
async fn sync_post_media(
    conn: &mut sqlx::PgConnection,
    post_id: Uuid,
    content: &str,
) -> Result<(), AppError> {
    // Delete existing post_media for this post
    sqlx::query("DELETE FROM post_media WHERE post_id = $1")
        .bind(post_id)
        .execute(&mut *conn)
        .await?;

    // Find media items whose storage_path or filename appears in the content
    let media_rows: Vec<(Uuid,)> = sqlx::query_as::<sqlx::Postgres, (Uuid,)>(
        "SELECT id FROM media WHERE $1 LIKE '%' || storage_path || '%' OR $1 LIKE '%' || filename || '%'"
    )
    .bind(content)
    .fetch_all(&mut *conn)
    .await
    .unwrap_or_default();

    for (idx, (media_id,)) in media_rows.iter().enumerate() {
        sqlx::query(
            "INSERT INTO post_media (post_id, media_id, position) VALUES ($1, $2, $3) ON CONFLICT (post_id, media_id) DO NOTHING"
        )
        .bind(post_id)
        .bind(media_id)
        .bind(idx as i32)
        .execute(&mut *conn)
        .await
        .inspect_err(|e| tracing::warn!("Failed to insert post_media row: {}", e))?;
    }

    // Recalculate usage_count for all media
    sqlx::query(
        "UPDATE media SET usage_count = (SELECT COUNT(*) FROM post_media WHERE media_id = media.id)"
    )
    .execute(&mut *conn)
    .await?;

    Ok(())
}
