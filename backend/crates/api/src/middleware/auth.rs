use axum::{
    extract::{Request, State},
    http::{header},
    middleware::Next,
    response::Response,
};
use crate::AppState;
use blog_shared::middleware::auth::{AuthUser, AuthError};

// 认证中间件
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    if let Some(auth_header) = auth_header {
        let (scheme, token) = auth_header
            .split_once(' ')
            .ok_or(AuthError::InvalidHeaderFormat)?;

        if scheme.to_lowercase() != "bearer" {
            return Err(AuthError::InvalidHeaderFormat);
        }

        // 验证 JWT token
        match state.jwt.verify_access_token(token) {
            Ok(claims) => {
                let user_id = uuid::Uuid::parse_str(&claims.sub)
                    .map_err(|_| AuthError::InvalidToken)?;

                let auth_user = AuthUser {
                    id: user_id,
                    email: claims.email,
                    username: claims.username,
                    profile: serde_json::Value::Null,
                    email_verified: false,
                };

                // 将用户信息添加到请求扩展中
                request.extensions_mut().insert(auth_user);
                Ok(next.run(request).await)
            }
            Err(_) => Err(AuthError::InvalidToken),
        }
    } else {
        Err(AuthError::MissingToken)
    }
}

// 可选的认证中间件
pub async fn optional_auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    if let Some(auth_header) = auth_header {
        if let Some((scheme, token)) = auth_header.split_once(' ') {
            if scheme.to_lowercase() == "bearer" {
                if let Ok(claims) = state.jwt.verify_access_token(token) {
                    if let Ok(user_id) = uuid::Uuid::parse_str(&claims.sub) {
                        let auth_user = AuthUser {
                            id: user_id,
                            email: claims.email,
                            username: claims.username,
                            profile: serde_json::Value::Null,
                            email_verified: false,
                        };

                        // 将用户信息添加到请求扩展中
                        request.extensions_mut().insert(auth_user);
                    }
                }
            }
        }
    }

    next.run(request).await
}