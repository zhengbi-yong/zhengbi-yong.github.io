//! Blog core crate
//!
//! This crate contains the business logic and domain models.

pub mod auth;
pub mod email;

// 重新导出常用类型
pub use auth::{Claims, JwtService, RefreshClaims, TokenType};
