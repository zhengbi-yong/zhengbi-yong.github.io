use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

// 用户模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Refresh Token 模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RefreshToken {
    pub id: Uuid,
    pub user_id: Uuid,
    #[serde(skip_serializing)]
    pub token_hash: String,
    pub family_id: Uuid,
    pub replaced_by_hash: Option<String>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub created_ip: Option<String>,
    pub user_agent_hash: Option<String>,
}

// 文章统计模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, utoipa::ToSchema)]
pub struct PostStats {
    pub slug: String,
    pub view_count: i64,
    pub like_count: i32,
    pub comment_count: i32,
    pub updated_at: DateTime<Utc>,
}

// 点赞记录模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PostLike {
    pub post_slug: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

// 评论状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "comment_status", rename_all = "lowercase")]
pub enum CommentStatus {
    Pending,
    Approved,
    Rejected,
    Spam,
    Deleted,
}

// 评论模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Comment {
    pub id: Uuid,
    pub post_slug: String,
    pub user_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
    pub content: String,
    pub html_sanitized: String,
    pub status: CommentStatus,
    pub path: String,
    pub depth: i32,
    pub like_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_ip: Option<String>,
    pub user_agent: Option<String>,
    pub moderation_reason: Option<String>,
}

// 带用户信息的评论模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CommentWithUser {
    pub id: Uuid,
    pub slug: String,
    pub user_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
    pub content: String,
    pub html_sanitized: String,
    pub status: CommentStatus,
    pub path: String,
    pub depth: i32,
    pub like_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub created_ip: Option<String>,
    pub user_agent: Option<String>,
    pub moderation_reason: Option<String>,
    pub username: String,
    pub profile: serde_json::Value,
}

// 事件出队模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OutboxEvent {
    pub id: Uuid,
    pub topic: String,
    pub payload: serde_json::Value,
    pub status: String,
    pub run_after: DateTime<Utc>,
    pub attempts: i32,
    pub last_error: Option<String>,
    pub created_at: DateTime<Utc>,
}

// 请求/响应 DTO

// 注册请求
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

// 登录请求
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

// 认证响应
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct AuthResponse {
    pub access_token: String,
    pub user: UserInfo,
}

// 用户信息
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
}

impl From<User> for UserInfo {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            profile: user.profile,
            email_verified: user.email_verified,
        }
    }
}

// 创建评论请求
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CreateCommentRequest {
    pub parent_id: Option<Uuid>,
    pub content: String,
}

// 评论查询参数
#[derive(Debug, Deserialize)]
pub struct CommentListParams {
    pub cursor: Option<String>,
    pub limit: Option<i64>,
}

// 评论列表响应
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct CommentListResponse {
    pub comments: Vec<CommentResponse>,
    pub next_cursor: Option<String>,
}

// 评论响应
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct CommentResponse {
    pub id: Uuid,
    pub content: String,
    pub html_sanitized: String,
    pub user: CommentUser,
    pub created_at: DateTime<Utc>,
    pub like_count: i32,
    pub replies: Vec<CommentResponse>,
}

// 评论用户信息
#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct CommentUser {
    pub username: String,
    pub profile: serde_json::Value,
}

impl From<CommentWithUser> for CommentResponse {
    fn from(comment: CommentWithUser) -> Self {
        Self {
            id: comment.id,
            content: comment.content,
            html_sanitized: comment.html_sanitized,
            user: CommentUser {
                username: comment.username,
                profile: comment.profile,
            },
            created_at: comment.created_at,
            like_count: comment.like_count,
            replies: vec![], // 暂时不加载嵌套回复
        }
    }
}

// 文章统计响应
#[derive(Debug, Serialize, Deserialize, utoipa::ToSchema)]
pub struct PostStatsResponse {
    pub slug: String,
    pub view_count: i64,
    pub like_count: i32,
    pub comment_count: i32,
    pub updated_at: DateTime<Utc>,
}

impl From<PostStats> for PostStatsResponse {
    fn from(stats: PostStats) -> Self {
        Self {
            slug: stats.slug,
            view_count: stats.view_count,
            like_count: stats.like_count,
            comment_count: stats.comment_count,
            updated_at: stats.updated_at,
        }
    }
}