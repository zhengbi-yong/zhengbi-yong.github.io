//! Blog API crate
//!
//! This crate contains the HTTP API implementation using Axum.

#![recursion_limit = "256"]

pub mod metrics;
pub mod middleware;
pub mod observability;
pub mod routes;
pub mod state;
pub mod utils;

// 重新导出常用类型
pub use metrics::*;
pub use middleware::{auth as auth_middleware, rate_limit};
pub use routes::{auth, comments, openapi, posts};
pub use state::AppState;
pub use utils::ip_extractor;
