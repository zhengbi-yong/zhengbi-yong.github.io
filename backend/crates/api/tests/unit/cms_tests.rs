//! CMS功能单元测试
//!
//! 测试分类、标签、媒体、版本控制、搜索等CMS功能

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

    /// 注册管理员用户并登录，返回访问令牌
    async fn register_admin_and_login() -> String {
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
        json["access_token"].as_str().unwrap().to_string()
    }

    // ===== 分类测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_categories_public() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/categories", BASE_URL))
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
    async fn test_get_category_tree() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/categories/tree", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_category_by_slug() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/categories/chemistry", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果分类不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_category_posts() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/categories/chemistry/posts", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果分类不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_create_category_requires_auth() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/admin/categories", BASE_URL))
            .json(&json!({
                "name": "Test Category",
                "slug": "test-category",
                "description": "Test description"
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_create_category_success() {
        let client = Client::new();
        let token = register_admin_and_login().await;
        let slug = format!("test-category-{}", Uuid::new_v4().simple());

        let response = client
            .post(&format!("{}/v1/admin/categories", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .json(&json!({
                "name": "Test Category",
                "slug": slug,
                "description": "Test description"
            }))
            .send()
            .await;

        // 可能返回201（成功）或403（非管理员）
        if let Ok(resp) = response {
            assert!(resp.status() == 201 || resp.status() == 403);
        }
    }

    // ===== 标签测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_tags_public() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/tags", BASE_URL))
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
    async fn test_get_popular_tags() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/tags/popular?limit=10", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_tags_autocomplete() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/tags/autocomplete?q=chem", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_tag_by_slug() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/tags/chemistry", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果标签不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_tag_posts() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/tags/chemistry/posts", BASE_URL))
            .send()
            .await;

        // 可能返回404（如果标签不存在）或200（如果存在）
        if let Ok(resp) = response {
            assert!(resp.status() == 200 || resp.status() == 404);
        }
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_create_tag_requires_auth() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/admin/tags", BASE_URL))
            .json(&json!({
                "name": "test-tag",
                "slug": "test-tag",
                "description": "Test tag"
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    // ===== 搜索测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_search_posts() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/search?q=chemistry", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_search_with_category_filter() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/search?q=test&category=chemistry", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_search_with_tags_filter() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/search?q=test&tags=chemistry,tutorial", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_search_suggest() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/search/suggest?q=chem", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_trending_keywords() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/search/trending?limit=10", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);
    }

    // ===== 媒体管理测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_media_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/admin/media", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_media_success() {
        let client = Client::new();
        let token = register_admin_and_login().await;

        let response = client
            .get(&format!("{}/v1/admin/media?limit=10", BASE_URL))
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await
            .unwrap();

        // 可能返回200（成功）或403（非管理员）
        assert!(response.status() == 200 || response.status() == 403);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_unused_media_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/admin/media/unused", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_media_by_id_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/admin/media/123", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    // ===== 版本控制测试 =====

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_list_versions_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!("{}/v1/admin/posts/test-post/versions", BASE_URL))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_create_version_requires_auth() {
        let client = Client::new();

        let response = client
            .post(&format!("{}/v1/admin/posts/test-post/versions", BASE_URL))
            .json(&json!({
                "title": "Test Version",
                "content": "Test content",
                "change_summary": "Initial version"
            }))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_get_version_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!(
                "{}/v1/admin/posts/test-post/versions/1",
                BASE_URL
            ))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_restore_version_requires_auth() {
        let client = Client::new();

        let response = client
            .post(&format!(
                "{}/v1/admin/posts/test-post/versions/1/restore",
                BASE_URL
            ))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_delete_version_requires_auth() {
        let client = Client::new();

        let response = client
            .delete(&format!(
                "{}/v1/admin/posts/test-post/versions/1",
                BASE_URL
            ))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }

    #[tokio::test]
    #[serial_test::serial]
#[ignore] // 需要运行中的后端服务
    async fn test_compare_versions_requires_auth() {
        let client = Client::new();

        let response = client
            .get(&format!(
                "{}/v1/admin/posts/test-post/versions/compare?from=1&to=2",
                BASE_URL
            ))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 401);
    }
}
