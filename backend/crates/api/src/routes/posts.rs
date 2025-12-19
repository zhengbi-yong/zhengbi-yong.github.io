use axum::{
    extract::{Path, State},
    http::header,
    response::{IntoResponse, Json},
};
use blog_db::PostStatsResponse;
use blog_shared::{AppError, AuthUser};
use utoipa;

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
    State(state): State<crate::AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // 尝试从 Redis 缓存获取
    let cache_key = format!("post_stats:{}", slug);

    let mut conn = state.redis.get().await
        .map_err(|_| AppError::InternalError)?;

    if let Ok(cached) = redis::cmd("GET")
        .arg(&cache_key)
        .query_async::<Option<String>>(&mut conn)
        .await
    {
        if let Some(cached_str) = &cached {
            if let Ok(stats) = serde_json::from_str::<PostStatsResponse>(cached_str) {
            return Ok((
                [
                    (header::CACHE_CONTROL, "public, s-maxage=5, stale-while-revalidate=60"),
                    (header::ETAG, format!("\"{}\"", compute_etag(&stats)).as_str()),
                ],
                Json(stats),
            ).into_response());
            }
        }
    }

    // 从数据库获取
    let stats_row = sqlx::query!(
        "SELECT slug, view_count, like_count, comment_count, updated_at FROM post_stats WHERE slug = $1",
        slug
    )
    .fetch_optional(&state.db)
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
                (header::CACHE_CONTROL, "public, s-maxage=5, stale-while-revalidate=60"),
                (header::ETAG, format!("\"{}\"", compute_etag(&response)).as_str()),
            ],
            Json(response),
        ).into_response())
    } else {
        // 如果统计不存在，创建默认值
        let default_stats = PostStatsResponse {
            slug: slug.clone(),
            view_count: 0,
            like_count: 0,
            comment_count: 0,
            updated_at: chrono::Utc::now(),
        };

        sqlx::query!(
            "INSERT INTO post_stats (slug) VALUES ($1)",
            slug
        )
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
    State(state): State<crate::AppState>,
    Path(slug): Path<String>,
) -> Result<(), AppError> {
    // 检查文章是否存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM post_stats WHERE slug = $1)"
    )
    .bind(&slug)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::PostNotFound);
    }

    // Redis 计数
    let mut conn = state.redis.get().await
        .map_err(|_| AppError::InternalError)?;
    let pv_key = format!("pv:{}", slug);
    let count: i64 = redis::cmd("INCR")
        .arg(&pv_key)
        .query_async(&mut conn)
        .await?;

    // 每 10 次浏览写入一次 outbox
    if count % 10 == 0 {
        sqlx::query!(
            r#"
            INSERT INTO outbox_events (topic, payload, run_after)
            VALUES ('post.viewed', $1, NOW())
            "#,
            serde_json::json!({
                "slug": slug,
                "count": count,
            })
        )
        .execute(&state.db)
        .await?;
    }

    Ok(())
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
    State(state): State<crate::AppState>,
    auth_user: AuthUser,
    Path(slug): Path<String>,
) -> Result<(), AppError> {
    // 使用事务确保原子性
    let mut tx = state.db.begin().await?;

    // 检查文章是否存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM post_stats WHERE slug = $1)"
    )
    .bind(&slug)
    .fetch_one(&mut *tx)
    .await?;

    if !exists {
        tx.rollback().await?;
        return Err(AppError::PostNotFound);
    }

    // 检查是否已点赞
    let already_liked: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM post_likes WHERE slug = $1 AND user_id = $2)"
    )
    .bind(&slug)
    .bind(&auth_user.id)
    .fetch_one(&mut *tx)
    .await?;

    if already_liked {
        tx.rollback().await?;
        return Err(AppError::AlreadyLiked);
    }

    // 添加点赞记录
    sqlx::query!(
        "INSERT INTO post_likes (slug, user_id) VALUES ($1, $2)",
        slug,
        auth_user.id
    )
    .execute(&mut *tx)
    .await?;

    // 更新计数
    sqlx::query!(
        "UPDATE post_stats SET like_count = like_count + 1 WHERE slug = $1",
        slug
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 清除缓存
    let mut conn = state.redis.get().await
        .map_err(|_| AppError::InternalError)?;
    let cache_key = format!("post_stats:{}", slug);
    let _: () = redis::cmd("DEL")
        .arg(&cache_key)
        .query_async(&mut conn)
        .await?;

    Ok(())
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
    State(state): State<crate::AppState>,
    auth_user: AuthUser,
    Path(slug): Path<String>,
) -> Result<(), AppError> {
    // 使用事务确保原子性
    let mut tx = state.db.begin().await?;

    // 检查是否已点赞
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM post_likes WHERE slug = $1 AND user_id = $2)"
    )
    .bind(&slug)
    .bind(&auth_user.id)
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
    let mut conn = state.redis.get().await
        .map_err(|_| AppError::InternalError)?;
    let cache_key = format!("post_stats:{}", slug);
    let _: () = redis::cmd("DEL")
        .arg(&cache_key)
        .query_async(&mut conn)
        .await?;

    Ok(())
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