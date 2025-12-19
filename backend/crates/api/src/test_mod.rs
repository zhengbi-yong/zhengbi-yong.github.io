//! 测试模块
//!
//! 提供测试工具和配置

use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use blog_db::User;
use blog_shared::Settings;
use sqlx::PgPool;
use std::sync::Arc;
use tower::ServiceExt;

/// 测试应用状态
#[derive(Clone)]
pub struct TestAppState {
    pub db: PgPool,
    pub settings: Settings,
    pub jwt: blog_core::JwtService,
}

impl TestAppState {
    pub async fn new() -> Self {
        // 使用测试数据库配置
        let database_url = std::env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgresql://postgres:password@localhost/blog_test".to_string());

        let db = PgPool::connect(&database_url).await.expect("Failed to connect to test database");

        // 运行测试迁移
        sqlx::migrate!("../../migrations")
            .run(&db)
            .await
            .expect("Failed to run test migrations");

        let settings = Settings::default();
        let jwt = blog_core::JwtService::new(&settings.jwt_secret)
            .expect("Failed to create JWT service");

        Self { db, settings, jwt }
    }

    /// 创建测试用户
    pub async fn create_test_user(&self, email: &str, username: &str) -> User {
        let password_hash = argon2::hash_encoded(
            b"test_password",
            &self.settings.password_pepper,
            &self.settings.argon2_config,
        )
        .expect("Failed to hash password");

        sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (email, username, password_hash)
            VALUES ($1, $2, $3)
            RETURNING *
            "#,
            email,
            username,
            password_hash
        )
        .fetch_one(&self.db)
        .await
        .expect("Failed to create test user")
    }

    /// 清理测试数据
    pub async fn cleanup(&self) {
        sqlx::query!("TRUNCATE TABLE users, refresh_tokens, posts, comments, post_stats CASCADE")
            .execute(&self.db)
            .await
            .expect("Failed to cleanup test data");
    }
}

/// 创建测试应用
pub fn create_test_app(state: TestAppState) -> Router {
    Router::new()
        .nest("/v1", test_v1_routes())
        .with_state(state)
}

/// 测试路由
fn test_v1_routes() -> Router<TestAppState> {
    use axum::routing::{get, post, delete};

    Router::new()
        // 认证路由
        .route("/auth/register", post(crate::routes::auth::register))
        .route("/auth/login", post(crate::routes::auth::login))
        .route("/auth/me", get(crate::routes::auth::me))

        // 文章相关路由
        .route("/posts/:slug/stats", get(crate::routes::posts::get_stats))
        .route("/posts/:slug/view", post(crate::routes::posts::view))

        // 评论相关路由
        .route("/posts/:slug/comments", get(crate::routes::comments::list_comments))
        .route("/posts/:slug/comments", post(crate::routes::comments::create_comment))
}

/// 测试工具函数
pub mod test_utils {
    use super::*;
    use serde_json::json;

    /// 创建注册请求
    pub fn create_register_request(email: &str, username: &str) -> Request<Body> {
        Request::builder()
            .method("POST")
            .uri("/v1/auth/register")
            .header("content-type", "application/json")
            .body(Body::from(json!({
                "email": email,
                "username": username,
                "password": "test_password123"
            }).to_string()))
            .unwrap()
    }

    /// 创建登录请求
    pub fn create_login_request(email: &str) -> Request<Body> {
        Request::builder()
            .method("POST")
            .uri("/v1/auth/login")
            .header("content-type", "application/json")
            .body(Body::from(json!({
                "email": email,
                "password": "test_password123"
            }).to_string()))
            .unwrap()
    }

    /// 创建认证请求头
    pub fn create_auth_header(token: &str) -> (&'static str, String) {
        ("authorization", format!("Bearer {}", token))
    }

    /// 解析响应体
    pub async fn response_to_json<T: serde::de::DeserializeOwned>(response: axum::response::Response) -> T {
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("Failed to read response body");

        serde_json::from_slice(&body).expect("Failed to parse JSON response")
    }

    /// 提取响应中的 access_token
    pub async fn extract_access_token(response: axum::response::Response) -> String {
        let json: serde_json::Value = response_to_json(response).await;
        json.get("access_token")
            .and_then(|v| v.as_str())
            .expect("Failed to extract access token")
            .to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum_test::TestServer;

    #[tokio::test]
    #[serial_test::serial]
    async fn test_user_registration_and_login() {
        let state = TestAppState::new().await;
        let app = create_test_app(state.clone());
        let server = TestServer::new(app).unwrap();

        // 测试用户注册
        let response = server
            .post("/v1/auth/register")
            .json(&json!({
                "email": "test@example.com",
                "username": "testuser",
                "password": "test_password123"
            }))
            .await;

        assert_eq!(response.status_code(), StatusCode::OK);

        let register_response: serde_json::Value = response.json();
        assert!(register_response.get("access_token").is_some());
        assert!(register_response.get("user").is_some());

        // 测试用户登录
        let response = server
            .post("/v1/auth/login")
            .json(&json!({
                "email": "test@example.com",
                "password": "test_password123"
            }))
            .await;

        assert_eq!(response.status_code(), StatusCode::OK);

        let login_response: serde_json::Value = response.json();
        assert!(login_response.get("access_token").is_some());

        // 清理
        state.cleanup().await;
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_protected_endpoint() {
        let state = TestAppState::new().await;
        let user = state.create_test_user("auth@example.com", "authuser").await;

        // 生成访问令牌
        let access_token = state.jwt.generate_access_token(&user).unwrap();

        let app = create_test_app(state.clone());
        let server = TestServer::new(app).unwrap();

        // 测试无认证访问
        let response = server.get("/v1/auth/me").await;
        assert_eq!(response.status_code(), StatusCode::UNAUTHORIZED);

        // 测试有认证访问
        let response = server
            .get("/v1/auth/me")
            .add_header("authorization", format!("Bearer {}", access_token))
            .await;

        assert_eq!(response.status_code(), StatusCode::OK);

        let me_response: serde_json::Value = response.json();
        assert_eq!(me_response.get("email").unwrap().as_str().unwrap(), "auth@example.com");
        assert_eq!(me_response.get("username").unwrap().as_str().unwrap(), "authuser");

        // 清理
        state.cleanup().await;
    }
}