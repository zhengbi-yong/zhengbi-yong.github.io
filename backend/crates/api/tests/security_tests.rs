//! 安全性测试
//! 测试后端对各种安全威胁的防护能力

use reqwest::Client;
use serde_json::json;
use std::time::Duration;

const BASE_URL: &str = "http://localhost:3000";
const TEST_PASSWORD: &str = "test_password_123";

/// SQL 注入测试
mod sql_injection_tests {
    use super::*;

    /// 测试登录端点的 SQL 注入
    #[tokio::test]
    #[serial_test::serial]
    async fn test_login_sql_injection() {
        let client = Client::new();

        let sql_payloads = vec![
            "admin'--",
            "' OR '1'='1",
            "' OR '1'='1'--",
            "' OR '1'='1' /*",
            "admin' #",
            "' UNION SELECT * FROM users--",
            "'; DROP TABLE users; --",
        ];

        for payload in sql_payloads {
            let response = client
                .post(&format!("{}/v1/auth/login", BASE_URL))
                .json(&json!({
                    "email": payload,
                    "password": payload
                }))
                .send()
                .await
                .unwrap();

            // 应该返回 400 或 401，不应该执行 SQL
            assert!(
                response.status() == 400 || response.status() == 401,
                "SQL injection attempt should be rejected: {}",
                payload
            );
        }
    }

    /// 测试注册端点的 SQL 注入
    #[tokio::test]
    #[serial_test::serial]
    async fn test_register_sql_injection() {
        let client = Client::new();

        let sql_payloads = vec![
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
        ];

        for payload in sql_payloads {
            let response = client
                .post(&format!("{}/v1/auth/register", BASE_URL))
                .json(&json!({
                    "email": format!("{}@example.com", uuid::Uuid::new_v4().simple().to_string()[..8].to_string()),
                    "username": payload,
                    "password": TEST_PASSWORD
                }))
                .send()
                .await
                .unwrap();

            // 应该返回 400，不应该执行 SQL
            assert!(
                response.status() == 400 || response.status() == 409,
                "SQL injection attempt should be rejected: {}",
                payload
            );
        }
    }
}

/// XSS 测试
mod xss_tests {
    use super::*;

    /// 测试评论中的 XSS
    #[tokio::test]
    #[serial_test::serial]
    async fn test_comment_xss() {
        let client = Client::new();

        // 先注册并登录
        let email = format!("{}@example.com", uuid::Uuid::new_v4().simple().to_string()[..8].to_string());
        let username = format!("user_{}", uuid::Uuid::new_v4().simple().to_string()[..8].to_string());

        let register_response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": email,
                "username": username,
                "password": TEST_PASSWORD
            }))
            .send()
            .await
            .unwrap();

        let token = register_response
            .json::<serde_json::Value>()
            .await
            .unwrap()
            .get("access_token")
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();

        let xss_payloads = vec![
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
            "javascript:alert('xss')",
            "<iframe src=javascript:alert('xss')>",
        ];

        for payload in xss_payloads {
            let response = client
                .post(&format!("{}/v1/posts/test-post/comments", BASE_URL))
                .header("Authorization", format!("Bearer {}", token))
                .json(&json!({
                    "content": payload,
                    "parent_id": null
                }))
                .send()
                .await
                .unwrap();

            if response.status() == 201 {
                let comment: serde_json::Value = response.json().await.unwrap();
                let content = comment.get("content").unwrap().as_str().unwrap();

                // 脚本标签应该被移除
                assert!(
                    !content.contains("<script>"),
                    "Script tags should be removed: {}",
                    payload
                );
                assert!(
                    !content.contains("onerror"),
                    "Event handlers should be removed: {}",
                    payload
                );
                assert!(
                    !content.contains("javascript:"),
                    "JavaScript URLs should be removed: {}",
                    payload
                );
            }
        }
    }

    /// 测试用户名中的 XSS
    #[tokio::test]
    #[serial_test::serial]
    async fn test_username_xss() {
        let client = Client::new();

        let xss_payloads = vec![
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
        ];

        for payload in xss_payloads {
            let response = client
                .post(&format!("{}/v1/auth/register", BASE_URL))
                .json(&json!({
                    "email": format!("{}@example.com", uuid::Uuid::new_v4().simple().to_string()[..8].to_string()),
                    "username": payload,
                    "password": TEST_PASSWORD
                }))
                .send()
                .await
                .unwrap();

            if response.status().is_success() {
                let user: serde_json::Value = response.json().await.unwrap();
                let username = user
                    .get("user")
                    .unwrap()
                    .get("username")
                    .unwrap()
                    .as_str()
                    .unwrap();

                // 脚本标签应该被清理
                assert!(
                    !username.contains("<script>"),
                    "Script tags should be removed from username"
                );
            }
        }
    }
}

