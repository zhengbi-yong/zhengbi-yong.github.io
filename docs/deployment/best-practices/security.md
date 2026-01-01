# Security Best Practices / 安全最佳实践

Comprehensive security hardening guide for production deployments.
/ 生产部署的综合安全加固指南。

---

## 📋 Overview / 概述

Security is paramount for production deployments. This guide covers essential security practices including password management, CORS configuration, SSL/TLS setup, firewall rules, and more.
/ 安全是生产部署的首要任务。本指南涵盖基本的安全实践，包括密码管理、CORS配置、SSL/TLS设置、防火墙规则等。

---

## 🚨 Critical Security Priorities / 关键安全优先级

### Top 5 Security Practices / 5大安全实践

| Priority / 优先级 | Practice / 实践 | Impact / 影响 |
|-----------------|----------------|-------------|
| **1** | Strong passwords and secrets / 强密码和密钥 | Prevents unauthorized access / 防止未授权访问 |
| **2** | SSL/TLS encryption / SSL/TLS加密 | Encrypts data in transit / 加密传输中的数据 |
| **3** | Firewall configuration / 防火墙配置 | Blocks malicious traffic / 阻止恶意流量 |
| **4** | Regular updates / 定期更新 | Patches vulnerabilities / 修补漏洞 |
| **5** | Monitoring and logging / 监控和日志 | Detects intrusions / 检测入侵 |

---

## 🔐 Password and Secret Management / 密钥和密钥管理

### Generate Strong Secrets / 生成强密钥

**Requirements / 要求**:
- Minimum 32 characters / 最少32个字符
- Mix of character types / 混合字符类型
- Random and unpredictable / 随机且不可预测
- Unique per installation / 每个安装唯一

**Generation Methods / 生成方法**:

```bash
# Method 1: OpenSSL (Recommended / 推荐)
openssl rand -base64 32
# Output: kM8xNj8vR9mK2pL5qW8yZ1bC4dF7gH0jK3mN6pQ9sT2=

# Method 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Method 3: /dev/urandom (Linux)
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# Method 4: Online generator (use offline for production)
# https://generate-random.org/api-key-generator
```

### Secret Rotation / 密钥轮换

**Rotation Schedule / 轮换计划**:

| Secret / 密钥 | Rotation Frequency / 轮换频率 |
|--------------|---------------------------|
| JWT_SECRET | Every 90 days / 每90天 |
| SESSION_SECRET | Every 90 days / 每90天 |
| Database password | Every 180 days / 每180天 |
| PASSWORD_PEPPER | Never (or very carefully) / 永不（或非常小心） |
| API keys | Every 60-90 days / 每60-90天 |

**Rotation Procedure / 轮换流程**:

1. **Generate new secret** / 生成新密钥:
   ```bash
   NEW_SECRET=$(openssl rand -base64 32)
   echo $NEW_SECRET
   ```

2. **Backup current .env** / 备份当前.env:
   ```bash
   cp .env .env.backup
   ```

3. **Update .env with new secret** / 用新密钥更新.env:
   ```bash
   sed -i "s/OLD_SECRET_VALUE/$NEW_SECRET/" .env
   ```

4. **Restart services** / 重启服务:
   ```bash
   docker compose restart backend
   ```

5. **Verify functionality** / 验证功能:
   - Test login
   - Test API calls
   - Check logs for errors

6. **Keep backup for 7 days** (in case of rollback) / 保留备份7天（以防回滚）

### Storage Security / 存储安全

**✅ DO / 要做**:
- ✅ Add `.env` to `.gitignore`
- ✅ Set file permissions: `chmod 600 .env`
- ✅ Use environment-specific secrets
- ✅ Store backups encrypted
- ✅ Document rotation procedures

**❌ DON'T / 不要做**:
- ❌ Commit `.env` to git
- ❌ Share secrets via email/chat
- ❌ Use default passwords in production
- ❌ Reuse secrets across environments
- ❌ Store secrets in public repositories

