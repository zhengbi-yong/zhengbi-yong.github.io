# Environment Variables Reference / 环境变量参考

Complete reference of all environment variables used in the blog platform.
/ 博客平台使用的所有环境变量的完整参考。

---

## 📋 Overview / 概述

The blog platform uses environment variables for configuration. These variables control database connections, authentication, security settings, and more.
/ 博客平台使用环境变量进行配置。这些变量控制数据库连接、认证、安全设置等。

### Configuration Files / 配置文件

**Primary Configuration / 主配置**:
- `.env` - Main environment variables (not in git) / 主要环境变量（不在git中）
- `.env.example` - Template with defaults / 带有默认值的模板

**Usage / 使用**:
```bash
# Copy template to .env
cp .env.example .env

# Edit .env with your values
nano .env

# Source the file (Linux/Mac)
source .env

# Or Docker Compose will automatically load .env
docker compose up -d
```

---

## 🔐 Category 1: Database / 数据库

### DATABASE_URL
**Description / 描述**: PostgreSQL connection string / PostgreSQL连接字符串

**Format / 格式**:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Example / 示例**:
```bash
# Local development
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Production (Docker internal network)
DATABASE_URL=postgresql://blog_user:STRONG_PASSWORD@postgres:5432/blog_db

# Remote PostgreSQL
DATABASE_URL=postgresql://blog_user:PASSWORD@db.example.com:5432/blog_db?sslmode=require
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: None

**Validation / 验证**:
- Must be valid PostgreSQL connection URL
- Database must exist (or user must have CREATE DATABASE权限)
- User must have necessary permissions

**Security Notes / 安全注意事项**:
- ⚠️ **NEVER use default passwords in production**
- ⚠️ **Use strong passwords (32+ characters)**
- ⚠️ **Restrict user permissions to minimum required**
- ⚠️ **Use SSL for remote connections (sslmode=require)**

**See Also / 另见**: [Database Setup](../guides/server/production-server.md#database-setup)

---

## 🔐 Category 2: Cache (Redis) / 缓存

### REDIS_URL
**Description / 描述**: Redis connection string / Redis连接字符串

**Format / 格式**:
```
redis://[host]:[port]
```

**Example / 示例**:
```bash
# Local development
REDIS_URL=redis://localhost:6379

# Production (Docker internal network)
REDIS_URL=redis://redis:6379

# Remote Redis with password
REDIS_URL=redis://:PASSWORD@redis.example.com:6379
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: None

**Validation / 验证**:
- Redis server must be accessible
- Port must be open (if remote)

**Security Notes / 安全注意事项**:
- ⚠️ **Use Redis AUTH in production**
- ⚠️ **Don't expose Redis port publicly**
- ⚠️ **Use Redis ACLs (Redis 6+) if available**

---

## 🔑 Category 3: Authentication (JWT) / 认证

### JWT_SECRET
**Description / 描述**: Secret key for signing JWT access tokens / 用于签名JWT访问令牌的密钥

**Format / 格式**: Any strong random string / 任何强随机字符串

**Example / 示例**:
```bash
# Generate secure random secret (Linux/Mac)
openssl rand -base64 32

# Or use (Python)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# In .env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: None (required in .env.example)

**Validation / 验证**:
- Minimum 32 characters recommended
- Should be random and unpredictable
- Must be same across all backend instances

**Security Notes / 安全注意事项**:
- 🚨 **CRITICAL: Keep this secret!**
- 🚨 **If leaked, attackers can forge tokens**
- 🚨 **Rotate immediately if compromised**
- 🚨 **Never commit to git**

**Rotation / 轮换**:
If JWT_SECRET is compromised:
1. Generate new secret
2. Update .env
3. Restart backend service
4. All users must re-login (existing tokens invalidated)

---

### SESSION_SECRET
**Description / 描述**: Secret key for session management (HTTP-only cookies) / 会话管理密钥（HTTP-only cookies）

**Format / 格式**: Any strong random string / 任何强随机字符串

**Example / 示例**:
```bash
# Generate secure secret
SESSION_SECRET=your-session-secret-key-min-32-chars-random
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: None

