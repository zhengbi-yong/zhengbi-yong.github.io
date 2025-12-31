use axum::{
    extract::{Path, Query, State, Extension},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::ToSchema;

use blog_shared::{AppError, AuthUser};
use crate::state::AppState;

// ===== API 模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ReadingProgressRequest {
    pub progress: i32,          // 0-100
    pub scroll_percentage: f64, // 0.0-1.0
    pub last_read_position: Option<i32>, // 滚动位置(像素)
    pub word_count: Option<i32>,
    pub words_read: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ReadingProgressResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub post_slug: String,
    pub progress: i32,
    pub scroll_percentage: Option<f64>,
    pub last_read_position: Option<i32>,
    pub word_count: i32,
    pub words_read: Option<i32>,
    pub is_completed: bool,
    pub last_read_at: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateReadingProgressRequest {
    pub progress: i32,
    pub scroll_percentage: f64,
    pub last_read_position: Option<i32>,
    pub words_read: Option<i32>,
}

// ===== 辅助函数 =====

async fn get_reading_progress(
    user_id: Uuid,
    post_slug: &str,
    state: &AppState,
) -> Result<Option<ReadingProgressResponse>, AppError> {
    let row = sqlx::query_as!(
        ReadingProgressResponse,
        r#"
        SELECT
            id,
            user_id,
            post_slug,
            progress,
            scroll_percentage,
            last_read_position,
            COALESCE(word_count, 0) as "word_count!",
            words_read,
            COALESCE(is_completed, false) as "is_completed!",
            to_char(last_read_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "last_read_at!",
            to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "created_at!",
            to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "updated_at!"
        FROM reading_progress
        WHERE user_id = $1 AND post_slug = $2
        "#,
        user_id,
        post_slug
    )
    .fetch_optional(&state.db)
    .await?;

    Ok(row)
}

// ===== API 路由处理函数 =====

/// 获取文章阅读进度
#[utoipa::path(
    get,
    path = "/v1/posts/{slug}/reading-progress",
    tag = "reading-progress",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("slug" = String, Path, description = "文章slug"),
    ),
    responses(
        (status = 200, description = "成功获取阅读进度", body = ReadingProgressResponse),
        (status = 401, description = "未授权"),
    ),
)]
pub async fn get_reading_progress_handler(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.id;

    let progress = get_reading_progress(user_id, &slug, &state).await?;

    match progress {
        Some(p) => Ok(Json(p)),
        None => {
            // 返回空的进度对象
            Ok(Json(ReadingProgressResponse {
                id: Uuid::nil(),
                user_id,
                post_slug: slug.clone(),
                progress: 0,
                scroll_percentage: Some(0.0),
                last_read_position: Some(0),
                word_count: 0,
                words_read: Some(0),
                is_completed: false,
                last_read_at: Utc::now().to_rfc3339(),
                created_at: Utc::now().to_rfc3339(),
                updated_at: Utc::now().to_rfc3339(),
            }))
        }
    }
}

