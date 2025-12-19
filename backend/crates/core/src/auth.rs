use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Duration, Utc};
use sha2::{Digest, Sha256};
use blog_shared::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,    // user_id
    pub email: String,
    pub username: String,
    pub exp: i64,       // 过期时间
    pub iat: i64,       // 签发时间
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
        if password.len() < 8 {
            return Err(AppError::Validation("Password must be at least 8 characters".to_string()));
        }

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

        let parsed_hash = PasswordHash::new(hash)
            .map_err(|_| AppError::PasswordHashError)?;
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
            email: String::new(), // Refresh token 不需要邮箱
            username: String::new(), // Refresh token 不需要用户名
            exp: (now + Duration::days(7)).timestamp(),
            iat: now.timestamp(),
            token_type: TokenType::Refresh { token_id, family_id },
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|_| AppError::TokenCreationError)?;

        Ok((token, family_id))
    }

    /// 验证 Access Token
    pub fn verify_access_token(&self, token: &str) -> Result<Claims, AppError> {
        let validation = Validation::default();
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &validation,
        )
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
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &validation,
        )
        .map_err(|_| AppError::InvalidToken)?;

        match token_data.claims.token_type {
            TokenType::Refresh { token_id, family_id } => {
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
        let password = "test-password-123";

        let hash = jwt.hash_password(password).unwrap();
        assert!(jwt.verify_password(password, &hash).unwrap());
        assert!(!jwt.verify_password("wrong-password", &hash).unwrap());
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
        let result = jwt.hash_password("short");
        assert!(result.is_err());
    }
}