use crate::state::AppState;
use axum::{
    extract::{Extension, Path, Query, State},
    response::IntoResponse,
    Json,
};
use blog_db::{Notification, NotificationListParams, NotificationListResponse, UnreadCountResponse};
use blog_shared::{AppError, AuthUser};
use uuid::Uuid;

/// 获取通知列表
#[utoipa::path(
    get,
    path = "/notifications",
    tag = "social",
    params(NotificationListParams),
    responses(
        (status = 200, description = "通知列表", body = NotificationListResponse),
        (status = 401, description = "未认证")
    ),
    security(("bearer_auth" = []))
)]
pub async fn list_notifications(
    Extension(auth_user): Extension<AuthUser>,
    Query(params): Query<NotificationListParams>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).min(50);
    let offset = ((page - 1) * limit) as i64;
    let unread_only = params.unread_only.unwrap_or(false);

    // Count total
    let total = if unread_only {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false"
        )
        .bind(auth_user.id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(0)
    } else {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1"
        )
        .bind(auth_user.id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(0)
    };

    // Count unread (global)
    let unread_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false"
    )
    .bind(auth_user.id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    let query = if unread_only {
        r#"SELECT id, user_id, type as "notification_type!: blog_db::NotificationType",
           title, body, link, is_read, actor_id, metadata, created_at
        FROM notifications
        WHERE user_id = $1 AND is_read = false
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3"#
    } else {
        r#"SELECT id, user_id, type as "notification_type!: blog_db::NotificationType",
           title, body, link, is_read, actor_id, metadata, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3"#
    };

    let notifications = sqlx::query_as::<_, Notification>(query)
        .bind(auth_user.id)
        .bind(limit as i64)
        .bind(offset)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch notifications: {e}");
            AppError::InternalError
        })?;

    Ok(Json(NotificationListResponse {
        notifications,
        unread_count,
        total,
        page,
        limit,
    }))
}

/// 获取未读通知数量
#[utoipa::path(
    get,
    path = "/notifications/unread-count",
    tag = "social",
    responses(
        (status = 200, description = "未读数量", body = UnreadCountResponse),
        (status = 401, description = "未认证")
    ),
    security(("bearer_auth" = []))
)]
pub async fn unread_count(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false"
    )
    .bind(auth_user.id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    Ok(Json(UnreadCountResponse { unread_count: count }))
}

/// 标记单条通知已读
#[utoipa::path(
    post,
    path = "/notifications/{id}/read",
    tag = "social",
    params(("id" = Uuid, Path, description = "通知ID")),
    responses(
        (status = 200, description = "已标记"),
        (status = 401, description = "未认证"),
        (status = 404, description = "通知不存在")
    ),
    security(("bearer_auth" = []))
)]
pub async fn mark_read(
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let result = sqlx::query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2"
    )
    .bind(id)
    .bind(auth_user.id)
    .execute(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("not found".into()));
    }

    Ok(Json(serde_json::json!({"status": "ok"})))
}

/// 标记全部通知已读
#[utoipa::path(
    post,
    path = "/notifications/read-all",
    tag = "social",
    responses(
        (status = 200, description = "全部已标记"),
        (status = 401, description = "未认证")
    ),
    security(("bearer_auth" = []))
)]
pub async fn mark_all_read(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    sqlx::query(
        "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false"
    )
    .bind(auth_user.id)
    .execute(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    Ok(Json(serde_json::json!({"status": "ok"})))
}