/// 更新或创建阅读进度
#[utoipa::path(
    post,
    path = "/v1/posts/{slug}/reading-progress",
    tag = "reading-progress",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("slug" = String, Path, description = "文章slug"),
    ),
    request_body = UpdateReadingProgressRequest,
    responses(
        (status = 200, description = "成功更新阅读进度", body = ReadingProgressResponse),
        (status = 201, description = "成功创建阅读进度", body = ReadingProgressResponse),
        (status = 401, description = "未授权"),
    ),
)]
pub async fn update_reading_progress_handler(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(slug): Path<String>,
    Json(req): Json<UpdateReadingProgressRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.id;

    // 验证进度值
    if req.progress < 0 || req.progress > 100 {
        return Err(AppError::InvalidInput);
    }

    if req.scroll_percentage < 0.0 || req.scroll_percentage > 1.0 {
        return Err(AppError::InvalidInput);
    }

    // 检查是否已存在进度记录
    let existing = get_reading_progress(user_id, &slug, &state).await?;

    let is_completed = req.progress >= 100;

    match existing {
        Some(_) => {
            // 更新现有记录
            let progress = sqlx::query_as!(
                ReadingProgressResponse,
                r#"
                UPDATE reading_progress
                SET
                    progress = $1,
                    scroll_percentage = $2,
                    last_read_position = COALESCE($3, last_read_position),
                    words_read = COALESCE($4, words_read),
                    is_completed = $5,
                    last_read_at = NOW()
                WHERE user_id = $6 AND post_slug = $7
                RETURNING
                    id,
                    user_id,
                    post_slug,
                    progress,
                    scroll_percentage,
                    last_read_position,
                    COALESCE(word_count, 0) as "word_count!",
                    words_read,
                    COALESCE(is_completed, false) as "is_completed!",
                    to_char(last_read_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "last_read_at!",
                    to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "created_at!",
                    to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "updated_at!"
                "#,
                req.progress,
                req.scroll_percentage,
                req.last_read_position,
                req.words_read,
                is_completed,
                user_id,
                slug
            )
            .fetch_one(&state.db)
            .await?;
            Ok((StatusCode::OK, Json(progress)).into_response())
        }
        None => {
            // 创建新记录
            let progress = sqlx::query_as!(
                ReadingProgressResponse,
                r#"
                INSERT INTO reading_progress (
                    user_id, post_slug, progress, scroll_percentage,
                    last_read_position, words_read, is_completed
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id,
                    user_id,
                    post_slug,
                    progress,
                    scroll_percentage,
                    last_read_position,
                    COALESCE(word_count, 0) as "word_count!",
                    words_read,
                    COALESCE(is_completed, false) as "is_completed!",
                    to_char(last_read_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "last_read_at!",
                    to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "created_at!",
                    to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "updated_at!"
                "#,
                user_id,
                slug,
                req.progress,
                req.scroll_percentage,
                req.last_read_position.unwrap_or(0),
                req.words_read.unwrap_or(0),
                is_completed
            )
            .fetch_one(&state.db)
            .await?;
            Ok((StatusCode::CREATED, Json(progress)).into_response())
        }
    }
}

/// 获取用户的阅读历史
#[utoipa::path(
    get,
    path = "/v1/reading-progress/history",
    tag = "reading-progress",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("limit" = Option<u32>, Query, description = "返回数量限制", example = 20),
    ("offset" = Option<u32>, Query, description = "偏移量", example = 0),
    ("completed_only" = Option<bool>, Query, description = "仅返回已读文章"),
    ),
    responses(
        (status = 200, description = "成功获取阅读历史", body = Vec<ReadingProgressResponse>),
        (status = 401, description = "未授权"),
    ),
)]
pub async fn get_reading_history_handler(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(params): Query<ReadingHistoryQuery>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.id;
    let limit = params.limit.unwrap_or(20).min(100) as i64;
    let offset = params.offset.unwrap_or(0) as i64;

    let history = if params.completed_only.unwrap_or(false) {
        // 仅返回已读文章
        sqlx::query_as!(
            ReadingProgressResponse,
            r#"
            SELECT
                id,
                user_id,
                post_slug,
                progress,
                scroll_percentage,
                last_read_position,
                COALESCE(word_count, 0) as "word_count!",
                words_read,
                COALESCE(is_completed, false) as "is_completed!",
                to_char(last_read_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "last_read_at!",
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "created_at!",
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "updated_at!"
            FROM reading_progress
            WHERE user_id = $1 AND is_completed = TRUE
            ORDER BY last_read_at DESC LIMIT $2 OFFSET $3
            "#,
            user_id,
            limit,
            offset
        )
        .fetch_all(&state.db)
        .await?
    } else {
        // 返回所有阅读历史
        sqlx::query_as!(
            ReadingProgressResponse,
            r#"
            SELECT
                id,
                user_id,
                post_slug,
                progress,
                scroll_percentage,
                last_read_position,
                COALESCE(word_count, 0) as "word_count!",
                words_read,
                COALESCE(is_completed, false) as "is_completed!",
                to_char(last_read_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "last_read_at!",
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "created_at!",
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "updated_at!"
            FROM reading_progress
            WHERE user_id = $1
            ORDER BY last_read_at DESC LIMIT $2 OFFSET $3
            "#,
            user_id,
            limit,
            offset
        )
        .fetch_all(&state.db)
        .await?
    };

    Ok(Json(history))
}

/// 删除阅读进度
#[utoipa::path(
    delete,
    path = "/v1/posts/{slug}/reading-progress",
    tag = "reading-progress",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("slug" = String, Path, description = "文章slug"),
    ),
    responses(
        (status = 204, description = "成功删除阅读进度"),
        (status = 401, description = "未授权"),
    ),
)]
pub async fn delete_reading_progress_handler(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.id;

    sqlx::query("DELETE FROM reading_progress WHERE user_id = $1 AND post_slug = $2")
        .bind(user_id)
        .bind(&slug)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

// ===== 查询参数模型 =====

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct ReadingHistoryQuery {
    pub limit: Option<u32>,
    pub offset: Option<u32>,
    pub completed_only: Option<bool>,
}
