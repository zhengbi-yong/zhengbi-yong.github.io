use axum::{extract::Request, http::HeaderValue, middleware::Next, response::Response};
use std::sync::Arc;
use uuid::Uuid;

/// Request ID header name
pub const REQUEST_ID_HEADER: &str = "x-request-id";

/// Extract or generate request ID
///
/// If the request already has a request ID (from upstream/frontend),
/// use it. Otherwise generate a new UUID.
pub fn extract_or_generate_request_id(request: &Request) -> String {
    request
        .headers()
        .get(REQUEST_ID_HEADER)
        .and_then(|value| value.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| Uuid::new_v4().to_string())
}

/// Middleware to inject request ID into request extensions and response headers
pub async fn request_id_middleware(mut request: Request, next: Next) -> Response {
    // Extract or generate request ID
    let request_id = extract_or_generate_request_id(&request);

    // Insert request ID into request extensions for use in handlers
    request
        .extensions_mut()
        .insert(Arc::new(request_id.clone()));

    // Continue to next middleware/handler
    let mut response = next.run(request).await;

    // Add request ID to response headers
    if let Ok(header_value) = HeaderValue::from_str(&request_id) {
        response
            .headers_mut()
            .insert(REQUEST_ID_HEADER, header_value);
    }

    response
}

/// Get request ID from request extensions
pub fn get_request_id_from_request(request: &Request) -> Option<String> {
    request
        .extensions()
        .get::<Arc<String>>()
        .map(|id| (**id).clone())
}
