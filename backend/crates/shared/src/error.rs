use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;
use uuid::Uuid;

// 导入新的 API 响应格式
use super::api_response::{ApiError, ApiResponse};

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

    #[error("Unauthorized")]
    Unauthorized,

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

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Resource conflict: {0}")]
    Conflict(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

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

    // 用户相关错误
    #[error("Email already exists")]
    EmailAlreadyExists,

    #[error("Username already exists")]
    UsernameAlreadyExists,

    // 点赞相关错误
    #[error("Already liked")]
    AlreadyLiked,

    #[error("Not liked")]
    NotLiked,

    // 评论相关错误
    #[error("Empty comment")]
    EmptyComment,

    #[error("Comment too long")]
    CommentTooLong,

    #[error("Comment too deep")]
    CommentTooDeep,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, error_message): (StatusCode, &'static str, String) = match self {
            // 认证错误 - 401
            AppError::InvalidCredentials => (
                StatusCode::UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                self.to_string(),
            ),
            AppError::InvalidToken => (StatusCode::UNAUTHORIZED, "INVALID_TOKEN", self.to_string()),
            AppError::TokenExpired => (
                StatusCode::UNAUTHORIZED,
                "TOKEN_EXPIRED",
                "登录已过期，请重新登录".to_string(),
            ),
            AppError::MissingRefreshToken => (
                StatusCode::UNAUTHORIZED,
                "MISSING_REFRESH_TOKEN",
                self.to_string(),
            ),
            AppError::UserNotFound => (
                StatusCode::UNAUTHORIZED,
                "USER_NOT_FOUND",
                "用户不存在".to_string(),
            ),

            // 权限错误 - 403
            AppError::InvalidTokenType => (
                StatusCode::FORBIDDEN,
                "INVALID_TOKEN_TYPE",
                self.to_string(),
            ),
            AppError::TokenCreationError => (
                StatusCode::FORBIDDEN,
                "TOKEN_CREATION_FAILED",
                self.to_string(),
            ),
            AppError::Unauthorized => (StatusCode::FORBIDDEN, "UNAUTHORIZED", self.to_string()),

            // 资源未找到 - 404
            AppError::PostNotFound => (
                StatusCode::NOT_FOUND,
                "POST_NOT_FOUND",
                "文章不存在".to_string(),
            ),
            AppError::CommentNotFound => (
                StatusCode::NOT_FOUND,
                "COMMENT_NOT_FOUND",
                "评论不存在".to_string(),
            ),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg),

            // 请求错误 - 400
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "CONFLICT", msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", msg),
            AppError::EmailAlreadyExists => (
                StatusCode::CONFLICT,
                "EMAIL_EXISTS",
                "该邮箱已被注册".to_string(),
            ),
            AppError::UsernameAlreadyExists => (
                StatusCode::CONFLICT,
                "USERNAME_EXISTS",
                "该用户名已被使用".to_string(),
            ),
            AppError::AlreadyLiked => (
                StatusCode::BAD_REQUEST,
                "ALREADY_LIKED",
                "已经点赞过了".to_string(),
            ),
            AppError::NotLiked => (StatusCode::BAD_REQUEST, "NOT_LIKED", "还未点赞".to_string()),
            AppError::EmptyComment => (
                StatusCode::BAD_REQUEST,
                "EMPTY_COMMENT",
                "评论内容不能为空".to_string(),
            ),
            AppError::CommentTooLong => (
                StatusCode::BAD_REQUEST,
                "COMMENT_TOO_LONG",
                "评论内容过长".to_string(),
            ),
            AppError::CommentTooDeep => (
                StatusCode::BAD_REQUEST,
                "COMMENT_TOO_DEEP",
                "评论层级过深".to_string(),
            ),
            AppError::InvalidInput => (
                StatusCode::BAD_REQUEST,
                "INVALID_INPUT",
                "输入内容无效".to_string(),
            ),
            AppError::InvalidCursor => (
                StatusCode::BAD_REQUEST,
                "INVALID_CURSOR",
                "无效的游标".to_string(),
            ),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg),

            // 请求过多 - 429
            AppError::Redis(_) => (
                StatusCode::TOO_MANY_REQUESTS,
                "RATE_LIMIT_EXCEEDED",
                "请求过于频繁，请稍后再试".to_string(),
            ),

            // 服务器错误 - 500
            AppError::Database(err) => {
                tracing::error!("Database error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "DATABASE_ERROR",
                    "数据库错误，请稍后重试".to_string(),
                )
            }
            AppError::PasswordHashError => {
                tracing::error!("Password hash error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "PASSWORD_HASH_ERROR",
                    "密码处理失败".to_string(),
                )
            }
            AppError::InvalidUserId => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INVALID_USER_ID",
                "用户ID无效".to_string(),
            ),
            AppError::Io(err) => {
                tracing::error!("IO error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "IO_ERROR",
                    "文件操作失败".to_string(),
                )
            }
            AppError::InternalError => {
                tracing::error!("Internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL_ERROR",
                    "服务器内部错误，请稍后重试".to_string(),
                )
            }
        };

        // 使用新的统一错误格式
        let api_error = ApiError::new(error_code, error_message, status);
        let response = ApiResponse::<()>::error(api_error);

        (status, Json(response)).into_response()
    }
}

// 请求ID提取器中间件使用的错误
#[derive(Error, Debug)]
pub enum RequestIdError {
    #[error("Failed to generate request ID")]
    GenerationFailed,
}
