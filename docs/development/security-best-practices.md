# 安全最佳实践

本文档概述了项目中应遵循的安全最佳实践，涵盖后端、前端和部署安全。

## 后端安全

### 1. 认证和授权

#### ✅ 推荐做法

```rust
// 使用 JWT + Refresh Token 双 token 机制
pub struct AuthService {
    jwt_secret: String,
    refresh_secret: String,
}

impl AuthService {
    // 短期 access token (15分钟)
    pub fn generate_access_token(&self, user_id: Uuid) -> String {
        // JWT 生成逻辑
    }

    // 长期 refresh token (7天)
    pub fn generate_refresh_token(&self, user_id: Uuid) -> String {
        // JWT 生成逻辑
    }
}

// 基于角色的访问控制 (RBAC)
#[derive(Debug, Clone, PartialEq)]
pub enum Role {
    Admin,
    User,
    Guest,
}

pub fn require_role(user: &User, required_role: Role) -> Result<(), AuthError> {
    if user.role >= required_role {
        Ok(())
    } else {
        Err(AuthError::InsufficientPermissions)
    }
}
```

#### ❌ 避免的做法

```rust
// ❌ 不要在日志中记录敏感信息
tracing::info!("User logged in with password: {}", password);

// ❌ 不要使用弱加密算法
use md5;  // 不要使用 MD5
use sha1; // 不要使用 SHA1

// ✅ 使用 Argon2
use argon2::{Argon2, PasswordHasher};
```

### 2. 密码安全

```rust
// ✅ 使用 Argon2 进行密码哈希
use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2,
};

pub fn hash_password(password: &str) -> Result<String, AuthError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AuthError::HashingError(e.to_string()))?
        .to_string();

    Ok(password_hash)
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, AuthError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AuthError::InvalidHash(e.to_string()))?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|e| match e {
            argon2::password_hash::Error::Password => Ok(false),
            _ => Err(AuthError::VerificationError(e.to_string())),
        })
}

// ✅ 强密码策略
pub struct PasswordValidator {
    min_length: usize,
    require_uppercase: bool,
    require_digit: bool,
    require_special: bool,
}

impl PasswordValidator {
    pub fn validate(&self, password: &str) -> Result<(), ValidationError> {
        if password.len() < self.min_length {
            return Err(ValidationError::TooShort);
        }

        if self.require_uppercase && !password.chars().any(|c| c.is_uppercase()) {
            return Err(ValidationError::MissingUppercase);
        }

        if self.require_digit && !password.chars().any(|c| c.is_ascii_digit()) {
            return Err(ValidationError::MissingDigit);
        }

        Ok(())
    }
}
```

### 3. 输入验证

```rust
// ✅ 验证所有用户输入
use validator::{Validate, ValidationError};

#[derive(Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,

    #[validate(email)]
    pub email: String,

    #[validate(length(min = 8))]
    pub password: String,
}

pub async fn create_user(
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    // 验证输入
    req.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // 处理逻辑...
}

// ✅ 清理 HTML 内容防止 XSS
use ammonia::clean;

pub fn sanitize_html(html: &str) -> String {
    clean(html)
}

// ✅ 限制文件上传
#[derive(Debug)]
pub struct FileUploadConfig {
    pub max_size: usize,           // 最大文件大小 (字节)
    pub allowed_types: Vec<String>, // 允许的 MIME 类型
    pub upload_path: String,       // 上传目录
}

impl FileUploadConfig {
    pub fn validate(&self, file: &UploadedFile) -> Result<(), UploadError> {
        // 检查文件大小
        if file.size > self.max_size {
            return Err(UploadError::FileTooLarge);
        }

        // 检查文件类型
        if !self.allowed_types.contains(&file.content_type) {
            return Err(UploadError::InvalidFileType);
        }

        Ok(())
    }
}
```

### 4. SQL注入防护

```rust
// ✅ 使用参数化查询
use sqlx::{PgPool, Row};

pub async fn get_user_by_id(pool: &PgPool, id: Uuid) -> Result<User, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT id, username, email, created_at FROM users WHERE id = $1",
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(user)
}

// ❌ 不要拼接 SQL 字符串
pub async fn get_user_by_id_bad(pool: &PgPool, id: &str) -> Result<User, AppError> {
    let query = format!("SELECT * FROM users WHERE id = '{}'", id);
    // 这是危险的！可能导致 SQL 注入
}
```

