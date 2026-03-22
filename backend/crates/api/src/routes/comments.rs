use crate::state::AppState;
use ammonia::Builder;
use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use blog_db::{CommentListParams, CommentListResponse, CommentResponse, CreateCommentRequest};
use blog_shared::{AppError, AuthUser};
use sqlx::Row;
use utoipa;

// HTML 清理配置
fn sanitize_comment_html(input: &str) -> String {
    Builder::default()
        .add_tags(&["p", "br", "strong", "em", "code", "pre", "a", "blockquote"])
        .add_tag_attributes("a", &["href", "title"])
        .add_tag_attributes("pre", &["class"])
        .add_tag_attributes("code", &["class"])
        .link_rel(Some("nofollow ugc"))
        .url_relative(ammonia::UrlRelative::PassThrough)
        .clean(input)
        .to_string()
}

// 注意：真实 IP 提取需要添加 Request 参数
// TODO: 添加 Request 参数并使用 crate::utils::ip_extractor::extract_real_ip

// 提取 User-Agent
fn extract_user_agent() -> String {
    // TODO: 从请求中提取 User-Agent
    "unknown".to_string()
}

/// 创建评论
#[utoipa::path(
    post,
    path = "/posts/{slug}/comments",
    tag = "comments",
    params(
        ("slug" = String, Path, description = "文章slug")
    ),
    request_body = CreateCommentRequest,
    responses(
        (status = 201, description = "评论创建成功", body = CommentResponse),
        (status = 400, description = "评论内容为空"),
        (status = 401, description = "未认证"),
        (status = 404, description = "文章不存在"),
        (status = 429, description = "评论频率限制")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn create_comment(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(slug): Path<String>,
    Json(payload): Json<CreateCommentRequest>,
) -> Result<Json<CommentResponse>, AppError> {
    // 检查文章是否存在
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM post_stats WHERE slug = $1)")
            .bind(&slug)
            .fetch_one(&state.db)
            .await?;

    if !exists {
        return Err(AppError::PostNotFound);
    }

    // 验证内容
    if payload.content.trim().is_empty() {
        return Err(AppError::EmptyComment);
    }

    if payload.content.len() > 2000 {
        return Err(AppError::CommentTooLong);
    }

    // 计算路径和深度
    let (path, depth) = if let Some(parent_id) = payload.parent_id {
        let parent = sqlx::query!("SELECT path, depth FROM comments WHERE id = $1", parent_id)
            .fetch_optional(&state.db)
            .await?
            .ok_or(AppError::CommentNotFound)?;

        if parent.depth >= 5 {
            return Err(AppError::CommentTooDeep);
        }

        let new_comment_id = uuid::Uuid::new_v4().simple().to_string();
        let path = format!("{}.c{}", parent.path, new_comment_id);
        (path, parent.depth + 1)
    } else {
        let new_comment_id = uuid::Uuid::new_v4().simple().to_string();
        (format!("c{}", new_comment_id), 0)
    };

    // 清理 HTML
    let html_content = sanitize_comment_html(&payload.content);

    // 使用事务确保原子性
    let mut tx = state.db.begin().await?;

    // 创建评论
    let comment_row = sqlx::query(
        r#"
        INSERT INTO comments (
            slug, user_id, parent_id, content, html_sanitized,
            path, depth, status, created_ip, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6::ltree, $7, 'pending', $8::inet, $9)
        RETURNING id, slug, user_id, parent_id, content, html_sanitized, status,
                 path::text, depth, like_count, created_at, updated_at, deleted_at,
                 created_ip, user_agent, moderation_reason
        "#
    )
    .bind(&slug)
    .bind(&auth_user.id)
    .bind(payload.parent_id)
    .bind(&payload.content)
    .bind(&html_content)
    .bind(&path as &str)
    .bind(&depth)
    .bind("127.0.0.1") // TODO: 从 Request 中提取真实 IP
    .bind(&extract_user_agent())
    .fetch_one(&mut *tx)
    .await?;

    let comment = blog_db::Comment {
        id: comment_row.get("id"),
        post_slug: comment_row.get("slug"),
        user_id: comment_row.get("user_id"),
        parent_id: comment_row.get("parent_id"),
        content: comment_row.get("content"),
        html_sanitized: comment_row.get("html_sanitized"),
        status: blog_db::CommentStatus::Pending,
        path: comment_row.get::<String, _>("path"),
        depth: comment_row.get("depth"),
        like_count: comment_row.get::<Option<i32>, _>("like_count").unwrap_or(0),
        created_at: comment_row.get("created_at"),
        updated_at: comment_row.get("updated_at"),
        deleted_at: comment_row.get("deleted_at"),
        created_ip: comment_row
            .get::<Option<sqlx::types::ipnetwork::IpNetwork>, _>("created_ip")
            .map(|ip| ip.to_string()),
        user_agent: comment_row.get("user_agent"),
        moderation_reason: comment_row.get("moderation_reason"),
    };

    // 更新评论计数
    sqlx::query!(
        "UPDATE post_stats SET comment_count = comment_count + 1 WHERE slug = $1",
        slug
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 获取用户信息
    let user = sqlx::query!(
        "SELECT username, profile FROM users WHERE id = $1",
        auth_user.id
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(CommentResponse {
        id: comment.id,
        content: comment.content,
        html_sanitized: comment.html_sanitized,
        user: blog_db::CommentUser {
            username: user.username,
            profile: user.profile,
        },
        created_at: comment.created_at,
        like_count: comment.like_count,
        replies: vec![], // 创建时不包含回复
    }))
}

/// 获取评论列表
#[utoipa::path(
    get,
    path = "/posts/{slug}/comments",
    tag = "comments",
    params(
        ("slug" = String, Path, description = "文章slug"),
        ("cursor" = Option<String>, Query, description = "分页游标"),
        ("limit" = Option<i64>, Query, description = "每页数量，默认20")
    ),
    responses(
        (status = 200, description = "获取评论列表成功", body = CommentListResponse),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn list_comments(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(params): Query<CommentListParams>,
) -> Result<Json<CommentListResponse>, AppError> {
    let limit = params.limit.unwrap_or(20).min(100);

    // 只返回已审核的评论
    let comments = if let Some(cursor) = params.cursor {
        let cursor_uuid = uuid::Uuid::parse_str(&cursor).map_err(|_| AppError::InvalidCursor)?;

        // 使用更简单的查询
        let rows = sqlx::query(
            r#"
            SELECT
                c.id, c.slug, c.user_id, c.parent_id, c.content, c.html_sanitized,
                c.status as status, c.path::text, c.depth, c.like_count, c.created_at,
                c.updated_at, c.deleted_at, c.created_ip, c.user_agent, c.moderation_reason,
                u.username, u.profile
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.slug = $1 AND c.status = 'approved'
            AND c.created_at < (SELECT created_at FROM comments WHERE id = $2)
            ORDER BY c.created_at DESC
            LIMIT $3
            "#,
        )
        .bind(&slug)
        .bind(&cursor_uuid)
        .bind(limit as i64)
        .fetch_all(&state.db)
        .await?;

        let comments: Vec<blog_db::CommentWithUser> = rows
            .into_iter()
            .map(|row| {
                blog_db::CommentWithUser {
                    id: row.get("id"),
                    slug: row.get("slug"),
                    user_id: row.get("user_id"),
                    parent_id: row.get("parent_id"),
                    content: row.get("content"),
                    html_sanitized: row.get("html_sanitized"),
                    status: blog_db::CommentStatus::Approved, // We only query approved comments
                    path: row.get("path"),
                    depth: row.get("depth"),
                    like_count: row.get("like_count"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                    deleted_at: row.get("deleted_at"),
                    created_ip: row
                        .get::<Option<sqlx::types::ipnetwork::IpNetwork>, _>("created_ip")
                        .map(|ip| ip.to_string()),
                    user_agent: row.get("user_agent"),
                    moderation_reason: row.get("moderation_reason"),
                    username: row.get("username"),
                    profile: row.get("profile"),
                }
            })
            .collect();

        comments
    } else {
        // 使用更简单的查询
        let rows = sqlx::query(
            r#"
            SELECT
                c.id, c.slug, c.user_id, c.parent_id, c.content, c.html_sanitized,
                c.status as status, c.path::text, c.depth, c.like_count, c.created_at,
                c.updated_at, c.deleted_at, c.created_ip, c.user_agent, c.moderation_reason,
                u.username, u.profile
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.slug = $1 AND c.status = 'approved'
            ORDER BY c.created_at DESC
            LIMIT $2
            "#,
        )
        .bind(&slug)
        .bind(limit as i64)
        .fetch_all(&state.db)
        .await?;

        let comments: Vec<blog_db::CommentWithUser> = rows
            .into_iter()
            .map(|row| {
                blog_db::CommentWithUser {
                    id: row.get("id"),
                    slug: row.get("slug"),
                    user_id: row.get("user_id"),
                    parent_id: row.get("parent_id"),
                    content: row.get("content"),
                    html_sanitized: row.get("html_sanitized"),
                    status: blog_db::CommentStatus::Approved, // We only query approved comments
                    path: row.get("path"),
                    depth: row.get("depth"),
                    like_count: row.get("like_count"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                    deleted_at: row.get("deleted_at"),
                    created_ip: row
                        .get::<Option<sqlx::types::ipnetwork::IpNetwork>, _>("created_ip")
                        .map(|ip| ip.to_string()),
                    user_agent: row.get("user_agent"),
                    moderation_reason: row.get("moderation_reason"),
                    username: row.get("username"),
                    profile: row.get("profile"),
                }
            })
            .collect();

        comments
    };

    let next_cursor = comments.last().map(|c| c.id.to_string());

    // 转换为响应格式
    let comment_responses: Vec<CommentResponse> = comments
        .into_iter()
        .map(|c| CommentResponse {
            id: c.id,
            content: c.content,
            html_sanitized: c.html_sanitized,
            user: blog_db::CommentUser {
                username: c.username,
                profile: c.profile,
            },
            created_at: c.created_at,
            like_count: c.like_count,
            replies: vec![], // 暂时不加载嵌套回复
        })
        .collect();

    Ok(Json(CommentListResponse {
        comments: comment_responses,
        next_cursor,
    }))
}

/// 点赞评论
#[utoipa::path(
    post,
    path = "/comments/{id}/like",
    tag = "comments",
    params(
        ("id" = uuid::Uuid, Path, description = "评论ID")
    ),
    responses(
        (status = 200, description = "点赞成功"),
        (status = 401, description = "未认证"),
        (status = 404, description = "评论不存在"),
        (status = 409, description = "已经点赞过")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn like_comment(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.id;

    // 检查评论是否存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1 AND status = $2::comment_status)",
    )
    .bind(&id)
    .bind("approved")
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::CommentNotFound);
    }

    // 检查是否已经点赞过
    let already_liked: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2)",
    )
    .bind(&id)
    .bind(&user_id)
    .fetch_one(&state.db)
    .await?;

    if already_liked {
        return Err(AppError::AlreadyLiked);
    }

    // 添加点赞记录
    sqlx::query("INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)")
        .bind(&id)
        .bind(&user_id)
        .execute(&state.db)
        .await?;

    // 更新评论的点赞计数
    sqlx::query("UPDATE comments SET like_count = like_count + 1 WHERE id = $1")
        .bind(&id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

/// Unlike a comment
#[utoipa::path(
    post,
    path = "/comments/{id}/unlike",
    responses(
        (status = 204, description = "成功取消点赞"),
        (status = 401, description = "未授权"),
        (status = 404, description = "评论不存在")
    ),
    params(
        ("id" = Uuid, Path, description = "评论ID")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn unlike_comment(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.id;

    // 检查评论是否存在
    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1)")
        .bind(&id)
        .fetch_one(&state.db)
        .await?;

    if !exists {
        return Err(AppError::CommentNotFound);
    }

    // 删除点赞记录
    let rows_affected =
        sqlx::query("DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2")
            .bind(&id)
            .bind(&user_id)
            .execute(&state.db)
            .await?
            .rows_affected();

    // 如果找到了点赞记录，更新评论的点赞计数
    if rows_affected > 0 {
        sqlx::query("UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1")
            .bind(&id)
            .execute(&state.db)
            .await?;
    }

    Ok(StatusCode::NO_CONTENT)
}
