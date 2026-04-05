//! Blog database crate
//!
//! This crate contains database models and queries.

pub mod models;
pub mod router;

// 重新导出常用类型
pub use models::*;
pub use router::DatabaseRouter;
