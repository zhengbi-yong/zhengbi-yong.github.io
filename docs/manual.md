# 平民版多设备开发部署手册

## 概述

这是一个面向个人开发者和小型团队的实用部署方案，用最少的设备实现开发和生产环境。本方案专注于成本效益和实用性，让你用一台电脑和一个云服务器就能搭建完整的开发和部署流程。

## 最小化设备方案

### 设备清单（仅需2台）

1. **开发电脑** (Development Machine)
   - 你现有的电脑
   - 配置要求：8GB+ RAM（推荐16GB），256GB+ SSD
   - 系统：Windows/macOS/Linux

2. **云端服务器** (Cloud Server)
   - 一台云服务器（阿里云/腾讯云/AWS等）
   - 配置建议：
     - 入门版：2核4GB，40GB SSD（约100元/月）
     - 推荐版：4核8GB，80GB SSD（约200元/月）

### 方案架构

```
┌─────────────────┐         ┌─────────────────┐
│   开发电脑       │         │   云端服务器      │
│                │         │                │
│ ├─ 前端开发      │         │ ├─ 生产环境      │
│ │  Next.js     │         │ │  ├─ 前端      │
│ │  热重载       │         │ │  ├─ 后端      │
│ └─ 后端开发      │         │ │  ├─ 数据库    │
│    Rust API     │         │ │  └─ Nginx    │
│                │         │ │              │
│ ├─ 本地测试      │         │ ├─ Docker      │
│ │  单元测试      │         │ │  容器管理     │
│ │  集成测试      │         │ └─ 自动化脚本   │
│ └─ Git工具       │         │                │
└─────────────────┘         └─────────────────┘
        │                           │
        └────────── Git Push ────────┘
                自动部署脚本
```

## 详细部署方案

### 一、开发环境设置（本地电脑）

#### 1. 基础环境准备

**安装必要软件**：

```bash
# Windows (使用 Chocolatey)
choco install git nodejs rust docker-desktop

# macOS (使用 Homebrew)
brew install git node rustup docker

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install -y git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**安装 pnpm**：
```bash
npm install -g pnpm
```

#### 2. 项目设置

```bash
# 克隆项目
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../backend
cargo build
```

#### 3. 本地开发配置

**前端配置** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

**后端配置** (`backend/.env`):
```env
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
RUST_LOG=debug
ENVIRONMENT=development
```

#### 4. 启动本地开发

**方法1：使用Docker（推荐）**

创建 `docker-compose.dev.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: blog_dev
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: blog_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

启动服务：
```bash
# 启动数据库服务
docker-compose -f docker-compose.dev.yml up -d

# 启动后端（新终端）
cd backend
cargo run

# 启动前端（新终端）
cd frontend
pnpm dev
```

**方法2：手动安装数据库**

```bash
# 安装 PostgreSQL
# Windows: 从官网下载安装
# macOS: brew install postgresql
# Linux: sudo apt install postgresql postgresql-contrib

# 安装 Redis
# Windows: 下载 Windows 版本
# macOS: brew install redis
# Linux: sudo apt install redis-server

# 启动服务
sudo service postgresql start
sudo service redis start
```

### 二、云端服务器配置

#### 1. 服务器初始化

**连接服务器**：
```bash
ssh root@your-server-ip
```

**基础设置**：
```bash
# 更新系统
apt update && apt upgrade -y

# 创建用户（推荐）
adduser deploy
usermod -aG sudo deploy

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker deploy

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 安装 Nginx
apt install -y nginx

# 安装 Git
apt install -y git

# 配置防火墙
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

#### 2. 生产环境部署

**切换到部署用户**：
```bash
su - deploy
```

**克隆项目**：
```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

**创建环境配置**：

`backend/.env.prod`:
```env
DATABASE_URL=postgresql://blog_user:your_password@postgres:5432/blog_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key
PASSWORD_PEPPER=your-password-pepper
RUST_LOG=info
ENVIRONMENT=production
HOST=0.0.0.0
PORT=3000
```

**创建生产环境 Docker Compose** (`docker-compose.prod.yml`):
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: blog_prod
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  api:
    build: ./backend
    env_file:
      - ./backend/.env.prod
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - api
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**创建 Nginx 配置** (`nginx.conf`):
```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # HTTP 重定向到 HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL 证书（先注释掉，后面配置）
        # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        # API 代理
        location /api/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 前端
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 3. 自动部署脚本

创建 `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# 拉取最新代码
git pull origin main

# 构建并启动服务
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
sleep 30

# 运行数据库迁移
docker-compose exec api sqlx migrate run

# 健康检查
if curl -f http://localhost/api/healthz; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
```

**赋予执行权限**：
```bash
chmod +x deploy.sh
```

### 三、自动化部署流程

#### 1. 使用 GitHub Actions（免费）

创建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/zhengbi-yong.github.io
            git pull origin main
            ./deploy.sh
```

