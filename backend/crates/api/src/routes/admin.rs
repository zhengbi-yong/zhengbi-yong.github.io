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
    pub search: Option<String>,
    pub status: Option<String>,
    pub role: Option<String>,
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
    pub status: String,
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
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub cover_image_url: Option<String>,
    pub status: String,
    pub published_at: Option<String>,
    pub category_name: Option<String>,
    pub author_name: Option<String>,
    pub view_count: i64,
    pub like_count: i32,
    pub comment_count: i32,
    pub created_at: String,
    pub updated_at: String,
    pub reading_time: Option<i32>,
    pub is_featured: bool,
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

    // 构建 WHERE 条件 - 值通过绑定参数传递防止 SQL 注入
    // 注意：列名是固定的（email, username, status, role），用户只能控制值
    let mut conditions = Vec::new();
    let mut search_like: Option<String> = None;
    let mut status_filter: Option<String> = None;
    let mut role_filter: Option<String> = None;

    if let Some(ref search) = query.search {
        search_like = Some(format!("%{}%", search));
        conditions.push("(u.email ILIKE $1 OR u.username ILIKE $2)".to_string());
    }
    if let Some(ref status) = query.status {
        let idx = if search_like.is_some() { 3 } else { 1 };
        status_filter = Some(status.clone());
        conditions.push(format!("u.status = ${}", idx));
    }
    if let Some(ref role) = query.role {
        let idx = if search_like.is_some() {
            if status_filter.is_some() {
                4
            } else {
                3
            }
        } else {
            if status_filter.is_some() {
                2
            } else {
                1
            }
        };
        role_filter = Some(role.clone());
        conditions.push(format!("u.role = ${}", idx));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", conditions.join(" AND "))
    };

    // 获取总数
    let count_query = format!("SELECT COUNT(*) FROM users u{}", where_clause);
    let total: i64 = if let Some(ref search) = search_like {
        let status = status_filter.as_deref();
        let role = role_filter.as_deref();
        if let (Some(s), Some(r)) = (status, role) {
            sqlx::query_scalar(&count_query)
                .bind(search)
                .bind(search)
                .bind(s)
                .bind(r)
                .fetch_one(&state.db)
                .await?
        } else if let Some(s) = status {
            sqlx::query_scalar(&count_query)
                .bind(search)
                .bind(search)
                .bind(s)
                .fetch_one(&state.db)
                .await?
        } else if let Some(r) = role {
            sqlx::query_scalar(&count_query)
                .bind(search)
                .bind(search)
                .bind(r)
                .fetch_one(&state.db)
                .await?
        } else {
            sqlx::query_scalar(&count_query)
                .bind(search)
                .bind(search)
                .fetch_one(&state.db)
                .await?
        }
    } else if let Some(ref status) = status_filter {
        if let Some(ref role) = role_filter {
            sqlx::query_scalar(&count_query)
                .bind(status)
                .bind(role)
                .fetch_one(&state.db)
                .await?
        } else {
            sqlx::query_scalar(&count_query)
                .bind(status)
                .fetch_one(&state.db)
                .await?
        }
    } else if let Some(ref role) = role_filter {
        sqlx::query_scalar(&count_query)
            .bind(role)
            .fetch_one(&state.db)
            .await?
    } else {
        sqlx::query_scalar(&count_query)
            .fetch_one(&state.db)
            .await?
    };

    // 获取用户列表
    let list_query = format!(
        "SELECT u.id, u.email, u.username, u.role, u.status, u.email_verified, u.created_at::text \
         FROM users u{} ORDER BY u.created_at DESC LIMIT {} OFFSET {}",
        where_clause, page_size, offset
    );
    let users: Vec<UserListItem> = if let Some(ref search) = search_like {
        let status = status_filter.as_deref();
        let role = role_filter.as_deref();
        if let (Some(s), Some(r)) = (status, role) {
            sqlx::query_as::<_, UserListItem>(&list_query)
                .bind(search)
                .bind(search)
                .bind(s)
                .bind(r)
                .fetch_all(&state.db)
                .await?
        } else if let Some(s) = status {
            sqlx::query_as::<_, UserListItem>(&list_query)
                .bind(search)
                .bind(search)
                .bind(s)
                .fetch_all(&state.db)
                .await?
        } else if let Some(r) = role {
            sqlx::query_as::<_, UserListItem>(&list_query)
                .bind(search)
                .bind(search)
                .bind(r)
                .fetch_all(&state.db)
                .await?
        } else {
            sqlx::query_as::<_, UserListItem>(&list_query)
                .bind(search)
                .bind(search)
                .fetch_all(&state.db)
                .await?
        }
    } else if let Some(ref status) = status_filter {
        if let Some(ref role) = role_filter {
            sqlx::query_as::<_, UserListItem>(&list_query)
                .bind(status)
                .bind(role)
                .fetch_all(&state.db)
                .await?
        } else {
            sqlx::query_as::<_, UserListItem>(&list_query)
                .bind(status)
                .fetch_all(&state.db)
                .await?
        }
    } else if let Some(ref role) = role_filter {
        sqlx::query_as::<_, UserListItem>(&list_query)
            .bind(role)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query_as::<_, UserListItem>(&list_query)
            .fetch_all(&state.db)
            .await?
    };

    Ok(Json(UserListResponse {
        users,
        total,
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

// ===== 用户增强管理 API =====

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CreateUserRequest {
    pub email: String,
    pub username: String,
    pub password: String,
    pub role: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct UserDetailItem {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub role: String,
    pub status: String,
    pub email_verified: bool,
    pub profile: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub username: Option<String>,
    pub role: Option<String>,
    pub status: Option<String>,
    pub email_verified: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BatchUpdateRoleRequest {
    pub user_ids: Vec<Uuid>,
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BatchDeleteUsersRequest {
    pub user_ids: Vec<Uuid>,
}

/// 创建用户（管理员）
#[utoipa::path(
    post,
    path = "/admin/users",
    tag = "admin",
    security(("BearerAuth" = [])),
    request_body = CreateUserRequest,
    responses(
        (status = 201, description = "成功创建用户", body = UserDetailItem),
        (status = 400, description = "输入无效"),
        (status = 409, description = "邮箱或用户名已存在"),
    ),
)]
pub async fn create_user(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    // 验证密码强度
    let validator = blog_shared::PasswordValidator::default();
    validator
        .validate(&req.password)
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // 验证角色
    let role = req.role.unwrap_or_else(|| "user".to_string());
    if !["user", "admin", "moderator"].contains(&role.as_str()) {
        return Err(AppError::InvalidInput);
    }

    // 密码哈希
    let password_hash = state.jwt.hash_password(&req.password)?;

    // 插入用户
    let user = sqlx::query_as::<_, UserDetailItem>(
        "INSERT INTO users (email, username, password_hash, role, email_verified)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, email, username, role, status, email_verified, profile, created_at::text, updated_at::text",
    )
    .bind(&req.email)
    .bind(&req.username)
    .bind(&password_hash)
    .bind(&role)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::Database(ref db_err) if db_err.code().as_deref() == Some("23505") => {
            if db_err.message().contains("email") {
                AppError::EmailAlreadyExists
            } else {
                AppError::UsernameAlreadyExists
            }
        }
        _ => AppError::Database(e),
    })?;

    Ok((StatusCode::CREATED, Json(user)))
}

/// 获取用户详情
#[utoipa::path(
    get,
    path = "/admin/users/{id}",
    tag = "admin",
    security(("BearerAuth" = [])),
    params(("id" = Uuid, Path, description = "用户ID")),
    responses(
        (status = 200, description = "成功获取用户详情", body = UserDetailItem),
        (status = 404, description = "用户不存在"),
    ),
)]
pub async fn get_user(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(target_user_id): Path<Uuid>,
) -> Result<Json<UserDetailItem>, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    let user = sqlx::query_as::<_, UserDetailItem>(
        "SELECT id, email, username, role, status, email_verified, profile, created_at::text, updated_at::text
         FROM users WHERE id = $1",
    )
    .bind(target_user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::UserNotFound)?;

    Ok(Json(user))
}

