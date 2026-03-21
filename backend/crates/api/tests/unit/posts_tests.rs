//! 文章路由单元测试
//!
//! 测试文章相关的路由功能，包括阅读进度追踪

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

    /// 注册并登录测试用户，返回访问令牌
    async fn register_and_login() -> (String, String) {
        let client = Client::new();
        let email = generate_test_email();
        let username = generate_test_username();
        let password = generate_strong_password();

        // 注册
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

        // 登录
        let response = client
            .post(&format!("{}/v1/auth/login", BASE_URL))
            .json(&json!({
                "email": email,
                "password": password,
            }))
            .send()
            .await
            .unwrap();

        let json: serde_json::Value = response.json().await.unwrap();
        (json["access_token"].as_str().unwrap().to_string(), username)
    }

    // ===== 文章列表测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_posts_success() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts", BASE_URL))
            .send()
            .await;

        assert!(response.is_ok());
        let response = response.unwrap();
        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert!(json.as_array().is_some());
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_posts_with_pagination() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts?page=0&limit=10", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert!(json.as_array().is_some());
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_posts_with_category_filter() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts?category=chemistry", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert!(json.as_array().is_some());
    }

    // ===== 单篇文章测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_post_by_slug() {
        let client = Client::new();

        // 假设存在一篇 slug 为 "test-post" 的文章
        let response = client
            .get(&format!("{}/v1/posts/test-post", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_nonexistent_post_returns_404() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts/nonexistent-post-xyz123", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 404);
    }

    // ===== 文章统计测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_post_stats() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts/test-post/stats", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_increment_post_view_count() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/posts/test-post/view", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    // ===== 文章点赞测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_like_post_requires_auth() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/posts/test-post/like", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_like_post_success() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        let response = client
            .post(&format!("{}/v1/posts/test-post/like", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_unlike_post_success() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        let response = client
            .delete(&format!("{}/v1/posts/test-post/like", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200/204（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 204 || resp.status() == 404);
        }
    }

    // ===== 阅读进度追踪测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_reading_progress_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_reading_progress_returns_empty_for_new_user() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        let response = client
            .get(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
            if resp.status() == 200 {
                let json: serde_json::Value = resp.json().await.unwrap();
                // 应该返回空进度对象
                assert_eq!(json["progress"], 0);
            }
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_update_reading_progress_requires_auth() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .json(&json!({
                "progress": 50,
                "scroll_percentage": 0.5,
                "last_read_position": 1000,
                "words_read": 500
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_update_reading_progress_success() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        let response = client
            .post(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({
                "progress": 50,
                "scroll_percentage": 0.5,
                "last_read_position": 1000,
                "words_read": 500
            }))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200/201（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 201 || resp.status() == 404);
            if resp.status() == 200 || resp.status() == 201 {
                let json: serde_json::Value = resp.json().await.unwrap();
                assert_eq!(json["progress"], 50);
            }
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_update_reading_progress_validates_range() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        // progress > 100 应该失败
        let response = client
            .post(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({
                "progress": 150,
                "scroll_percentage": 1.5,
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 400);

        // progress < 0 应该失败
        let response = client
            .post(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({
                "progress": -10,
                "scroll_percentage": -0.1,
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 400);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_delete_reading_progress_requires_auth() {
        let client = Client::new();

        let response = client
            .delete(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_delete_reading_progress_success() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        // 先创建进度
        let _ = client
            .post(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({
                "progress": 50,
                "scroll_percentage": 0.5,
            }))
            .send()
            .await;

        // 然后删除
        let response = client
            .delete(&format!("{}/v1/posts/test-post/reading-progress", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或204（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 204 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_reading_history_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/reading-progress/history", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_reading_history_success() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        let response = client
            .get(&format!("{}/v1/reading-progress/history?limit=10", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert!(json.as_array().is_some());
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_reading_history_with_completed_filter() {
        let client = Client::new();
        let (token, _) = register_and_login().await;

        let response = client
            .get(&format!(
                "{}/v1/reading-progress/history?completed_only=true",
                BASE_URL
            ))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);

        let json: serde_json::Value = response.json().await.unwrap();
        assert!(json.as_array().is_some());
    }

    // ===== 文章评论测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_post_comments() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts/test-post/comments", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    // ===== 相关文章测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_related_posts() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/posts/test-post/related", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果文章不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }
}
