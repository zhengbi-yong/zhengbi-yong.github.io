# 服务器部署配置修改清单

**用途**: 快速检查所有需要在服务器上修改的配置项
**使用方法**: 按顺序检查每一项，打勾 ✅ 表示已完成

---

## 🔴 必须修改的配置（部署前必须完成）

### 1. 环境变量配置文件

**文件位置**: `/opt/blog/.env`

**生成命令**:
```bash
cp .env.docker.example .env
nano .env
```

#### ✅ 1.1 数据库密码

```bash
# 找到这一行:
POSTGRES_PASSWORD=your_secure_postgres_password_here

# 修改为强密码（至少 16 位，包含大小写字母、数字、特殊字符）
POSTGRES_PASSWORD=YourSecurePasswordHere!2025
```

**验证方法**:
```bash
grep POSTGRES_PASSWORD .env
# 确保不是默认值
```

---

#### ✅ 1.2 JWT 密钥

```bash
# 找到这一行:
JWT_SECRET=your_jwt_secret_at_least_32_characters_long_change_this

# 生成新密钥（在本地执行）
openssl rand -base64 32

# 将生成的密钥填入（例如）:
JWT_SECRET=K7xX9mP2qR8vN4wT6jY3hF5dS8gA1zBcDeFgHiJkLmNoPqRsTuVwXyZ
```

**验证方法**:
```bash
grep JWT_SECRET .env | wc -c
# 应该大于 32 个字符
```

---

#### ✅ 1.3 密码哈希密钥

```bash
# 找到这一行:
PASSWORD_PEPPER=your_password_pepper_at_least_32_characters_change_this

# 生成新密钥（在本地执行）
openssl rand -base64 32

# 将生成的密钥填入
PASSWORD_PEPPER=另一个32位随机密钥
```

**验证方法**:
```bash
grep PASSWORD_PEPPER .env | wc -c
# 应该大于 32 个字符
```

---

#### ✅ 1.4 会话密钥

```bash
# 找到这一行:
SESSION_SECRET=your_session_secret_at_least_32_characters_change_this

# 生成新密钥（在本地执行）
openssl rand -base64 32

# 将生成的密钥填入
SESSION_SECRET=第三个32位随机密钥
```

**验证方法**:
```bash
grep SESSION_SECRET .env | wc -c
# 应该大于 32 个字符
```

---

#### ✅ 1.5 CORS 允许的域名

```bash
# 找到这一行:
CORS_ALLOWED_ORIGINS=http://localhost:3001,https://zhengbi-yong.top

# 修改为你的域名（只保留你的域名）
CORS_ALLOWED_ORIGINS=https://your-domain.com

# 如果有多个域名，用逗号分隔
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

**验证方法**:
```bash
grep CORS_ALLOWED_ORIGINS .env
# 确保包含你的域名，没有 localhost
```

---

#### ✅ 1.6 前端站点 URL

```bash
# 找到这一行:
NEXT_PUBLIC_SITE_URL=http://localhost

# 修改为你的域名
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**验证方法**:
```bash
grep NEXT_PUBLIC_SITE_URL .env
# 应该以 https:// 开头，是你的域名
```

---

#### ✅ 1.7 前端 API URL

```bash
# 找到这一行:
NEXT_PUBLIC_API_URL=http://localhost:3000

# 修改为你的域名
NEXT_PUBLIC_API_URL=https://your-domain.com
```

**验证方法**:
```bash
grep NEXT_PUBLIC_API_URL .env
# 应该以 https:// 开头，是你的域名
```

---

### 2. Nginx 配置文件

**文件位置**: `/opt/blog/nginx/conf.d/blog.conf`

**编辑命令**:
```bash
nano nginx/conf.d/blog.conf
```

#### ✅ 2.1 修改域名（第 7 行）

```nginx
# 找到这一行:
server_name zhengbi-yong.top 152.136.43.194;

# 修改为你的域名
server_name your-domain.com;

# 或如果有多个域名
server_name your-domain.com www.your-domain.com;
```

