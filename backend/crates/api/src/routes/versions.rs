use axum::{
    extract::{Path, Query, State, Extension},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
};
use blog_db::cms::*;
use blog_shared::{AppError, AuthUser};
use crate::state::AppState;
use utoipa;
use uuid::Uuid;

/// 创建文章版本
#[utoipa::path(
    post,
    path = "/admin/posts/{post_id}/versions",
    tag = "admin/versions",
    params(
        ("post_id" = Uuid, Path, description = "文章ID")
    ),
    request_body = CreateVersionRequest,
    responses(
        (status = 201, description = "创建成功", body = PostVersion),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 404, description = "文章不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn create_version(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(post_id): Path<Uuid>,
    Json(req): Json<CreateVersionRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 检查文章是否存在
    let post_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1 AND deleted_at IS NULL)"
    )
    .bind(post_id)
    .fetch_one(&state.db)
    .await?;

    if !post_exists {
        return Err(AppError::NotFound("Post not found".to_string()));
    }

    // 获取当前最大版本号
    let max_version: Option<i32> = sqlx::query_scalar(
        "SELECT MAX(version_number) FROM post_versions WHERE post_id = $1"
    )
    .bind(post_id)
    .fetch_one(&state.db)
    .await?;

    let new_version = max_version.unwrap_or(0) + 1;

    // 创建新版本
    let version = sqlx::query_as!(
        PostVersion,
        r#"
        INSERT INTO post_versions (post_id, version_number, title, content, summary, change_log, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, post_id, version_number, title, content, summary, change_log, created_by, created_at
        "#,
        post_id,
        new_version,
        req.title,
        req.content,
        req.summary,
        req.change_log,
        auth_user.id
    )
    .fetch_one(&state.db)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(version),
    ))
}

/// 获取文章的所有版本
#[utoipa::path(
    get,
    path = "/admin/posts/{post_id}/versions",
    tag = "admin/versions",
    params(
        ("post_id" = Uuid, Path, description = "文章ID")
    ),
    responses(
        (status = 200, description = "获取成功", body = Vec<PostVersionWithUser>),
        (status = 401, description = "未认证"),
        (status = 404, description = "文章不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn list_versions(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    // 检查文章是否存在
    let post_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1 AND deleted_at IS NULL)"
    )
    .bind(post_id)
    .fetch_one(&state.db)
    .await?;

    if !post_exists {
        return Err(AppError::NotFound("Post not found".to_string()));
    }

    let versions: Vec<PostVersionWithUser> = sqlx::query_as!(
        PostVersionWithUser,
        r#"
        SELECT
            pv.id, pv.post_id, pv.version_number,
            pv.title, pv.content, pv.summary,
            pv.change_log, pv.created_by,
            u.username as "created_by_name?",
            pv.created_at
        FROM post_versions pv
        LEFT JOIN users u ON pv.created_by = u.id
        WHERE pv.post_id = $1
        ORDER BY pv.version_number DESC
        "#,
        post_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(versions).into_response())
}