### 5. 速率限制

```rust
// ✅ 使用 Redis 实现速率限制
use redis::AsyncCommands;

pub struct RateLimiter {
    redis_client: redis::Client,
    max_requests: u64,
    window_seconds: u64,
}

impl RateLimiter {
    pub async fn check_rate_limit(
        &self,
        key: &str,
    ) -> Result<bool, RateLimitError> {
        let mut conn = self.redis_client
            .get_async_connection()
            .await
            .map_err(|e| RateLimitError::RedisError(e.to_string()))?;

        let key = format!("rate_limit:{}", key);

        // 增加计数
        let count: u64 = conn
            .incr(&key, 1)
            .await
            .map_err(|e| RateLimitError::RedisError(e.to_string()))?;

        // 如果是第一次请求，设置过期时间
        if count == 1 {
            conn
                .expire(&key, self.window_seconds as usize)
                .await
                .map_err(|e| RateLimitError::RedisError(e.to_string()))?;
        }

        Ok(count <= self.max_requests)
    }
}

// 在 Axum 中间件中使用
pub async fn rate_limit_middleware(
    State(limiter): State<RateLimiter>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let ip = req
        .headers()
        .get("X-Forwarded-For")
        .and_then(|h| h.to_str().ok())
        .unwrap_or_else(|| "unknown");

    match limiter.check_rate_limit(ip).await {
        Ok(true) => Ok(next.run(req).await),
        Ok(false) => Err(StatusCode::TOO_MANY_REQUESTS),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
```

### 6. CORS 配置

```rust
// ✅ 严格的 CORS 配置
use tower_http::cors::{Any, CorsLayer};
use tower_http::cors::AllowOrigin;

pub fn create_cors_layer() -> CorsLayer {
    let allowed_origins: Vec<String> = std::env::var("CORS_ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3000".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .collect();

    CorsLayer::new()
        .allow_origin(allowed_origins.iter().map(|origin| {
            origin.parse::<AllowOrigin>().unwrap_or(AllowOrigin::any())
        }).collect::<Vec<_>>())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any)
        .allow_credentials(true)
        .max_age(Duration::from_secs(3600))
}
```

## 前端安全

### 1. XSS 防护

```typescript
// ✅ React 自动转义 JSX 中的内容
function UserComment({ comment }: { comment: string }) {
  return <div>{comment}</div>  // 自动转义
}

// ⚠️ 使用 dangerouslySetInnerHTML 时必须清理
import DOMPurify from 'dompurify'

function HtmlContent({ html }: { html: string }) {
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  })

  return (
    <div
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  )
}

// ❌ 不要直接插入未验证的 HTML
function BadComponent({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
```

### 2. CSRF 防护

```typescript
// ✅ 使用 httpOnly cookie 存储 token
// 前端代码无法通过 JavaScript 访问，防止 XSS 窃取

// ✅ 每个请求自动携带 cookie
const response = await fetch('/api/posts', {
  credentials: 'include',  // 包含 cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ CSRF Token
function getCsrfToken(): string {
  // 从 meta 标签获取 CSRF token
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  return metaTag?.getAttribute('content') || ''
}

const response = await fetch('/api/posts', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  },
})
```

### 3. 敏感数据保护

```typescript
// ❌ 不要在前端存储敏感信息
// 不要这样做：
localStorage.setItem('password', password)
localStorage.setItem('api_key', api_key)

// ✅ 只存储必要的非敏感数据
localStorage.setItem('user_preferences', JSON.stringify(preferences))

// ✅ 使用 httpOnly cookie 存储 token
// 这是后端设置的，前端 JavaScript 无法访问

// ✅ 环境变量管理
const API_URL = process.env.NEXT_PUBLIC_API_URL
// 不要在代码中硬编码密钥或敏感 URL
```

### 4. 内容安全策略 (CSP)

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.example.com",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

## 部署安全

### 1. 环境变量管理

