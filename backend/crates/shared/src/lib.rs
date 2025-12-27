//! Blog shared crate
//!
//! This crate contains shared utilities, error types, and configuration.

pub mod config;
pub mod error;
pub mod middleware;
pub mod validators;

// 重新导出常用类型
pub use config::Settings;
pub use error::AppError;
pub use middleware::{AuthUser, AuthError};
pub use validators::PasswordValidator;