**Validation / 验证**:
- Minimum 32 characters
- Should be different from JWT_SECRET

**Security Notes / 安全注意事项**:
- 🚨 **Keep this secret**
- 🚨 **Different from JWT_SECRET**
- 🚨 **Rotate periodically (every 90 days)**

---

### PASSWORD_PEPPER
**Description / 描述**: Global pepper for password hashing (additional security layer) / 密码哈希的全局pepper（额外安全层）

**Format / 格式**: Any strong random string / 任何强随机字符串

**Example / 示例**:
```bash
# Generate pepper (one-time, never change)
PASSWORD_PEPPER=your-global-pepper-never-change-this
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: None

**Validation / 验证**:
- Minimum 32 characters
- Should be unique per installation

**Security Notes / 安全注意事项**:
- ⚠️ **Store securely (not in .env if possible)**
- ⚠️ **If you change this, ALL passwords become invalid**
- ⚠️ **Backup before changing**
- ⚠️ **Consider using environment-specific pepper**

**What is Pepper? / 什么是Pepper？**
- Similar to salt but global (same for all users)
- Stored separately from database
- Adds defense against database + app compromise
- Must NEVER change after setting

---

## 🌐 Category 4: Server Configuration / 服务器配置

### HOST
**Description / 描述**: Host address for backend server / 后端服务器主机地址

**Example / 示例**:
```bash
# Local development
HOST=127.0.0.1

# Docker deployment
HOST=0.0.0.0

# Production
HOST=0.0.0.0
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: `127.0.0.1`

**Values / 值**:
- `127.0.0.1` - Localhost only (development)
- `0.0.0.0` - All interfaces (production/Docker)

---

### PORT
**Description / 描述**: Port for backend server / 后端服务器端口

**Example / 示例**:
```bash
PORT=3000
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: `3000`

**Validation / 验证**:
- Must be available (not in use)
- 1024-65535 range
- Frontend and Nginx config must match

---

### ENVIRONMENT
**Description / 描述**: Deployment environment type / 部署环境类型

**Example / 示例**:
```bash
ENVIRONMENT=development
# or
ENVIRONMENT=production
# or
ENVIRONMENT=staging
```

**Required / 必需**: ⚠️ No (but recommended)

**Default Value / 默认值**: `development`

**Values / 值**:
- `development` - Development mode (verbose logs, debug info)
- `production` - Production mode (minimal logs, optimized)
- `staging` - Staging environment

**Impact / 影响**:
- Log verbosity
- Error messages detail
- Debug features enabled/disabled
- Performance optimizations

---

## 🔒 Category 5: Security / 安全

### CORS_ALLOWED_ORIGINS
**Description / 描述**: Allowed CORS origins for frontend / 允许的前端CORS源

**Format / 格式**: Comma-separated list of URLs / 逗号分隔的URL列表

**Example / 示例**:
```bash
# Local development
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Production single domain
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Multiple domains
CORS_ALLOWED_ORIGINS=https://blog.example.com,https://www.example.com
```

**Required / 必需**: ✅ Yes

**Default Value / 默认值**: `http://localhost:3001`

**Validation / 验证**:
- Must include frontend URL
- Use https:// in production
- No trailing slashes

**Security Notes / 安全注意事项**:
- ⚠️ **Don't use `*` in production**
- ⚠️ **Only include domains you control**
- ⚠️ **Include all variants (www, non-www)**
- ⚠️**Test after deployment**

---

### RATE_LIMIT_PER_MINUTE
**Description / 描述**: Maximum requests per minute per IP / 每个IP每分钟最大请求数

**Example / 示例**:
```bash
# Development (no limit)
RATE_LIMIT_PER_MINUTE=10000

# Production (reasonable limit)
RATE_LIMIT_PER_MINUTE=100

# Strict limit
RATE_LIMIT_PER_MINUTE=60
```

