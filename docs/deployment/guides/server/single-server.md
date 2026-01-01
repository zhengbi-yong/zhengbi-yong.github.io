# Single Server Deployment

单服务器快速部署指南，适合个人博客或小型项目。

## 目录

- [准备工作](#准备工作)
- [系统配置](#系统配置)
- [Docker 部署](#docker-部署)
- [应用部署](#应用部署)
- [Nginx 配置](#nginx-配置)
- [SSL 证书](#ssl-证书)
- [安全加固](#安全加固)
- [监控和维护](#监控和维护)

---

## 准备工作

### 服务器要求

**最低配置**:
- CPU: 2 核
- 内存: 2 GB
- 存储: 20 GB SSD
- 操作系统: Ubuntu 22.04 LTS / Debian 11

**推荐配置**:
- CPU: 4 核
- 内存: 4 GB
- 存储: 40 GB SSD
- 操作系统: Ubuntu 22.04 LTS

### 域名和 DNS

1. **购买域名**:
   - Namecheap
   - GoDaddy
   - Cloudflare Registrar

2. **配置 DNS 记录**:

```
A     @        你的服务器IP
A     www      你的服务器IP
```

---

## 系统配置

### 更新系统

```bash
# 更新包管理器
sudo apt update

# 升级系统
sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim ufw
```

### 设置防火墙

```bash
# 启用 UFW
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

### 创建用户

```bash
# 创建新用户
sudo adduser deploy

# 添加到 sudo 组
sudo usermod -aG sudo deploy

# 切换到新用户
su - deploy
```

---

## Docker 部署

### 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 重新登录
```

### 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

---

## 应用部署

### 克隆代码

```bash
# 克隆仓库
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 配置环境变量

#### 后端环境变量

**文件**: `backend/.env`

```bash
# 数据库
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT 密钥（生成随机密钥）
JWT_SECRET=$(openssl rand -base64 32)

# Session 密钥
SESSION_SECRET=$(openssl rand -base64 32)

# 密码增强密钥
PASSWORD_PEPPER=$(openssl rand -base64 32)

# 服务器配置
HOST=127.0.0.1
PORT=3000
RUST_LOG=info
ENVIRONMENT=production

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 速率限制
RATE_LIMIT_PER_MINUTE=60

# SMTP（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

#### 前端环境变量

**文件**: `frontend/.env.local`

```bash
# 站点配置
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_PATH=

# 分析（可选）
NEXT_PUBLIC_UMAMI_ID=your-umami-id
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# 错误追踪（可选）
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

### 启动数据库

```bash
cd backend

# 启动数据库
docker-compose up -d postgres redis

# 检查状态
docker-compose ps

# 运行迁移
sqlx migrate run
```

---

### 构建后端

```bash
# 编译发布版本
cargo build --release

# 测试运行
cargo run --bin api
```

---

### 构建前端

```bash
cd frontend

# 安装依赖
pnpm install

# 构建生产版本
pnpm build

# 测试
pnpm start
```

---

## Nginx 配置

### 安装 Nginx

```bash
sudo apt install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

### 配置反向代理

**文件**: `/etc/nginx/sites-available/blog`

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 服务器
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书配置（下面配置）
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 前端静态文件
    location / {
        root /home/deploy/zhengbi-yong.github.io/frontend/out;
        try_files $uri $uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
}
```

---

### 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx
```

---

## SSL 证书

### 安装 Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

### 获取证书

```bash
# 创建目录
sudo mkdir -p /var/www/certbot

# 获取证书
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com

# 按提示输入邮箱和同意条款
```

---

### 自动续期

```bash
# 添加定时任务
sudo crontab -e

# 添加以下行（每天凌晨 2 点检查并续期）
0 2 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 安全加固

### SSH 安全

**文件**: `/etc/ssh/sshd_config`

```bash
# 禁用 root 登录
PermitRootLogin no

# 禁用密码登录（仅密钥）
PasswordAuthentication no

# 更改默认端口（可选）
Port 2222

# 重启 SSH
sudo systemctl restart sshd
```

---

### Fail2Ban

```bash
# 安装 Fail2Ban
sudo apt install fail2ban -y

# 启动服务
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

---

## 监控和维护

### 日志管理

```bash
# 查看应用日志
sudo journalctl -u blog-backend -f

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

### 系统监控

```bash
# 安装 htop
sudo apt install htop -y

# 查看资源使用
htop

# 查看 Docker 容器
docker stats
```

---

### 自动备份

**文件**: `/home/deploy/backup.sh`

```bash
#!/bin/bash

# 备份脚本
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec postgres pg_dump -U blog_user blog_db > $BACKUP_DIR/db_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

**添加到定时任务**:
```bash
# 编辑 crontab
crontab -e

# 每天凌晨 3 点备份
0 3 * * * /home/deploy/backup.sh
```

---

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 更新后端
cd backend
cargo build --release
systemctl restart blog-backend

# 更新前端
cd ../frontend
pnpm build
```

---

## 相关文档

- [High Availability Deployment](./high-availability.md) - 高可用部署
- [Deployment Overview](./overview.md) - 部署总览
- [Troubleshooting Guide](../development/operations/troubleshooting-guide.md) - 故障排查

---

**最后更新**: 2025-12-27
**维护者**: DevOps Team
