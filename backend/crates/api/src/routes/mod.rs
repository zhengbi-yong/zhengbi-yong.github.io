pub mod auth;
pub mod posts;
pub mod comments;
pub mod admin;
pub mod openapi;
pub mod reading_progress;
pub mod mdx_sync; // MDX同步模块

// CMS 路由模块
pub mod categories;
pub mod tags;
pub mod media;
pub mod versions;
pub mod search;
pub mod search_optimized; // 优化后的搜索模块

// 重新导出路由模块
pub use auth::*;
pub use posts::*;
pub use comments::*;
pub use admin::*;
pub use openapi::*;
pub use reading_progress::*;
pub use mdx_sync::*; // 导出MDX同步函数

// CMS 模块导出
pub use categories::*;
pub use tags::*;
pub use media::*;
pub use versions::*;
pub use search::*;
pub use search_optimized::*;