**验证方法**:
```bash
grep "server_name" nginx/conf.d/blog.conf | head -1
# 应该是你的域名
```

---

#### ✅ 2.2 启用 HTTPS 重定向（可选，第 16 行）

```nginx
# 找到这一行:
# return 301 https://$host$request_uri;

# 如果配置了 SSL，取消注释
return 301 https://$host$request_uri;
```

**注意**: 首次部署不要启用，等 SSL 证书配置完成后再启用。

---

### 3. Docker Compose 配置

**文件位置**: `/opt/blog/docker-compose.yml`

**编辑命令**:
```bash
nano docker-compose.yml
```

#### ✅ 3.1 前端环境变量（第 107-108 行）

```yaml
# 找到这两行:
environment:
  NEXT_PUBLIC_API_URL: http://localhost:3000
  NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-http://localhost:3001}

# 修改第一行为使用环境变量
environment:
  NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
  NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
```

**验证方法**:
```bash
grep -A 2 "frontend:" docker-compose.yml | grep NEXT_PUBLIC_API_URL
# 应该是 ${NEXT_PUBLIC_API_URL}
```

---

#### ✅ 3.2 后端 CORS 配置（第 69 行）

```yaml
# 找到这一行:
CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:3001,https://zhengbi-yong.top}

# 修改为使用环境变量（移除默认值）
CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
```

**验证方法**:
```bash
grep CORS_ALLOWED_ORIGINS docker-compose.yml
# 应该是 ${CORS_ALLOWED_ORIGINS}
```

---

## 🟡 推荐修改的配置（增强安全性）

### 4. 数据库配置

#### ✅ 4.1 隐藏数据库端口

**文件**: `docker-compose.yml`

```yaml
# 找到 postgres 服务:
postgres:
  ports:
    - "${POSTGRES_PORT:-5432}:5432"  # ⚠️ 暴露到宿主机

# 修改为不暴露端口（通过 Docker 内部网络访问）
postgres:
  # 移除整个 ports 部分
```

**验证方法**:
```bash
docker compose ps postgres
# 在 PORTS 列应该没有 0.0.0.0:5432->5432 的映射
```

---

#### ✅ 4.2 隐藏 Redis 端口

**文件**: `docker-compose.yml`

```yaml
# 找到 redis 服务:
redis:
  ports:
    - "${REDIS_PORT:-6379}:6379"  # ⚠️ 暴露到宿主机

# 修改为不暴露端口
redis:
  # 移除整个 ports 部分
```

**验证方法**:
```bash
docker compose ps redis
# 在 PORTS 列应该没有 0.0.0.0:6379->6379 的映射
```

---

### 5. 安全密钥生成脚本

**创建快速生成脚本**:

```bash
cat > /opt/blog/generate-secrets.sh <<'EOF'
#!/bin/bash
echo "=== 生成安全密钥 ==="
echo ""
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "PASSWORD_PEPPER=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
echo ""
echo "将上面的三行复制到 .env 文件中"
EOF

chmod +x /opt/blog/generate-secrets.sh
```

**使用方法**:
```bash
./generate-secrets.sh
```

---

## 🟢 可选配置（根据需求）

### 6. 邮件配置

**文件**: `.env`

```bash
# 如果需要邮件功能，配置 SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_email_app_password
SMTP_FROM=noreply@your-domain.com
```

**获取 Gmail 应用密码**:
1. 访问 https://myaccount.google.com/security
2. 启用两步验证
3. 生成应用专用密码
4. 复制密码到 SMTP_PASSWORD

---

### 7. 分析服务配置

**文件**: `.env`

```bash
# 如果使用 Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# 如果使用 Umami Analytics
NEXT_PUBLIC_UMAMI_ID=your-umami-id

# 如果使用 Sentry 错误追踪
SENTRY_DSN=your-sentry-dsn
```

---

### 8. Giscus 评论系统

**文件**: 前端代码中配置

```bash
# 访问 https://giscus.app
# 配置你的仓库
# 获取数据属性
```

