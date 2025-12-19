//! API 集成测试

use axum_test::TestServer;
use blog_api::{create_test_app, test_mod::TestAppState};
use reqwest::Client;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

/// 测试配置
const BASE_URL: &str = "http://localhost:3000";
const TEST_EMAIL: &str = "integration@example.com";
const TEST_USERNAME: &str = "integrationuser";
const TEST_PASSWORD: &str = "integration_password123";

/// 集成测试客户端
struct TestClient {
    client: Client,
    auth_token: Option<String>,
    state: TestAppState,
}

impl TestClient {
    async fn new() -> Self {
        let state = TestAppState::new().await;
        let client = Client::new();

        Self {
            client,
            auth_token: None,
            state,
        }
    }

    /// 注册测试用户
    async fn register_user(&mut self, email: &str, username: &str) -> anyhow::Result<Value> {
        let response = self
            .client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": TEST_PASSWORD
            }))
            .send()
            .await?;

        let response_text = response.text().await?;
        let json: Value = serde_json::from_str(&response_text)?;

        if let Some(token) = json.get("access_token").and_then(|v| v.as_str()) {
            self.auth_token = Some(token.to_string());
        }

        Ok(json)
    }

    /// 登录测试用户
    async fn login_user(&mut self, email: &str) -> anyhow::Result<Value> {
        let response = self
            .client
            .post(&format!("{}/v1/auth/login", BASE_URL))
            .json(&json!({
                "email": email,
                "password": TEST_PASSWORD
            }))
            .send()
            .await?;

        let response_text = response.text().await?;
        let json: Value = serde_json::from_str(&response_text)?;

        if let Some(token) = json.get("access_token").and_then(|v| v.as_str()) {
            self.auth_token = Some(token.to_string());
        }

        Ok(json)
    }

    /// 获取当前用户信息
    async fn get_current_user(&self) -> anyhow::Result<Value> {
        let token = self.auth_token.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No auth token available"))?;

        let response = self
            .client
            .get(&format!("{}/v1/auth/me", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        let response_text = response.text().await?;
        Ok(serde_json::from_str(&response_text)?)
    }

    /// 创建测试文章统计
    async fn create_post_stats(&self, slug: &str) -> anyhow::Result<()> {
        let token = self.auth_token.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No auth token available"))?;

        // 创建文章统计记录
        sqlx::query!(
            "INSERT INTO post_stats (slug, view_count, like_count, comment_count) VALUES ($1, $2, $3, $4)",
            slug,
            100i64,
            10i32,
            5i32
        )
        .execute(&self.state.db)
        .await?;

        Ok(())
    }

    /// 获取文章统计
    async fn get_post_stats(&self, slug: &str) -> anyhow::Result<Value> {
        let response = self
            .client
            .get(&format!("{}/v1/posts/{}/stats", BASE_URL, slug))
            .send()
            .await?;

        let response_text = response.text().await?;
        Ok(serde_json::from_str(&response_text)?)
    }

    /// 增加文章浏览量
    async fn view_post(&self, slug: &str) -> anyhow::Result<Value> {
        let token = self.auth_token.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No auth token available"))?;

        let response = self
            .client
            .post(&format!("{}/v1/posts/{}/view", BASE_URL, slug))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        let response_text = response.text().await?;
        Ok(serde_json::from_str(&response_text)?)
    }

    /// 创建评论
    async fn create_comment(&self, slug: &str, content: &str) -> anyhow::Result<Value> {
        let token = self.auth_token.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No auth token available"))?;

        let response = self
            .client
            .post(&format!("{}/v1/posts/{}/comments", BASE_URL, slug))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({
                "content": content,
                "parent_id": null
            }))
            .send()
            .await?;

        let response_text = response.text().await?;
        Ok(serde_json::from_str(&response_text)?)
    }

    /// 获取评论列表
    async fn list_comments(&self, slug: &str) -> anyhow::Result<Value> {
        let response = self
            .client
            .get(&format!("{}/v1/posts/{}/comments", BASE_URL, slug))
            .send()
            .await?;

        let response_text = response.text().await?;
        Ok(serde_json::from_str(&response_text)?)
    }

    /// 清理测试数据
    async fn cleanup(&self) {
        self.state.cleanup().await;
    }
}