**Required / 必需**: ⚠️ No

**Default Value / 默认值**: `1000`

**Values / 值**:
- `0` or empty - No rate limiting
- `10-100` - Strict (good for preventing abuse)
- `100-1000` - Moderate (typical production)
- `1000+` - Permissive (development)

**Recommendations / 推荐**:
- Development: No limit or very high (10000+)
- Production: 100-200 depending on traffic
- Public API: Lower (60-100)

**Storage / 存储**: Uses Redis to track request counts

---

## 📊 Category 6: Monitoring / 监控

### PROMETHEUS_ENABLED
**Description / 描述**: Enable Prometheus metrics collection / 启用Prometheus指标收集

**Example / 示例**:
```bash
# Enable (production)
PROMETHEUS_ENABLED=true

# Disable (development)
PROMETHEUS_ENABLED=false
```

**Required / 必需**: ⚠️ No

**Default Value / 默认值**: `false`

**Values / 值**:
- `true` - Enable metrics endpoint at `/metrics`
- `false` - Disable metrics

**When to Enable / 何时启用**:
- Production deployments
- When using Prometheus + Grafana
- Performance monitoring needed

**Metrics Collected / 收集的指标**:
- Request counts and latency
- Database query performance
- Cache hit rates
- Error rates
- Resource usage

**See Also / 另见**: [Monitoring Guide](../best-practices/monitoring.md)

---

### RUST_LOG
**Description / 描述**: Rust log level for backend / 后端Rust日志级别

**Example / 示例**:
```bash
# Development (verbose)
RUST_LOG=debug

# Production (errors only)
RUST_LOG=error

# Info level
RUST_LOG=info

# Specific module
RUST_LOG=blog_backend=debug,sqlx=warn
```

**Required / 必需**: ⚠️ No

**Default Value / 默认值**: `info`

**Log Levels / 日志级别** (from most to least verbose):
- `trace` - Extremely verbose (rarely used)
- `debug` - Development debugging
- `info` - General information (default)
- `warn` - Warnings only
- `error` - Errors only

**Recommendations / 推荐**:
- Development: `debug` or `trace`
- Production: `info` or `warn`
- Troubleshooting: `debug`

---

## 📧 Category 7: Email (Optional) / 邮件（可选）

### SMTP_HOST
**Description / 描述**: SMTP server hostname / SMTP服务器主机名

**Example / 示例**:
```bash
# Gmail
SMTP_HOST=smtp.gmail.com

# SendGrid
SMTP_HOST=smtp.sendgrid.net

# Custom SMTP
SMTP_HOST=mail.example.com
```

**Required / 必需**: ❌ No (only if email features needed)

**Default Value / 默认值**: None

---

### SMTP_PORT
**Description / 描述**: SMTP server port / SMTP服务器端口

**Example / 示例**:
```bash
# TLS
SMTP_PORT=587

# SSL
SMTP_PORT=465
```

**Required / 必需**: ❌ No

**Default Value / 默认值**: `587`

---

### SMTP_USERNAME
**Description / 描述**: SMTP authentication username / SMTP认证用户名

**Example / 示例**:
```bash
SMTP_USERNAME=your-email@example.com
```

**Required / 必需**: ❌ No

**Default Value / 默认值**: None

---

### SMTP_PASSWORD
**Description / 描述**: SMTP authentication password / SMTP认证密码

**Example / 示例**:
```bash
SMTP_PASSWORD=your-app-password
```

**Required / 必需**: ❌ No

**Default Value / 默认值**: None

**Security Notes / 安全注意事项**:
- ⚠️ **Use app-specific passwords (not your main password)**
- ⚠️ **Don't use gmail account password (use app password)**

---

### SMTP_FROM
**Description / 描述**: From email address / 发件人邮箱地址

**Example / 示例**:
```bash
SMTP_FROM=noreply@yourdomain.com
```

**Required / 必需**: ❌ No

**Default Value / 默认值**: None

