use axum::{
    extract::Request,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Helper function to extract auth user from request
pub fn extract_auth_user<B>(request: &Request<B>) -> Option<AuthUser> {
    request.extensions().get::<AuthUser>().cloned()
}

// Helper function to check if user is admin
pub fn is_admin_user(user: &AuthUser) -> bool {
    user.email_verified && user.username == "admin"
}

/// Authenticated user context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
    pub role: String,
}

/// Authentication error types
#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidHeaderFormat,
    InvalidToken,
    TokenExpired,
    InvalidTokenType,
}

impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            AuthError::MissingToken => write!(f, "MissingToken"),
            AuthError::InvalidHeaderFormat => write!(f, "InvalidHeaderFormat"),
            AuthError::InvalidToken => write!(f, "InvalidToken"),
            AuthError::TokenExpired => write!(f, "TokenExpired"),
            AuthError::InvalidTokenType => write!(f, "InvalidTokenType"),
        }
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authentication token"),
            AuthError::InvalidHeaderFormat => (StatusCode::BAD_REQUEST, "Invalid authorization header format"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid or expired token"),
            AuthError::TokenExpired => (StatusCode::UNAUTHORIZED, "Token has expired"),
            AuthError::InvalidTokenType => (StatusCode::BAD_REQUEST, "Invalid token type"),
        };
        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}
