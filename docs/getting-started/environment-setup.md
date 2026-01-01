# 环境配置

本指南详细说明如何配置前端和后端的环境变量。

## 目录

- [快速配置](#快速配置)
- [前端环境变量](#前端环境变量)
- [后端环境变量](#后端环境变量)
- [生产环境配置](#生产环境配置)
- [安全建议](#安全建议)

## 快速配置

### 使用配置文件（推荐）

#### 前端配置

创建 `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

#### 后端配置

创建 `backend/.env`:

```bash
cd backend
cp .env.example .env
```

### 自动生成开发配置

**后端**：
```bash
cd backend
./scripts/deployment/deploy.sh dev
```

这将自动创建 `.env` 文件和开发环境配置。

## 前端环境变量

### 站点配置

```bash
# 站点 URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# 基础路径 (GitHub Pages 使用)
NEXT_PUBLIC_BASE_PATH=

# 构建模式
EXPORT=0  # 设为 1 启用静态导出
```

### 分析工具（可选）

```bash
# Umami 分析
NEXT_PUBLIC_UMAMI_ID=your-umami-id

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 评论系统（可选）

```bash
# Giscus 评论配置
NEXT_PUBLIC_GISCUS_REPO=zhengbi-yong/zhengbi-yong.github.io
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDOJxxxxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOJxxxxx
NEXT_PUBLIC_GISCUS_THEME=preferred_color_scheme
NEXT_PUBLIC_GISCUS_LANG=en
```

### 错误追踪（可选）

```bash
# Sentry 配置
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_PROJECT=blog-frontend
SENTRY_ORG=your-org
```

## 后端环境变量

### 数据库配置

```bash
# PostgreSQL 连接字符串
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# 数据库连接池（可选）
DATABASE_MAX_CONNECTIONS=10
DATABASE_MIN_CONNECTIONS=1
```

### Redis 配置

```bash
# Redis 连接字符串
REDIS_URL=redis://localhost:6379

# Redis 密码（如果设置了密码）
# REDIS_URL=redis://:password@localhost:6379
```

### JWT 认证配置

```bash
# JWT 签名密钥（**至少 32 个字符，生产环境必须更改**）
JWT_SECRET=dev-secret-key-for-testing-only-32-chars

# JWT 过期时间
JWT_EXPIRATION_HOURS=24

# Refresh Token 过期时间
REFRESH_TOKEN_EXPIRATION_DAYS=7
```

### 密码安全配置

```bash
# 密码 pepper（**至少 32 个字符，生产环境必须更改**）
PASSWORD_PEPPER=dev-password-pepper-for-testing
```

### 服务器配置

```bash
# 服务器地址
HOST=127.0.0.1

# 服务器端口
PORT=3000

# 运行环境
ENVIRONMENT=development
```

### 日志配置

```bash
# 日志级别: trace, debug, info, warn, error
RUST_LOG=debug

# 日志格式: json, pretty
RUST_LOG_FORMAT=pretty
```

### CORS 配置

```bash
# 允许的 CORS 源（多个用逗号分隔）
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# 允许的 HTTP 方法
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS

# 允许的请求头
CORS_ALLOWED_HEADERS=content-type,authorization
```

### 速率限制

```bash
# 每分钟请求限制
RATE_LIMIT_PER_MINUTE=1000

# 速率限制存储 (redis/memory)
RATE_LIMIT_STORE=redis
```

### Session 配置

```bash
# Session 密钥（**至少 32 个字符**）
SESSION_SECRET=dev-session-secret-key-32-chars

# Session 超时时间（小时）
SESSION_TIMEOUT_HOURS=24
```

### SMTP 配置（可选）

```bash
# SMTP 服务器
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# 使用 TLS
SMTP_USE_TLS=true
```

### 监控配置

```bash
# Prometheus 指标
PROMETHEUS_ENABLED=true
PROMETHEUS_ENDPOINT=/metrics

# Sentry 错误追踪
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=development
```

## 生产环境配置

### 安全密钥生成

生成安全的随机密钥：

```bash
# JWT Secret
openssl rand -base64 32

# Password Pepper
openssl rand -base64 32

# Session Secret
openssl rand -base64 32
```

### 生产环境示例

`backend/.env.production`:

```bash
# 数据库（使用强密码）
DATABASE_URL=postgresql://blog_user:STRONG_PASSWORD@localhost:5432/blog_db

# Redis（生产环境建议使用密码）
REDIS_URL=redis://:STRONG_PASSWORD@localhost:6379

# JWT（使用生成的密钥）
JWT_SECRET=<generated-32-char-secret>
JWT_EXPIRATION_HOURS=24

# 密码安全
PASSWORD_PEPPER=<generated-32-char-pepper>

# 服务器
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production

# CORS（仅允许生产域名）
CORS_ALLOWED_ORIGINS=https://zhengbi-yong.github.io

# 日志
RUST_LOG=info

# 速率限制
RATE_LIMIT_PER_MINUTE=60

# Session
SESSION_SECRET=<generated-32-char-secret>
SESSION_TIMEOUT_HOURS=24

# SMTP（使用真实的 SMTP 服务器）
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com

# 监控
PROMETHEUS_ENABLED=true
SENTRY_DSN=your-production-sentry-dsn
SENTRY_ENVIRONMENT=production
```

## 安全建议

### 密钥管理

1. **永远不要**将生产密钥提交到 Git
2. 使用 `.env.example` 作为模板
3. 确保 `.env` 文件在 `.gitignore` 中
4. 定期轮换密钥

### Git 配置

确保 `.gitignore` 包含：

```gitignore
# 环境变量
.env
.env.local
.env.*.local

# 但保留示例
!.env.example
```

### 文件权限

**Linux/Mac**:
```bash
chmod 600 .env  # 仅所有者可读写
```

**Windows PowerShell**:
```powershell
icacls .env /inheritance:r
icacls .env /grant:r "$env:USERNAME:F"
```

### 密钥存储

**开发环境**: 使用 `.env` 文件

**生产环境** 考虑使用：
- 系统环境变量
- Docker Secrets
- Vault 等密钥管理服务
- 云服务商的密钥管理（AWS Secrets Manager, Azure Key Vault 等）

### 配置验证

启动前验证配置：

```bash
# 检查必需的环境变量
cd backend
cargo run --bin check-env

# 或手动检查
echo $DATABASE_URL
echo $JWT_SECRET
```

## 平台特定配置

### Windows PowerShell

临时设置（当前会话）：
```powershell
$env:DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"
$env:REDIS_URL="redis://localhost:6379"
cargo run
```

永久设置（系统环境变量）：
```powershell
[System.Environment]::SetEnvironmentVariable('DATABASE_URL', 'postgresql://blog_user:blog_password@localhost:5432/blog_db', 'User')
```

### Linux/Mac

临时设置：
```bash
export DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"
export REDIS_URL="redis://localhost:6379"
cargo run
```

永久设置（添加到 `~/.bashrc` 或 `~/.zshrc`）：
```bash
echo 'export DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"' >> ~/.bashrc
source ~/.bashrc
```

### Docker Compose

在 `deployments/docker/compose-files/docker-compose.yml` 中配置：

```yaml
services:
  api:
    environment:
      - DATABASE_URL=postgresql://blog_user:blog_password@postgres:5432/blog_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env
```

## 故障排查

### 环境变量未生效

1. 确认文件名正确：
   - 前端: `.env.local`
   - 后端: `.env`

2. 重启开发服务器

3. 检查文件权限

### 数据库连接失败

```bash
# 检查 DATABASE_URL 格式
echo $DATABASE_URL

# 测试数据库连接
psql $DATABASE_URL
```

### CORS 错误

确保 `CORS_ALLOWED_ORIGINS` 包含前端 URL：
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com
```

## 相关文档

- [快速开始](quick-start.md) - 快速启动项目
- [安装指南](installation.md) - 详细的安装步骤
- [故障排查](troubleshooting.md) - 解决常见问题

---

**最后更新**: 2025-12-27
