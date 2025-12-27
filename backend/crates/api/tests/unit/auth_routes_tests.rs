//! 认证路由单元测试
//!
//! 测试认证相关的路由功能

use blog_api::test_mod::*;
use reqwest::Client;
use serde_json::json;
use uuid::Uuid;

const BASE_URL: &str = "http://localhost:3000";

#[cfg(test)]
mod tests {
    use super::*;

    /// 生成唯一测试邮箱
    fn generate_test_email() -> String {
        format!("test_{}@example.com", Uuid::new_v4())
    }

    /// 生成唯一测试用户名
    fn generate_test_username() -> String {
        format!("testuser_{}", Uuid::new_v4())
    }

    /// 生成强密码
    fn generate_strong_password() -> String {
        format!("TestP@ssw0rd_{}", Uuid::new_v4().simple())
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_register_success() {
        let client = Client::new();
        let email = generate_test_email();
        let username = generate_test_username();
        let password = generate_strong_password();

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": password,
            }))
            .send()
            .await;

        assert!(response.is_ok());
        let response = response.unwrap();

        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert!(json.get("access_token").is_some());
        assert!(json.get("user").is_some());
        assert_eq!(json["user"]["email"], email);
        assert_eq!(json["user"]["username"], username);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_register_email_too_short() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": "a@b",
                "username": generate_test_username(),
                "password": generate_strong_password(),
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 400);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_register_password_too_short() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": generate_test_email(),
                "username": generate_test_username(),
                "password": "short",
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 400);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_register_username_too_short() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": generate_test_email(),
                "username": "ab",
                "password": generate_strong_password(),
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 400);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_register_missing_email() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "username": generate_test_username(),
                "password": generate_strong_password(),
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 400);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_login_success() {
        let client = Client::new();
        let email = generate_test_email();
        let username = generate_test_username();
        let password = generate_strong_password();

        // 先注册
        let _ = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": password,
            }))
            .send()
            .await
            .unwrap();

        // 然后登录
        let response = client
            .post(&format!("{}/v1/auth/login", BASE_URL))
            .json(&json!({
                "email": email,
                "password": password,
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert!(json.get("access_token").is_some());
        assert!(json.get("user").is_some());
        assert_eq!(json["user"]["email"], email);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_login_wrong_password() {
        let client = Client::new();
        let email = generate_test_email();
        let username = generate_test_username();
        let password = generate_strong_password();

        // 先注册
        let _ = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": password,
            }))
            .send()
            .await
            .unwrap();

        // 然后用错误密码登录
        let response = client
            .post(&format!("{}/v1/auth/login", BASE_URL))
            .json(&json!({
                "email": email,
                "password": "wrong_password",
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_login_nonexistent_user() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/auth/login", BASE_URL))
            .json(&json!({
                "email": "nonexistent@example.com",
                "password": "password123",
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_login_missing_email() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/auth/login", BASE_URL))
            .json(&json!({
                "password": "password123",
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 400);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_get_current_user() {
        let client = Client::new();
        let email = generate_test_email();
        let username = generate_test_username();
        let password = generate_strong_password();

        // 注册并获取 token
        let register_response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": password,
            }))
            .send()
            .await
            .unwrap();

        let register_json: serde_json::Value = register_response.json().await.unwrap();
        let token = register_json["access_token"].as_str().unwrap();

        // 获取当前用户
        let response = client
            .get(&format!("{}/v1/auth/me", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert_eq!(json["email"], email);
        assert_eq!(json["username"], username);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_get_current_user_unauthorized() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/auth/me", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
    async fn test_get_current_user_invalid_token() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/auth/me", BASE_URL))
            .header("Authorization", "Bearer invalid_token")
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }
}
