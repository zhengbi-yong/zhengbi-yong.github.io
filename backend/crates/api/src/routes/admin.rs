use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;
use blog_shared::{AppError, AuthUser};

// ===== 简化的管理员权限检查 =====

async fn is_admin(user_id: Uuid, state: &AppState) -> Result<bool, AppError> {
    let role: Option<String> = sqlx::query_scalar("SELECT role FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?;

    Ok(role.as_deref() == Some("admin"))
}

// ===== API 模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserListQuery {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserListResponse {
    pub users: Vec<UserListItem>,
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct UserListItem {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub role: String,
    pub email_verified: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateUserRoleRequest {
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CommentListQuery {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CommentListResponse {
    pub comments: Vec<CommentAdminItem>,
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct CommentAdminItem {
    pub id: Uuid,
    pub slug: String,
    pub user_id: Option<Uuid>,
    pub username: Option<String>,
    pub content: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateCommentStatusRequest {
    pub status: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AdminStats {
    pub total_users: i64,
    pub total_comments: i64,
    pub pending_comments: i64,
    pub approved_comments: i64,
    pub rejected_comments: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostListQuery {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostListResponse {
    pub posts: Vec<PostAdminItem>,
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct PostAdminItem {
    pub slug: String,
    pub view_count: i64,
    pub like_count: i32,
    pub comment_count: i32,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserGrowthQuery {
    pub days: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserGrowthData {
    pub date: String,
    pub new_users: i64,
    pub cumulative_users: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserGrowthResponse {
    pub data: Vec<UserGrowthData>,
    pub total_users: i64,
}

// ===== 用户管理 API =====

#[utoipa::path(
    get,
    path = "/admin/users",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("page" = Option<u32>, Query, description = "页码，从1开始", example = 1),
        ("page_size" = Option<u32>, Query, description = "每页数量，1-100", example = 20),
    ),
    responses(
        (status = 200, description = "成功获取用户列表", body = UserListResponse),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn list_users(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<UserListQuery>,
) -> Result<Json<UserListResponse>, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(20).min(100);
    let offset = (page - 1) * page_size;

    // 获取总数
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await?;

    // 获取用户列表
    let users = sqlx::query_as::<_, UserListItem>(
        "SELECT id, email, username, role, email_verified, created_at::text FROM users
         ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(UserListResponse {
        users,
        total: total.0,
        page,
        page_size,
    }))
}

#[utoipa::path(
    put,
    path = "/admin/users/{id}/role",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "用户ID"),
    ),
    request_body = UpdateUserRoleRequest,
    responses(
        (status = 204, description = "成功更新用户角色"),
        (status = 400, description = "无效的角色值"),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn update_user_role(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(target_user_id): Path<Uuid>,
    Json(req): Json<UpdateUserRoleRequest>,
) -> Result<impl IntoResponse, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    // 验证角色值
    if !["user", "admin", "moderator"].contains(&req.role.as_str()) {
        return Err(AppError::InvalidInput);
    }

    sqlx::query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2")
        .bind(&req.role)
        .bind(target_user_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    delete,
    path = "/admin/users/{id}",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "用户ID"),
    ),
    responses(
        (status = 204, description = "成功删除用户"),
        (status = 400, description = "不能删除自己"),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn delete_user(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(target_user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    if uid == target_user_id {
        return Err(AppError::InvalidInput);
    }

    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(target_user_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

// ===== 评论管理 API =====

#[utoipa::path(
    get,
    path = "/admin/comments",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("page" = Option<u32>, Query, description = "页码，从1开始", example = 1),
        ("page_size" = Option<u32>, Query, description = "每页数量，1-100", example = 20),
        ("status" = Option<String>, Query, description = "评论状态筛选：pending, approved, rejected, spam"),
    ),
    responses(
        (status = 200, description = "成功获取评论列表", body = CommentListResponse),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn list_comments_admin(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<CommentListQuery>,
) -> Result<Json<CommentListResponse>, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(20).min(100);
    let offset = (page - 1) * page_size;

    // 构建查询
    let mut base_query = r#"
        SELECT c.id, c.slug, c.user_id, c.content, c.status::text, c.created_at::text,
               COALESCE(u.username, 'Anonymous') as username
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
    "#
    .to_string();

    let mut count_query = "SELECT COUNT(*) FROM comments".to_string();

    if let Some(status) = &query.status {
        base_query.push_str(&format!(" WHERE c.status = '{}'", status));
        count_query.push_str(&format!(" WHERE status = '{}'", status));
    }

    // 获取总数
    let total: (i64,) = sqlx::query_as(&count_query).fetch_one(&state.db).await?;

    // 获取评论列表
    let final_query = format!(
        "{} ORDER BY c.created_at DESC LIMIT {} OFFSET {}",
        base_query, page_size, offset
    );

    let comments = sqlx::query_as::<_, CommentAdminItem>(&final_query)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(CommentListResponse {
        comments,
        total: total.0,
        page,
        page_size,
    }))
}

#[utoipa::path(
    put,
    path = "/admin/comments/{id}/status",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "评论ID"),
    ),
    request_body = UpdateCommentStatusRequest,
    responses(
        (status = 204, description = "成功更新评论状态"),
        (status = 400, description = "无效的状态值"),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn update_comment_status(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(comment_id): Path<Uuid>,
    Json(req): Json<UpdateCommentStatusRequest>,
) -> Result<impl IntoResponse, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    // 验证状态值
    if !["pending", "approved", "rejected", "spam"].contains(&req.status.as_str()) {
        return Err(AppError::InvalidInput);
    }

    sqlx::query("UPDATE comments SET status = $1::comment_status, moderation_reason = $2, updated_at = NOW() WHERE id = $3")
        .bind(&req.status)
        .bind(&req.reason)
        .bind(comment_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    delete,
    path = "/admin/comments/{id}",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "评论ID"),
    ),
    responses(
        (status = 204, description = "成功删除评论"),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn delete_comment_admin(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(comment_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    sqlx::query("DELETE FROM comments WHERE id = $1")
        .bind(comment_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

// ===== 统计数据 API =====

#[utoipa::path(
    get,
    path = "/admin/stats",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    responses(
        (status = 200, description = "成功获取管理员统计数据", body = AdminStats),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn get_admin_stats(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
) -> Result<Json<AdminStats>, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    let total_users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await?;

    let total_comments: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM comments")
        .fetch_one(&state.db)
        .await?;

    let pending_comments: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM comments WHERE status = 'pending'")
            .fetch_one(&state.db)
            .await?;

    let approved_comments: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM comments WHERE status = 'approved'")
            .fetch_one(&state.db)
            .await?;

    let rejected_comments: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM comments WHERE status = 'rejected'")
            .fetch_one(&state.db)
            .await?;

    Ok(Json(AdminStats {
        total_users: total_users.0,
        total_comments: total_comments.0,
        pending_comments: pending_comments.0,
        approved_comments: approved_comments.0,
        rejected_comments: rejected_comments.0,
    }))
}

// ===== 文章管理 API =====

#[utoipa::path(
    get,
    path = "/admin/posts",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("page" = Option<u32>, Query, description = "页码，从1开始", example = 1),
        ("page_size" = Option<u32>, Query, description = "每页数量，1-100", example = 20),
    ),
    responses(
        (status = 200, description = "成功获取文章列表", body = PostListResponse),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn list_posts_admin(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<PostListQuery>,
) -> Result<Json<PostListResponse>, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(20).min(100);
    let offset = (page - 1) * page_size;

    // 获取总数
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM post_stats WHERE slug != ''")
        .fetch_one(&state.db)
        .await?;

    // 获取文章列表
    let posts = sqlx::query_as::<_, PostAdminItem>(
        "SELECT slug, view_count, like_count, comment_count, updated_at::text
         FROM post_stats
         WHERE slug != ''
         ORDER BY updated_at DESC
         LIMIT $1 OFFSET $2",
    )
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(PostListResponse {
        posts,
        total: total.0,
        page,
        page_size,
    }))
}

// ===== 用户增长数据 API =====

#[utoipa::path(
    get,
    path = "/admin/user-growth",
    tag = "admin",
    security(
        ("BearerAuth" = [])
    ),
    params(
        ("days" = Option<u32>, Query, description = "统计天数，1-90天", example = 30),
    ),
    responses(
        (status = 200, description = "成功获取用户增长数据", body = UserGrowthResponse),
        (status = 401, description = "未授权"),
        (status = 403, description = "权限不足，需要管理员权限"),
    ),
)]
pub async fn get_user_growth(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<UserGrowthQuery>,
) -> Result<Json<UserGrowthResponse>, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    let days = query.days.unwrap_or(30).min(90) as i64;

    // 计算起始日期
    let start_date = (chrono::Utc::now() - chrono::Duration::days(days))
        .naive_utc()
        .date();

    // 获取每天的用户注册数据
    let growth_data = sqlx::query!(
        r#"
        WITH date_series AS (
            SELECT generate_series(
                $1::date,
                CURRENT_DATE,
                INTERVAL '1 day'
            )::date as date
        ),
        user_counts AS (
            SELECT
                ds.date,
                COUNT(u.id) FILTER (WHERE DATE(u.created_at) = ds.date) as new_users,
                (
                    SELECT COUNT(*)
                    FROM users
                    WHERE DATE(created_at) <= ds.date
                ) as cumulative_users
            FROM date_series ds
            LEFT JOIN users u ON DATE(u.created_at) = ds.date
            GROUP BY ds.date
            ORDER BY ds.date
        )
        SELECT
            date::text as date,
            COALESCE(new_users, 0)::bigint as new_users,
            COALESCE(cumulative_users, 0)::bigint as cumulative_users
        FROM user_counts
        "#,
        start_date
    )
    .fetch_all(&state.db)
    .await?;

    let total_users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await?;

    let data = growth_data
        .into_iter()
        .map(|row| UserGrowthData {
            date: row.date.unwrap_or_default(),
            new_users: row.new_users.unwrap_or(0),
            cumulative_users: row.cumulative_users.unwrap_or(0),
        })
        .collect();

    Ok(Json(UserGrowthResponse {
        data,
        total_users: total_users.0,
    }))
}
