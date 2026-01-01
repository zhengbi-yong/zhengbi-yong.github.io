//! 统一 API 响应格式
//!
//! 参考世界级 API 设计标准（Stripe、GitHub）实现统一的响应格式

use serde::{Deserialize, Serialize};
use std::fmt;

/// 统一 API 响应格式
///
/// 成功响应示例：
/// ```json
/// {
///   "success": true,
///   "data": { ... },
///   "message": "操作成功"
/// }
/// ```
///
/// 失败响应示例：
/// ```json
/// {
///   "success": false,
///   "error": {
///     "code": "POST_NOT_FOUND",
///     "message": "文章不存在",
///     "type": "404"
///   }
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ApiResponse<T> {
    /// 操作是否成功
    pub success: bool,

    /// 响应数据（成功时）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,

    /// 成功消息（可选）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,

    /// 错误信息（失败时）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ApiError>,
}

impl<T> ApiResponse<T> {
    /// 创建成功响应（仅数据）
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            error: None,
        }
    }

    /// 创建成功响应（带消息）
    pub fn success_with_message(data: T, message: impl Into<String>) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: Some(message.into()),
            error: None,
        }
    }

    /// 创建错误响应
    pub fn error(error: ApiError) -> Self {
        Self {
            success: false,
            data: None,
            message: None,
            error: Some(error),
        }
    }

    /// 创建无数据的成功响应（如 DELETE 操作）
    pub fn success_no_data() -> ApiResponse<()> {
        ApiResponse {
            success: true,
            data: Some(()),
            message: None,
            error: None,
        }
    }
}

/// API 错误详情
///
/// 提供机器可读的错误代码和人类可读的错误消息
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ApiError {
    /// 机器可读的错误代码（如 "INVALID_CREDENTIALS"）
    pub code: String,

    /// 人类可读的错误消息
    pub message: String,

    /// HTTP 状态码类型
    #[serde(rename = "type")]
    pub error_type: String,

    /// 错误路径（用于验证错误，如 "user.email"）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,

    /// 额外错误详情
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl ApiError {
    /// 创建新的错误
    pub fn new(
        code: impl Into<String>,
        message: impl Into<String>,
        status: axum::http::StatusCode,
    ) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            error_type: status.as_u16().to_string(),
            path: None,
            details: None,
        }
    }

    /// 创建带路径的错误（用于验证错误）
    pub fn with_path(
        code: impl Into<String>,
        message: impl Into<String>,
        status: axum::http::StatusCode,
        path: impl Into<String>,
    ) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            error_type: status.as_u16().to_string(),
            path: Some(path.into()),
            details: None,
        }
    }

    /// 添加额外详情
    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }
}

/// 分页元数据
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct PaginationMeta {
    /// 当前页码（从1开始）
    pub page: u32,

    /// 每页数量
    pub limit: u32,

    /// 总记录数
    pub total: u64,

    /// 总页数
    pub total_pages: u32,

    /// 是否有下一页
    pub has_next: bool,

    /// 是否有上一页
    pub has_prev: bool,
}

impl PaginationMeta {
    /// 创建分页元数据
    pub fn new(page: u32, limit: u32, total: u64) -> Self {
        let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;
        let has_next = page < total_pages;
        let has_prev = page > 1;

        Self {
            page,
            limit,
            total,
            total_pages,
            has_next,
            has_prev,
        }
    }
}

/// 分页响应
///
/// 示例：
/// ```json
/// {
///   "success": true,
///   "data": {
///     "items": [...],
///     "meta": {
///       "page": 1,
///       "limit": 20,
///       "total": 100,
///       "total_pages": 5,
///       "has_next": true,
///       "has_prev": false
///     }
///   }
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct PaginatedResponse<T> {
    /// 数据列表
    pub items: Vec<T>,

    /// 分页元数据
    pub meta: PaginationMeta,
}

impl<T> PaginatedResponse<T> {
    /// 创建分页响应
    pub fn new(items: Vec<T>, page: u32, limit: u32, total: u64) -> Self {
        Self {
            items,
            meta: PaginationMeta::new(page, limit, total),
        }
    }

    /// 转换为 ApiResponse
    pub fn into_api_response(self) -> ApiResponse<Self> {
        ApiResponse::success(self)
    }
}

