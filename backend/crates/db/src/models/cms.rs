use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::str::FromStr;
use utoipa::ToSchema;
use uuid::Uuid;

// ===== 文章状态枚举 =====

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq, Eq, ToSchema)]
#[sqlx(type_name = "post_status", rename_all = "lowercase")]
pub enum PostStatus {
    Draft,
    Published,
    Archived,
    Scheduled,
}

impl PostStatus {
    pub fn as_str(&self) -> &str {
        match self {
            PostStatus::Draft => "draft",
            PostStatus::Published => "published",
            PostStatus::Archived => "archived",
            PostStatus::Scheduled => "scheduled",
        }
    }

    pub fn is_published(&self) -> bool {
        matches!(self, PostStatus::Published)
    }

    pub fn is_draft(&self) -> bool {
        matches!(self, PostStatus::Draft)
    }
}

impl FromStr for PostStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "draft" => Ok(PostStatus::Draft),
            "published" => Ok(PostStatus::Published),
            "archived" => Ok(PostStatus::Archived),
            "scheduled" => Ok(PostStatus::Scheduled),
            _ => Err(format!("Invalid post status: {}", s)),
        }
    }
}

// ===== 文章模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Post {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub content: String,
    pub content_html: Option<String>,
    pub summary: Option<String>,
    pub cover_image_id: Option<Uuid>,
    pub status: PostStatus,
    pub published_at: Option<DateTime<Utc>>,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub canonical_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub author_id: Option<Uuid>,
    pub show_toc: bool,
    pub layout: String,
    pub view_count: i64,
    pub like_count: i32,
    pub comment_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub lastmod_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub reading_time: Option<i32>,
}

// 文章详情（包含关联数据）
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PostDetail {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub content: String,
    pub content_html: Option<String>,
    pub summary: Option<String>,
    pub cover_image_url: Option<String>,
    pub status: PostStatus,
    pub published_at: Option<DateTime<Utc>>,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub canonical_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub category_name: Option<String>,
    pub category_slug: Option<String>,
    pub author_id: Option<Uuid>,
    pub author_name: Option<String>,
    pub show_toc: bool,
    pub layout: String,
    pub view_count: i64,
    pub like_count: i32,
    pub comment_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub lastmod_at: Option<DateTime<Utc>>,
    pub reading_time: Option<i32>,
    #[serde(default)]
    pub tags: Vec<TagBasic>,
}

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct PostListItem {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub cover_image_url: Option<String>,
    pub status: PostStatus,
    pub published_at: Option<DateTime<Utc>>,
    pub category_name: Option<String>,
    pub category_slug: Option<String>,
    pub author_name: Option<String>,
    pub view_count: i64,
    pub like_count: i64,
    pub comment_count: i64,
    pub created_at: DateTime<Utc>,
    pub reading_time: Option<i32>,
    pub tag_count: i64,
}

// For JSON deserialization (e.g., from API responses)
#[derive(Debug, Clone, Deserialize)]
pub struct PostListItemJson {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub cover_image_url: Option<String>,
    pub status: PostStatus,
    pub published_at: Option<DateTime<Utc>>,
    pub category_name: Option<String>,
    pub category_slug: Option<String>,
    pub author_name: Option<String>,
    pub view_count: i64,
    pub like_count: i32,
    pub comment_count: i32,
    pub created_at: DateTime<Utc>,
    pub reading_time: Option<serde_json::Value>,
    pub tag_count: i32,
}

// 文章创建请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreatePostRequest {
    pub slug: String,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub cover_image_id: Option<Uuid>,
    pub status: PostStatus,
    pub published_at: Option<DateTime<Utc>>,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub canonical_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub show_toc: Option<bool>,
    pub layout: Option<String>,
    pub tag_ids: Option<Vec<Uuid>>,
}

// 文章更新请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdatePostRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub content_html: Option<String>,
    pub summary: Option<String>,
    pub cover_image_id: Option<Uuid>,
    pub status: Option<PostStatus>,
    pub published_at: Option<DateTime<Utc>>,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub canonical_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub show_toc: Option<bool>,
    pub layout: Option<String>,
    pub tag_ids: Option<Vec<Uuid>>,
}

// 文章列表查询参数
#[derive(Debug, Deserialize, ToSchema)]
pub struct PostListParams {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub status: Option<PostStatus>,
    pub category_id: Option<Uuid>,
    pub tag_id: Option<Uuid>,
    pub author_id: Option<Uuid>,
    pub search: Option<String>,
    pub sort_by: Option<String>, // "published_at", "created_at", "view_count", "like_count"
    pub sort_order: Option<String>, // "asc", "desc"
}

