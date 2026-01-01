//! 增强版文章路由示例
//!
//! 展示如何使用统一的 API 响应格式、RESTful 查询参数和 HATEOAS 链接

use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use blog_shared::{
    ApiResponse, PaginatedResponse, PaginationMeta, ResourceResponse, Link, ResourceQuery,
    AppError,
};
use crate::state::AppState;
use utoipa::ToSchema;
use serde::{Serialize, Deserialize};

/// 文章详情（简化的示例模型）
#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct PostDetail {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub content: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<Author>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<Category>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Author {
    pub id: String,
    pub username: String,
    pub email: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Category {
    pub id: String,
    pub slug: String,
    pub name: String,
}

/// 文章列表项（简化版）
#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct PostListItem {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub status: String,
    pub created_at: String,
}

/// 获取文章列表（使用新的统一响应格式和查询参数）
#[utoipa::path(
    get,
    path = "/posts/enhanced",
    tag = "posts",
    params(
        ("page" = Option<u32>, Query, description = "页码（从1开始）"),
        ("limit" = Option<u32>, Query, description = "每页数量（默认20，最大100）"),
        ("sort" = Option<String>, Query, description = "排序字段（如 +created_at 或 -title）"),
        ("fields" = Option<String>, Query, description = "字段选择（逗号分隔，如 id,title,slug）"),
        ("include" = Option<String>, Query, description = "包含关联资源（如 author,category）")
    ),
    responses(
        (status = 200, description = "成功获取文章列表", body = ApiResponse<PaginatedResponse<PostListItem>>),
        (status = 400, description = "参数错误")
    )
)]
pub async fn list_posts_enhanced(
    State(state): State<AppState>,
    Query(params): Query<ResourceQuery>,
) -> Result<Json<ApiResponse<PaginatedResponse<PostListItem>>>, AppError> {
    // 验证并限制每页数量
    let limit = params.validate_limit(100);
    let offset = params.offset();

    // 解析排序参数
    let (sort_field, sort_asc) = params.parse_sort().unwrap_or_else(|| ("created_at".to_string(), false));

    // 解析字段选择
    let selected_fields = params.parse_fields();

    // TODO: 从数据库查询
    // 这里只是示例，实际应该从数据库查询
    let mock_posts = vec![
        PostListItem {
            id: "1".to_string(),
            slug: "post-1".to_string(),
            title: "First Post".to_string(),
            summary: Some("Summary of first post".to_string()),
            status: "published".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
        },
        PostListItem {
            id: "2".to_string(),
            slug: "post-2".to_string(),
            title: "Second Post".to_string(),
            summary: Some("Summary of second post".to_string()),
            status: "published".to_string(),
            created_at: "2024-01-02T00:00:00Z".to_string(),
        },
    ];

    // 如果指定了字段选择，过滤返回的字段
    let posts = if let Some(fields) = &selected_fields {
        // TODO: 实际实现中应该根据字段选择过滤
        mock_posts
    } else {
        mock_posts
    };

    // 计算总数（实际应该从数据库查询）
    let total = 100u64;

    // 创建分页元数据
    let meta = PaginationMeta::new(params.page, limit, total);

    // 创建分页响应
    let paginated_response = PaginatedResponse {
        items: posts,
        meta,
    };

    // 包装在统一的成功响应中
    Ok(Json(ApiResponse::success(paginated_response)))
}

