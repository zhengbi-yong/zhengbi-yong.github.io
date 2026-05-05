use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

// CMS models module
pub mod cms;

// 用户角色枚举
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, ToSchema)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum UserRole {
    User,
    Admin,
    Moderator,
}

impl UserRole {
    pub fn as_str(&self) -> &str {
        match self {
            UserRole::Admin => "admin",
            UserRole::Moderator => "moderator",
            UserRole::User => "user",
        }
    }
}

// 用于SQL查询的角色包装器
#[derive(Debug, sqlx::FromRow)]
pub struct UserRoleWrapper(pub UserRole);

// 用户模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Refresh Token 模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
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
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct PostLike {
    pub post_slug: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

// 评论状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, ToSchema)]
#[sqlx(type_name = "comment_status", rename_all = "lowercase")]
pub enum CommentStatus {
    Pending,
    Approved,
    Rejected,
    Spam,
    Deleted,
}

// 评论模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
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
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
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
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct OutboxEvent {
    pub id: Uuid,
    pub event_type: String,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
    pub retry_count: i32,
    pub error: Option<String>,
    pub locked_at: Option<DateTime<Utc>>,
    pub locked_by: Option<String>,
}

// 请求/响应 DTO

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
#[derive(Debug, Serialize, Default, utoipa::ToSchema)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
    pub role: String,
    pub display_name: Option<String>,
    pub institution: Option<String>,
    pub research_fields: Option<Vec<String>>,
    pub orcid_id: Option<String>,
    pub avatar_url: Option<String>,
    pub website: Option<String>,
    pub academic_bio: Option<String>,
}

impl From<User> for UserInfo {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            profile: user.profile,
            email_verified: user.email_verified,
            role: user.role.as_str().to_string(),
            ..Default::default()
        }
    }
}

// 更新用户资料请求
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateProfileRequest {
    pub bio: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub twitter: Option<String>,
    pub github: Option<String>,
}

// 公开用户资料（无需登录即可查看）- 学术社交名片
#[derive(Debug, Serialize, Default, utoipa::ToSchema)]
pub struct UserPublicProfile {
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub institution: Option<String>,
    pub research_fields: Option<Vec<String>>,
    pub orcid_id: Option<String>,
    pub google_scholar: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub twitter: Option<String>,
    pub github: Option<String>,
    pub academic_bio: Option<String>,
    pub role: String,
    pub total_posts: i64,
    pub total_likes: i64,
    pub follower_count: i64,
    pub following_count: i64,
    pub created_at: DateTime<Utc>,
}

// 更新学术资料请求
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct UpdateAcademicProfileRequest {
    pub display_name: Option<String>,
    pub institution: Option<String>,
    pub research_fields: Option<Vec<String>>,
    pub orcid_id: Option<String>,
    pub google_scholar: Option<String>,
    pub academic_bio: Option<String>,
    pub website: Option<String>,
    pub location: Option<String>,
    pub twitter: Option<String>,
    pub github: Option<String>,
}

// 注册请求（扩展版：含学术信息）
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
    pub display_name: Option<String>,
    pub institution: Option<String>,
    pub research_fields: Option<Vec<String>>,
}

// 创建评论请求
#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub struct CreateCommentRequest {
    pub parent_id: Option<Uuid>,
    pub content: String,
}

// 评论查询参数
#[derive(Debug, Deserialize, ToSchema)]
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

// ============================================
// Team Member Models
// ============================================

/// Team member database model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct TeamMember {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub name: String,
    pub name_en: Option<String>,
    pub team_role: String,
    pub display_order: i32,
    pub is_active: bool,
    pub title: Option<String>,
    pub bio: Option<String>,
    pub affiliation: Option<String>,
    pub research_tags: Option<Vec<String>>,
    pub email: Option<String>,
    pub github: Option<String>,
    pub website: Option<String>,
    pub avatar_media_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Team member list item (smaller payload for listing)
#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct TeamMemberListItem {
    pub id: Uuid,
    pub name: String,
    pub name_en: Option<String>,
    pub team_role: String,
    pub title: Option<String>,
    pub affiliation: Option<String>,
    pub avatar_media_id: Option<Uuid>,
    pub display_order: i32,
}

