# 服务器部署完整指南

**适用版本**: v1.8.2+
**部署目标**: 从零开始在 Linux 服务器上部署完整的博客系统
**预计时间**: 30-60 分钟
**难度等级**: ⭐⭐⭐ (中等)

---

## 📑 目录

1. [前置要求](#前置要求)
2. [部署准备](#部署准备)
3. [配置文件修改](#配置文件修改)
4. [部署方式选择](#部署方式选择)
5. [部署步骤](#部署步骤)
6. [SSL 证书配置](#ssl-证书配置)
7. [功能验证](#功能验证)
8. [常见问题排查](#常见问题排查)
9. [维护指南](#维护指南)

---

## 前置要求

### 服务器要求

- **操作系统**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU**: 2 核心以上
- **内存**: 4GB 以上（推荐 8GB）
- **磁盘**: 40GB 以上可用空间
- **网络**: 公网 IP，开放 80、443 端口

### 本地机器要求

- Git 客户端
- SSH 客户端
- 基础的 Linux 命令行知识

### 域名（可选但推荐）

- 已注册的域名
- 域名 DNS 已解析到服务器 IP

---

## 部署准备

### 步骤 1: 服务器环境检查

#### 1.1 连接到服务器

```bash
# 替换为你的服务器信息
ssh root@your-server-ip

# 或使用非 root 用户
ssh username@your-server-ip
sudo -s  # 切换到 root
```

#### 1.2 检查系统信息

```bash
# 检查操作系统
cat /etc/os-release

# 检查可用内存
free -h

# 检查磁盘空间
df -h

# 检查 CPU
nproc
```

**预期结果**:
- 内存至少 4GB
- 磁盘可用空间至少 20GB
- CPU 至少 2 核心

#### 1.3 更新系统

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS
yum update -y
```

---

### 步骤 2: 安装 Docker

#### 2.1 安装 Docker

**Ubuntu/Debian**:

```bash
# 1. 卸载旧版本（如果有）
apt remove docker docker-engine docker.io containerd runc -y

# 2. 安装依赖
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. 添加 Docker 官方 GPG 密钥
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. 安装 Docker Engine
apt update
apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# 6. 启动 Docker
systemctl start docker
systemctl enable docker
```

**CentOS**:

```bash
# 1. 安装依赖
yum install -y yum-utils

# 2. 添加 Docker 仓库
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 3. 安装 Docker
yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# 4. 启动 Docker
systemctl start docker
systemctl enable docker
```

#### 2.2 验证 Docker 安装

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version

# 运行测试容器
docker run hello-world

# 预期输出: Hello from Docker!
```

#### 2.3 配置 Docker 用户（可选）

```bash
# 创建专用用户（推荐）
useradd -m -s /bin/bash dockeradmin
usermod -aG docker dockeradmin

# 切换到 dockeradmin 用户
su - dockeradmin

# 验证
docker ps
```

---

### 步骤 3: 安装必要工具

```bash
# 安装常用工具
apt install -y git vim wget curl nano unzip

# 验证安装
git --version
```

---

## 配置文件修改

### 步骤 4: 创建项目目录

```bash
# 创建项目目录
mkdir -p /opt/blog
cd /opt/blog

# 设置权限
chown -R dockeradmin:dockeradmin /opt/blog
```

**如果你使用 root 用户**:
```bash
mkdir -p /opt/blog
cd /opt/blog
```

---

### 步骤 5: 上传项目文件

#### 方法 A: 使用 Git 克隆（推荐）

```bash
# 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git .

# 查看文件
ls -la
```

#### 方法 B: 手动上传

**在本地上传**:
```bash
# 在本地机器上打包项目
cd D:/YZB/zhengbi-yong.github.io
tar czf blog.tar.gz \
    backend/ \
    frontend/ \
    nginx/ \
    docker-compose.yml \
    docker-compose.local.yml \
    .env.docker.example \
    VERSION

# 上传到服务器
scp blog.tar.gz user@your-server-ip:/opt/blog/
```

**在服务器上解压**:
```bash
cd /opt/blog
tar xzf blog.tar.gz
rm blog.tar.gz
```

---

### 步骤 6: 修改配置文件

这是**最关键**的步骤！请仔细修改以下配置。

#### 6.1 创建 `.env` 文件

```bash
# 复制模板
cp .env.docker.example .env

# 编辑配置
nano .env
```

**完整配置示例**（请根据实际情况修改）:

```bash
# ================================
# 数据库配置
# ================================
POSTGRES_USER=blog_user
# ⚠️ 重要: 修改为强密码（至少 16 位，包含大小写字母、数字、特殊字符）
POSTGRES_PASSWORD=YourSecurePasswordHere!2025
POSTGRES_DB=blog_db
POSTGRES_PORT=5432

# ================================
# Redis 配置
# ================================
REDIS_PORT=6379

# ================================
# 后端 API 配置
# ================================
BACKEND_PORT=3000
RUST_LOG=info

# ================================
# 安全配置（必须修改！）
# ================================
# ⚠️ 重要: 生成安全的随机密钥
# 在本地生成: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_at_least_32_characters_long_change_this_now
PASSWORD_PEPPER=your_password_pepper_at_least_32_characters_change_this_now
SESSION_SECRET=your_session_secret_at_least_32_characters_change_this_now

# ================================
# CORS 配置（必须修改！）
# ================================
# ⚠️ 重要: 改为你的域名，多个域名用逗号分隔
# 示例: https://example.com,https://www.example.com
CORS_ALLOWED_ORIGINS=https://your-domain.com

# 限流配置
RATE_LIMIT_PER_MINUTE=60

# ================================
# 邮件配置（可选）
# ================================
# 如果不需要邮件功能，保持默认即可
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_email_app_password
SMTP_FROM=noreply@your-domain.com

# ================================
# 前端配置
# ================================
FRONTEND_PORT=3001

# ⚠️ 重要: 改为你的域名
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com

# ================================
# 可选配置
# ================================
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_UMAMI_ID=your-umami-id
# SENTRY_DSN=your-sentry-dsn
```

#### 6.2 生成安全密钥

**在你的本地机器**上执行:

```bash
# Windows PowerShell
openssl rand -base64 32

# 或在 Linux/Mac 上
openssl rand -base64 32
```

**你会得到类似这样的输出**:
```
K7xX9mP2qR8vN4wT6jY3hF5dS8gA1zBcDeFgHiJkLmNoPqRsTuVwXyZ
```

**将生成的三个密钥分别填入**:
- `JWT_SECRET=第一个生成的密钥`
- `PASSWORD_PEPPER=第二个生成的密钥`
- `SESSION_SECRET=第三个生成的密钥`

#### 6.3 修改 Nginx 配置

```bash
# 编辑 Nginx 配置
nano nginx/conf.d/blog.conf
```

**需要修改的位置**:

**第 7 行** - 修改域名:
```nginx
# 修改前:
server_name zhengbi-yong.top 152.136.43.194;

# 修改后（使用你的域名）:
server_name your-domain.com;

# 或者如果有多个域名:
server_name your-domain.com www.your-domain.com;
```

**第 14-17 行** - 开发环境配置（通常不需要修改）:
```nginx
location / {
    # 取消下面的注释以启用HTTPS重定向
    # return 301 https://$host$request_uri;
    proxy_pass http://frontend:3001;
    ...
}
```

**第 30-116 行** - HTTPS 配置（首次部署先跳过，配置 SSL 时再启用）

**第 121 行** - localhost 配置（开发环境，保持默认）

#### 6.4 修改 docker-compose.yml（如果需要）

```bash
# 编辑 docker-compose.yml
nano docker-compose.yml
```

**检查第 107-108 行**:
```yaml
environment:
  NEXT_PUBLIC_API_URL: http://localhost:3000  # ⚠️ 需要修改
  NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-http://localhost:3001}  # ✅ 使用环境变量
```

**修改为**:
```yaml
environment:
  NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}  # 使用 .env 中的配置
  NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
```

**修改第 69 行**:
```yaml
CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}  # 使用 .env 中的配置
```

---

## 部署方式选择

你有**两种部署方式**可以选择：

### 方式 A: 在服务器上构建镜像

**优点**:
- 简单直接
- 适合小型项目
- 代码更新方便

**缺点**:
- 构建时间长（15-30 分钟）
- 需要服务器有足够资源

**适用场景**: 首次部署或服务器资源充足

### 方式 B: 本地构建后上传镜像

**优点**:
- 部署快速（5-10 分钟）
- 减轻服务器负担

**缺点**:
- 需要本地 Docker 环境
- 镜像文件较大（~2GB）

**适用场景**: 频繁部署或服务器资源有限

---

## 部署步骤

### 方式 A: 在服务器上构建（推荐首次部署）

```bash
cd /opt/blog

# 构建所有镜像
docker compose build

# 这需要 15-30 分钟，耐心等待
# 你会看到类似输出:
# [+] Building 1234.5s (100/100) FINISHED
```

**构建过程中**:
- 如果遇到网络错误，重试即可
- 如果内存不足，增加 swap 空间:
  ```bash
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  ```

**构建完成后**:
```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps
```

**预期输出**:
```
NAME                IMAGE                      STATUS
blog-postgres       postgres:17-alpine         Up (healthy)
blog-redis          redis:7.4-alpine           Up (healthy)
blog-backend        blog-backend:latest        Up (healthy)
blog-frontend       blog-frontend:latest       Up (healthy)
blog-nginx          nginx:1.27-alpine          Up
```

---

### 方式 B: 本地构建后上传（推荐快速部署）

#### B.1 在本地构建镜像

**在你的本地机器**（Windows）:

```powershell
# 进入项目目录
cd D:\YZB\zhengbi-yong.github.io

# 构建后端镜像
cd backend
docker build -t blog-backend:local .
cd ..

# 构建前端镜像
cd frontend
docker build -t blog-frontend:local .
cd ..
```

#### B.2 导出镜像

```powershell
# 导出后端镜像（约 500MB）
docker save blog-backend:local -o blog-backend.tar.gz

# 导出前端镜像（约 1.5GB）
docker save blog-frontend:local -o blog-frontend.tar.gz

# 压缩（可选，减少约 30%）
gzip blog-backend.tar
gzip blog-frontend.tar
```

#### B.3 上传到服务器

```powershell
# 使用 SCP 上传（Windows PowerShell）
scp blog-backend.tar.gz user@your-server-ip:/opt/blog/
scp blog-frontend.tar.gz user@your-server-ip:/opt/blog/

# 或使用 SFTP 工具（如 FileZilla、WinSCP）
```

#### B.4 在服务器上加载镜像

```bash
cd /opt/blog

# 加载后端镜像
docker load < blog-backend.tar.gz

# 加载前端镜像
docker load < blog-frontend.tar.gz

# 验证镜像
docker images | grep blog
```

**预期输出**:
```
blog-backend    local     abc123def456   5 minutes ago   567MB
blog-frontend   local     def789ghi012   3 minutes ago   1.2GB
```

#### B.5 启动服务

```bash
# 使用本地配置启动
docker compose -f docker-compose.local.yml up -d

# 查看服务状态
docker compose -f docker-compose.local.yml ps
```

---

### 通用启动后操作

无论选择哪种方式，启动后都需要执行以下操作：

#### 7.1 查看服务日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend

# 查看最近 100 行日志
docker compose logs --tail=100
```

#### 7.2 检查服务健康状态

```bash
# 检查后端 API
docker compose exec backend curl http://localhost:3000/healthz

# 检查前端
docker compose exec frontend curl http://localhost:3001

# 检查数据库
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT version();"

# 检查 Redis
docker compose exec redis redis-cli ping
# 预期输出: PONG
```

#### 7.3 初始化数据库（如果需要）

```bash
# 运行数据库迁移
docker compose exec backend cargo migrate run

# 或使用 SQLx
docker compose exec backend sqlx migrate run
```

#### 7.4 开放防火墙端口

```bash
# Ubuntu/Debian
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable

# CentOS
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

#### 7.5 测试访问

```bash
# 在服务器上测试
curl http://localhost

# 从本地浏览器访问
http://your-server-ip
```

---

## SSL 证书配置

### 步骤 8: 配置 HTTPS（强烈推荐）

#### 8.1 安装 Certbot

```bash
# Ubuntu/Debian
apt install certbot python3-certbot-nginx -y

# CentOS
yum install certbot python3-certbot-nginx -y
```

#### 8.2 获取 SSL 证书

```bash
# 自动配置 Nginx
certbot --nginx -d your-domain.com -d www.your-domain.com

# 按提示操作:
# 1. 输入邮箱地址
# 2. 同意服务条款
# 3. 选择是否分享邮箱
# 4. 选择重定向 HTTP 到 HTTPS
```

**Certbot 会自动**:
- 获取 SSL 证书
- 修改 Nginx 配置
- 设置自动续期

#### 8.3 手动配置 Nginx（如果自动配置失败）

```bash
# 编辑 Nginx 配置
nano nginx/conf.d/blog.conf
```

**取消第 30-116 行的注释，并修改**:

```nginx
# HTTPS服务器
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL证书配置（Certbot 会自动生成）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;

    # SSL优化
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 前端Next.js
    location / {
        proxy_pass http://frontend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 后端API
    location /v1/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 后端管理面板
    location /admin/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js静态资源缓存
    location /_next/static {
        proxy_pass http://frontend:3001;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # 图片资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        proxy_pass http://frontend:3001;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP - 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Let's Encrypt验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 重定向到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}
```

**重启 Nginx**:
```bash
docker compose restart nginx
```

#### 8.4 验证 SSL 证书

```bash
# 检查证书状态
certbot certificates

# 测试续期（不会实际续期）
certbot renew --dry-run
```

**在浏览器访问**:
```
https://your-domain.com
```

检查浏览器地址栏的锁图标 🔒

---

## 功能验证

### 步骤 9: 完整功能测试

#### 9.1 前端功能测试

**访问**:
```
http://your-server-ip
或
https://your-domain.com
```

**测试清单**:
- [ ] 首页正常加载
- [ ] 文章列表显示
- [ ] 文章详情页正常
- [ ] 导航菜单工作
- [ ] 搜索功能（Ctrl+K）
- [ ] 主题切换（深色/浅色）
- [ ] 响应式布局（手机访问）

#### 9.2 后端 API 测试

```bash
# 测试健康检查
curl http://your-server-ip/v1/health

# 测试文章列表 API
curl http://your-server-ip/v1/posts

# 测试用户注册 API
curl -X POST http://your-server-ip/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPassword123!"}'
```

#### 9.3 化学可视化功能测试（离线）

**访问化学相关文章**:
```
https://your-domain.com/blog/chemistry/rdkit-visualization
```

**测试清单**:
- [ ] 化学公式渲染（KaTeX）
- [ ] 2D 分子结构（RDKit）
- [ ] 3D 分子可视化（3Dmol.js）
- [ ] 控制台无 CSP 错误

**验证离线功能**:
```bash
# 在服务器上断开网络测试（可选）
docker compose exec frontend wget --spider http://localhost:3001
```

#### 9.4 数据库持久化测试

```bash
# 创建测试数据
curl -X POST http://your-server-ip/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Test content"}'

# 重启服务
docker compose restart backend

# 检查数据是否保留
curl http://your-server-ip/v1/posts
```

#### 9.5 性能测试

```bash
# 使用 Apache Bench
ab -n 100 -c 10 http://your-server-ip/

# 或使用 curl 测试响应时间
time curl http://your-server-ip
```

---

## 常见问题排查

### 问题 1: 容器无法启动

**症状**:
```bash
docker compose ps
# 显示 Exit 1 或 Restarting
```

**解决方案**:

```bash
# 查看详细日志
docker compose logs backend
docker compose logs frontend

# 常见原因:
# 1. 端口被占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# 解决: 修改 docker-compose.yml 中的端口映射

# 2. 内存不足
free -h

# 解决: 增加 swap 或升级服务器配置

# 3. 环境变量错误
cat .env

# 解决: 检查 .env 文件格式，确保没有多余空格
```

---

### 问题 2: 前端无法访问后端

**症状**:
- 前端页面正常，但无法加载数据
- 浏览器控制台显示 CORS 错误

**解决方案**:

```bash
# 检查 CORS 配置
cat .env | grep CORS

# 确保包含你的域名
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 重启后端
docker compose restart backend

# 检查 Nginx 配置
cat nginx/conf.d/blog.conf | grep proxy_pass
```

---

### 问题 3: 化学可视化不显示

**症状**:
- 化学公式显示为原始 LaTeX
- 分子结构无法加载

**解决方案**:

```bash
# 检查化学库文件是否存在
ls -la frontend/public/chemistry/

# 应该看到:
# katex/
# rdkit/
# 3dmol/

# 如果不存在，重新构建前端
docker compose build frontend
docker compose up -d frontend

# 检查 CSP 配置
docker compose exec frontend cat /app/next.config.js | grep script-src
```

---

### 问题 4: SSL 证书获取失败

**症状**:
```bash
certbot --nginx -d your-domain.com
# 显示: Failed to connect to your-domain.com
```

**解决方案**:

```bash
# 1. 确认域名 DNS 已解析
nslookup your-domain.com

# 2. 确认防火墙开放 80 端口
ufw status

# 3. 确认 Nginx 配置正确
nginx -t

# 4. 使用 HTTP-01 验证
certbot certonly --webroot -w /var/www/html -d your-domain.com
```

---

### 问题 5: 数据库连接失败

**症状**:
```bash
docker compose logs backend
# 显示: Connection refused
```

**解决方案**:

```bash
# 检查数据库是否运行
docker compose ps postgres

# 检查数据库日志
docker compose logs postgres

# 测试数据库连接
docker compose exec postgres psql -U blog_user -d blog_db

# 检查网络
docker network inspect blog-blog-network

# 重启数据库
docker compose restart postgres
```

---

### 问题 6: 内存不足

**症状**:
```bash
docker compose logs backend
# 显示: Killed
```

**解决方案**:

```bash
# 增加 swap 空间
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 限制 Docker 内存使用
nano /etc/docker/daemon.json
```

添加:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启 Docker:
```bash
systemctl restart docker
docker compose up -d
```

---

## 维护指南

### 日常维护

#### 10.1 查看服务状态

```bash
# 每日检查脚本
cat > /usr/local/bin/check-blog.sh <<'EOF'
#!/bin/bash
cd /opt/blog
docker compose ps
docker compose logs --tail=20
EOF

chmod +x /usr/local/bin/check-blog.sh

# 每天自动检查
echo "0 9 * * * /usr/local/bin/check-blog.sh" | crontab -
```

#### 10.2 数据备份

**数据库备份**:

```bash
# 创建备份脚本
cat > /opt/blog/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker compose exec -T postgres pg_dump -U blog_user blog_db > $BACKUP_DIR/db_$DATE.sql

# 备份 Redis
docker compose exec -T redis redis-cli SAVE
docker cp blog-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 压缩备份
tar czf $BACKUP_DIR/blog_backup_$DATE.tar.gz $BACKUP_DIR/*_$DATE.*

# 删除 7 天前的备份
find $BACKUP_DIR -name "blog_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/blog_backup_$DATE.tar.gz"
EOF

chmod +x /opt/blog/backup.sh

# 每天凌晨 2 点自动备份
echo "0 2 * * * /opt/blog/backup.sh" | crontab -
```

**恢复备份**:

```bash
# 恢复数据库
docker compose exec -T postgres psql -U blog_user blog_db < /opt/backups/db_20251229_020000.sql

# 恢复 Redis
docker cp /opt/backups/redis_20251229_020000.rdb blog-redis:/data/dump.rdb
docker compose restart redis
```

#### 10.3 日志管理

```bash
# 清理旧日志
docker compose logs --tail=0 -f > /dev/null

# 限制日志大小
# 编辑 /etc/docker/daemon.json
nano /etc/docker/daemon.json
```

添加:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# 重启 Docker
systemctl restart docker
docker compose up -d
```

#### 10.4 更新部署

**更新代码**:

```bash
cd /opt/blog

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker compose build

# 重启服务
docker compose up -d
```

**零停机更新**:

```bash
# 构建新镜像
docker compose build --no-cache

# 启动新容器
docker compose up -d --no-deps --build

# 清理旧镜像
docker image prune -a
```

---

### 监控

#### 10.5 安装监控工具

**使用 htop 监控资源**:

```bash
apt install htop -y
htop
```

**使用 GoAccess 分析访问日志**:

```bash
apt install goaccess -y

# 实时分析
docker compose logs -f nginx | goaccess -
```

---

### 安全加固

#### 10.6 配置防火墙

```bash
# Ubuntu/Debian
apt install ufw -y

# 默认拒绝所有入站
ufw default deny incoming

# 允许出站
ufw default allow outgoing

# 允许 SSH（防止自己被锁在外面）
ufw allow 22/tcp

# 允许 HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status verbose
```

#### 10.7 禁用 root 登录

```bash
# 创建普通用户
useradd -m -s /bin/bash admin
usermod -aG sudo admin
usermod -aG docker admin

# 设置密码
passwd admin

# 配置 SSH
nano /etc/ssh/sshd_config
```

修改:
```
PermitRootLogin no
PasswordAuthentication no  # 强制使用密钥登录
```

重启 SSH:
```bash
systemctl restart sshd
```

#### 10.8 配置 fail2ban

```bash
# 安装 fail2ban
apt install fail2ban -y

# 创建本地配置
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
EOF

# 启动服务
systemctl enable fail2ban
systemctl start fail2ban

# 查看状态
fail2ban-client status
```

---

## 附录

### A. 快速命令参考

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f

# 查看状态
docker compose ps

# 进入容器
docker compose exec backend bash
docker compose exec frontend sh

# 重建服务
docker compose up -d --build

# 清理所有
docker compose down -v
```

### B. 环境变量快速生成

```bash
# 生成所有需要的密钥
cat > generate-env.sh <<'EOF'
#!/bin/bash
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "PASSWORD_PEPPER=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
EOF

chmod +x generate-env.sh
./generate-env.sh
```

### C. 故障排查命令

```bash
# 检查端口占用
netstat -tulpn | grep LISTEN

# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查 Docker 日志
docker compose logs --tail=100

# 检查容器资源使用
docker stats

# 检查网络连接
docker network inspect blog-blog-network
```

### D. 有用的链接

- [Docker 官方文档](https://docs.docker.com/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [Let's Encrypt 证书](https://letsencrypt.org/)
- [Certbot 文档](https://certbot.eff.org/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

---

## 📞 获取帮助

如果遇到问题:

1. **查看日志**: `docker compose logs -f`
2. **检查状态**: `docker compose ps`
3. **搜索错误**: 将错误信息复制到 Google
4. **查看文档**: `docs/` 目录下的相关文档
5. **GitHub Issues**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-29
**维护者**: Zhengbi Yong