---

## 🔒 Authentication Security / 认证安全

### Password Hashing / 密码哈希

**Algorithm: Argon2** (industry standard / 行业标准)

```rust
// Rust backend uses Argon2 for password hashing
use argon2::{Argon2, PasswordHasher, password_hash::{SaltString, rand_core::OsRng}};

let argon2 = Argon2::default();
let salt = SaltString::generate(&mut OsRng);
let password_hash = argon2.hash_password(password.as_bytes(), &salt)?;
```

**Security Features / 安全特性**:
- Memory-hard computation (resists GPU/ASIC attacks)
- Configurable time cost, memory cost, and parallelism
- Salting (unique salt per password)
- Pepper support (global secret)

### JWT Security / JWT安全

**Token Configuration / 令牌配置**:

```rust
// Access token (short-lived)
const ACCESS_TOKEN_EXPIRY: Duration = Duration::from_secs(900); // 15 minutes

// Refresh token (longer-lived, stored in HTTP-only cookie)
const REFRESH_TOKEN_EXPIRY: Duration = Duration::from_secs(604800); // 7 days
```

**Security Best Practices / 安全最佳实践**:

1. **Short access token lifetime** / 短访问令牌生命周期 (15 minutes)
2. **HTTP-only cookies for refresh tokens** / 刷新令牌使用HTTP-only cookies
3. **Secure flag for cookies** (HTTPS only) / Cookie使用安全标志
4. **Strong JWT_SECRET** (32+ characters) / 强JWT_SECRET（32+字符）
5. **Token validation on every request** / 每次请求验证令牌

### Session Management / 会话管理

```bash
# .env configuration
SESSION_SECRET=strong-random-secret-32-chars-min
```

**Cookie Security / Cookie安全**:

```rust
// Set secure cookie attributes
Cookie::build("session_id", session_value)
    .http_only(true)      // Prevent JavaScript access
    .secure(true)         // HTTPS only
    .same_site(SameSite::Strict)  // Prevent CSRF
    .max_age(Duration::seconds(604800))  // 7 days
    .finish()
```

---

## 🌐 CORS Configuration / CORS配置

### Understanding CORS / 理解CORS

CORS (Cross-Origin Resource Sharing) controls which domains can access your API.
/ CORS（跨域资源共享）控制哪些域可以访问您的API。

**Security Risk / 安全风险**:
- Misconfigured CORS can allow unauthorized domains
- Overly permissive CORS (`*`) allows anyone to access your API

### Production CORS Configuration / 生产CORS配置

```bash
# .env file
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Rules / 规则**:
- ✅ Include all your domains (including www and non-www)
- ✅ Use https:// in production
- ✅ No trailing slashes
- ❌ Don't use `*` in production
- ❌ Don't include development URLs in production

**Example Configuration / 示例配置**:

```rust
// Backend CORS setup
let allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS")?
    .split(',')
    .map(|s| s.trim().to_string())
    .collect::<Vec<_>>();

// Configure CORS layer
let cors = CorsLayer::new()
    .allow_origin(allowed_origins)
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
    .allow_headers([HeaderName::from_static("content-type")])
    .allow_credentials(true);
```

**Testing CORS / 测试CORS**:

```bash
# Test from allowed origin
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://api.yourdomain.com/test

# Expected response header:
# Access-Control-Allow-Origin: https://yourdomain.com
```

---

## 🔥 Firewall Configuration / 防火墙配置

### Basic Firewall Rules / 基本防火墙规则

```bash
# UFW (Uncomplicated Firewall)

# 1. Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. Allow SSH (CRITICAL: Do this first!)
sudo ufw allow 22/tcp
sudo ufw limit 22/tcp  # Rate limiting to prevent brute force

# 3. Allow HTTP and HTTPS
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 4. Enable firewall
sudo ufw enable