/// Create team member request
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateTeamMemberRequest {
    pub user_id: Option<Uuid>,
    pub name: String,
    pub name_en: Option<String>,
    pub team_role: Option<String>,
    pub display_order: Option<i32>,
    pub title: Option<String>,
    pub bio: Option<String>,
    pub affiliation: Option<String>,
    pub research_tags: Option<Vec<String>>,
    pub email: Option<String>,
    pub github: Option<String>,
    pub website: Option<String>,
    pub avatar_media_id: Option<Uuid>,
}

/// Update team member request
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateTeamMemberRequest {
    pub user_id: Option<Uuid>,
    pub name: Option<String>,
    pub name_en: Option<String>,
    pub team_role: Option<String>,
    pub display_order: Option<i32>,
    pub is_active: Option<bool>,
    pub title: Option<String>,
    pub bio: Option<String>,
    pub affiliation: Option<String>,
    pub research_tags: Option<Vec<String>>,
    pub email: Option<String>,
    pub github: Option<String>,
    pub website: Option<String>,
    pub avatar_media_id: Option<Uuid>,
}

/// Team member detail with media URL
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct TeamMemberDetail {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub name: String,
    pub name_en: Option<String>,
    pub team_role: String,
    pub display_order: i32,
    pub is_active: bool,
    pub title: Option<String>,
    pub bio: Option<String>,
    pub affiliation: Option<String>,
    pub research_tags: Option<Vec<String>>,
    pub email: Option<String>,
    pub github: Option<String>,
    pub website: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<TeamMember> for TeamMemberDetail {
    fn from(m: TeamMember) -> Self {
        Self {
            id: m.id,
            user_id: m.user_id,
            name: m.name,
            name_en: m.name_en,
            team_role: m.team_role,
            display_order: m.display_order,
            is_active: m.is_active,
            title: m.title,
            bio: m.bio,
            affiliation: m.affiliation,
            research_tags: m.research_tags,
            email: m.email,
            github: m.github,
            website: m.website,
            avatar_url: None,
            created_at: m.created_at,
            updated_at: m.updated_at,
        }
    }
}

/// Gallery image for team member
#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct TeamMemberGalleryImage {
    pub id: Uuid,
    pub media_id: Uuid,
    pub url: String,
}

// ============================================
// Platform Transformation: Social Models
// ============================================

/// 关注关系
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Follow {
    pub id: Uuid,
    pub follower_id: Uuid,
    pub followed_id: Uuid,
    pub created_at: DateTime<Utc>,
}

/// 关注列表项（带用户信息）
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct FollowWithUser {
    pub id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub institution: Option<String>,
    pub research_fields: Option<Vec<String>>,
    pub created_at: DateTime<Utc>,
}

/// 关注列表响应
#[derive(Debug, Serialize, ToSchema)]
pub struct FollowListResponse {
    pub users: Vec<FollowWithUser>,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
}

/// 关注/取关请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct FollowRequest {
    pub username: String,
}

/// 通知类型
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, ToSchema)]
#[sqlx(type_name = "notification_type", rename_all = "lowercase")]
pub enum NotificationType {
    #[sqlx(rename = "follow")]
    Follow,
    #[sqlx(rename = "comment")]
    Comment,
    #[sqlx(rename = "comment_reply")]
    CommentReply,
    #[sqlx(rename = "like")]
    Like,
    #[sqlx(rename = "comment_like")]
    CommentLike,
    #[sqlx(rename = "mention")]
    Mention,
    #[sqlx(rename = "review")]
    Review,
    #[sqlx(rename = "system")]
    System,
}

impl From<String> for NotificationType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "follow" => Self::Follow,
            "comment" => Self::Comment,
            "comment_reply" => Self::CommentReply,
            "like" => Self::Like,
            "comment_like" => Self::CommentLike,
            "mention" => Self::Mention,
            "review" => Self::Review,
            _ => Self::System,
        }
    }
}

/// 通知
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    #[sqlx(rename = "type", try_from = "String")]
    pub notification_type: NotificationType,
    pub title: String,
    pub body: Option<String>,
    pub link: Option<String>,
    pub is_read: bool,
    pub actor_id: Option<Uuid>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

/// 通知列表响应
#[derive(Debug, Serialize, ToSchema)]
pub struct NotificationListResponse {
    pub notifications: Vec<Notification>,
    pub unread_count: i64,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
}

/// 未读通知数响应
#[derive(Debug, Serialize, ToSchema)]
pub struct UnreadCountResponse {
    pub unread_count: i64,
}

/// 通知查询参数
#[derive(Debug, Deserialize, utoipa::IntoParams, ToSchema)]
pub struct NotificationListParams {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub unread_only: Option<bool>,
}
