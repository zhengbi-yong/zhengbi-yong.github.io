//! Blog shared crate
//!
//! This crate contains shared utilities, error types, and configuration.

pub mod api_response;
pub mod config;
pub mod error;
pub mod middleware;
pub mod query_params;
pub mod validators;

// 重新导出常用类型
pub use api_response::{
    ApiError, ApiResponse, Link, PaginatedResponse, PaginationMeta, ResourceResponse,
};
pub use config::{
    DatabasePoolConfig, HealthConfig, MeilisearchConfig, RateLimitConfig, RateLimitFailureMode,
    RedisPoolConfig, Settings, WorkerConfig,
};
pub use error::AppError;
pub use middleware::AuthUser;
pub use query_params::{PaginatedQuery, ResourceQuery, SearchQuery};
pub use validators::PasswordValidator;