# 5. Check status
sudo ufw status numbered
```

**Expected Output / 预期输出**:
```
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     LIMIT IN    Anywhere
[ 2] 80/tcp                     ALLOW IN    Anywhere
[ 3] 443/tcp                    ALLOW IN    Anywhere
```

### Advanced Firewall Rules / 高级防火墙规则

```bash
# Restrict SSH to specific IP (recommended)
sudo ufw delete allow 22/tcp
sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# Block common attack ports
sudo ufw deny 23/tcp    # Telnet
sudo ufw deny 25/tcp    # SMTP (if not running mail server)

# Allow VPN (if needed)
sudo ufw allow 1194/udp  # OpenVPN

# Block specific IP (if malicious)
sudo ufw deny from MALICIOUS_IP
```

### Cloud Provider Firewalls / 云提供商防火墙

**DigitalOcean Cloud Firewall**:
- Inbound rules:
  - SSH: Port 22, Your IP only
  - HTTP: Port 80, All IPv4
  - HTTPS: Port 443, All IPv4

**AWS Security Group**:
- Inbound rules:
  - Type: SSH, Port: 22, Source: Your IP/32
  - Type: HTTP, Port: 80, Source: 0.0.0.0/0
  - Type: HTTPS, Port: 443, Source: 0.0.0.0/0

---

## 🔒 SSL/TLS Configuration / SSL/TLS配置

### Let's Encrypt (Free SSL) / Let's Encrypt（免费SSL）

**Setup with Certbot / 使用Certbot设置**:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate (interactive)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or obtain certificate (non-interactive)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos --email admin@yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

**Auto-renewal is configured automatically** by Certbot (systemd timer or cron job). / Certbot自动配置自动续期（systemd计时器或cron作业）。

**Verify Certificate / 验证证书**:

```bash
# Check certificate details
sudo certbot certificates

# Test SSL configuration
curl -I https://yourdomain.com

# Online SSL test
# https://www.ssllabs.com/ssltest/
```

### Nginx SSL Configuration / Nginx SSL配置

**Optimized SSL Configuration / 优化的SSL配置**:

```nginx
# /etc/nginx/conf.d/ssl.conf

# SSL certificates
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# SSL protocols (disable old, insecure protocols)
ssl_protocols TLSv1.2 TLSv1.3;

# SSL ciphers (strong ciphers only)
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

# SSL session cache
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (above)...

    # Your location blocks...
}
```

**Security Headers Explained / 安全头说明**:

| Header / 头 | Purpose / 用途 |
|------------|-------------|
| **Strict-Transport-Security** | Enforces HTTPS (HSTS) / 强制HTTPS |
| **X-Frame-Options** | Prevents clickjacking / 防止点击劫持 |
| **X-Content-Type-Options** | Prevents MIME sniffing / 防止MIME嗅探 |
| **X-XSS-Protection** | Enables XSS filter / 启用XSS过滤器 |
| **Referrer-Policy** | Controls referrer information / 控制引用信息 |

---

## 🛡️ Rate Limiting / 速率限制

### Why Rate Limiting? / 为什么需要速率限制？

Prevents abuse / 防止滥用:
- Brute force attacks / 暴力攻击
- DoS attacks / DoS攻击
- API abuse / API滥用
- Resource exhaustion / 资源耗尽

### Configure Rate Limiting / 配置速率限制

```bash
# .env configuration
RATE_LIMIT_PER_MINUTE=100
```

**Rate Limiting Strategy / 速率限制策略**:

| Deployment / 部署方式 | Recommended Limit / 推荐限制 |
|---------------------|---------------------|
| **Development** | 10000+ (effectively unlimited) / 10000+（基本无限制） |
| **Production** | 100-200 / 100-200 |
| **Public API** | 60-100 / 60-100 |
| **Low Resource** | 60 / 60 |

**Implementation / 实现** (using Redis):

```rust
// Rate limiting middleware
use redis::AsyncCommands;

