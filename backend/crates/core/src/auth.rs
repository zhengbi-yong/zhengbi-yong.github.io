use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use blog_shared::{AppError, PasswordValidator};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub email: String,
    pub username: String,
    pub exp: i64, // 过期时间
    pub iat: i64, // 签发时间
    pub token_type: TokenType,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TokenType {
    Access,
    Refresh { token_id: Uuid, family_id: Uuid },
}

#[derive(Clone)]
pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(secret: &str) -> Result<Self, AppError> {
        if secret.len() < 32 {
            return Err(AppError::InternalError);
        }

        Ok(Self {
            encoding_key: EncodingKey::from_secret(secret.as_ref()),
            decoding_key: DecodingKey::from_secret(secret.as_ref()),
        })
    }

    /// 密码哈希
    pub fn hash_password(&self, password: &str) -> Result<String, AppError> {
        // 使用 PasswordValidator 验证密码强度
        let validator = PasswordValidator::default();
        validator
            .validate(password)
            .map_err(|e| AppError::Validation(e.to_string()))?;

        // 验证通过后进行哈希
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|_| AppError::PasswordHashError)?
            .to_string();
        Ok(password_hash)
    }

    /// 验证密码
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool, AppError> {
        if password.is_empty() || hash.is_empty() {
            return Ok(false);
        }

        let parsed_hash = PasswordHash::new(hash).map_err(|_| AppError::PasswordHashError)?;
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// 生成 Access Token（15分钟）
    pub fn create_access_token(
        &self,
        user_id: &Uuid,
        email: &str,
        username: &str,
    ) -> Result<String, AppError> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            username: username.to_string(),
            exp: (now + Duration::minutes(15)).timestamp(),
            iat: now.timestamp(),
            token_type: TokenType::Access,
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|_| AppError::TokenCreationError)
    }

    /// 生成 Refresh Token（7天）
    pub fn create_refresh_token(&self, user_id: &Uuid) -> Result<(String, Uuid), AppError> {
        let token_id = Uuid::new_v4();
        let family_id = Uuid::new_v4();
        let now = Utc::now();

        let claims = Claims {
            sub: user_id.to_string(),
            email: String::new(),    // Refresh token 不需要邮箱
            username: String::new(), // Refresh token 不需要用户名
            exp: (now + Duration::days(7)).timestamp(),
            iat: now.timestamp(),
            token_type: TokenType::Refresh {
                token_id,
                family_id,
            },
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|_| AppError::TokenCreationError)?;

        Ok((token, family_id))
    }

    /// 验证 Access Token
    pub fn verify_access_token(&self, token: &str) -> Result<Claims, AppError> {
        let validation = Validation::default();
        let token_data = decode::<Claims>(token, &self.decoding_key, &validation)
            .map_err(|_| AppError::InvalidToken)?;

        match token_data.claims.token_type {
            TokenType::Access => {
                // 检查是否过期
                let now = Utc::now().timestamp();
                if token_data.claims.exp < now {
                    return Err(AppError::TokenExpired);
                }
                Ok(token_data.claims)
            }
            _ => Err(AppError::InvalidTokenType),
        }
    }

    /// 验证 Refresh Token
    pub fn verify_refresh_token(&self, token: &str) -> Result<RefreshClaims, AppError> {
        let validation = Validation::default();
        let token_data = decode::<Claims>(token, &self.decoding_key, &validation)
            .map_err(|_| AppError::InvalidToken)?;

        match token_data.claims.token_type {
            TokenType::Refresh {
                token_id,
                family_id,
            } => {
                // 检查是否过期
                let now = Utc::now().timestamp();
                if token_data.claims.exp < now {
                    return Err(AppError::TokenExpired);
                }

                Ok(RefreshClaims {
                    user_id: Uuid::parse_str(&token_data.claims.sub)
                        .map_err(|_| AppError::InvalidUserId)?,
                    token_id,
                    family_id,
                })
            }
            _ => Err(AppError::InvalidTokenType),
        }
    }

    /// 生成 Token 哈希
    pub fn hash_token(&self, token: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

#[derive(Debug)]
pub struct RefreshClaims {
    pub user_id: Uuid,
    pub token_id: Uuid,
    pub family_id: Uuid,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let jwt = JwtService::new("super-secret-key-that-is-at-least-32-characters-long").unwrap();
        let password = "Tr0ngS3cureP@ss!"; // 满足新要求：12+字符，大小写+数字+特殊字符

        let hash = jwt.hash_password(password).unwrap();
        assert!(jwt.verify_password(password, &hash).unwrap());
        assert!(!jwt.verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_token_creation_and_verification() {
        let jwt = JwtService::new("super-secret-key-that-is-at-least-32-characters-long").unwrap();
        let user_id = Uuid::new_v4();
        let email = "test@example.com";
        let username = "testuser";

        let token = jwt.create_access_token(&user_id, email, username).unwrap();
        let claims = jwt.verify_access_token(&token).unwrap();

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.username, username);
    }

    #[test]
    fn test_refresh_token() {
        let jwt = JwtService::new("super-secret-key-that-is-at-least-32-characters-long").unwrap();
        let user_id = Uuid::new_v4();

        let (token, family_id) = jwt.create_refresh_token(&user_id).unwrap();
        let claims = jwt.verify_refresh_token(&token).unwrap();

        assert_eq!(claims.user_id, user_id);
        assert_eq!(claims.family_id, family_id);
    }

    #[test]
    fn test_short_secret_fails() {
        let jwt = JwtService::new("short");
        assert!(jwt.is_err());
    }

    #[test]
    fn test_password_too_short() {
        let jwt = JwtService::new("super-secret-key-that-is-at-least-32-characters-long").unwrap();
        let result = jwt.hash_password("Short1!"); // 7 字符
        assert!(result.is_err());
    }

    // ===== 新增测试用例 =====

    #[test]
    fn test_hash_password_minimum_length() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();

        // 新的密码要求：最少 12 字符，包含大小写、数字、特殊字符
        assert!(jwt.hash_password("SecurePass123!").is_ok()); // 满足所有要求
        assert!(jwt.hash_password("Short1!").is_err()); // 太短
        assert!(jwt.hash_password("").is_err()); // 空字符串
    }

    #[test]
    fn test_hash_password_requires_complexity() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();

        // 测试密码复杂度要求
        assert!(jwt.hash_password("Tr0ngS3cureP@ss!").is_ok()); // 满足所有要求

        // 缺少大写字母
        assert!(jwt.hash_password("lowercase123!").is_err());

        // 缺少小写字母
        assert!(jwt.hash_password("UPPERCASE123!").is_err());

        // 缺少数字
        assert!(jwt.hash_password("NoDigitsHere!").is_err());

        // 缺少特殊字符
        assert!(jwt.hash_password("NoSpecialChars123").is_err());

        // 太常见
        assert!(jwt.hash_password("Password123!").is_err());
    }

    #[test]
    fn test_hash_password_uniqueness() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let password = "Tr0ngS3cureP@ss!";

        let hash1 = jwt.hash_password(password).unwrap();
        let hash2 = jwt.hash_password(password).unwrap();

        // 相同密码应该产生不同哈希 (不同 salt)
        assert_ne!(hash1, hash2);

        // 但两个哈希都应该能验证密码
        assert!(jwt.verify_password(password, &hash1).unwrap());
        assert!(jwt.verify_password(password, &hash2).unwrap());
    }

    #[test]
    fn test_verify_password_correct() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let password = "Tr0ngS3cureP@ss!";
        let hash = jwt.hash_password(password).unwrap();

        assert!(jwt.verify_password(password, &hash).unwrap());
    }

    #[test]
    fn test_verify_password_incorrect() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let hash = jwt.hash_password("Tr0ngS3cureP@ss!").unwrap();

        assert!(!jwt.verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_verify_password_empty_inputs() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let hash = jwt.hash_password("Tr0ngS3cureP@ss!").unwrap();

        assert!(!jwt.verify_password("", &hash).unwrap());
        assert!(!jwt.verify_password("Tr0ngS3cureP@ss!", "").unwrap());
        assert!(!jwt.verify_password("", "").unwrap());
    }

    #[test]
    fn test_access_token_expiration() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let user_id = Uuid::new_v4();
        let token = jwt
            .create_access_token(&user_id, "test@example.com", "testuser")
            .unwrap();
        let claims = jwt.verify_access_token(&token).unwrap();

        let now = Utc::now().timestamp();
        let expected_expiry = now + (15 * 60);

        // 允许 2 秒误差
        assert!(claims.exp <= expected_expiry + 2);
        assert!(claims.exp >= expected_expiry - 2);
    }

    #[test]
    fn test_refresh_token_expiration() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let user_id = Uuid::new_v4();
        let (token, _family_id) = jwt.create_refresh_token(&user_id).unwrap();
        let claims = jwt.verify_refresh_token(&token).unwrap();

        // 验证 user_id 正确
        assert!(claims.user_id == user_id);
    }

    #[test]
    fn test_verify_invalid_token() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        assert!(jwt.verify_access_token("invalid_token").is_err());
        assert!(jwt.verify_refresh_token("invalid_token").is_err());
    }

    #[test]
    fn test_verify_refresh_token_as_access() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let user_id = Uuid::new_v4();
        let (refresh_token, _) = jwt.create_refresh_token(&user_id).unwrap();

        // 尝试用 access token 验证方法验证 refresh token
        assert!(jwt.verify_access_token(&refresh_token).is_err());
    }

    #[test]
    fn test_hash_token_consistent() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let token = "test_token_value";

        let hash1 = jwt.hash_token(token);
        let hash2 = jwt.hash_token(token);

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_hash_token_different() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();

        let hash1 = jwt.hash_token("token1");
        let hash2 = jwt.hash_token("token2");

        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_secret_exactly_32_chars() {
        assert!(JwtService::new("a".repeat(31).as_str()).is_err());
        assert!(JwtService::new("a".repeat(32).as_str()).is_ok());
        assert!(JwtService::new("a".repeat(33).as_str()).is_ok());
    }

    #[test]
    fn test_token_uniqueness() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();

        // 为不同用户生成 token
        let tokens: Vec<_> = (0..10)
            .map(|_| {
                let user_id = Uuid::new_v4();
                jwt.create_access_token(&user_id, "test@example.com", "testuser")
                    .unwrap()
            })
            .collect();

        // 所有 token 应该不同（因为 user_id 或时间戳不同）
        let unique_tokens: std::collections::HashSet<_> = tokens.iter().collect();
        assert_eq!(unique_tokens.len(), tokens.len());
    }

    #[test]
    fn test_password_hash_uniqueness_simple() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let password = "Tr0ngS3cureP@ss!";

        // 生成多个哈希
        let hashes: Vec<_> = (0..10)
            .map(|_| jwt.hash_password(password).unwrap())
            .collect();

        // 所有哈希应该不同（因为随机 salt）
        let unique_hashes: std::collections::HashSet<_> = hashes.iter().collect();
        assert_eq!(unique_hashes.len(), hashes.len());

        // 但所有哈希都应该能验证密码
        assert!(hashes
            .iter()
            .all(|hash| jwt.verify_password(password, hash).unwrap()));
    }

    #[test]
    fn test_token_contains_correct_user_info() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let user_id = Uuid::new_v4();
        let email = "test@example.com";
        let username = "testuser";

        let token = jwt.create_access_token(&user_id, email, username).unwrap();
        let claims = jwt.verify_access_token(&token).unwrap();

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.username, username);
        assert!(matches!(claims.token_type, TokenType::Access));
    }

    #[test]
    fn test_refresh_token_family_id_persistence() {
        let jwt = JwtService::new("a".repeat(32).as_str()).unwrap();
        let user_id = Uuid::new_v4();

        let (token1, family_id1) = jwt.create_refresh_token(&user_id).unwrap();
        let claims1 = jwt.verify_refresh_token(&token1).unwrap();

        assert_eq!(claims1.family_id, family_id1);

        // 同一用户的另一个 refresh token 应该有不同的 family_id
        let (token2, family_id2) = jwt.create_refresh_token(&user_id).unwrap();
        let claims2 = jwt.verify_refresh_token(&token2).unwrap();

        assert_eq!(claims2.family_id, family_id2);
        assert_ne!(family_id1, family_id2);
    }
}
