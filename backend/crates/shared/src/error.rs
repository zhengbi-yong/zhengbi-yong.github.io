use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum AppError {
    // 认证相关错误
    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("Invalid token")]
    InvalidToken,

    #[error("Token expired")]
    TokenExpired,

    #[error("Invalid token type")]
    InvalidTokenType,

    #[error("Missing refresh token")]
    MissingRefreshToken,

    #[error("Token creation failed")]
    TokenCreationError,

    #[error("Password hash error")]
    PasswordHashError,

    #[error("Invalid user ID")]
    InvalidUserId,

    // 数据库错误
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("User not found")]
    UserNotFound,

    #[error("Post not found")]
    PostNotFound,

    #[error("Comment not found")]
    CommentNotFound,

    // 业务逻辑错误
    #[error("Email already exists")]
    EmailAlreadyExists,

    #[error("Username already exists")]
    UsernameAlreadyExists,

    #[error("Already liked")]
    AlreadyLiked,

    #[error("Not liked")]
    NotLiked,

    #[error("Empty comment")]
    EmptyComment,

    #[error("Comment too long")]
    CommentTooLong,

    #[error("Comment too deep")]
    CommentTooDeep,

    // 输入验证错误
    #[error("Invalid input")]
    InvalidInput,

    #[error("Invalid cursor")]
    InvalidCursor,

    // Redis 错误
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    // IO 错误
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    // 验证错误
    #[error("Validation error: {0}")]
    Validation(String),

    // 内部错误
    #[error("Internal server error")]
    InternalError,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            // 认证错误 - 401
            AppError::InvalidCredentials
            | AppError::InvalidToken
            | AppError::TokenExpired
            | AppError::MissingRefreshToken
            | AppError::UserNotFound => {
                (StatusCode::UNAUTHORIZED, self.to_string())
            }

            // 权限错误 - 403
            AppError::InvalidTokenType
            | AppError::TokenCreationError => {
                (StatusCode::FORBIDDEN, self.to_string())
            }

            // 资源未找到 - 404
            AppError::PostNotFound
            | AppError::CommentNotFound => {
                (StatusCode::NOT_FOUND, self.to_string())
            }

            // 请求错误 - 400
            AppError::EmailAlreadyExists
            | AppError::UsernameAlreadyExists
            | AppError::AlreadyLiked
            | AppError::NotLiked
            | AppError::EmptyComment
            | AppError::CommentTooLong
            | AppError::CommentTooDeep
            | AppError::InvalidInput
            | AppError::InvalidCursor
            | AppError::Validation(_) => {
                (StatusCode::BAD_REQUEST, self.to_string())
            }

            // 请求过多 - 429
            AppError::Redis(_) => {
                (StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded".to_string())
            }

            // 服务器错误 - 500
            AppError::Database(_)
            | AppError::PasswordHashError
            | AppError::InvalidUserId
            | AppError::Io(_)
            | AppError::InternalError => {
                tracing::error!("Internal error: {:?}", self);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        let body = Json(json!({
            "code": status.as_u16(),
            "message": error_message,
        }));

        (status, body).into_response()
    }
}

// 请求ID提取器中间件使用的错误
#[derive(Error, Debug)]
pub enum RequestIdError {
    #[error("Failed to generate request ID")]
    GenerationFailed,
}

// 认证中间件使用的用户信息
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
}

// 认证中间件错误
#[derive(Error, Debug)]
pub enum AuthError {
    #[error("Missing Authorization header")]
    MissingToken,

    #[error("Invalid Authorization header format")]
    InvalidHeaderFormat,

    #[error("Invalid token")]
    InvalidToken,

    #[error("Token expired")]
    TokenExpired,

    #[error("Invalid token type")]
    InvalidTokenType,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::MissingToken
            | AuthError::InvalidHeaderFormat
            | AuthError::InvalidToken
            | AuthError::TokenExpired
            | AuthError::InvalidTokenType => {
                (StatusCode::UNAUTHORIZED, self.to_string())
            }
        };

        let body = Json(json!({
            "code": status.as_u16(),
            "message": error_message,
        }));

        (status, body).into_response()
    }
}