async fn check_rate_limit(
    redis: &RedisClient,
    ip: &str,
    limit: u64,
) -> Result<bool, Error> {
    let key = format!("rate_limit:{}", ip);
    let count: u64 = redis.incr(&key, 1).await?;

    if count == 1 {
        redis.expire(&key, 60).await?;  // 60 seconds window
    }

    Ok(count <= limit)
}
```

**Test Rate Limiting / 测试速率限制**:

```bash
# Send 101 requests (should fail on last one)
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://yourdomain.com/api/v1/posts
done

# Expected: First 100 return 200, last one returns 429 (Too Many Requests)
```

---

## 🔍 Input Validation / 输入验证

### Backend Validation / 后端验证

```rust
// Validate user input
use validator::Validate;

#[derive(Validate, Deserialize)]
struct CreatePostRequest {
    #[validate(length(min = 1, max = 200))]
    title: String,

    #[validate(length(min = 1, max = 10000))]
    content: String,

    #[validate(url)]
    cover_image: Option<String>,

    #[validate(length(min = 1, max = 50))]
    tags: Vec<String>,
}

// In handler
let request = create_post_request.validate()?;
```

### SQL Injection Prevention / SQL注入防护

**Using SQLx (Compile-time checked queries)** / 使用SQLx（编译时检查的查询）:

```rust
// Safe (parameterized query)
sqlx::query!(
    "INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3)",
    title, content, author_id
)
.execute(&pool)
.await?;

// ❌ NEVER do this (SQL injection risk)
let query = format!(
    "INSERT INTO posts (title, content) VALUES ('{}', '{}')",
    title, content
);
```

### XSS Prevention / XSS防护

**Frontend (React/Next.js)** / 前端（React/Next.js）:
- React automatically escapes JSX content / React自动转义JSX内容
- For MDX, use sanitization libraries / 对于MDX，使用清理库

```typescript
// Use DOMPurify for user-generated content
import DOMPurify from 'dompurify';

const cleanContent = DOMPurify.sanitize(userContent);
```

---

## 📊 Security Monitoring / 安全监控

### Log Monitoring / 日志监控

**Key Security Events to Monitor / 要监控的关键安全事件**:

1. **Failed login attempts** / 失败的登录尝试
2. **Rate limit violations** / 速率限制违规
3. **Unusual API usage** / 异常API使用
4. **SQL errors** / SQL错误
5. **Authorization failures** / 授权失败

**Example Monitoring / 监控示例**:

```bash
# Monitor failed logins
docker compose logs backend | grep "Failed login"

# Monitor rate limits
docker compose logs backend | grep "Rate limit exceeded"

