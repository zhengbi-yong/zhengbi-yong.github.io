pub mod auth;
pub mod posts;
pub mod comments;
pub mod openapi;

// 重新导出路由模块
pub use auth::*;
pub use posts::*;
pub use comments::*;
pub use openapi::*;