---

## 📋 完整检查清单

### 部署前检查

- [ ] ✅ 修改 `.env` 文件中的数据库密码
- [ ] ✅ 生成并修改 JWT_SECRET
- [ ] ✅ 生成并修改 PASSWORD_PEPPER
- [ ] ✅ 生成并修改 SESSION_SECRET
- [ ] ✅ 修改 CORS_ALLOWED_ORIGINS
- [ ] ✅ 修改 NEXT_PUBLIC_SITE_URL
- [ ] ✅ 修改 NEXT_PUBLIC_API_URL
- [ ] ✅ 修改 Nginx 配置中的域名
- [ ] ✅ 修改 docker-compose.yml 中的环境变量引用
- [ ] ✅ 隐藏数据库端口（推荐）
- [ ] ✅ 隐藏 Redis 端口（推荐）

### 部署后验证

- [ ] ✅ 检查所有容器状态正常
- [ ] ✅ 前端页面可以访问
- [ ] ✅ 后端 API 可以访问
- [ ] ✅ 数据库连接正常
- [ ] ✅ Redis 连接正常
- [ ] ✅ 化学可视化功能正常
- [ ] ✅ CORS 配置正确
- [ ] ✅ SSL 证书已配置（如果需要）

---

## 🔧 快速修改命令

### 一键生成所有密钥

```bash
cat > /tmp/generate-all.sh <<'EOF'
#!/bin/bash
echo "=== 生成所有配置 ==="
echo ""
echo "数据库密码:"
openssl rand -base64 24
echo ""
echo "JWT_SECRET:"
openssl rand -base64 32
echo ""
echo "PASSWORD_PEPPER:"
openssl rand -base64 32
echo ""
echo "SESSION_SECRET:"
openssl rand -base64 32
EOF

chmod +x /tmp/generate-all.sh
/tmp/generate-all.sh
```

### 批量替换域名

```bash
# 创建脚本
cat > /tmp/replace-domain.sh <<'EOF'
#!/bin/bash
OLD_DOMAIN="zhengbi-yong.top"
NEW_DOMAIN="your-domain.com"

# 替换 .env 文件
sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" .env

# 替换 Nginx 配置
sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" nginx/conf.d/blog.conf

echo "域名替换完成"
EOF

chmod +x /tmp/replace-domain.sh

# 使用前先修改 NEW_DOMAIN
nano /tmp/replace-domain.sh
./tmp/replace-domain.sh
```

---

## 🚨 常见错误

### 错误 1: 环境变量格式错误

**症状**:
```bash
docker compose up -d
# 显示: invalid environment variable
```

**原因**: `.env` 文件中有多余空格或引号

**解决**:
```bash
# 检查格式
cat -A .env | grep "\\$"

# 正确格式:
VARIABLE=value

# 错误格式:
VARIABLE = value
VARIABLE="value"
VARIABLE='value'
```

---

### 错误 2: 域名未解析

**症状**:
```bash
curl https://your-domain.com
# 显示: Could not resolve host
```

**解决**:
```bash
# 检查 DNS 解析
nslookup your-domain.com

# 如果未解析，到域名服务商添加 A 记录
# A 记录: your-domain.com -> your-server-ip
```

---

### 错误 3: 端口被占用

**症状**:
```bash
docker compose up -d
# 显示: port is already allocated
```

**解决**:
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# 停止占用端口的服务
systemctl stop nginx  # 如果系统 nginx 在运行

# 或修改 docker-compose.yml 中的端口映射
```

---

## 📞 获取帮助

如果配置有问题:

1. **查看详细部署指南**: `docs/deployment/SERVER_DEPLOYMENT_GUIDE.md`
2. **查看验证报告**: `docs/DEPLOYMENT_VERIFICATION.md`
3. **查看 Docker 日志**: `docker compose logs`
4. **提交 Issue**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

---

**清单版本**: 1.0.0
**最后更新**: 2025-12-29
**维护者**: Zhengbi Yong
