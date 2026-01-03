# Blog Core Crate (backend/crates/core)

## Overview
Core business logic and domain services for the blog application. Provides authentication (JWT, password hashing) and email services.

**Purpose**: Core business services layer
**Language**: Rust
**Layer**: Layer 3 - Business Logic
**Dependencies**: argon2, jsonwebtoken, lettre, chrono, uuid

## Architecture

### Module Structure
```
src/
├── lib.rs          # Public API exports
├── auth.rs         # Authentication services (JWT, passwords)
└── email.rs        # Email service (SMTP)
```

### Public API (lib.rs)

**Re-exports**:
```rust
pub use auth::{JwtService, Claims, TokenType, RefreshClaims};
pub use email::EmailService;
```

## Authentication Module (auth.rs)

### JwtService

**Purpose**: JWT token creation and validation

**Struct**:
```rust
pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}
```

**Initialization**:
```rust
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
}
```

**Requirements**:
- `secret` must be >= 32 characters
- Uses HS256 algorithm (HMAC-SHA256)

### Token Types

**Claims Struct**:
```rust
pub struct Claims {
    pub sub: String,        // user_id (UUID)
    pub email: String,
    pub username: String,
    pub exp: i64,           // Expiration timestamp
    pub iat: i64,           // Issued at timestamp
    pub token_type: TokenType,
}
```

**TokenType Enum**:
```rust
pub enum TokenType {
    Access,                          // Short-lived token
    Refresh { token_id: Uuid, family_id: Uuid },  // Long-lived with family tracking
}
```

**Token Family**:
- `token_id`: Unique identifier for this refresh token
- `family_id`: Shared ID for all tokens in a refresh chain (for token rotation security)

### Password Hashing (Argon2)

**Hash Password**:
```rust
pub fn hash_password(&self, password: &str) -> Result<String, AppError>
```

**Process**:
1. Validate password strength using `PasswordValidator`
2. Generate random salt (`SaltString::generate(&mut OsRng)`)
3. Hash with Argon2 default parameters
4. Return PHC string format (`$argon2id$v=19$...`)

**Validation Rules** (via `PasswordValidator`):
- Minimum length
- Complexity requirements
- Character class requirements

**Verify Password**:
```rust
pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool, AppError>
```

**Process**:
1. Parse password hash string
2. Verify password against hash using Argon2
3. Return `Ok(true)` if match, `Ok(false)` if no match
4. Returns `false` for empty inputs (safe default)

### Token Creation

**Access Token** (15 minutes):
```rust
pub fn create_access_token(
    &self,
    user_id: &Uuid,
    email: &str,
    username: &str,
) -> Result<String, AppError>
```

**Claims**:
- `sub`: user_id (UUID string)
- `email`: User email
- `username`: Username
- `exp`: Current time + 15 minutes
- `iat`: Current timestamp
- `token_type`: `TokenType::Access`

**Refresh Token** (7 days):
```rust
pub fn create_refresh_token(
    &self,
    user_id: &Uuid
) -> Result<(String, Uuid), AppError>
```

**Returns**: `(token_string, token_id)`

**Claims**:
- `exp`: Current time + 7 days
- `token_type`: `TokenType::Refresh { token_id, family_id }`
- `token_id`: Unique per token
- `family_id`: New UUID for token family

**Token Rotation**:
When refreshing, pass `family_id` from previous refresh token:
```rust
pub fn create_refresh_token_with_family(
    &self,
    user_id: &Uuid,
    family_id: Uuid,
) -> Result<(String, Uuid), AppError>
```

All tokens in a chain share the same `family_id`.

### Token Validation

**Decode Token**:
```rust
pub fn decode_token(&self, token: &str) -> Result<Claims, AppError>
```

**Process**:
1. Decode JWT using `decoding_key`
2. Validate signature (HS256)
3. Validate expiration (`exp` claim)
4. Return `Claims` struct

**Validation**: Uses `jsonwebtoken::decode()` with default validation (validates exp, nbf).

### Refresh Token Claims (Optional)

**If implemented**:
```rust
pub struct RefreshClaims {
    pub sub: String,           // user_id
    pub token_id: Uuid,
    pub family_id: Uuid,
    pub exp: i64,
}
```

Used for refresh token validation logic.

## Email Module (email.rs)

### EmailService

**Purpose**: Send emails via SMTP

**Struct** (inferred):
```rust
pub struct EmailService {
    mailer: AsyncTransport<Email>,
    from_address: Mailbox,
}
```

**Initialization**:
```rust
impl EmailService {
    pub fn new(smtp_config: &SmtpConfig) -> Result<Self, AppError>
}
```

**SmtpConfig** (from `blog_shared`):
```rust
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub tls: bool,
    pub username: String,
    pub password: String,
    pub from: String,
}
```

### Email Types

**Verification Email**:
```rust
pub async fn send_verification_email(
    &self,
    to: &str,
    username: &str,
    verification_link: &str,
) -> Result<(), AppError>
```

**Template** (inferred):
```html
<h1>Welcome, {{username}}!</h1>
<p>Click <a href="{{verification_link}}">here</a> to verify your email.</p>
```