**配置 GitHub Secrets**：
- `HOST`: 服务器IP地址
- `USERNAME`: deploy
- `SSH_KEY`: SSH私钥内容

#### 2. 简单的 Git Hook 方案

如果没有使用 GitHub Actions，可以在服务器设置 Git Hook：

```bash
# 在服务器上创建 bare repo
mkdir ~/blog.git
cd ~/blog.git
git init --bare

# 创建 post-receive hook
cat > hooks/post-receive << 'EOF'
#!/bin/bash
cd ~/zhengbi-yong.github.io
git checkout main
git pull origin main
./deploy.sh
EOF

chmod +x hooks/post-receive
```

### 四、SSL证书配置（Let's Encrypt）

#### 1. 安装 Certbot

```bash
# 在服务器上执行
sudo apt install certbot python3-certbot-nginx
```

#### 2. 获取证书

```bash
# 确保域名已解析到服务器
sudo certbot --nginx -d your-domain.com
```

#### 3. 自动续期

```bash
# 添加定时任务
crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 五、备份策略

#### 1. 数据库备份脚本

创建 `backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec postgres pg_dump -U blog_user blog_prod | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 备份用户上传的文件
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz uploads/

# 清理30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

#### 2. 自动备份

```bash
# 添加到 crontab
crontab -e

# 每天凌晨3点备份
0 3 * * * /home/deploy/zhengbi-yong.github.io/backup.sh
```

### 六、监控方案

#### 1. 简单的健康检查

创建 `health-check.sh`:
```bash
#!/bin/bash

# 检查服务状态
if ! curl -f http://localhost/api/healthz > /dev/null 2>&1; then
    echo "Service is down! Restarting..."
    docker-compose restart api

    # 发送告警邮件（需要配置邮件）
    # echo "Blog service is down and has been restarted" | mail -s "Blog Alert" your-email@example.com
fi
```

#### 2. 使用 Uptime Robot（免费）

访问 https://uptimerobot.com/
- 注册免费账号
- 添加监控：https://your-domain.com/api/healthz
- 设置告警邮件

### 七、域名和DNS配置

#### 1. 购买域名

- 阿里云：wanwang.aliyun.com
- 腾讯云：dnspod.cloud.tencent.com
- Namesilo：namesilo.com（便宜）

#### 2. 配置DNS解析

```
类型     名称            值
A       @              你的服务器IP
A       www            你的服务器IP
```

## 成本估算

### 必要支出

1. **云服务器**：
   - 入门版：约100元/月
   - 推荐版：约200元/月

2. **域名**：
   - .com：约60元/年
   - .cn：约30元/年

### 可选支出

1. **对象存储**（用于图片备份）：
   - 阿里云OSS：约10元/月
   - 腾讯云COS：约10元/月

**总计**：最低每月约100元，每年约1200元

## 逐步升级建议

### 阶段1：基础运行（当前）
- ✅ 本地开发 + 云端部署
- ✅ 自动化部署
- ✅ 基础监控

### 阶段2：优化体验（1-2个月后）
- 添加 CDN 加速（约10元/月）
- 使用对象存储存储图片
- 配置更详细的监控

### 阶段3：提升性能（3-6个月后）
- 升级服务器配置
- 添加 Redis 缓存
- 配置数据库备份到云存储

### 阶段4：高可用（半年后）
- 添加第二台服务器做负载均衡
- 配置数据库主从复制
- 考虑使用 CDN 和 WAF

## 常见问题解决

### 1. 部署失败怎么办？

```bash
# 查看日志
docker-compose -f docker-compose.prod.yml logs

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs api

# 重启服务
docker-compose -f docker-compose.prod.yml restart
```

### 2. 如何更新部署？

```bash
# 方法1：推送代码自动触发（配置了GitHub Actions）
git push origin main

# 方法2：手动部署
ssh deploy@your-server-ip
cd ~/zhengbi-yong.github.io
./deploy.sh
```

### 3. 数据库密码忘了？

```bash
# 查看环境变量
docker-compose exec api env | grep DATABASE_URL

# 或直接修改配置文件
nano backend/.env.prod
docker-compose restart api
```

### 4. 如何备份和恢复？

```bash
# 备份（已有自动备份脚本）
./backup.sh

# 恢复
gunzip < backups/db_backup_20241220_030000.sql.gz | docker-compose exec -T postgres psql -U blog_user blog_prod
```

### 5. 网站访问慢怎么办？

1. 检查服务器资源使用：
   ```bash
   htop
   df -h
   ```

2. 优化 Nginx 配置（添加缓存）

3. 考虑升级服务器配置

## 总结

这个平民版方案让你用最少的资源实现：
- ✅ 本地开发环境
- ✅ 自动化部署
- ✅ 生产环境运行
- ✅ 基础监控和备份
- ✅ SSL证书
- ✅ 域名访问

**总成本**：每月约100-200元，适合个人开发者和初创项目。随着项目发展，可以逐步升级到更专业的方案。