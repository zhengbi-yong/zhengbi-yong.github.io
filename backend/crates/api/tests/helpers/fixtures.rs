//! 测试数据工厂
//!
//! 提供创建测试数据的辅助函数

use uuid::Uuid;
use blog_db::{RegisterRequest, LoginRequest};

/// 生成唯一测试邮箱
pub fn generate_test_email() -> String {
    format!("test_{}@example.com", Uuid::new_v4())
}

/// 生成唯一测试用户名
pub fn generate_test_username() -> String {
    format!("testuser_{}", Uuid::new_v4())
}

/// 生成强密码
pub fn generate_strong_password() -> String {
    format!("TestP@ssw0rd_{}", Uuid::new_v4().simple())
}

/// 创建注册请求
pub fn create_register_request(email: Option<String>, username: Option<String>, password: Option<String>) -> RegisterRequest {
    RegisterRequest {
        email: email.unwrap_or_else(generate_test_email),
        username: username.unwrap_or_else(generate_test_username),
        password: password.unwrap_or_else(generate_strong_password),
    }
}

/// 创建登录请求
pub fn create_login_request(email: String, password: String) -> LoginRequest {
    LoginRequest { email, password }
}

/// 创建默认注册请求（使用随机数据）
pub fn default_register_request() -> RegisterRequest {
    create_register_request(None, None, None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_test_email_is_unique() {
        let email1 = generate_test_email();
        let email2 = generate_test_email();
        assert_ne!(email1, email2);
        assert!(email1.contains("test_"));
        assert!(email1.ends_with("@example.com"));
    }

    #[test]
    fn test_generate_test_username_is_unique() {
        let username1 = generate_test_username();
        let username2 = generate_test_username();
        assert_ne!(username1, username2);
        assert!(username1.starts_with("testuser_"));
    }

    #[test]
    fn test_generate_strong_password_meets_requirements() {
        let password = generate_strong_password();
        assert!(password.len() >= 8);
        // 密码应该包含大小写字母、数字和特殊字符
        assert!(password.chars().any(|c| c.is_lowercase()));
        assert!(password.chars().any(|c| c.is_uppercase()));
        assert!(password.chars().any(|c| c.is_ascii_digit()));
    }
}
