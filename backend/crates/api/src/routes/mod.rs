pub mod admin;
pub mod auth;
pub mod comments;
pub mod mdx_convert;
pub mod mdx_sync;
pub mod openapi;
pub mod posts;
pub mod reading_progress; // MDX同步模块
pub mod team_members;

// CMS 路由模块
pub mod categories;
pub mod media;
pub mod search;
pub mod search_optimized;
pub mod tags;
pub mod versions; // 优化后的搜索模块

// 重新导出路由模块
pub use admin::*;
pub use auth::*;
pub use comments::*;
pub use mdx_sync::*;
pub use openapi::*;
pub use posts::*;
pub use reading_progress::*; // 导出MDX同步函数
pub use team_members::admin_team_members_routes;
pub use team_members::team_members_routes;

// CMS 模块导出
pub use categories::*;
pub use media::*;
pub use search::*;
pub use tags::*;
pub use versions::*;