/// 获取文章详情（使用 HATEOAS 链接）
#[utoipa::path(
    get,
    path = "/posts/enhanced/{slug}",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug"),
        ("include" = Option<String>, Query, description = "包含关联资源（如 author,category）")
    ),
    responses(
        (status = 200, description = "成功获取文章详情", body = ApiResponse<ResourceResponse<PostDetail>>),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn get_post_enhanced(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(params): Query<ResourceQuery>,
) -> Result<Json<ApiResponse<ResourceResponse<PostDetail>>>, AppError> {
    // 解析包含的关联资源
    let includes = params.parse_includes().unwrap_or_default();
    let include_author = includes.contains(&"author".to_string());
    let include_category = includes.contains(&"category".to_string());

    // TODO: 从数据库查询文章
    let mut post = PostDetail {
        id: "1".to_string(),
        slug: slug.clone(),
        title: "Sample Post".to_string(),
        summary: Some("This is a sample post".to_string()),
        content: "Full content here...".to_string(),
        status: "published".to_string(),
        author: None,
        category: None,
    };

    // 如果请求包含作者信息
    if include_author {
        post.author = Some(Author {
            id: "author-1".to_string(),
            username: "john_doe".to_string(),
            email: "john@example.com".to_string(),
        });
    }

    // 如果请求包含分类信息
    if include_category {
        post.category = Some(Category {
            id: "category-1".to_string(),
            slug: "technology".to_string(),
            name: "Technology".to_string(),
        });
    }

    // 创建 HATEOAS 链接
    let links = vec![
        Link::get(format!("/v1/posts/{}", slug), "self"),
        Link::post(format!("/v1/posts/{}", slug), "like"),
        Link::get(format!("/v1/posts/{}/comments", slug), "comments"),
        Link::get(format!("/v1/posts/{}/stats", slug), "stats"),
    ];

    // 创建带链接的资源响应
    let resource_response = ResourceResponse::new(post, links);

    // 包装在统一的成功响应中
    Ok(Json(ApiResponse::success(resource_response)))
}

/// 创建文章（返回带消息的成功响应）
#[utoipa::path(
    post,
    path = "/posts/enhanced",
    tag = "posts",
    request_body = PostDetail,
    responses(
        (status = 201, description = "文章创建成功", body = ApiResponse<ResourceResponse<PostDetail>>),
        (status = 400, description = "参数错误")
    )
)]
pub async fn create_post_enhanced(
    State(state): State<AppState>,
    Json(payload): Json<PostDetail>,
) -> Result<Json<ApiResponse<ResourceResponse<PostDetail>>>, AppError> {
    // TODO: 验证输入
    // TODO: 保存到数据库

    // 创建成功响应，带成功消息
    let links = vec![
        Link::get(format!("/v1/posts/{}", payload.slug), "self"),
    ];

    let resource_response = ResourceResponse::new(payload, links);

    Ok(Json(ApiResponse::success_with_message(
        resource_response,
        "文章创建成功",
    )))
}

/// 删除文章（返回无数据的成功响应）
#[utoipa::path(
    delete,
    path = "/posts/enhanced/{slug}",
    tag = "posts",
    params(
        ("slug" = String, Path, description = "文章slug")
    ),
    responses(
        (status = 200, description = "文章删除成功", body = ApiResponse<()>),
        (status = 404, description = "文章不存在")
    )
)]
pub async fn delete_post_enhanced(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<ApiResponse<()>>, AppError> {
    // TODO: 从数据库删除

    // 返回无数据的成功响应
    Ok(Json(ApiResponse::success_with_message(
        (),
        format!("文章 {} 已成功删除", slug),
    )))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resource_query_defaults() {
        let query: ResourceQuery = serde_qs::from_str("").unwrap();
        assert_eq!(query.page, 1);
        assert_eq!(query.limit, 20);
    }

    #[test]
    fn test_parse_sort() {
        let query: ResourceQuery = serde_qs::from_str("sort=-created_at").unwrap();
        let (field, asc) = query.parse_sort().unwrap();
        assert_eq!(field, "created_at");
        assert!(!asc);
    }

    #[test]
    fn test_parse_fields() {
        let query: ResourceQuery = serde_qs::from_str("fields=id,title,slug").unwrap();
        let fields = query.parse_fields().unwrap();
        assert_eq!(fields, vec!["id", "title", "slug"]);
    }

    #[test]
    fn test_parse_includes() {
        let query: ResourceQuery = serde_qs::from_str("include=author,category").unwrap();
        let includes = query.parse_includes().unwrap();
        assert_eq!(includes, vec!["author", "category"]);
    }

    #[test]
    fn test_offset_calculation() {
        let query: ResourceQuery = serde_qs::from_str("page=2&limit=20").unwrap();
        assert_eq!(query.offset(), 20);
    }

    #[test]
    fn test_validate_limit() {
        let query: ResourceQuery = serde_qs::from_str("limit=150").unwrap();
        assert_eq!(query.validate_limit(100), 100);
    }
}
