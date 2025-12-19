use axum::{
    extract::{Request},
    http::StatusCode,
    response::{Response, IntoResponse},
    Json,
};
use serde_json::json;
use uuid::Uuid;

#[derive(Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub profile: serde_json::Value,
    pub email_verified: bool,
}

#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidHeaderFormat,
    InvalidToken,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing token"),
            AuthError::InvalidHeaderFormat => (StatusCode::UNAUTHORIZED, "Invalid header format"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}

// Helper function to extract auth user from request
pub fn extract_auth_user<B>(request: &Request<B>) -> Option<AuthUser> {
    request.extensions().get::<AuthUser>().cloned()
}