**Recommendations / 推荐**:
- Use `noreply@` domain for automated emails
- Use actual email for human communications
- Ensure domain SPF/DKIM records configured

---

## 🐳 Category 8: Docker (Optional) / Docker（可选）

### COMPOSE_PROJECT_NAME
**Description / 描述**: Docker Compose project name / Docker Compose项目名称

**Example / 示例**:
```bash
COMPOSE_PROJECT_NAME=myblog
```

**Required / 必需**: ❌ No

**Default Value / 默认值**: Directory name (e.g., `zhengbi-yong-github-io`)

**Purpose / 用途**:
- Prefix for container names
- Isolates multiple deployments
- Useful for running multiple instances

**Impact / 影响**:
```bash
# Without COMPOSE_PROJECT_NAME
zhengbi-yong-github-io-frontend-1
zhengbi-yong-github-io-backend-1

# With COMPOSE_PROJECT_NAME=blog
blog-frontend-1
blog-backend-1
```

---

## 📝 Environment File Templates / 环境文件模板

### Minimum Required .env / 最低必需.env

```bash
# Database
DATABASE_URL=postgresql://blog_user:CHANGE_THIS_PASSWORD@localhost:5432/blog_db

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=CHANGE_THIS_JWT_SECRET_MIN_32_CHARS
SESSION_SECRET=CHANGE_THIS_SESSION_SECRET_MIN_32_CHARS
PASSWORD_PEPPER=CHANGE_THIS_PEPPER_NEVER_CHANGE_THIS

# Server
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=development

# Security
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

### Production .env / 生产环境.env

```bash
# Database (strong password, SSL)
DATABASE_URL=postgresql://blog_user:STRONG_RANDOM_64_CHAR_PASSWORD@postgres:5432/blog_db?sslmode=require

# Redis
REDIS_URL=redis://:STRONG_PASSWORD@redis:6379

# Authentication (strong secrets)
JWT_SECRET=STRONG_RANDOM_64_CHAR_JWT_SECRET
SESSION_SECRET=STRONG_RANDOM_64_CHAR_SESSION_SECRET
PASSWORD_PEPPER=STRONG_RANDOM_64_CHAR_PEPPER_NEVER_CHANGE

# Server
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production

# Security
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_PER_MINUTE=100

# Monitoring
PROMETHEUS_ENABLED=true
RUST_LOG=info

# Email (optional)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=YOUR_APP_PASSWORD
SMTP_FROM=noreply@yourdomain.com
```

### Low Resource .env / 低资源配置.env

```bash
# Database
DATABASE_URL=postgresql://blog_user:PASSWORD@postgres:5432/blog_db

# Redis (memory limited)
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=RANDOM_SECRET_32_CHARS
SESSION_SECRET=RANDOM_SECRET_32_CHARS
PASSWORD_PEPPER=RANDOM_PEPPER_32_CHARS

# Server
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production

# Security
CORS_ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_PER_MINUTE=60

# Monitoring (minimal logging)
PROMETHEUS_ENABLED=false
RUST_LOG=warn
```

---

## 🔒 Security Best Practices / 安全最佳实践

### Password Generation / 密码生成

**Generate Strong Secrets / 生成强密钥**:

```bash
# Method 1: OpenSSL (Linux/Mac)
openssl rand -base64 32

# Method 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Method 3: /dev/urandom (Linux)
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# Method 4: Online (use offline generator for production)
# https://generate-random.org/api-key-generator
```

**Password Requirements / 密码要求**:
- Minimum 32 characters
- Mix of uppercase, lowercase, numbers, symbols
- Random and unpredictable
- Unique per installation

### .env File Security / .env文件安全

**DO / 要做**:
- ✅ Add `.env` to `.gitignore`
- ✅ Set file permissions: `chmod 600 .env`
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate secrets periodically (every 90 days)
- ✅ Backup .env securely (encrypted backup)
- ✅ Document secret rotation procedure

**DON'T / 不要做**:
- ❌ Commit .env to git
- ❌ Share .env via email/chat
- ❌ Use default passwords in production
- ❌ Reuse secrets across projects
- ❌ Store .env in public repositories

---

## 🧪 Verification / 验证

### Check Environment Variables / 检查环境变量

```bash
# Source .env file
source .env