// 文章列表响应
#[derive(Debug, Serialize, ToSchema)]
pub struct PostListResponse {
    pub posts: Vec<PostListItem>,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}

// ===== 分类模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Category {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub display_order: i32,
    pub post_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// 分类树节点（包含子分类）
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CategoryTreeNode {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub display_order: i32,
    pub post_count: i32,
    pub children: Vec<CategoryTreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct CategoryBasic {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub post_count: i32,
}

// 分类创建请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateCategoryRequest {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub display_order: Option<i32>,
}

// 分类更新请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub parent_id: Option<Uuid>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub display_order: Option<i32>,
}

// ===== 标签模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Tag {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub post_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct TagBasic {
    pub id: Uuid,
    pub slug: String,
    pub name: String,
}

// 标签创建请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateTagRequest {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
}

// 标签更新请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateTagRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

// ===== 媒体文件模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Media {
    pub id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub storage_path: String,
    pub cdn_url: Option<String>,
    pub alt_text: Option<String>,
    pub caption: Option<String>,
    pub uploaded_by: Option<Uuid>,
    pub media_type: String,
    pub usage_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct MediaListItem {
    pub id: Uuid,
    pub filename: String,
    pub original_filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub url: String,
    pub media_type: String,
    pub usage_count: i64,
    pub created_at: DateTime<Utc>,
}

// 媒体上传请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct MediaUploadRequest {
    pub alt_text: Option<String>,
    pub caption: Option<String>,
}

// 媒体更新请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateMediaRequest {
    pub alt_text: Option<String>,
    pub caption: Option<String>,
}

// 媒体列表查询参数
#[derive(Debug, Deserialize, ToSchema)]
pub struct MediaListParams {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub media_type: Option<String>,
    pub search: Option<String>,
}

// 媒体列表响应
#[derive(Debug, Serialize, ToSchema)]
pub struct MediaListResponse {
    pub media: Vec<MediaListItem>,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}

// ===== 版本历史模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct PostVersion {
    pub id: Uuid,
    pub post_id: Uuid,
    pub version_number: i32,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub change_log: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct PostVersionWithUser {
    pub id: Uuid,
    pub post_id: Uuid,
    pub version_number: i32,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub change_log: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_by_name: Option<String>,
    pub created_at: DateTime<Utc>,
}

// 版本创建请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateVersionRequest {
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub change_log: Option<String>,
}

// ===== 草稿模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Draft {
    pub id: Uuid,
    pub post_id: Option<Uuid>,
    pub user_id: Uuid,
    pub title: Option<String>,
    pub content: Option<String>,
    pub summary: Option<String>,
    pub saved_at: DateTime<Utc>,
}

// 草稿保存请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct SaveDraftRequest {
    pub post_id: Option<Uuid>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub summary: Option<String>,
}

// ===== 搜索模型 =====

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SearchResult {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub rank: f32,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub total: i64,
    pub query: String,
}

// 搜索请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct SearchRequest {
    pub q: String,
    pub category_slug: Option<String>,
    pub tag_slug: Option<String>,
    pub author_id: Option<Uuid>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

// ===== 通用响应模型 =====

#[derive(Debug, Serialize, ToSchema)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct IdResponse {
    pub id: Uuid,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct SlugResponse {
    pub slug: String,
}

// ===== 批量操作模型 =====

#[derive(Debug, Deserialize, ToSchema)]
pub struct BulkDeleteRequest {
    pub ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct BulkUpdateRequest {
    pub ids: Vec<Uuid>,
    pub updates: serde_json::Value,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct BulkOperationResponse {
    pub success_count: usize,
    pub failed_count: usize,
    pub errors: Vec<String>,
}

// ===== 统计模型 =====

#[derive(Debug, Serialize, Deserialize, FromRow, ToSchema)]
pub struct DashboardStats {
    pub total_posts: i64,
    pub published_posts: i64,
    pub draft_posts: i64,
    pub total_categories: i64,
    pub total_tags: i64,
    pub total_media: i64,
    pub total_views: i64,
    pub total_comments: i64,
}

// ===== 阅读时间辅助 =====

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ReadingTime {
    pub minutes: u32,
    pub words: u32,
}

impl ReadingTime {
    pub fn from_content(content: &str) -> Self {
        // 粗略估算：平均每分钟 200 词，每词约 5 个字符
        let word_count = (content.len() / 5) as u32;
        let minutes = (word_count as f32 / 200.0).ceil() as u32;
        Self {
            minutes: minutes.max(1),
            words: word_count,
        }
    }

    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "minutes": self.minutes,
            "words": self.words,
        })
    }
}