/// 获取特定版本详情
#[utoipa::path(
    get,
    path = "/admin/posts/{post_id}/versions/{version_number}",
    tag = "admin/versions",
    params(
        ("post_id" = Uuid, Path, description = "文章ID"),
        ("version_number" = i32, Path, description = "版本号")
    ),
    responses(
        (status = 200, description = "获取成功", body = PostVersionWithUser),
        (status = 401, description = "未认证"),
        (status = 404, description = "版本不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn get_version(
    State(state): State<AppState>,
    Path((post_id, version_number)): Path<(Uuid, i32)>,
) -> Result<impl IntoResponse, AppError> {
    let version = sqlx::query_as!(
        PostVersionWithUser,
        r#"
        SELECT
            pv.id, pv.post_id, pv.version_number,
            pv.title, pv.content, pv.summary,
            pv.change_log, pv.created_by,
            u.username as "created_by_name?",
            pv.created_at
        FROM post_versions pv
        LEFT JOIN users u ON pv.created_by = u.id
        WHERE pv.post_id = $1 AND pv.version_number = $2
        "#,
        post_id,
        version_number
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Version not found".to_string()))?;

    Ok(Json(version).into_response())
}

/// 恢复到指定版本
#[utoipa::path(
    post,
    path = "/admin/posts/{post_id}/versions/{version_number}/restore",
    tag = "admin/versions",
    params(
        ("post_id" = Uuid, Path, description = "文章ID"),
        ("version_number" = i32, Path, description = "版本号")
    ),
    responses(
        (status = 200, description = "恢复成功", body = MessageResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "版本不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn restore_version(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path((post_id, version_number)): Path<(Uuid, i32)>,
) -> Result<impl IntoResponse, AppError> {
    let mut tx = state.db.begin().await?;

    // 获取要恢复的版本
    let version = sqlx::query!(
        "SELECT title, content, summary FROM post_versions WHERE post_id = $1 AND version_number = $2",
        post_id,
        version_number
    )
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("Version not found".to_string()))?;

    // 更新文章内容
    sqlx::query!(
        r#"
        UPDATE posts
        SET title = $1, content = $2, summary = $3, updated_at = NOW()
        WHERE id = $4
        "#,
        version.title,
        version.content,
        version.summary,
        post_id
    )
    .execute(&mut *tx)
    .await?;

    // 创建新版本（记录恢复操作）
    let max_version: Option<i32> = sqlx::query_scalar(
        "SELECT MAX(version_number) FROM post_versions WHERE post_id = $1"
    )
    .bind(post_id)
    .fetch_one(&mut *tx)
    .await?;

    let new_version = max_version.unwrap_or(0) + 1;

    sqlx::query!(
        r#"
        INSERT INTO post_versions (post_id, version_number, title, content, summary, change_log, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#,
        post_id,
        new_version,
        version.title,
        version.content,
        version.summary,
        Some(format!("Restored from version {}", version_number)),
        auth_user.id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 清除缓存
    clear_post_cache(&state, post_id).await;

    Ok(Json(MessageResponse {
        message: format!("Post restored to version {}", version_number),
    }))
}

/// 比较两个版本
#[utoipa::path(
    get,
    path = "/admin/posts/{post_id}/versions/compare",
    tag = "admin/versions",
    params(
        ("post_id" = Uuid, Path, description = "文章ID"),
        ("from" = i32, Query, description = "起始版本号"),
        ("to" = i32, Query, description = "目标版本号")
    ),
    responses(
        (status = 200, description = "比较成功", body = VersionCompareResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "版本不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn compare_versions(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
    Query(params): Query<CompareParams>,
) -> Result<impl IntoResponse, AppError> {
    let from_version = sqlx::query!(
        "SELECT version_number, title, content, summary FROM post_versions WHERE post_id = $1 AND version_number = $2",
        post_id,
        params.from_version
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("From version not found".to_string()))?;

    let to_version = sqlx::query!(
        "SELECT version_number, title, content, summary FROM post_versions WHERE post_id = $1 AND version_number = $2",
        post_id,
        params.to_version
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("To version not found".to_string()))?;

    // 简单的差异比较（实际可以使用更复杂的 diff 算法）
    let title_changed = from_version.title != to_version.title;
    let content_changed = from_version.content != to_version.content;
    let summary_changed = from_version.summary != to_version.summary;

    let response = VersionCompareResponse {
        from_version: from_version.version_number,
        to_version: to_version.version_number,
        title_changed,
        content_changed,
        summary_changed,
        from_title: from_version.title,
        to_title: to_version.title,
        from_summary: from_version.summary,
        to_summary: to_version.summary,
        // 注意：不返回完整内容，因为可能很大
    };

    Ok(Json(response).into_response())
}

/// 删除版本
#[utoipa::path(
    delete,
    path = "/admin/posts/{post_id}/versions/{version_number}",
    tag = "admin/versions",
    params(
        ("post_id" = Uuid, Path, description = "文章ID"),
        ("version_number" = i32, Path, description = "版本号")
    ),
    responses(
        (status = 200, description = "删除成功", body = MessageResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "版本不存在"),
        (status = 409, description = "不能删除最新版本")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn delete_version(
    State(state): State<AppState>,
    Path((post_id, version_number)): Path<(Uuid, i32)>,
) -> Result<impl IntoResponse, AppError> {
    let mut tx = state.db.begin().await?;

    // 检查版本是否存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM post_versions WHERE post_id = $1 AND version_number = $2)"
    )
    .bind(post_id)
    .bind(version_number)
    .fetch_one(&mut *tx)
    .await?;

    if !exists {
        tx.rollback().await?;
        return Err(AppError::NotFound("Version not found".to_string()));
    }

    // 检查是否是最新版本
    let max_version: Option<i32> = sqlx::query_scalar(
        "SELECT MAX(version_number) FROM post_versions WHERE post_id = $1"
    )
    .bind(post_id)
    .fetch_one(&mut *tx)
    .await?;

    if Some(version_number) == max_version {
        tx.rollback().await?;
        return Err(AppError::Conflict("Cannot delete the latest version".to_string()));
    }

    // 删除版本
    sqlx::query!(
        "DELETE FROM post_versions WHERE post_id = $1 AND version_number = $2",
        post_id,
        version_number
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(MessageResponse {
        message: "Version deleted successfully".to_string(),
    }))
}

// ===== 辅助结构体 =====

#[derive(serde::Deserialize)]
pub struct CompareParams {
    pub from_version: i32,
    pub to_version: i32,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct VersionCompareResponse {
    pub from_version: i32,
    pub to_version: i32,
    pub title_changed: bool,
    pub content_changed: bool,
    pub summary_changed: bool,
    pub from_title: String,
    pub to_title: String,
    pub from_summary: Option<String>,
    pub to_summary: Option<String>,
}

// ===== 缓存辅助函数 =====

async fn clear_post_cache(state: &AppState, post_id: Uuid) {
    // 根据 post_id 查找 slug 并清除缓存
    if let Ok(Some(slug)) = sqlx::query_scalar::<_, String>(
        "SELECT slug FROM posts WHERE id = $1"
    )
    .bind(post_id)
    .fetch_optional(&state.db)
    .await
    {
        if let Ok(mut conn) = state.redis.get().await {
            let _: () = redis::cmd("DEL")
                .arg(format!("post:{}", slug))
                .query_async(&mut conn)
                .await
                .unwrap_or(());
        }
    }
}