# Verify variables are set
echo $DATABASE_URL
echo $JWT_SECRET
echo $REDIS_URL

# Or use Docker Compose config
docker compose config

# Or check in running container
docker compose exec backend env | grep -E 'DATABASE|JWT|REDIS'
```

### Test Configuration / 测试配置

```bash
# Test database connection
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT 1;"

# Test Redis connection
docker compose exec redis redis-cli ping

# Test backend (should return 401 for protected endpoint without auth)
curl http://localhost:3000/api/v1/health
```

---

## 🔄 Migration / 迁移

### Export Current Environment / 导出当前环境

```bash
# Export all environment variables
env > environment-backup.txt

# Or export specific variables
echo "DATABASE_URL=$DATABASE_URL" > .env.backup
echo "JWT_SECRET=$JWT_SECRET" >> .env.backup
echo "REDIS_URL=$REDIS_URL" >> .env.backup
```

### Import Environment / 导入环境

```bash
# Source backup file
source .env.backup

# Or manually edit
nano .env
```

---

## 🐛 Troubleshooting / 故障排查

### Issue: "Database connection failed" / 数据库连接失败

**Possible Causes / 可能原因**:
1. DATABASE_URL is incorrect
2. PostgreSQL is not running
3. Network/firewall blocking connection
4. Database doesn't exist

**Solutions / 解决方案**:
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Test connection manually
docker compose exec postgres psql -U blog_user -d blog_db
```

### Issue: "Invalid JWT" / JWT无效

**Possible Causes / 可能原因**:
1. JWT_SECRET changed (old tokens invalid)
2. JWT_SECRET not set
3. Token expired

**Solutions / 解决方案**:
```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Ensure it's at least 32 characters
echo ${#JWT_SECRET}

# Restart backend after changing JWT_SECRET
docker compose restart backend
```

### Issue: "CORS error" / CORS错误

**Possible Causes / 可能原因**:
1. Frontend URL not in CORS_ALLOWED_ORIGINS
2. HTTP vs HTTPS mismatch
3. Trailing slash in URL

**Solutions / 解决方案**:
```bash
# Check CORS_ALLOWED_ORIGINS
echo $CORS_ALLOWED_ORIGINS

# Ensure frontend URL is included (no trailing slash)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3001

# Restart backend
docker compose restart backend
```

---

## 📖 Related Documentation / 相关文档

- [Prerequisites](../getting-started/prerequisites.md) - Environment setup
- [Production Server Guide](../guides/server/production-server.md) - Production configuration
- [Security Best Practices](../best-practices/security.md) - Security hardening
- [Configuration Checklist](./configuration-checklist.md) - Pre-deployment checks

---

## ❓ FAQ / 常见问题

### Q: Can I use environment variables without .env file? / 可以不用.env文件使用环境变量吗？

**A / 答**: Yes. You can set them directly in the shell or in Docker Compose file. / 可以。您可以直接在shell中设置或在Docker Compose文件中设置。

```bash
# Shell (temporary)
export DATABASE_URL="postgresql://..."

# Docker Compose (permanent)
environment:
  - DATABASE_URL=postgresql://...
```

### Q: What if I lose my JWT_SECRET? / 如果JWT_SECRET丢失了怎么办？

**A / 答**: Generate a new one and update .env. All users will need to re-login. This is secure but inconvenient. / 生成新的并更新.env。所有用户需要重新登录。这很安全但不方便。

### Q: How often should I rotate secrets? / 应该多久轮换密钥？

**A / 答**: / 最佳实践：
- JWT_SECRET: Every 90 days / 每90天
- SESSION_SECRET: Every 90 days / 每90天
- PASSWORD_PEPPER: Never (or very carefully) / 永不（或非常小心地）
- Database password: Every 180 days / 每180天

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