/// 认证流程集成测试
#[tokio::test]
#[serial_test::serial]
async fn test_authentication_flow() -> anyhow::Result<()> {
    let mut client = TestClient::new().await;

    // 1. 测试用户注册
    let register_response = client.register_user(TEST_EMAIL, TEST_USERNAME).await?;
    assert!(register_response.get("access_token").is_some(), "Registration should return access token");
    assert!(register_response.get("user").is_some(), "Registration should return user info");

    let user_info = register_response.get("user").unwrap();
    assert_eq!(user_info.get("email").unwrap().as_str().unwrap(), TEST_EMAIL);
    assert_eq!(user_info.get("username").unwrap().as_str().unwrap(), TEST_USERNAME);
    assert_eq!(user_info.get("email_verified").unwrap().as_bool().unwrap(), false);

    // 2. 测试获取当前用户信息
    let current_user = client.get_current_user().await?;
    assert_eq!(current_user.get("email").unwrap().as_str().unwrap(), TEST_EMAIL);
    assert_eq!(current_user.get("username").unwrap().as_str().unwrap(), TEST_USERNAME);

    // 3. 测试用户登出（重新登录）
    client.auth_token = None;
    let login_response = client.login_user(TEST_EMAIL).await?;
    assert!(login_response.get("access_token").is_some(), "Login should return access token");

    let logged_in_user = client.get_current_user().await?;
    assert_eq!(logged_in_user.get("email").unwrap().as_str().unwrap(), TEST_EMAIL);

    // 清理
    client.cleanup().await;
    Ok(())
}

/// 文章相关功能集成测试
#[tokio::test]
#[serial_test::serial]
async fn test_post_functionality() -> anyhow::Result<()> {
    let mut client = TestClient::new().await;

    // 登录测试用户
    client.register_user(TEST_EMAIL, TEST_USERNAME).await?;

    let test_slug = "test-post-integration";

    // 1. 创建测试文章统计
    client.create_post_stats(test_slug).await?;

    // 2. 获取文章统计
    let stats_response = client.get_post_stats(test_slug).await?;
    assert_eq!(stats_response.get("slug").unwrap().as_str().unwrap(), test_slug);
    assert_eq!(stats_response.get("view_count").unwrap().as_i64().unwrap(), 100);
    assert_eq!(stats_response.get("like_count").unwrap().as_i32().unwrap(), 10);
    assert_eq!(stats_response.get("comment_count").unwrap().as_i32().unwrap(), 5);

    // 3. 增加文章浏览量
    let view_response = client.view_post(test_slug).await?;
    let updated_stats = view_response.get("stats").unwrap();
    assert_eq!(updated_stats.get("view_count").unwrap().as_i64().unwrap(), 101);

    // 清理
    client.cleanup().await;
    Ok(())
}

/// 评论功能集成测试
#[tokio::test]
#[serial_test::serial]
async fn test_comment_functionality() -> anyhow::Result<()> {
    let mut client = TestClient::new().await;

    // 登录测试用户
    client.register_user(TEST_EMAIL, TEST_USERNAME).await?;

    let test_slug = "test-comment-post";

    // 创建测试文章统计
    client.create_post_stats(test_slug).await?;

    // 1. 创建评论
    let comment_content = "This is a test comment for integration testing.";
    let create_response = client.create_comment(test_slug, comment_content).await?;

    assert!(create_response.get("id").is_some(), "Comment creation should return comment ID");
    assert_eq!(
        create_response.get("content").unwrap().as_str().unwrap(),
        comment_content
    );

    // 2. 获取评论列表
    let list_response = client.list_comments(test_slug).await?;
    assert!(list_response.get("comments").is_some(), "Should return comments list");

    let comments = list_response.get("comments").unwrap().as_array().unwrap();
    assert!(!comments.is_empty(), "Comments list should not be empty");

    // 验证创建的评论在列表中
    let found_comment = comments.iter().find(|c| {
        c.get("content")
            .and_then(|v| v.as_str())
            .map(|s| s == comment_content)
            .unwrap_or(false)
    });
    assert!(found_comment.is_some(), "Created comment should be in the comments list");

    // 清理
    client.cleanup().await;
    Ok(())
}

/// API 错误处理测试
#[tokio::test]
#[serial_test::serial]
async fn test_error_handling() -> anyhow::Result<()> {
    let mut client = TestClient::new().await;

    // 1. 测试无效凭证登录
    let response = client
        .client
        .post(&format!("{}/v1/auth/login", BASE_URL))
        .json(&json!({
            "email": "nonexistent@example.com",
            "password": "wrong_password"
        }))
        .send()
        .await?;

    assert_eq!(response.status(), 401);

    // 2. 测试重复注册
    client.register_user(TEST_EMAIL, TEST_USERNAME).await?;

    let response = client
        .client
        .post(&format!("{}/v1/auth/register", BASE_URL))
        .json(&json!({
            "email": TEST_EMAIL,
            "username": "different_username",
            "password": TEST_PASSWORD
        }))
        .send()
        .await?;

    assert_eq!(response.status(), 409);

    // 3. 测试未认证访问受保护的端点
    let response = client
        .client
        .get(&format!("{}/v1/auth/me", BASE_URL))
        .send()
        .await?;

    assert_eq!(response.status(), 401);

    // 清理
    client.cleanup().await;
    Ok(())
}

