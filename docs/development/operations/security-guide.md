# Security Guide

本文档说明项目中的安全措施和最佳实践，确保系统在生产环境中保持安全。

## 目录

- [认证与授权](#认证与授权)
- [API 安全](#api-安全)
- [数据保护](#数据保护)
- [Web 安全](#web-安全)
- [依赖安全](#依赖安全)
- [安全审计](#安全审计)

---

## 认证与授权

### JWT 最佳实践

#### Token 结构

```rust
// JWT Token 包含三个部分
pub struct Claims {
    pub sub: String,        // 用户 ID
    pub exp: usize,         // 过期时间
    pub iat: usize,         // 签发时间
    pub iss: String,        // 签发者
    pub aud: String,        // 受众
    pub typ: String,        // Token 类型 (access/refresh)
}
```

#### Access Token 配置

**有效期**: 15 分钟

```rust
use jsonwebtoken::{encode, Header, EncodingKey};

fn generate_access_token(user_id: &str) -> Result<String> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::minutes(15))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration as usize,
        iat: Utc::now().timestamp() as usize,
        iss: "blog-backend".to_string(),
        aud: "blog-users".to_string(),
        typ: "access".to_string(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
}
```

#### Refresh Token 配置

**有效期**: 7 天

**安全措施**:
- 存储在 HTTP-only Cookie 中
- 使用 Token family 追踪机制
- 登录时吊销所有旧的 refresh token

```rust
pub struct RefreshToken {
    pub token: String,
    pub user_id: Uuid,
    pub family_id: Uuid,      // Token family ID
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
}
```

---

### 密码策略

#### 密码要求

- 最少 12 字符
- 最多 128 字符
- 必须包含：
  - 大写字母 (A-Z)
  - 小写字母 (a-z)
  - 数字 (0-9)
  - 特殊字符 (!@#$%^&*)
- 不能在常见密码黑名单中

#### 密码哈希

```rust
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, SaltString},
    Argon2,
};

pub fn hash_password(password: &str) -> Result<String> {
    // 验证密码强度
    PasswordValidator::validate(password)?;

    // 使用 Argon2 哈希
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|_| anyhow!("Failed to hash password"))?
        .to_string();

    Ok(password_hash)
}
```

#### 密码验证

```rust
pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|_| anyhow!("Invalid password hash"))?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map(|_| true)
        .map_err(|_| anyhow!("Invalid password"))
}
```

---

### Session 管理

#### Session 配置

**环境变量**:
```bash
SESSION_SECRET=your-secret-key-at-least-32-chars
SESSION_TIMEOUT_HOURS=24
```

#### Session 实现

```rust
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
}

impl Session {
    pub fn is_valid(&self) -> bool {
        Utc::now() < self.expires_at
    }

    pub fn refresh(&mut self) {
        self.last_activity = Utc::now();
        self.expires_at = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .expect("valid timestamp");
    }
}
```

---

## API 安全

### 速率限制

#### 配置

**默认限制**: 60 请求/分钟

```rust
use governor::{Quota, RateLimiter};

pub fn create_rate_limiter() -> RateLimiter<std::net::IpAddr> {
    let quota = Quota::per_minute(60);
    RateLimiter::direct(quota)
}
```

#### 不同端点的限制

| 端点类型 | 限制 | 窗口 |
|---------|------|------|
| 公开 API | 60/min | 1 分钟 |
| 认证端点 | 10/min | 1 分钟 |
| API 用户 | 120/min | 1 分钟 |
| 管理员 | 300/min | 1 分钟 |

---

### CORS 配置

#### 开发环境

```rust
pub fn create_cors_layer() -> CorsLayer {
    let allowed_origins = if cfg!(debug_assertions) {
        "http://localhost:3001,http://localhost:3000".to_string()
    } else {
        std::env::var("CORS_ALLOWED_ORIGINS")
            .unwrap_or_else(|_| "https://yourdomain.com".to_string())
    };

    // 解析并创建 CORS 层
    // ...
}
```

#### 生产环境

```bash
# 环境变量
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**CORS 头**:
- `Access-Control-Allow-Origin`: 配置的域名
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Max-Age`: 86400 (24 小时)

---

### 输入验证

#### 类型验证

```rust
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,

    #[validate(length(min = 12, max = 128, message = "Password must be 12-128 characters"))]
    pub password: String,

    #[validate(length(min = 3, max = 50, message = "Username must be 3-50 characters"))]
    pub username: String,
}
```

#### SQL 注入防护

```rust
use sqlx::PgPool;

// ✅ 使用参数化查询
async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>> {
    sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await
    .map_err(Into::into)
}

// ❌ 避免字符串拼接
// let query = format!("SELECT * FROM users WHERE email = '{}'", email);
```

#### XSS 防护

**后端**:
```rust
use ammonia::clean;

pub fn sanitize_html(input: &str) -> String {
    clean(input)
}
```

**前端**:
```tsx
import DOMPurify from 'dompurify'

function CommentContent({ content }: { content: string }) {
  const clean = DOMPurify.sanitize(content)
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

---

## 数据保护

### 加密策略

#### 传输层加密

- **HTTPS 强制**: 所有生产环境流量必须使用 HTTPS
- **TLS 版本**: 最低 TLS 1.2，推荐 TLS 1.3
- **HSTS**: 启用 HTTP Strict Transport Security

```nginx
# Nginx 配置
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

#### 存储加密

**敏感数据**:
- 密码：使用 Argon2 哈希
- API 密钥：加密存储
- Session 数据：加密存储

```rust
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};

pub fn encrypt_sensitive_data(data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(b"unique nonce"); // 应使用随机 nonce

    cipher
        .encrypt(nonce, data)
        .map_err(|_| anyhow!("Encryption failed"))
}
```

---

### 敏感数据存储

#### 环境变量

```bash
# 密钥
JWT_SECRET=your-secret-key-at-least-32-chars
SESSION_SECRET=your-session-secret
PASSWORD_PEPPER=your-pepper-at-least-32-chars

# 数据库
DATABASE_URL=postgresql://user:password@host:5432/dbname

# 外部服务
SMTP_PASSWORD=your-smtp-password
API_SECRET_KEY=your-api-key
```

**注意事项**:
- ✅ 所有密钥存储在环境变量中
- ✅ 不要在代码中硬编码密钥
- ✅ 使用 `.env` 文件（不要提交到 Git）
- ✅ 定期轮换密钥

---

### GDPR 合规

#### 数据最小化

只收集必要的用户数据：

```rust
pub struct User {
    pub id: Uuid,
    pub email: String,          // 必需
    pub username: String,       // 必需
    pub password_hash: String,  // 必需

    // 可选数据（需用户同意）
    pub profile_picture: Option<String>,
    pub bio: Option<String>,
    pub location: Option<String>,
}
```

#### 数据导出

```rust
#[derive(Serialize)]
pub struct UserDataExport {
    pub profile: User,
    pub comments: Vec<Comment>,
    pub statistics: UserStats,
    pub export_date: DateTime<Utc>,
}

pub async fn export_user_data(pool: &PgPool, user_id: Uuid) -> Result<UserDataExport> {
    // 收集所有用户数据
    let user = get_user(pool, user_id).await?;
    let comments = get_user_comments(pool, user_id).await?;
    let stats = get_user_stats(pool, user_id).await?;

    Ok(UserDataExport {
        profile: user,
        comments,
        statistics: stats,
        export_date: Utc::now(),
    })
}
```

#### 数据删除

```rust
pub async fn delete_user_data(pool: &PgPool, user_id: Uuid) -> Result<()> {
    // 开始事务
    let mut tx = pool.begin().await?;

    // 删除用户关联数据
    sqlx::query("DELETE FROM comments WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

    // 删除用户会话
    sqlx::query("DELETE FROM refresh_tokens WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

    // 删除用户（假删除）
    sqlx::query("UPDATE users SET email = $1, username = $1, deleted_at = NOW() WHERE id = $2")
        .bind(format!("deleted-{}", user_id))
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

    // 提交事务
    tx.commit().await?;

    Ok(())
}
```

---

## Web 安全

### XSS 防护

#### Content Security Policy

```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
`

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ]
  },
}
```

#### 输入清理

```rust
use ammonia::clean;

pub fn sanitize_user_input(input: &str) -> String {
    clean(input)
}

// 或使用更严格的策略
use ammonia::Builder;

pub fn sanitize_strict(input: &str) -> String {
    Builder::new()
        .tags(vec!["p", "br", "strong", "em"])
        .clean(input)
        .to_string()
}
```

---

### CSRF 防护

#### SameSite Cookie

```rust
use tower_cookies::Cookie;

pub fn create_cookie(name: &str, value: &str) -> Cookie {
    let mut cookie = Cookie::new(name, value);

    cookie.set_http_only(true);
    cookie.set_secure(true); // 仅通过 HTTPS
    cookie.set_same_site(tower_cookies::cookie::SameSite::Strict);
    cookie.set_path("/");

    cookie
}
```

#### CSRF Token

```typescript
// 前端：生成 CSRF token
import { csrfToken } from '@/lib/csrf'

async function submitForm(data: FormData) {
  const token = await csrfToken()

  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': token,
    },
    body: data,
  })

  return response.json()
}
```

---

### 点击劫持防护

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}
```

---

## 依赖安全

### 依赖扫描

#### Rust - cargo-audit

```bash
# 安装 cargo-audit
cargo install cargo-audit

# 扫描漏洞
cargo audit

# 自动审计
cargo audit --fetch
```

#### Node.js - npm audit

```bash
# 扫描漏洞
pnpm audit

# 自动修复
pnpm audit --fix

# 仅检查开发依赖
pnpm audit --dev
```

---

### 漏洞更新

#### 自动更新

```bash
# Rust
cargo-update

# Node.js
pnpm update
```

#### GitHub Dependabot

**文件**: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "cargo"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10

  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

### Supply Chain Security

#### Rust

```toml
# Cargo.toml
[dependencies]
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres"] }

# 验证依赖校验和
[dependencies.sqlx]
checksum = "sha256:${checksum}"
```

#### Node.js

```json
// package.json
{
  "overrides": {
    "package-with-vulnerability": "fixed-version"
  }
}
```

---

## 安全审计

### 定期审计清单

#### 每周

- [ ] 检查依赖漏洞
- [ ] 审查访问日志
- [ ] 检查异常登录

#### 每月

- [ ] 更新依赖
- [ ] 审查权限
- [ ] 检查错误日志

#### 每季度

- [ ] 全面安全审计
- [ ] 渗透测试
- [ ] 代码安全审查

---

### 安全评分

#### 使用工具

1. **Snyk**: 依赖漏洞扫描
2. **OWASP ZAP**: Web 应用安全扫描
3. **Lighthouse**: 安全最佳实践检查

#### 目标评分

| 工具 | 目标 | 可接受 |
|------|------|--------|
| Snyk | A | B |
| OWASP ZAP | Low | Medium |
| Lighthouse | 90+ | 80+ |

---

### 渗透测试

#### 常见测试场景

1. **认证测试**:
   - 弱密码测试
   - 暴力破解防护
   - Session 劫持

2. **授权测试**:
   - 垂直权限提升（普通用户访问管理员功能）
   - 水平权限提升（用户A访问用户B数据）

3. **注入测试**:
   - SQL 注入
   - XSS 注入
   - 命令注入

4. **业务逻辑测试**:
   - 支付绕过
   - 参数篡改
   - 竞态条件

---

## 事故响应

### 安全事件处理流程

1. **检测**: 监控系统检测到异常
2. **确认**: 验证是否为真实安全事件
3. **遏制**: 限制事件影响范围
4. **根除**: 移除攻击源
5. **恢复**: 恢复正常服务
6. **总结**: 事后分析和改进

### 联系方式

| 角色 | 联系方式 |
|------|---------|
| 安全负责人 | security@example.com |
| 系统管理员 | admin@example.com |
| 开发团队 | dev@example.com |

---

## 相关文档

- [Performance Monitoring](./performance-monitoring.md) - 性能监控
- [Troubleshooting Guide](./troubleshooting-guide.md) - 故障排查
- [Backend API Reference](../backend/api-reference.md) - API 文档
- [Best Practices](../best-practices.md) - 开发最佳实践

---

**最后更新**: 2025-12-27
**维护者**: Security Team