/// 更新用户信息
#[utoipa::path(
    put,
    path = "/admin/users/{id}",
    tag = "admin",
    security(("BearerAuth" = [])),
    params(("id" = Uuid, Path, description = "用户ID")),
    request_body = UpdateUserRequest,
    responses(
        (status = 200, description = "成功更新用户", body = UserDetailItem),
        (status = 400, description = "输入无效"),
        (status = 404, description = "用户不存在"),
    ),
)]
pub async fn update_user(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(target_user_id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<UserDetailItem>, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    // 验证角色值
    if let Some(ref role) = req.role {
        if !["user", "admin", "moderator"].contains(&role.as_str()) {
            return Err(AppError::InvalidInput);
        }
    }

    // 验证状态值
    if let Some(ref status) = req.status {
        if !["active", "suspended", "banned"].contains(&status.as_str()) {
            return Err(AppError::InvalidInput);
        }
    }

    // 构建动态 UPDATE — 使用原始 SQL 字符串拼接 + 直接绑定值
    let mut set_clauses = Vec::new();
    let mut bind_idx = 2u32; // $1 is always target_user_id

    if req.email.is_some() {
        set_clauses.push(format!("email = ${}", bind_idx));
        bind_idx += 1;
    }
    if req.username.is_some() {
        set_clauses.push(format!("username = ${}", bind_idx));
        bind_idx += 1;
    }
    if req.role.is_some() {
        set_clauses.push(format!("role = ${}", bind_idx));
        bind_idx += 1;
    }
    if req.status.is_some() {
        set_clauses.push(format!("status = ${}", bind_idx));
        bind_idx += 1;
    }
    if req.email_verified.is_some() {
        set_clauses.push(format!("email_verified = ${}", bind_idx));
    }

    if set_clauses.is_empty() {
        return Err(AppError::BadRequest("No fields to update".to_string()));
    }

    set_clauses.push("updated_at = NOW()".to_string());

    let query = format!(
        "UPDATE users SET {} WHERE id = $1 \
         RETURNING id, email, username, role, status, email_verified, profile, created_at::text, updated_at::text",
        set_clauses.join(", ")
    );

    let mut q = sqlx::query_as::<_, UserDetailItem>(&query);
    q = q.bind(target_user_id);

    if let Some(email) = req.email {
        q = q.bind(email);
    }
    if let Some(username) = req.username {
        q = q.bind(username);
    }
    if let Some(role) = req.role {
        q = q.bind(role);
    }
    let new_status = req.status.clone();
    if let Some(status) = req.status {
        q = q.bind(status);
    }
    if let Some(email_verified) = req.email_verified {
        q = q.bind(email_verified);
    }

    let user = q
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::UserNotFound)?;

    // 如果用户被停用或封禁，使其所有 token 失效
    if let Some(ref status) = new_status {
        if status == "suspended" || status == "banned" {
            if let Err(e) =
                crate::middleware::auth::blacklist_all_user_tokens(&state, target_user_id).await
            {
                tracing::warn!(
                    "Failed to invalidate tokens for user {}: {}",
                    target_user_id,
                    e
                );
            }
        }
    }

    Ok(Json(user))
}