# Real-time monitoring
docker compose logs -f backend | grep -E "Failed|Error|Unauthorized"
```

### Security Auditing / 安全审计

**Regular Security Tasks / 定期安全任务**:

| Task / 任务 | Frequency / 频率 |
|------------|----------------|
| Review logs for suspicious activity / 检查可疑活动日志 | Daily / 每天 |
| Check for security updates / 检查安全更新 | Weekly / 每周 |
| Rotate secrets / 轮换密钥 | Every 90 days / 每90天 |
| Security audit / 安全审计 | Monthly / 每月 |
| Penetration testing / 渗透测试 | Quarterly / 每季度 |

---

## 🚨 Security Incident Response / 安全事件响应

### Incident Response Plan / 事件响应计划

**Step 1: Identify / 识别**
- Monitor logs for suspicious activity / 监控可疑活动日志
- Verify incident / 验证事件

**Step 2: Contain / 遏制**
- Rotate compromised secrets / 轮换受损密钥
- Block malicious IPs / 阻止恶意IP
- Disable affected accounts / 禁用受影响账户

**Step 3: Eradicate / 根除**
- Patch vulnerability / 修补漏洞
- Update security rules / 更新安全规则
- Verify root cause is fixed / 验证根本原因已修复

**Step 4: Recover / 恢复**
- Restore from backup (if needed) / 从备份恢复（如需要）
- Monitor for recurrence / 监控是否复发
- Document lessons learned / 记录经验教训

---

## ✅ Security Checklist / 安全清单

### Pre-Deployment Checklist / 部署前清单

- [ ] Strong secrets generated (32+ characters) / 生成强密钥（32+字符）
- [ ] `.env` added to `.gitignore` / `.env`添加到`.gitignore`
- [ ] File permissions set (`chmod 600 .env`) / 设置文件权限
- [ ] CORS configured for production domains / CORS配置为生产域
- [ ] Firewall enabled (ports 80, 443 only) / 启用防火墙（仅端口80、443）
- [ ] SSL certificate installed / 安装SSL证书
- [ ] Security headers configured / 配置安全头
- [ ] Rate limiting enabled / 启用速率限制
- [ ] Input validation implemented / 实现输入验证
- [ ] Monitoring configured / 配置监控

### Ongoing Security Tasks / 持续安全任务

- [ ] Review access logs weekly / 每周审查访问日志
- [ ] Update dependencies regularly / 定期更新依赖
- [ ] Rotate secrets every 90 days / 每90天轮换密钥
- [ ] Monitor security advisories / 监控安全公告
- [ ] Perform security audits / 执行安全审计

---

## 📖 Related Documentation / 相关文档

- [Environment Variables Reference](../reference/environment-variables.md) - Secret configuration
- [Ports and Networking](../reference/ports-and-networking.md) - Firewall configuration
- [Production Server Guide](../guides/server/production-server.md) - Security setup
- [Monitoring Guide](./monitoring.md) - Security monitoring

---

## 🔗 Security Resources / 安全资源

### External Tools / 外部工具

- **SSL Labs Test**: https://www.ssllabs.com/ssltest/ - Test SSL configuration
- **Security Headers**: https://securityheaders.com/ - Check security headers
- **Mozilla SSL Config Generator**: https://ssl-config.mozilla.org/ - Generate SSL config
- **OWASP**: https://owasp.org/ - Security best practices

### Stay Informed / 保持知情

- **CVE Database**: https://cve.mitre.org/ - Security vulnerabilities
- **NVD**: https://nvd.nist.gov/ - National Vulnerability Database
- **Rust Security Advisories**: https://www.rust-lang.org/policies/security
- **Next.js Security**: https://nextjs.org/docs/app/building-your-application/configuring/security

---

## ❓ FAQ / 常见问题

### Q: How do I know if my site is secure? / 如何知道我的网站是否安全？

**A / 答**: Run these checks / 运行这些检查：
1. SSL Labs test (A grade) / SSL Labs测试（A级）
2. Security headers test / 安全头测试
3. Try to access database ports from internet (should fail) / 尝试从互联网访问数据库端口（应失败）
4. Check for exposed .env file / 检查暴露的.env文件
5. Test rate limiting / 测试速率限制

### Q: What should I do if JWT_SECRET is compromised? / 如果JWT_SECRET泄露了怎么办？

**A / 答**: Immediately / 立即：
1. Generate new JWT_SECRET / 生成新JWT_SECRET
2. Update .env file / 更新.env文件
3. Restart backend service / 重启后端服务
4. All users must re-login (this is secure) / 所有用户必须重新登录（这是安全的）
5. Investigate how it was leaked / 调查如何泄露的

### Q: Do I need a WAF (Web Application Firewall)? / 需要WAF（Web应用防火墙）吗？

**A / 答**: / 建议：
- Small sites (<10K visitors): Rate limiting is usually sufficient / 小型站点（<1万访客）：速率限制通常足够
- Medium sites (10K-100K): Consider Cloudflare (free) / 中型站点（1万-10万）：考虑Cloudflare（免费）
- Large sites (100K+): Yes, use WAF (Cloudflare, AWS WAF) / 大型站点（10万+）：是，使用WAF

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
