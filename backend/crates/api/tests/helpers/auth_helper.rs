//! 认证测试辅助函数
//!
//! 提供用户注册、登录等认证相关的测试辅助函数

use reqwest::Client;
use serde_json::json;

const BASE_URL: &str = "http://localhost:3000";

/// 测试用户结构
#[derive(Debug, Clone)]
pub struct TestUser {
    pub email: String,
    pub username: String,
    pub password: String,
    pub access_token: Option<String>,
}

impl TestUser {
    /// 创建新的测试用户（不注册）
    pub fn new() -> Self {
        use super::fixtures::*;
        Self {
            email: generate_test_email(),
            username: generate_test_username(),
            password: generate_strong_password(),
            access_token: None,
        }
    }

    /// 创建并注册测试用户
    pub async fn register_and_login(client: &Client) -> Result<Self, String> {
        let mut user = Self::new();
        user.register(client).await?;
        user.login(client).await?;
        Ok(user)
    }

    /// 注册用户
    pub async fn register(&mut self, client: &Client) -> Result<(), String> {
        let response = client
            .post(&format!("{}/v1/auth/register", BASE_URL))
            .json(&json!({
                "email": self.email,
                "username": self.username,
                "password": self.password,
            }))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            let json: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Failed to parse response: {}", e))?;
            self.access_token = Some(json["access_token"].as_str().unwrap().to_string());
            Ok(())
        } else {
            let status = response.status();
            let error = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            Err(format!("Registration failed: {} - {}", status, error))
        }
    }

    /// 登录用户
    pub async fn login(&mut self, client: &Client) -> Result<(), String> {
        let response = client
            .post(&format!("{}/v1/auth/login", BASE_URL))
            .json(&json!({
                "email": self.email,
                "password": self.password,
            }))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            let json: serde_json::Value = response
                .json()
                .await
                .map_err(|e| format!("Failed to parse response: {}", e))?;
            self.access_token = Some(json["access_token"].as_str().unwrap().to_string());
            Ok(())
        } else {
            let status = response.status();
            let error = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            Err(format!("Login failed: {} - {}", status, error))
        }
    }

    /// 登出用户
    pub async fn logout(&self, client: &Client) -> Result<(), String> {
        let response = client
            .post(&format!("{}/v1/auth/logout", BASE_URL))
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            Ok(())
        } else {
            let status = response.status();
            let error = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            Err(format!("Logout failed: {} - {}", status, error))
        }
    }

    /// 获取认证头
    pub fn auth_header(&self) -> String {
        format!(
            "Bearer {}",
            self.access_token.as_ref().expect("User not logged in")
        )
    }
}

/// 创建管理员用户（直接插入数据库）
pub async fn create_admin_user(db: &sqlx::PgPool) -> Result<TestUser, String> {
    let user = TestUser::new();
    let password_hash = blog_core::JwtService::new("a".repeat(32).as_str())
        .unwrap()
        .hash_password(&user.password)
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    sqlx::query(
        "INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, 'admin')",
    )
    .bind(&user.email)
    .bind(&user.username)
    .bind(&password_hash)
    .execute(db)
    .await
    .map_err(|e| format!("Failed to create admin user: {}", e))?;

    Ok(user)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_test_user_creation() {
        let user = TestUser::new();
        assert!(user.email.contains("@example.com"));
        assert!(user.username.starts_with("testuser_"));
        assert!(user.password.len() >= 8);
        assert!(user.access_token.is_none());
    }
}