```bash
# ✅ 使用 .env 文件（不提交到 git）
# .env
DATABASE_URL=postgresql://user:password@localhost/db
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379

# ✅ 生产环境从安全配置管理服务获取
# AWS Secrets Manager, HashiCorp Vault 等

# ❌ 不要在代码中硬编码密钥
// const API_KEY = "sk-live-abc123"  // 危险！
```

```rust
// ✅ 验证必需的环境变量
use std::env;

#[derive(Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub redis_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let database_url = env::var("DATABASE_URL")
            .map_err(|_| ConfigError::MissingEnv("DATABASE_URL"))?;

        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| ConfigError::MissingEnv("JWT_SECRET"))?;

        if jwt_secret.len() < 32 {
            return Err(ConfigError::InvalidSecret("JWT_SECRET too short"));
        }

        Ok(Config {
            database_url,
            jwt_secret,
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
        })
    }
}
```

### 2. HTTPS 配置

```nginx
# ✅ Nginx 配置 - 强制 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 现代 SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 其他安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3. Docker 安全

```dockerfile
# ✅ 使用非 root 用户
FROM rust:1.84 as builder

WORKDIR /app
COPY . .

# 构建应用
RUN cargo build --release

# ✅ 使用最小的基础镜像
FROM debian:bookworm-slim

# 创建非 root 用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 安装必要的依赖
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 复制构建的二进制文件
COPY --from=builder /app/target/release/api /app/api

# 设置文件权限
RUN chown -R appuser:appuser /app

# 切换到非 root 用户
USER appuser

WORKDIR /app

# ✅ 只暴露必要的端口
EXPOSE 3000

CMD ["/app/api"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    # ✅ 不使用特权模式
    # privileged: false  (默认)
    # ✅ 限制资源
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    # ✅ 只读根文件系统
    read_only: true
    tmpfs:
      - /tmp
```

### 4. 依赖安全

```bash
# ✅ Rust 依赖审计
cargo install cargo-audit
cargo audit

# ✅ Node.js 依赖审计
pnpm audit

# ✅ 自动更新依赖
cargo-update:
  cargo install cargo-update
  cargo update

pnpm-update:
  pnpm update --latest

# ✅ 定期检查漏洞
# 设置 CI/CD 管道自动运行审计
```

### 5. 日志和监控

```rust
// ✅ 不记录敏感信息
use tracing::{info, error, instrument};

#[instrument(skip(password))]
pub async fn login_user(
    email: String,
    password: String,  // skip 防止密码被记录
) -> Result<String, AuthError> {
    info!(email = %email, "User login attempt");
    // 不记录密码！

    let user = authenticate_user(&email, &password).await?;

    info!(user_id = %user.id, "User logged in successfully");
    Ok(generate_token(&user)?)
}

// ✅ 记录安全事件
pub enum SecurityEvent {
    LoginFailed { email: String, reason: String },
    RateLimitExceeded { ip: String },
    SuspiciousActivity { user_id: Uuid, description: String },
}

pub async fn log_security_event(event: SecurityEvent) {
    match event {
        SecurityEvent::LoginFailed { email, reason } => {
            tracing::warn!(
                email = %email,
                reason = %reason,
                "Failed login attempt"
            );
            // 发送到安全监控系统
        }
        // ... 其他事件
    }
}
```

## 安全检查清单

### 开发阶段
- [ ] 所有用户输入都经过验证
- [ ] 密码使用 Argon2 哈希
- [ ] SQL 查询使用参数化
- [ ] 没有 `unwrap()` 或 `expect()` 在生产代码中
- [ ] 敏感信息不记录到日志
- [ ] 错误消息不泄露敏感信息

### 部署阶段
- [ ] 环境变量正确配置
- [ ] HTTPS 强制启用
- [ ] CORS 配置严格
- [ ] 速率限制启用
- [ ] 依赖无已知漏洞
- [ ] 日志监控系统运行

### 运维阶段
- [ ] 定期更新依赖
- [ ] 定期运行安全审计
- [ ] 监控异常活动
- [ ] 备份数据并测试恢复
- [ ] 响应安全事件预案

---

遵循这些安全最佳实践将大大提高应用程序的安全性，防止常见的安全漏洞。