/// HATEOAS 链接
///
/// 用于实现超媒体作为应用状态引擎（HATEOAS）
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Link {
    /// 链接 URL
    pub href: String,

    /// 关系类型（self、next、prev、related 等）
    pub rel: String,

    /// HTTP 方法
    pub method: String,
}

impl Link {
    /// 创建新链接
    pub fn new(href: impl Into<String>, rel: impl Into<String>, method: impl Into<String>) -> Self {
        Self {
            href: href.into(),
            rel: rel.into(),
            method: method.into(),
        }
    }

    /// 创建 GET 链接
    pub fn get(href: impl Into<String>, rel: impl Into<String>) -> Self {
        Self::new(href, rel, "GET")
    }

    /// 创建 POST 链接
    pub fn post(href: impl Into<String>, rel: impl Into<String>) -> Self {
        Self::new(href, rel, "POST")
    }

    /// 创建 PATCH 链接
    pub fn patch(href: impl Into<String>, rel: impl Into<String>) -> Self {
        Self::new(href, rel, "PATCH")
    }

    /// 创建 DELETE 链接
    pub fn delete(href: impl Into<String>, rel: impl Into<String>) -> Self {
        Self::new(href, rel, "DELETE")
    }
}

/// 带 HATEOAS 链接的资源响应
///
/// 示例：
/// ```json
/// {
///   "success": true,
///   "data": {
///     "id": "123",
///     "title": "Post Title",
///     ...
///   },
///   "links": [
///     { "href": "/v1/posts/123", "rel": "self", "method": "GET" },
///     { "href": "/v1/posts/123/comments", "rel": "comments", "method": "GET" },
///     { "href": "/v1/posts/123", "rel": "update", "method": "PATCH" },
///     { "href": "/v1/posts/123", "rel": "delete", "method": "DELETE" }
///   ]
/// }
/// ```
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct ResourceResponse<T> {
    /// 资源数据
    pub data: T,

    /// HATEOAS 链接
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub links: Vec<Link>,
}

impl<T> ResourceResponse<T> {
    /// 创建带链接的资源响应
    pub fn new(data: T, links: Vec<Link>) -> Self {
        Self { data, links }
    }

    /// 创建无链接的资源响应
    pub fn without_links(data: T) -> Self {
        Self {
            data,
            links: Vec::new(),
        }
    }

    /// 转换为 ApiResponse
    pub fn into_api_response(self) -> ApiResponse<Self> {
        ApiResponse::success(self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_success_response() {
        let response = ApiResponse::success("test data");
        assert!(response.success);
        assert_eq!(response.data, Some("test data"));
        assert!(response.error.is_none());
    }

    #[test]
    fn test_error_response() {
        let error = ApiError::new("TEST_ERROR", "Test error message", axum::http::StatusCode::BAD_REQUEST);
        let response = ApiResponse::<()>::error(error);

        assert!(!response.success);
        assert!(response.data.is_none());
        assert!(response.error.is_some());
        assert_eq!(response.error.unwrap().code, "TEST_ERROR");
    }

    #[test]
    fn test_pagination_meta() {
        let meta = PaginationMeta::new(1, 20, 100);
        assert_eq!(meta.page, 1);
        assert_eq!(meta.limit, 20);
        assert_eq!(meta.total, 100);
        assert_eq!(meta.total_pages, 5);
        assert!(meta.has_next);
        assert!(!meta.has_prev);
    }

    #[test]
    fn test_paginated_response() {
        let items = vec!["item1", "item2", "item3"];
        let response = PaginatedResponse::new(items, 1, 20, 100);

        assert_eq!(response.items.len(), 3);
        assert_eq!(response.meta.page, 1);
        assert_eq!(response.meta.total, 100);
    }

    #[test]
    fn test_link_creation() {
        let link = Link::get("/v1/posts/123", "self");
        assert_eq!(link.href, "/v1/posts/123");
        assert_eq!(link.rel, "self");
        assert_eq!(link.method, "GET");
    }

    #[test]
    fn test_resource_response() {
        let links = vec![
            Link::get("/v1/posts/123", "self"),
            Link::delete("/v1/posts/123", "delete"),
        ];

        let response = ResourceResponse::new("data", links);
        assert_eq!(response.data, "data");
        assert_eq!(response.links.len(), 2);
    }
}
