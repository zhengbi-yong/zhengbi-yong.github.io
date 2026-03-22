//! Utils 模块
//!
//! 包含辅助工具函数

pub mod http_route;
pub mod ip_extractor;

// 重新导出常用函数
pub use http_route::{normalize_route_pattern, normalized_route_label};
pub use ip_extractor::extract_real_ip;
