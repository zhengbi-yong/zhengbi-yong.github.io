//! 输入验证模块
//!
//! 提供各种输入验证功能，包括密码强度验证。

use std::fmt;

/// 密码验证器
pub struct PasswordValidator {
    min_length: usize,
    max_length: usize,
    require_uppercase: bool,
    require_lowercase: bool,
    require_digit: bool,
    require_special_char: bool,
}

impl Default for PasswordValidator {
    fn default() -> Self {
        Self {
            min_length: 12, // 提高到12位
            max_length: 128,
            require_uppercase: true,
            require_lowercase: true,
            require_digit: true,
            require_special_char: true,
        }
    }
}

impl PasswordValidator {
    /// 创建新的密码验证器（使用默认设置）
    pub fn new() -> Self {
        Self::default()
    }

    /// 设置最小长度
    pub fn min_length(mut self, min_length: usize) -> Self {
        self.min_length = min_length;
        self
    }

    /// 设置最大长度
    pub fn max_length(mut self, max_length: usize) -> Self {
        self.max_length = max_length;
        self
    }

    /// 是否要求大写字母
    pub fn require_uppercase(mut self, require: bool) -> Self {
        self.require_uppercase = require;
        self
    }

    /// 是否要求小写字母
    pub fn require_lowercase(mut self, require: bool) -> Self {
        self.require_lowercase = require;
        self
    }

    /// 是否要求数字
    pub fn require_digit(mut self, require: bool) -> Self {
        self.require_digit = require;
        self
    }

    /// 是否要求特殊字符
    pub fn require_special_char(mut self, require: bool) -> Self {
        self.require_special_char = require;
        self
    }

    /// 验证密码
    pub fn validate(&self, password: &str) -> Result<(), PasswordError> {
        // 长度检查
        if password.len() < self.min_length {
            return Err(PasswordError::TooShort(self.min_length));
        }
        if password.len() > self.max_length {
            return Err(PasswordError::TooLong(self.max_length));
        }

        // 字符类型检查
        if self.require_uppercase && !password.chars().any(|c| c.is_uppercase()) {
            return Err(PasswordError::MissingUppercase);
        }
        if self.require_lowercase && !password.chars().any(|c| c.is_lowercase()) {
            return Err(PasswordError::MissingLowercase);
        }
        if self.require_digit && !password.chars().any(|c| c.is_ascii_digit()) {
            return Err(PasswordError::MissingDigit);
        }
        if self.require_special_char
            && !password
                .chars()
                .any(|c| matches!(c, '!'..='/' | ':'..'@' | '['..'`' | '{'..'~'))
        {
            return Err(PasswordError::MissingSpecialChar);
        }

        // 检查常见弱密码
        if is_common_password(password) {
            return Err(PasswordError::TooCommon);
        }

        Ok(())
    }
}

/// 密码错误类型
#[derive(Debug, Clone, PartialEq)]
pub enum PasswordError {
    TooShort(usize),
    TooLong(usize),
    MissingUppercase,
    MissingLowercase,
    MissingDigit,
    MissingSpecialChar,
    TooCommon,
}

impl fmt::Display for PasswordError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PasswordError::TooShort(n) => write!(f, "密码至少需要 {} 个字符", n),
            PasswordError::TooLong(n) => write!(f, "密码不能超过 {} 个字符", n),
            PasswordError::MissingUppercase => write!(f, "密码必须包含至少一个大写字母"),
            PasswordError::MissingLowercase => write!(f, "密码必须包含至少一个小写字母"),
            PasswordError::MissingDigit => write!(f, "密码必须包含至少一个数字"),
            PasswordError::MissingSpecialChar => {
                write!(f, "密码必须包含至少一个特殊字符 (!@#$%^&* 等)")
            }
            PasswordError::TooCommon => write!(f, "密码过于常见，请选择更强的密码"),
        }
    }
}

impl std::error::Error for PasswordError {}

/// 检查是否为常见弱密码
fn is_common_password(password: &str) -> bool {
    // 常见弱密码列表（示例）
    const COMMON_PASSWORDS: &[&str] = &[
        "password",
        "123456",
        "password123",
        "admin",
        "qwerty",
        "abc123",
        "letmein",
        "monkey",
        "dragon",
        "1234567890",
        "baseball",
        "iloveyou",
        "trustno1",
        "sunshine",
        "master",
        "hello",
        "welcome",
        "login",
        "football",
        "123123",
    ];

    let lower = password.to_lowercase();
    COMMON_PASSWORDS
        .iter()
        .any(|&weak| lower.contains(weak) || lower == weak)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_password() {
        let validator = PasswordValidator::default();
        let result = validator.validate("SecurePass123!");
        assert!(result.is_ok());
    }

    #[test]
    fn test_too_short() {
        let validator = PasswordValidator::default();
        let result = validator.validate("Short1!");
        assert!(matches!(result, Err(PasswordError::TooShort(12))));
    }

    #[test]
    fn test_missing_uppercase() {
        let validator = PasswordValidator::default();
        let result = validator.validate("lowercase123!");
        assert!(matches!(result, Err(PasswordError::MissingUppercase)));
    }

    #[test]
    fn test_missing_lowercase() {
        let validator = PasswordValidator::default();
        let result = validator.validate("UPPERCASE123!");
        assert!(matches!(result, Err(PasswordError::MissingLowercase)));
    }

    #[test]
    fn test_missing_digit() {
        let validator = PasswordValidator::default();
        let result = validator.validate("NoDigitsHere!");
        assert!(matches!(result, Err(PasswordError::MissingDigit)));
    }

    #[test]
    fn test_missing_special_char() {
        let validator = PasswordValidator::default();
        let result = validator.validate("NoSpecialChars123");
        assert!(matches!(result, Err(PasswordError::MissingSpecialChar)));
    }

    #[test]
    fn test_common_password() {
        let validator = PasswordValidator::default();
        let result = validator.validate("Password123!");
        assert!(matches!(result, Err(PasswordError::TooCommon)));
    }
}