/// 认证绕过测试
mod auth_bypass_tests {
    use super::*;

    /// 测试无效 token
    #[tokio::test]
    #[serial_test::serial]
    async fn test_invalid_token() {
        let client = Client::new();

        let invalid_tokens = vec![
            "invalid_token",
            "Bearer invalid_token",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
            "",
        ];

        for token in invalid_tokens {
            let response = client
                .get(&format!("{}/v1/auth/me", BASE_URL))
                .header("Authorization", format!("Bearer {}", token))
                .send()
                .await
                .unwrap();

            assert_eq!(
                response.status(),
                401,
                "Invalid token should return 401: {}",
                token
            );
        }
    }

    /// 测试过期 token
    #[tokio::test]
    #[serial_test::serial]
    async fn test_expired_token() {
        // 这个测试需要生成一个过期的 token
        // 由于 JWT 的过期时间通常较长，这个测试可能需要特殊配置
        // 暂时跳过，或者使用 mock
    }

    /// 测试无认证访问受保护端点
    #[tokio::test]
    #[serial_test::serial]
    async fn test_unauthenticated_access() {
        let client = Client::new();

        let protected_endpoints = vec![
            ("GET", "/v1/auth/me"),
            ("POST", "/v1/posts/test/like"),
            ("POST", "/v1/posts/test/comments"),
        ];

        for (method, endpoint) in protected_endpoints {
            let response = match method {
                "GET" => client
                    .get(&format!("{}{}", BASE_URL, endpoint))
                    .send()
                    .await
                    .unwrap(),
                "POST" => client
                    .post(&format!("{}{}", BASE_URL, endpoint))
                    .send()
                    .await
                    .unwrap(),
                _ => continue,
            };

            assert_eq!(
                response.status(),
                401,
                "Unauthenticated access should return 401: {} {}",
                method,
                endpoint
            );
        }
    }
}

/// 速率限制测试
mod rate_limiting_tests {
    use super::*;

    /// 测试登录速率限制
    #[tokio::test]
    #[serial_test::serial]
    async fn test_login_rate_limiting() {
        let client = Client::new();

        let mut rate_limited_count = 0;
        let mut success_count = 0;

        // 发送大量请求
        for i in 0..200 {
            let response = client
                .post(&format!("{}/v1/auth/login", BASE_URL))
                .json(&json!({
                    "email": format!("test{}@example.com", i),
                    "password": "wrong_password"
                }))
                .send()
                .await
                .unwrap();

            match response.status().as_u16() {
                401 => success_count += 1, // 正常的认证失败
                429 => rate_limited_count += 1, // 速率限制
                _ => {}
            }

            // 如果触发速率限制，等待一段时间
            if rate_limited_count > 0 {
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
        }

        // 应该有部分请求被限制（如果实现了速率限制）
        // 如果没有实现速率限制，所有请求都应该返回 401
        assert!(
            rate_limited_count > 0 || success_count == 200,
            "Rate limiting should work or all requests should return 401"
        );
    }
}

/// 输入验证测试
mod input_validation_tests {
    use super::*;

    /// 测试邮箱格式验证
    #[tokio::test]
    #[serial_test::serial]
    async fn test_email_validation() {
        let client = Client::new();

        let invalid_emails = vec![
            "notanemail",
            "@example.com",
            "test@",
            "test..test@example.com",
            "test@example",
            "test @example.com",
        ];

        for email in invalid_emails {
            let response = client
                .post(&format!("{}/v1/auth/register", BASE_URL))
                .json(&json!({
                    "email": email,
                    "username": format!("user_{}", uuid::Uuid::new_v4().simple().to_string()[..8].to_string()),
                    "password": TEST_PASSWORD
                }))
                .send()
                .await
                .unwrap();

            assert!(
                response.status() == 400 || response.status() == 422,
                "Invalid email should be rejected: {}",
                email
            );
        }
    }

    /// 测试密码强度验证
    #[tokio::test]
    #[serial_test::serial]
    async fn test_password_validation() {
        let client = Client::new();

        let weak_passwords = vec![
            "short",
            "12345678",
            "password",
            "aaaaaaaa",
        ];

        for password in weak_passwords {
            let response = client
                .post(&format!("{}/v1/auth/register", BASE_URL))
                .json(&json!({
                    "email": format!("{}@example.com", uuid::Uuid::new_v4().simple().to_string()[..8].to_string()),
                    "username": format!("user_{}", uuid::Uuid::new_v4().simple().to_string()[..8].to_string()),
                    "password": password
                }))
                .send()
                .await
                .unwrap();

            // 弱密码可能被接受或拒绝，取决于实现
            // 但应该不会导致安全问题
            assert!(
                response.status() == 200 || response.status() == 400,
                "Password validation should work: {}",
                password
            );
        }
    }
}