/// 批量更新用户角色
#[utoipa::path(
    post,
    path = "/admin/users/batch/role",
    tag = "admin",
    security(("BearerAuth" = [])),
    request_body = BatchUpdateRoleRequest,
    responses(
        (status = 204, description = "成功批量更新角色"),
        (status = 400, description = "输入无效"),
    ),
)]
pub async fn batch_update_roles(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<BatchUpdateRoleRequest>,
) -> Result<impl IntoResponse, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    if !["user", "admin", "moderator"].contains(&req.role.as_str()) {
        return Err(AppError::InvalidInput);
    }

    if req.user_ids.is_empty() {
        return Err(AppError::BadRequest("No user IDs provided".to_string()));
    }

    // 不能修改自己的角色
    if req.user_ids.contains(&uid) {
        return Err(AppError::BadRequest(
            "Cannot change your own role".to_string(),
        ));
    }

    sqlx::query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = ANY($2)")
        .bind(&req.role)
        .bind(&req.user_ids)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

/// 批量删除用户
#[utoipa::path(
    post,
    path = "/admin/users/batch/delete",
    tag = "admin",
    security(("BearerAuth" = [])),
    request_body = BatchDeleteUsersRequest,
    responses(
        (status = 204, description = "成功批量删除"),
        (status = 400, description = "输入无效"),
    ),
)]
pub async fn batch_delete_users(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<BatchDeleteUsersRequest>,
) -> Result<impl IntoResponse, AppError> {
    let uid = auth_user.id;
    if !is_admin(uid, &state).await? {
        return Err(AppError::Unauthorized);
    }

    if req.user_ids.is_empty() {
        return Err(AppError::BadRequest("No user IDs provided".to_string()));
    }

    // 不能删除自己
    if req.user_ids.contains(&uid) {
        return Err(AppError::BadRequest("Cannot delete yourself".to_string()));
    }

    sqlx::query("DELETE FROM users WHERE id = ANY($1)")
        .bind(&req.user_ids)
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

    // 使用参数化查询防止 SQL 注入
    let (count_query, list_query, has_status_filter) = if let Some(ref _status) = query.status {
        let cq = "SELECT COUNT(*) FROM comments c WHERE c.status = $1";
        let lq = format!(
            r#"
            SELECT c.id, c.slug, c.user_id, c.content, c.status::text, c.created_at::text,
                   COALESCE(u.username, 'Anonymous') as username
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.status = $1
            ORDER BY c.created_at DESC LIMIT {} OFFSET {}
            "#,
            page_size, offset
        );
        (cq.to_string(), lq, true)
    } else {
        let cq = "SELECT COUNT(*) FROM comments c".to_string();
        let lq = format!(
            r#"
            SELECT c.id, c.slug, c.user_id, c.content, c.status::text, c.created_at::text,
                   COALESCE(u.username, 'Anonymous') as username
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC LIMIT {} OFFSET {}
            "#,
            page_size, offset
        );
        (cq, lq, false)
    };

    // 获取总数
    let total: i64 = if has_status_filter {
        sqlx::query_scalar(&count_query)
            .bind(&query.status)
            .fetch_one(&state.db)
            .await?
    } else {
        sqlx::query_scalar(&count_query)
            .fetch_one(&state.db)
            .await?
    };

    // 获取评论列表
    let comments: Vec<CommentAdminItem> = if has_status_filter {
        sqlx::query_as::<_, CommentAdminItem>(&list_query)
            .bind(&query.status)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query_as::<_, CommentAdminItem>(&list_query)
            .fetch_all(&state.db)
            .await?
    };

    Ok(Json(CommentListResponse {
        comments,
        total,
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

    // 获取总数（只统计未删除的）
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL")
        .fetch_one(&state.db)
        .await?;

    // 获取文章列表（关联 post_stats 获取统计数据）
    let posts = sqlx::query_as::<_, PostAdminItem>(
        "SELECT p.id, p.slug, p.title, p.summary,
                COALESCE(m.cdn_url, m.storage_path)::text as cover_image_url,
                INITCAP(p.status::text) as status, p.published_at::text, cat.name as category_name,
                COALESCE(p.author_display_name, u.username) as author_name,
                p.view_count,
                p.like_count,
                p.comment_count,
                p.created_at::text, p.updated_at::text,
                p.reading_time, p.is_featured
         FROM posts p
         LEFT JOIN media m ON p.cover_image_id = m.id
         LEFT JOIN categories cat ON p.category_id = cat.id
         LEFT JOIN users u ON p.author_id = u.id
         WHERE p.deleted_at IS NULL
         ORDER BY p.updated_at DESC
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
