use crate::state::AppState;
use axum::{
    extract::{Extension, Json, Path, Query, State},
    response::IntoResponse,
};
use blog_db::{FollowListResponse, FollowWithUser, NotificationListParams};
use blog_shared::{AppError, AuthUser};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

/// 关注用户
#[utoipa::path(
    post,
    path = "/users/{username}/follow",
    tag = "social",
    params(("username" = String, Path, description = "要关注的用户名")),
    responses(
        (status = 201, description = "关注成功"),
        (status = 401, description = "未认证"),
        (status = 404, description = "用户不存在"),
        (status = 409, description = "已关注")
    ),
    security(("bearer_auth" = []))
)]
pub async fn follow_user(
    Extension(auth_user): Extension<AuthUser>,
    Path(username): Path<String>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    // Find target user
    let target = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL"
    )
    .bind(&username)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?
    .ok_or(AppError::NotFound("not found".into()))?;

    // Can't follow yourself
    if target == auth_user.id {
        return Err(AppError::BadRequest("bad request".into()));
    }

    // Check if already following
    let already = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2)"
    )
    .bind(auth_user.id)
    .bind(target)
    .fetch_one(&state.db)
    .await
    .unwrap_or(false);

    if already {
        return Err(AppError::Conflict("conflict".into()));
    }

    // Insert follow
    sqlx::query(
        "INSERT INTO follows (id, follower_id, followed_id) VALUES ($1, $2, $3)"
    )
    .bind(Uuid::new_v4())
    .bind(auth_user.id)
    .bind(target)
    .execute(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    // Create notification
    let actor_name = sqlx::query_scalar::<_, String>(
        "SELECT COALESCE(display_name, username) FROM users WHERE id = $1"
    )
    .bind(auth_user.id)
    .fetch_one(&state.db)
    .await
    .unwrap_or_default();

    sqlx::query(
        r#"INSERT INTO notifications (id, user_id, type, title, actor_id, metadata)
           VALUES ($1, $2, 'follow', $3, $4, '{}'::jsonb)"#
    )
    .bind(Uuid::new_v4())
    .bind(target)
    .bind(format!("{} 关注了你", actor_name))
    .bind(auth_user.id)
    .execute(&state.db)
    .await
    .ok();

    Ok(axum::http::StatusCode::CREATED)
}

/// 取消关注
#[utoipa::path(
    delete,
    path = "/users/{username}/follow",
    tag = "social",
    params(("username" = String, Path, description = "要取关的用户名")),
    responses(
        (status = 204, description = "取关成功"),
        (status = 401, description = "未认证"),
        (status = 404, description = "未关注")
    ),
    security(("bearer_auth" = []))
)]
pub async fn unfollow_user(
    Extension(auth_user): Extension<AuthUser>,
    Path(username): Path<String>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let target = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL"
    )
    .bind(&username)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?
    .ok_or(AppError::NotFound("not found".into()))?;

    let deleted = sqlx::query(
        "DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2"
    )
    .bind(auth_user.id)
    .bind(target)
    .execute(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    if deleted.rows_affected() == 0 {
        return Err(AppError::NotFound("not found".into()));
    }

    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// 检查是否已关注
#[derive(Debug, serde::Serialize, ToSchema)]
pub struct FollowStatus {
    pub following: bool,
}

#[utoipa::path(
    get,
    path = "/users/{username}/follow-status",
    tag = "social",
    params(("username" = String, Path, description = "用户名")),
    responses(
        (status = 200, description = "关注状态", body = FollowStatus)
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_follow_status(
    Extension(auth_user): Extension<AuthUser>,
    Path(username): Path<String>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let target = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL"
    )
    .bind(&username)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    let following = match target {
        Some(t) => sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2)"
        )
        .bind(auth_user.id)
        .bind(t)
        .fetch_one(&state.db)
        .await
        .unwrap_or(false),
        None => false,
    };

    Ok(Json(FollowStatus { following }))
}

/// 查询参数
#[derive(Debug, Deserialize, utoipa::IntoParams, ToSchema)]
pub struct FollowListParams {
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

/// 获取粉丝列表
#[utoipa::path(
    get,
    path = "/users/{username}/followers",
    tag = "social",
    params(
        ("username" = String, Path, description = "用户名"),
        FollowListParams
    ),
    responses(
        (status = 200, description = "粉丝列表", body = FollowListResponse),
        (status = 404, description = "用户不存在")
    )
)]
pub async fn get_followers(
    Path(username): Path<String>,
    Query(params): Query<FollowListParams>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).min(50);
    let offset = ((page - 1) * limit) as i64;

    let target = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL"
    )
    .bind(&username)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?
    .ok_or(AppError::NotFound("not found".into()))?;

    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM follows WHERE followed_id = $1"
    )
    .bind(target)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    let rows = sqlx::query_as!(
        FollowWithUser,
        r#"SELECT f.id as "id!", u.username, u.display_name,
           u.avatar_url, u.institution, u.research_fields,
           f.created_at
        FROM follows f
        JOIN users u ON f.follower_id = u.id
        WHERE f.followed_id = $1 AND u.deleted_at IS NULL
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3"#,
        target,
        limit as i64,
        offset,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    Ok(Json(FollowListResponse {
        users: rows,
        total,
        page,
        limit,
    }))
}

/// 获取关注列表
#[utoipa::path(
    get,
    path = "/users/{username}/following",
    tag = "social",
    params(
        ("username" = String, Path, description = "用户名"),
        FollowListParams
    ),
    responses(
        (status = 200, description = "关注列表", body = FollowListResponse),
        (status = 404, description = "用户不存在")
    )
)]
pub async fn get_following(
    Path(username): Path<String>,
    Query(params): Query<FollowListParams>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).min(50);
    let offset = ((page - 1) * limit) as i64;

    let target = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL"
    )
    .bind(&username)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?
    .ok_or(AppError::NotFound("not found".into()))?;

    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM follows WHERE follower_id = $1"
    )
    .bind(target)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    let rows = sqlx::query_as!(
        FollowWithUser,
        r#"SELECT f.id as "id!", u.username, u.display_name,
           u.avatar_url, u.institution, u.research_fields,
           f.created_at
        FROM follows f
        JOIN users u ON f.followed_id = u.id
        WHERE f.follower_id = $1 AND u.deleted_at IS NULL
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3"#,
        target,
        limit as i64,
        offset,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    Ok(Json(FollowListResponse {
        users: rows,
        total,
        page,
        limit,
    }))
}
