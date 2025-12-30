pub mod auth;
pub mod posts;
pub mod comments;
pub mod admin;
pub mod openapi;

// CMS 路由模块
pub mod categories;
pub mod tags;
pub mod media;
pub mod versions;
pub mod search;

// 重新导出路由模块
pub use auth::*;
pub use posts::*;
pub use comments::*;
pub use admin::*;
pub use openapi::*;

// CMS 模块导出
pub use categories::*;
pub use tags::*;
pub use media::*;
pub use versions::*;
pub use search::*;