**Password Reset Email**:
```rust
pub async fn send_password_reset_email(
    &self,
    to: &str,
    reset_link: &str,
) -> Result<(), AppError>
```

**Template** (inferred):
```html
<h1>Reset Your Password</h1>
<p>Click <a href="{{reset_link}}">here</a> to reset your password.</p>
<p>This link expires in 1 hour.</p>
```

### Email Content

**Subject Lines**:
- Verification: "Verify your email address"
- Password reset: "Reset your password"

**HTML Templates**:
- Responsive design
- Plain text fallback
- Trackable links (optional)

### Error Handling

**Email Errors**:
- SMTP connection failure
- Authentication failure
- Invalid recipient address
- Timeout

**Mapped to**:
```rust
pub enum AppError {
    EmailError(String),
    // ...
}
```

## Dependencies

### External Crates
```toml
[dependencies]
argon2 = "0.5"              # Password hashing
jsonwebtoken = "9"          # JWT encoding/decoding
lettre = "0.11"             # Email sending
chrono = "0.4"              # Date/time handling
uuid = { version = "1", features = ["v4", "serde"] }
sha2 = "0.10"               # Hashing (pepper)
```

### Internal Crates
```toml
blog_shared = { path = "../shared" }
```

**Imports from `blog_shared`**:
- `AppError` - Error types
- `PasswordValidator` - Password validation

## Usage Examples

### Initialize Services

```rust
use blog_core::{JwtService, EmailService};

// JWT service
let jwt = JwtService::new(&settings.jwt_secret)?;

// Email service
let email = EmailService::new(&settings.smtp)?;
```

### Hash and Verify Password

```rust
// Hash password
let hash = jwt.hash_password("mySecurePassword123!")?;

// Verify password
let is_valid = jwt.verify_password("mySecurePassword123!", &hash)?;
assert!(is_valid);
```

### Create Tokens

```rust
use uuid::Uuid;

let user_id = Uuid::new_v4();

// Access token (15 min)
let access_token = jwt.create_access_token(
    &user_id,
    "user@example.com",
    "username"
)?;

// Refresh token (7 days)
let (refresh_token, token_id) = jwt.create_refresh_token(&user_id)?;
```

### Decode and Validate Token

```rust
let claims = jwt.decode_token(&access_token)?;

println!("User ID: {}", claims.sub);
println!("Email: {}", claims.email);
println!("Expires: {}", claims.exp);
```

### Send Emails

```rust
// Verification email
email.send_verification_email(
    "user@example.com",
    "username",
    "https://example.com/verify?token=abc123"
).await?;

// Password reset
email.send_password_reset_email(
    "user@example.com",
    "https://example.com/reset?token=xyz789"
).await?;
```

## Security Considerations

### Password Hashing
- **Algorithm**: Argon2id (memory-hard, resistant to GPU/ASIC attacks)
- **Salt**: Randomly generated per password
- **Parameters**: Argon2 default (time=1, mem=19456, threads=4)
- **Pepper**: Optional (SHA-256 hash of password + pepper)

### JWT Security
- **Secret**: >= 32 characters (enforced)
- **Algorithm**: HS256 (HMAC-SHA256)
- **Expiration**: Access (15 min), Refresh (7 days)
- **Token Family**: Prevents token reuse attacks
- **Rotation**: Old tokens invalidated on refresh

### Email Security
- **TLS**: Encrypted SMTP connection
- **Authentication**: Username/password
- **From Address**: Verified sender
- **Rate Limiting**: Should be implemented in API layer

### Error Handling
- Password hash errors return generic error (don't leak salt)
- JWT decode errors return generic "invalid token"
- Email errors logged but don't expose sensitive info

## Testing

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_and_verify_password() {
        let jwt = JwtService::new("test_secret_key_at_least_32_chars_long").unwrap();
        let hash = jwt.hash_password("password123").unwrap();
        assert!(jwt.verify_password("password123", &hash).unwrap());
    }

    #[test]
    fn test_create_and_decode_token() {
        let jwt = JwtService::new("test_secret_key_at_least_32_chars_long").unwrap();
        let token = jwt.create_access_token(&Uuid::new_v4(), "test@example.com", "user").unwrap();
        let claims = jwt.decode_token(&token).unwrap();
        assert_eq!(claims.email, "test@example.com");
    }
}
```

## Future Enhancements

### Authentication
- Add token blacklist (for logout)
- Implement token rotation (refresh token reuse detection)
- Add 2FA support (TOTP)
- Add OAuth2 (Google, GitHub)
- Add session management

### Password
- Add password history tracking
- Add password expiration
- Add account lockout (failed attempts)
- Add password reset rate limiting

### Email
- Add email templates (HTML + plain text)
- Add email queue (async sending)
- Add email tracking (opens, clicks)
- Add unsubscribe support
- Add bulk email support

## Related Modules
- `blog_api` - API handlers using auth services
- `blog_shared` - Shared error types, config
- `blog_db` - Database models for user tokens
