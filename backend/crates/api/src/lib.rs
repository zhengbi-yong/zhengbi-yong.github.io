//! Blog API crate
//!
//! This crate contains the HTTP API implementation using Axum.

pub mod routes;
pub mod middleware;
pub mod metrics;
pub mod state;
pub mod utils;

// 重新导出常用类型
pub use routes::{auth, posts, comments, openapi};
pub use middleware::{auth as auth_middleware, rate_limit};
pub use metrics::*;
pub use state::AppState;
pub use utils::ip_extractor;