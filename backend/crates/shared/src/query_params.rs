//! RESTful API 统一查询参数
//!
//! 提供标准化的查询参数结构，遵循 RESTful 最佳实践

use serde::Deserialize;

/// 默认页码
fn default_page() -> u32 {
    1
}

/// 默认每页数量
fn default_limit() -> u32 {
    20
}

/// 资源查询参数（通用）
///
/// 支持以下查询参数：
/// - `page`: 页码（从1开始，默认1）
/// - `limit`: 每页数量（默认20，最大100）
/// - `sort`: 排序字段（支持 +field/-field，如 +created_at 或 -title）
/// - `fields`: 字段选择（逗号分隔，如 id,title,slug）
/// - `include`: 包含关联资源（逗号分隔，如 author,category,tags）
/// - `filter`: 过滤条件（JSON 格式）
#[derive(Debug, Clone, Deserialize)]
pub struct ResourceQuery {
    /// 页码（从1开始）
    #[serde(default = "default_page")]
    pub page: u32,

    /// 每页数量（1-100）
    #[serde(default = "default_limit")]
    pub limit: u32,

    /// 排序字段（支持 +field/-field）
    #[serde(default)]
    pub sort: Option<String>,

    /// 字段选择（逗号分隔）
    #[serde(default)]
    pub fields: Option<String>,

    /// 包含关联资源（逗号分隔）
    #[serde(default)]
    pub include: Option<String>,

    /// 过滤条件（JSON 格式）
    #[serde(default)]
    pub filter: Option<String>,
}

impl ResourceQuery {
    /// 获取排序字段和方向
    ///
    /// 返回 (field_name, is_ascending)
    ///
    /// 示例：
    /// - "+created_at" -> ("created_at", true)
    /// - "-title" -> ("title", false)
    pub fn parse_sort(&self) -> Option<(String, bool)> {
        self.sort.as_ref().map(|s| {
            let s = s.trim();
            if let Some(stripped) = s.strip_prefix('+') {
                (stripped.to_string(), true)
            } else if let Some(stripped) = s.strip_prefix('-') {
                (stripped.to_string(), false)
            } else {
                (s.to_string(), true)
            }
        })
    }

    /// 解析字段选择列表
    pub fn parse_fields(&self) -> Option<Vec<String>> {
        self.fields.as_ref().map(|s| {
            s.split(',')
                .map(|f| f.trim().to_string())
                .filter(|f| !f.is_empty())
                .collect()
        })
    }

    /// 解析包含的关联资源列表
    pub fn parse_includes(&self) -> Option<Vec<String>> {
        self.include.as_ref().map(|s| {
            s.split(',')
                .map(|i| i.trim().to_string())
                .filter(|i| !i.is_empty())
                .collect()
        })
    }

    /// 计算偏移量
    pub fn offset(&self) -> u32 {
        (self.page.saturating_sub(1)) * self.limit
    }

    /// 验证并限制每页数量
    pub fn validate_limit(&self, max: u32) -> u32 {
        self.limit.min(max)
    }
}

/// 分页查询参数（简化版）
#[derive(Debug, Clone, Deserialize)]
pub struct PaginatedQuery {
    /// 页码（从1开始）
    #[serde(default = "default_page")]
    pub page: u32,

    /// 每页数量
    #[serde(default = "default_limit")]
    pub limit: u32,
}

impl PaginatedQuery {
    /// 计算偏移量
    pub fn offset(&self) -> u32 {
        (self.page.saturating_sub(1)) * self.limit
    }

    /// 验证并限制每页数量
    pub fn validate_limit(&self, max: u32) -> u32 {
        self.limit.min(max)
    }
}

/// 搜索查询参数
#[derive(Debug, Clone, Deserialize)]
pub struct SearchQuery {
    /// 搜索关键词
    pub q: String,

    /// 页码
    #[serde(default = "default_page")]
    pub page: u32,

    /// 每页数量
    #[serde(default = "default_limit")]
    pub limit: u32,

    /// 分类过滤
    #[serde(default)]
    pub category: Option<String>,

    /// 标签过滤
    #[serde(default)]
    pub tag: Option<String>,

    /// 排序字段
    #[serde(default)]
    pub sort: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_sort_ascending() {
        let query = ResourceQuery {
            page: 1,
            limit: 20,
            sort: Some("+created_at".to_string()),
            fields: None,
            include: None,
            filter: None,
        };

        assert_eq!(query.parse_sort(), Some(("created_at".to_string(), true)));
    }

    #[test]
    fn test_parse_sort_descending() {
        let query = ResourceQuery {
            page: 1,
            limit: 20,
            sort: Some("-title".to_string()),
            fields: None,
            include: None,
            filter: None,
        };

        assert_eq!(query.parse_sort(), Some(("title".to_string(), false)));
    }

    #[test]
    fn test_parse_sort_default() {
        let query = ResourceQuery {
            page: 1,
            limit: 20,
            sort: Some("created_at".to_string()),
            fields: None,
            include: None,
            filter: None,
        };

        assert_eq!(query.parse_sort(), Some(("created_at".to_string(), true)));
    }

    #[test]
    fn test_parse_fields() {
        let query = ResourceQuery {
            page: 1,
            limit: 20,
            sort: None,
            fields: Some("id,title,slug".to_string()),
            include: None,
            filter: None,
        };

        assert_eq!(
            query.parse_fields(),
            Some(vec![
                "id".to_string(),
                "title".to_string(),
                "slug".to_string()
            ])
        );
    }

    #[test]
    fn test_parse_includes() {
        let query = ResourceQuery {
            page: 1,
            limit: 20,
            sort: None,
            fields: None,
            include: Some("author,category,tags".to_string()),
            filter: None,
        };

        assert_eq!(
            query.parse_includes(),
            Some(vec![
                "author".to_string(),
                "category".to_string(),
                "tags".to_string()
            ])
        );
    }

    #[test]
    fn test_offset() {
        let query = ResourceQuery {
            page: 2,
            limit: 20,
            sort: None,
            fields: None,
            include: None,
            filter: None,
        };

        assert_eq!(query.offset(), 20);
    }

    #[test]
    fn test_validate_limit() {
        let query = ResourceQuery {
            page: 1,
            limit: 150,
            sort: None,
            fields: None,
            include: None,
            filter: None,
        };

        assert_eq!(query.validate_limit(100), 100);
    }
}