/// 健康检查端点测试
#[tokio::test]
#[serial_test::serial]
async fn test_health_endpoints() -> anyhow::Result<()> {
    let client = reqwest::Client::new();

    // 1. 测试基本健康检查
    let response = client
        .get(&format!("{}/healthz", BASE_URL))
        .send()
        .await?;

    assert_eq!(response.status(), 200);

    let health: Value = response.json().await?;
    assert_eq!(health.get("status").unwrap().as_str().unwrap(), "healthy");

    // 2. 测试详细健康检查
    let response = client
        .get(&format!("{}/healthz/detailed", BASE_URL))
        .send()
        .await?;

    assert_eq!(response.status(), 200);

    let detailed_health: Value = response.json().await?;
    assert_eq!(detailed_health.get("status").unwrap().as_str().unwrap(), "healthy");
    assert!(detailed_health.get("services").unwrap().as_object().unwrap().contains_key("database"));
    assert!(detailed_health.get("services").unwrap().as_object().unwrap().contains_key("redis"));

    // 3. 测试就绪检查
    let response = client
        .get(&format!("{}/readyz", BASE_URL))
        .send()
        .await?;

    assert_eq!(response.status(), 200);

    // 4. 测试 Prometheus 指标端点
    let response = client
        .get(&format!("{}/metrics", BASE_URL))
        .send()
        .await?;

    assert_eq!(response.status(), 200);
    assert_eq!(
        response.headers().get("content-type").unwrap(),
        "text/plain; version=0.0.4"
    );

    let metrics_text = response.text().await?;
    assert!(metrics_text.contains("http_requests_total"));
    assert!(metrics_text.contains("http_request_duration_seconds"));

    Ok(())
}

/// API 速率限制测试
#[tokio::test]
#[serial_test::serial]
async fn test_rate_limiting() -> anyhow::Result<()> {
    let client = reqwest::Client::new();

    // 创建多个并发请求来触发速率限制
    let mut handles = Vec::new();
    let base_url = format!("{}/healthz", BASE_URL);

    for _ in 0..10 {
        let client_clone = client.clone();
        let url_clone = base_url.clone();

        let handle = tokio::spawn(async move {
            client_clone.get(&url_clone).send().await
        });

        handles.push(handle);
    }

    // 等待所有请求完成
    let mut rate_limited_count = 0;
    for handle in handles {
        match handle.await.unwrap() {
            Ok(response) => {
                if response.status() == 429 {
                    rate_limited_count += 1;
                }
            }
            Err(_) => {}
        }
    }

    // 应该有部分请求被限制
    assert!(rate_limited_count > 0, "Some requests should be rate limited");

    Ok(())
}

/// 并发请求测试
#[tokio::test]
#[serial_test::serial]
async fn test_concurrent_requests() -> anyhow::Result<()> {
    let mut client = TestClient::new().await;
    client.register_user(TEST_EMAIL, TEST_USERNAME).await?;

    let test_slug = "concurrent-test-post";
    client.create_post_stats(test_slug).await?;

    // 创建多个并发浏览请求
    let mut handles = Vec::new();
    let token = client.auth_token.clone().unwrap();
    let base_url = format!("{}/v1/posts/{}/view", BASE_URL, test_slug);

    for i in 0..20 {
        let client_clone = reqwest::Client::new();
        let url_clone = base_url.clone();
        let token_clone = token.clone();

        let handle = tokio::spawn(async move {
            client_clone
                .post(&url_clone)
                .header("Authorization", format!("Bearer {}", token_clone))
                .send()
                .await
        });

        handles.push(handle);
    }

    // 等待所有请求完成
    let mut success_count = 0;
    for handle in handles {
        match handle.await.unwrap() {
            Ok(response) => {
                if response.status().is_success() {
                    success_count += 1;
                }
            }
            Err(_) => {}
        }
    }

    // 所有请求都应该成功
    assert_eq!(success_count, 20, "All concurrent requests should succeed");

    // 验证浏览量正确更新
    let stats = client.get_post_stats(test_slug).await?;
    assert_eq!(stats.get("view_count").unwrap().as_i64().unwrap(), 120); // 100 + 20

    // 清理
    client.cleanup().await;
    Ok(())
}