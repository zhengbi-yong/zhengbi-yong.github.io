# 博客系统部署实战指南

本文档基于实际场景：**新租赁云服务器 + 自有域名**，详细说明完整的部署流程。

## 场景说明

- **新租赁的云服务器**：例如阿里云ECS、腾讯云CVM、AWS EC2等
- **拥有域名**：例如 `example.com` 或 `blog.example.com`
- **部署目标**：在一台服务器上运行所有服务（前端、后端、数据库、缓存）

---

## 目录

- [第一步：服务器环境准备](#第一步服务器环境准备)
- [第二步：域名解析配置](#第二步域名解析配置)
- [第三步：服务器基础配置](#第三步服务器基础配置)
- [第四步：安装必要软件](#第四步安装必要软件)
- [第五步：项目部署](#第五步项目部署)
- [第六步：配置HTTPS](#第六步配置https)
- [第七步：配置防火墙](#第七步配置防火墙)
- [第八步：验证与测试](#第八步验证与测试)
- [第九步：日常维护](#第九步日常维护)

---

## 第一步：服务器环境准备

### 1.1 购买云服务器

**推荐配置**：

| 访问量 | CPU | 内存 | 硬盘 | 带宽 | 预估成本 |
|--------|-----|------|------|------|----------|
| 日活 < 1000 | 2核 | 4GB | 40GB SSD | 3Mbps | ¥50-100/月 |
| 日活 1000-5000 | 4核 | 8GB | 40GB SSD | 5Mbps | ¥150-300/月 |
| 日活 > 5000 | 8核 | 16GB | 60GB SSD | 10Mbps | ¥500+/月 |

**操作系统选择**：
- 推荐：**Ubuntu 22.04 LTS** 或 **Ubuntu 24.04 LTS**
- 次选：Debian 12、CentOS Stream 9

### 1.2 获取服务器信息

购买后，您会获得：

```
公网IP地址: 123.56.78.90
SSH端口: 22 (默认)
用户名: root (或 ubuntu)
密码: [在控制台设置]
```

### 1.3 本地连接测试

在您的本地电脑终端执行：

```bash
# 替换为您的服务器IP
ssh root@123.56.78.90

# 输入密码后成功登录，说明服务器正常
```

**成功登录后**：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl wget git vim htop net-tools

# 设置时区（可选）
timedatectl set-timezone Asia/Shanghai
```

---

## 第二步：域名解析配置

### 2.1 添加DNS解析记录

登录您的域名服务商控制台（阿里云、腾讯云、Cloudflare等），添加以下记录：

**如果使用主域名**（如 `blog.example.com`）：

| 主机记录 | 记录类型 | 记录值 | TTL |
|----------|----------|--------|-----|
| blog | A | 123.56.78.90 | 600 |

**如果使用根域名**（如 `example.com`）：

| 主机记录 | 记录类型 | 记录值 | TTL |
|----------|----------|--------|-----|
| @ | A | 123.56.78.90 | 600 |
| www | A | 123.56.78.90 | 600 |

### 2.2 验证DNS解析

在本地电脑执行：

```bash
# 检查域名解析
ping blog.example.com

# 或使用 nslookup
nslookup blog.example.com

# 应该返回您的服务器IP
```

**等待DNS生效**：通常需要 5-30 分钟，最长可能需要 24 小时。

---

## 第三步：服务器基础配置

### 3.1 创建专用用户（安全推荐）

```bash
# 创建新用户
adduser blogadmin

# 添加到sudo组
usermod -aG sudo blogadmin

# 切换到新用户
su - blogadmin
```

### 3.2 配置SSH密钥认证（推荐）

**在本地电脑生成SSH密钥**：

```bash
# 如果没有密钥，生成一个
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥到服务器
ssh-copy-id blogadmin@123.56.78.90
```

**禁用密码登录**（可选，提高安全性）：

```bash
# 在服务器上编辑SSH配置
sudo vim /etc/ssh/sshd_config

# 修改以下选项
PasswordAuthentication no
PubkeyAuthentication yes

# 重启SSH服务
sudo systemctl restart sshd
```

### 3.3 配置防火墙（UFW）

```bash
# 安装UFW
sudo apt install -y ufw

# 允许SSH（重要！先执行）
sudo ufw allow 22/tcp

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

**注意**：如果云服务商有安全组，也需要在控制台配置相同规则。

---

## 第四步：安装必要软件

### 4.1 安装Docker和Docker Compose

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入docker组（免sudo）
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 验证安装
docker --version
docker-compose --version
```

### 4.2 安装Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
curl localhost
```

**此时访问 `http://123.56.78.90` 应该看到 Nginx 欢迎页面。**

### 4.3 安装编译工具（构建后端需要）

```bash
# 安装Rust工具链
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 验证安装
rustc --version
cargo --version

# 安装Node.js（构建前端需要）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装pnpm（推荐）
npm install -g pnpm

# 验证安装
node --version
pnpm --version
```

---

## 第五步：项目部署

### 5.1 克隆项目到服务器

```bash
# 克隆项目（替换为您的仓库地址）
cd ~
git clone https://github.com/yourusername/zhengbi-yong.github.io.git

# 进入项目目录
cd zhengbi-yong.github.io
```

### 5.2 配置环境变量

```bash
# 创建.env文件
cat > .env << 'EOF'
# 数据库配置
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=blog_password
POSTGRES_DB=blog_db

# Redis配置
REDIS_URL=redis://localhost:6379

# JWT密钥（生产环境请使用强随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32-chars-min

# 服务器配置
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production

# 密码加密盐（生产环境请更换）
PASSWORD_PEPPER=change-this-to-a-random-string-in-production

# CORS配置（替换为您的域名）
CORS_ALLOWED_ORIGINS=https://blog.example.com,https://www.example.com

# 会话密钥
SESSION_SECRET=change-this-to-a-random-session-secret-in-production

# 速率限制
RATE_LIMIT_PER_MINUTE=1000

# Prometheus监控
PROMETHEUS_ENABLED=false

# SMTP邮件配置（可选）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@example.com
EOF

# ⚠️ 重要：修改JWT_SECRET、PASSWORD_PEPPER、SESSION_SECRET为随机字符串
```

**生成随机密钥**：

```bash
# 生成JWT密钥
openssl rand -base64 32

# 生成会话密钥
openssl rand -base64 24

# 生成密码盐
openssl rand -base64 16
```

### 5.3 启动数据库服务

```bash
# 启动PostgreSQL和Redis
docker-compose up -d postgres redis

# 查看容器状态
docker-compose ps

# 等待数据库启动（约10秒）
sleep 10

# 初始化数据库（首次启动）
docker-compose exec postgres psql -U blog_user -d blog_db -c "
  -- 这个命令会自动运行migrations
  SELECT 'Database initialized';
"
```

### 5.4 构建后端

```bash
# 进入后端目录
cd backend

# 编译release版本
cargo build --release --bin api

# 测试运行
cd ..
./backend/target/release/api &
BACKEND_PID=$!

# 检查后端是否启动
sleep 3
curl http://localhost:3000/health

# 如果返回200，停止测试进程
kill $BACKEND_PID
```

### 5.5 构建前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 构建生产版本
pnpm build

# 验证构建产物
ls -la .next
```

### 5.6 配置systemd服务（保持服务运行）

**创建后端服务**：

```bash
sudo vim /etc/systemd/system/blog-backend.service
```

**添加以下内容**：

```ini
[Unit]
Description=Blog Backend API
After=network.target docker-compose.service

[Service]
Type=simple
User=blogadmin
WorkingDirectory=/home/blogadmin/zhengbi-yong.github.io
Environment="RUST_LOG=info"
ExecStart=/home/blogadmin/zhengbi-yong.github.io/backend/target/release/api
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**创建前端服务**：

```bash
sudo vim /etc/systemd/system/blog-frontend.service
```

**添加以下内容**：

```ini
[Unit]
Description=Blog Frontend
After=network.target

[Service]
Type=simple
User=blogadmin
WorkingDirectory=/home/blogadmin/zhengbi-yong.github.io/frontend
Environment="NODE_ENV=production"
Environment="PORT=3003"
Environment="HOSTNAME=0.0.0.0"
ExecStart=$(which pnpm) start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**启动服务**：

```bash
# 重载systemd配置
sudo systemctl daemon-reload

# 启动后端
sudo systemctl start blog-backend
sudo systemctl enable blog-backend

# 启动前端
sudo systemctl start blog-frontend
sudo systemctl enable blog-frontend

# 查看服务状态
sudo systemctl status blog-backend
sudo systemctl status blog-frontend

# 查看日志
sudo journalctl -u blog-backend -f
sudo journalctl -u blog-frontend -f
```

### 5.7 验证服务运行

```bash
# 测试后端
curl http://localhost:3000/health

# 测试前端
curl http://localhost:3003

# 应该都能正常返回
```

---

## 第六步：配置Nginx反向代理

### 6.1 创建Nginx配置文件

```bash
sudo vim /etc/nginx/sites-available/blog
```

**添加以下配置**：

```nginx
# 后端API
server {
    listen 80;
    server_name api.blog.example.com;  # 替换为您的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 前端
server {
    listen 80;
    server_name blog.example.com www.blog.example.com;  # 替换为您的域名

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**如果前后端使用同一个域名**（推荐）：

```nginx
server {
    listen 80;
    server_name blog.example.com www.blog.example.com;  # 替换为您的域名

    # API请求转发到后端
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 其他请求转发到前端
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 启用站点配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 6.3 验证域名访问

在浏览器访问：
- `http://blog.example.com` - 应该看到前端页面
- `http://blog.example.com/api/v1/posts` - 应该返回文章列表

---

## 第七步：配置HTTPS（Let's Encrypt）

### 7.1 安装Certbot

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书（自动配置Nginx）
sudo certbot --nginx -d blog.example.com -d www.blog.example.com

# 按提示输入邮箱，同意服务条款
```

### 7.2 验证SSL证书

```bash
# 检查证书状态
sudo certbot certificates

# 测试自动续期
sudo certbot renew --dry-run
```

Certbot会自动添加定时任务来续期证书。

### 7.3 强制HTTPS（可选）

编辑Nginx配置，添加HTTP到HTTPS的重定向：

```nginx
server {
    listen 80;
    server_name blog.example.com www.blog.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.example.com www.blog.example.com;

    # SSL证书配置（Certbot自动添加）
    ssl_certificate /etc/letsencrypt/live/blog.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blog.example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... 其他配置保持不变
}
```

重载Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 7.4 验证HTTPS

在浏览器访问：
- `https://blog.example.com` - 应该看到小锁图标，显示连接安全

---

## 第八步：验证与测试

### 8.1 功能测试清单

**基础功能**：

```bash
# 1. 测试前端首页
curl -I https://blog.example.com

# 2. 测试后端API
curl https://blog.example.com/api/v1/posts

# 3. 测试用户注册
curl -X POST https://blog.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# 4. 测试用户登录
curl -X POST https://blog.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo2024@test.com","password":"demo123456"}'
```

**管理员功能**：

```bash
# 1. 登录获取token
TOKEN=$(curl -s -X POST https://blog.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo2024@test.com","password":"demo123456"}' \
  | jq -r '.access_token')

# 2. 测试管理后台统计
curl https://blog.example.com/api/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN"

# 3. 测试用户列表
curl https://blog.example.com/api/v1/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

### 8.2 性能测试

```bash
# 安装wrk
sudo apt install -y wrk

# 测试API性能
wrk -t4 -c100 -d30s https://blog.example.com/api/v1/posts
```

### 8.3 安全检查

访问以下URL确认没有安全漏洞：

```
https://blog.example.com/api/v1/posts  # 不应该返回数据库错误
https://blog.example.com/admin          # 未登录应该重定向或返回401
```

---

## 第九步：日常维护

### 9.1 日志查看

```bash
# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 后端服务日志
sudo journalctl -u blog-backend -f

# 前端服务日志
sudo journalctl -u blog-frontend -f

# Docker容器日志
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 9.2 数据备份

**创建备份脚本**：

```bash
cat > ~/backup-blog.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/blogadmin/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T postgres pg_dump -U blog_user blog_db > $BACKUP_DIR/db_$DATE.sql

# 备份Redis
docker-compose exec -T redis redis-cli SAVE
docker cp blog-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 压缩备份
cd $BACKUP_DIR
tar czf blog_backup_$DATE.tar.gz db_$DATE.sql redis_$DATE.rdb

# 删除30天前的备份
find $BACKUP_DIR -name "blog_backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: blog_backup_$DATE.tar.gz"
EOF

chmod +x ~/backup-blog.sh
```

**设置定时备份**：

```bash
# 编辑crontab
crontab -e

# 添加每天凌晨2点自动备份
0 2 * * * /home/blogadmin/backup-blog.sh >> /home/blogadmin/backup.log 2>&1
```

### 9.3 监控服务状态

```bash
# 创建监控脚本
cat > ~/check-services.sh << 'EOF'
#!/bin/bash
echo "=== Service Status ==="
sudo systemctl status blog-backend --no-pager | grep Active
sudo systemctl status blog-frontend --no-pager | grep Active
docker ps --filter "name=blog" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== Disk Space ==="
df -h | grep -E "(Filesystem|/$)"

echo ""
echo "=== Memory Usage ==="
free -h

echo ""
echo "=== API Health ==="
curl -s http://localhost:3000/health || echo "Backend is down!"
EOF

chmod +x ~/check-services.sh
```

### 9.4 更新部署

**更新代码**：

```bash
cd ~/zhengbi-yong.github.io

# 拉取最新代码
git pull origin main

# 更新后端
cd backend
cargo build --release --bin api
sudo systemctl restart blog-backend

# 更新前端
cd ../frontend
pnpm install
pnpm build
sudo systemctl restart blog-frontend

# 检查服务状态
sudo systemctl status blog-backend blog-frontend
```

**数据库迁移**（如果有新的migration）：

```bash
# 重启数据库容器会自动运行migrations
docker-compose restart postgres

# 或手动执行
docker-compose exec postgres psql -U blog_user -d blog_db -f migrations/xxxx.sql
```

---

## 常见问题排查

### 问题1：网站无法访问

```bash
# 检查域名解析
ping blog.example.com

# 检查Nginx状态
sudo systemctl status nginx

# 检查防火墙
sudo ufw status

# 检查云服务商安全组
# （在云服务控制台查看）
```

### 问题2：数据库连接失败

```bash
# 检查数据库容器
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 进入数据库容器
docker-compose exec postgres bash
```

### 问题3：后端API返回500错误

```bash
# 查看后端日志
sudo journalctl -u blog-backend -n 50

# 检查环境变量
cat .env

# 检查数据库连接
docker-compose exec postgres psql -U blog_user -d blog_db -c "SELECT 1;"
```

### 问题4：SSL证书申请失败

```bash
# 检查域名解析是否生效
nslookup blog.example.com

# 检查80端口是否开放
sudo netstat -tlnp | grep :80

# 停止Nginx重新申请
sudo systemctl stop nginx
sudo certbot certonly --standalone -d blog.example.com
sudo systemctl start nginx
```

---

## 安全建议

### 1. 定期更新系统

```bash
# 每周执行
sudo apt update && sudo apt upgrade -y
```

### 2. 修改默认密码

```bash
# 登录数据库修改默认管理员密码
docker-compose exec postgres psql -U blog_user -d blog_db
UPDATE users SET password_hash = '$new_hash' WHERE email = 'demo2024@test.com';
```

### 3. 配置fail2ban（防止SSH暴力破解）

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. 启用自动安全更新

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 成本优化建议

### 1. 使用CDN加速

- 静态资源使用CDN（如阿里云OSS+CDN、腾讯云COS+CDN）
- 可以显著降低带宽成本

### 2. 数据库优化

```bash
# 配置PostgreSQL内存限制
sudo vim /etc/postgresql/14/main/postgresql.conf

# 添加以下配置（根据服务器内存调整）
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

### 3. 使用轻量级监控

- 使用云服务商提供的免费监控
- 避免安装重型监控工具

---

## 总结

完成以上步骤后，您将拥有：

✅ 完整的博客系统运行在新服务器上
✅ 域名通过HTTPS访问
✅ 数据自动备份
✅ 服务自动重启
✅ 基本的安全防护

**访问地址**：
- 前端：`https://blog.example.com`
- 后端API：`https://blog.example.com/api/v1/`
- 管理后台：`https://blog.example.com/admin`

**默认管理员账号**：
- 邮箱：`demo2024@test.com`
- 密码：`demo123456`

**首次登录后请立即修改密码！**

---

## 附录：完整部署脚本

如果以上步骤太繁琐，可以使用一键部署脚本：

```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

echo "=== Blog Production Deployment ==="

# 检查必要软件
command -v docker >/dev/null 2>&1 || { echo "Docker not installed. Exiting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose not installed. Exiting."; exit 1; }

# 配置环境变量
read -p "Enter your domain (e.g., blog.example.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL

# 生成随机密钥
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 24)
PASSWORD_PEPPER=$(openssl rand -base64 16)

# 创建.env文件
cat > .env << EOF
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=blog_password
POSTGRES_DB=blog_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=$JWT_SECRET
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production
PASSWORD_PEPPER=$PASSWORD_PEPPER
CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
SESSION_SECRET=$SESSION_SECRET
RATE_LIMIT_PER_MINUTE=1000
PROMETHEUS_ENABLED=false
EOF

echo "Environment configured."

# 启动数据库
docker-compose up -d postgres redis
sleep 10

# 构建后端
echo "Building backend..."
cd backend
cargo build --release --bin api
cd ..

# 构建前端
echo "Building frontend..."
cd frontend
pnpm install
pnpm build
cd ..

# 配置systemd服务
sudo cp scripts/blog-backend.service /etc/systemd/system/
sudo cp scripts/blog-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start blog-backend blog-frontend
sudo systemctl enable blog-backend blog-frontend

# 配置Nginx
sudo cp scripts/blog-nginx.conf /etc/nginx/sites-available/blog
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 获取SSL证书
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

echo "=== Deployment Complete! ==="
echo "Visit https://$DOMAIN to see your blog."
```

保存为 `scripts/deploy-production.sh`，然后：

```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

---

**祝您部署顺利！** 🎉

如有问题，请参考 `docs/deploy.md` 或 `docs/admin.md` 获取更多帮助。
