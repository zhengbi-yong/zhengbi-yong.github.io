# 服务器部署切换指南

本文档提供了完整的服务器部署切换方案，让你能够快速在新服务器上部署应用，并实现零停机迁移。

## 目录

- [部署架构](#部署架构)
- [环境准备](#环境准备)
- [快速部署](#快速部署)
- [数据迁移](#数据迁移)
- [服务管理](#服务管理)
- [故障排查](#故障排查)

---

## 部署架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (可选)                        │
│                    http://localhost:80/443               │
└──────────────────────┬────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐           ┌────────▼────────┐
│  Frontend UI    │           │   Backend API    │
│  Next.js 16     │           │   Axum/Rust      │
│  Port: 3003     │◄────────►│   Port: 3000     │
└─────────────────┘           └────────┬─────────┘
                                         │
        ┌────────────────────────────────┴────────┐
        │                                         │
┌───────▼────────┐           ┌────────────────▼─────┐
│   PostgreSQL   │           │       Redis          │
│   Port: 5432   │           │     Port: 6379        │
└────────────────┘           └───────────────────────┘
```

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend (Next.js) | 3003 | 前端 UI 服务 |
| Backend API | 3000 | 后端 API 服务 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存服务 |

---

## 环境准备

### 1. 系统要求

**支持的操作系统**：
- Linux (Ubuntu 20.04+, Debian 10+, CentOS 7+)
- Windows 10/11 (with WSL2)
- macOS 11+

**必需软件**：
- Docker 20.10+
- Docker Compose 1.29+
- Git 2.0+
- 至少 2GB RAM
- 至少 10GB 可用磁盘空间

### 2. 安装 Docker

#### Ubuntu/Debian

```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 设置 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker-compose --version
```

#### CentOS/RHEL

```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

#### macOS

```bash
# 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Docker Desktop
brew install --cask docker

# 启动 Docker Desktop
open /Applications/Docker.app
```

### 3. 配置防火墙

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend API (可选)
sudo ufw allow 3003/tcp  # Frontend (可选)
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3003/tcp
sudo firewall-cmd --reload
```

### 4. 创建部署用户（推荐）

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# 切换到 deploy 用户
sudo su - deploy
```

---

## 快速部署

### 方法 1：一键部署脚本

我们提供了自动化部署脚本，可以快速在新服务器上部署所有服务。

```bash
#!/bin/bash
# scripts/deploy.sh - 一键部署脚本

set -e  # 遇到错误立即退出

echo "================================"
echo "  博客系统一键部署脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查必要的命令
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 未安装，请先安装${NC}"
        exit 1
    fi
}

echo "→ 检查系统环境..."
check_command "docker"
check_command "docker-compose"
check_command "git"
echo -e "${GREEN}✓ 系统环境检查通过${NC}"
echo ""

# 项目配置
PROJECT_DIR="${HOME}/blog"
REPO_URL="https://github.com/your-username/zhengbi-yong.github.io.git"
BACKUP_DIR="${HOME}/backups"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 克隆或更新项目
if [ -d "$PROJECT_DIR" ]; then
    echo "→ 更新项目代码..."
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "→ 克隆项目仓库..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi
echo -e "${GREEN}✓ 项目代码已更新${NC}"
echo ""

# 检查 .env 文件
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    echo "→ 创建配置文件..."
    cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env" 2>/dev/null || cat > "$PROJECT_DIR/backend/.env" << 'EOF'
# 数据库配置
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=blog_password
POSTGRES_DB=blog_db

# Redis 配置
REDIS_URL=redis://localhost:6379

# JWT 密钥（生产环境请使用强密码）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
SESSION_SECRET=your-session-secret-change-this

# 服务器配置
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production
PASSWORD_PEPPER=your-password-pepper-add-random-string-here

# CORS 配置（允许的前端域名）
CORS_ALLOWED_ORIGINS=http://localhost:3003,https://yourdomain.com

# 速率限制
RATE_LIMIT_PER_MINUTE=100

# Prometheus 监控
PROMETHEUS_ENABLED=false

# SMTP 邮件配置（可选）
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@yourdomain.com
EOF
    echo -e "${YELLOW}⚠ 请编辑 $PROJECT_DIR/backend/.env 配置生产环境密钥${NC}"
fi

# 停止旧容器（如果存在）
echo "→ 停止旧容器..."
cd "$PROJECT_DIR"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ 旧容器已停止${NC}"
echo ""

# 构建后端
echo "→ 构建后端服务..."
cd "$PROJECT_DIR/backend"
cargo build --release --bin api
echo -e "${GREEN}✓ 后端构建完成${NC}"
echo ""

# 构建前端
echo "→ 构建前端服务..."
cd "$PROJECT_DIR/frontend"
pnpm install
pnpm build
echo -e "${GREEN}✓ 前端构建完成${NC}"
echo ""

# 启动服务
echo "→ 启动所有服务..."
cd "$PROJECT_DIR"
docker-compose up -d postgres redis

# 等待数据库启动
echo "→ 等待数据库启动..."
sleep 10

# 启动应用
docker-compose up -d

echo ""
echo "================================"
echo -e "${GREEN}  部署完成！${NC}"
echo "================================"
echo ""
echo "服务访问地址："
echo "  前端: http://localhost:3003"
echo "  后端: http://localhost:3000"
echo ""
echo "查看服务状态："
echo "  docker-compose ps"
echo ""
echo "查看日志："
echo "  docker-compose logs -f"
echo ""
echo "停止所有服务："
echo "  docker-compose down"
echo ""
```

### 方法 2：手动部署

如果需要更多控制，可以手动执行以下步骤：

#### 步骤 1：克隆项目

```bash
# 克隆项目到服务器
git clone https://github.com/your-username/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

#### 步骤 2：配置环境变量

```bash
# 复制示例配置文件
cp backend/.env.example backend/.env

# 编辑配置文件
nano backend/.env
```

**重要配置项**：

```bash
# 生产环境必须修改的密钥
JWT_SECRET=生产环境请使用至少32位的随机字符串
SESSION_SECRET=同上
PASSWORD_PEPPER=密码增强密钥

# 数据库密码
POSTGRES_PASSWORD=生产环境使用强密码

# CORS 配置
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SMTP 邮件配置（如果需要邮件功能）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

#### 步骤 3：构建应用

```bash
# 构建后端
cd backend
cargo build --release --bin api

# 构建前端
cd ../frontend
pnpm install
pnpm build
```

#### 步骤 4：启动服务

```bash
# 返回项目根目录
cd ..

# 启动数据库和缓存
docker-compose up -d postgres redis

# 等待数据库启动（约 10 秒）
sleep 10

# 启动应用
docker-compose up -d
```

#### 步骤 5：验证部署

```bash
# 检查容器状态
docker-compose ps

# 检查服务健康
curl http://localhost:3000/health

# 访问前端
# 在浏览器中打开 http://your-server-ip:3003
```

---

## 数据迁移

### 旧服务器数据备份

在切换服务器前，需要备份所有数据：

#### 1. 创建备份脚本

创建 `scripts/backup.sh`:

```bash
#!/bin/bash
# scripts/backup.sh - 数据备份脚本

set -e

BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "→ 开始数据备份..."
echo ""

# 1. 备份数据库
echo "→ 备份 PostgreSQL 数据库..."
docker exec blog-postgres pg_dump -U blog_user blog_db \
    --clean --if-exists \
    > "$BACKUP_DIR/database_$DATE.sql"

echo -e "  ✓ 数据库备份完成: database_$DATE.sql"

# 2. 备份 Redis 数据
echo "→ 备份 Redis 数据..."
docker exec blog-redis redis-cli --rdb /data/dump.rdb BGSAVE
sleep 2
docker cp blog-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

echo -e "  ✓ Redis 备份完成: redis_$DATE.rdb"

# 3. 备份上传的文件（如果有）
echo "→ 备份上传的文件..."
if [ -d "public/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" public/uploads
    echo -e "  ✓ 上传文件备份完成: uploads_$DATE.tar.gz"
fi

# 4. 备份配置文件
echo "→ 备份配置文件..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    backend/.env \
    frontend/.env.local \
    docker-compose.yml \
    docker-compose.prod.yml 2>/dev/null

echo -e "  ✓ 配置文件备份完成: config_$DATE.tar.gz"

echo ""
echo "================================"
echo "  备份完成！"
echo "================================"
echo ""
echo "备份文件位置: $BACKUP_DIR"
echo ""
ls -lh "$BACKUP_DIR"
```

#### 2. 执行备份

```bash
# 赋予执行权限
chmod +x scripts/backup.sh

# 执行备份
./scripts/backup.sh
```

#### 3. 下载备份到本地

```bash
# 在本地机器上执行（将 old-server 替换为旧服务器地址）
scp -r deploy@old-server:~/backups ./local_backups
```

### 新服务器数据恢复

#### 1. 上传备份文件

```bash
# 上传备份到新服务器
scp -r ./local_backups deploy@new-server:~/
```

#### 2. 恢复数据

创建 `scripts/restore.sh`:

```bash
#!/bin/bash
# scripts/restore.sh - 数据恢复脚本

set -e

if [ -z "$1" ]; then
    echo "用法: ./restore.sh <backup_date>"
    echo "示例: ./restore.sh 20251226_120000"
    exit 1
fi

BACKUP_DIR="$HOME/backups"
DATE=$1

echo "→ 开始恢复数据..."
echo ""

# 1. 恢复数据库
echo "→ 恢复 PostgreSQL 数据库..."
if [ -f "$BACKUP_DIR/database_$DATE.sql" ]; then
    docker exec -i blog-postgres psql -U blog_user -d blog_db \
        < "$BACKUP_DIR/database_$DATE.sql"
    echo -e "  ✓ 数据库恢复完成"
else
    echo -e "  ⚠ 数据库备份文件不存在: database_$DATE.sql"
fi

# 2. 恢复 Redis 数据
echo "→ 恢复 Redis 数据..."
if [ -f "$BACKUP_DIR/redis_$DATE.rdb" ]; then
    docker cp "$BACKUP_DIR/redis_$DATE.rdb" blog-redis:/data/dump.rdb
    docker restart blog-redis
    sleep 3
    echo -e "  ✓ Redis 恢复完成"
else
    echo -e "  ⚠ Redis 备份文件不存在: redis_$DATE.rdb"
fi

# 3. 恢复上传文件
if [ -f "$BACKUP_DIR/uploads_$DATE.tar.gz" ]; then
    echo "→ 恢复上传的文件..."
    tar -xzf "$BACKUP_DIR/uploads_$DATE.tar.gz"
    echo -e "  ✓ 上传文件恢复完成"
fi

# 4. 恢复配置文件
if [ -f "$BACKUP_DIR/config_$DATE.tar.gz" ]; then
    echo "→ 恢复配置文件..."
    tar -xzf "$BACKUP_DIR/config_$DATE.tar.gz"
    echo -e "  ✓ 配置文件恢复完成"
fi

echo ""
echo "================================"
echo "  数据恢复完成！"
echo "================================"
echo ""
echo "请重启服务以使配置生效："
echo "  docker-compose restart"
```

#### 3. 执行恢复

```bash
# 赋予执行权限
chmod +x scripts/restore.sh

# 恢复数据（使用备份日期）
./scripts/restore.sh 20251226_120000

# 重启服务
docker-compose restart
```

---

## 服务管理

### 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 只启动数据库和缓存
docker-compose up -d postgres redis

# 启动后端（开发模式）
cd backend
cargo run --bin api

# 启动前端（开发模式）
cd frontend
pnpm dev
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止所有服务并删除数据卷（⚠️ 会删除数据）
docker-compose down -v

# 停止特定服务
docker-compose stop backend
docker-compose stop frontend
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# 查看最近 100 行日志
docker-compose logs --tail=100 backend
```

### 更新应用

```bash
# 1. 更新代码
git pull origin main

# 2. 重新构建
cd backend
cargo build --release --bin api

cd ../frontend
pnpm build

# 3. 重启服务
cd ..
docker-compose restart backend frontend

# 4. 清理旧镜像（可选）
docker image prune -a
```

---

## 生产环境优化

### 1. 使用 Nginx 反向代理

创建 `nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /v1/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3003;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启动 Nginx:

```bash
# 复制配置
sudo cp nginx.conf /etc/nginx/sites-available/blog

# 启用站点
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 2. 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 配置 systemd 服务

创建 `/etc/systemd/system/blog-backend.service`:

```ini
[Unit]
Description=Blog Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/blog/backend
Environment="DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db"
Environment="REDIS_URL=redis://localhost:6379"
ExecStart=/home/deploy/blog/backend/target/release/api
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

创建 `/etc/systemd/system/blog-frontend.service`:

```ini
[Unit]
Description=Blog Frontend UI
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/blog/frontend
Environment="NODE_ENV=production"
Environment="PORT=3003"
ExecStart=/usr/bin/node server/build/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
# 重载 systemd
sudo systemctl daemon-reload

# 启用自启动
sudo systemctl enable blog-backend blog-frontend

# 启动服务
sudo systemctl start blog-backend blog-frontend

# 查看状态
sudo systemctl status blog-backend blog-frontend
```

### 4. 数据库性能优化

编辑 `backend/docker-compose.yml` 中的 PostgreSQL 配置：

```yaml
services:
  postgres:
    environment:
      # 内存配置（根据服务器内存调整）
      - POSTGRES_SHARED_BUFFERS=256MB
      - POSTGRES_EFFECTIVE_CACHE_SIZE=2GB
      - POSTGRES_WORK_MEM=32MB
      # 连接配置
      - POSTGRES_MAX_CONNECTIONS=100
      # WAL 配置
      - POSTGRES_WAL_BUFFERS=16MB
      - POSTGRES_CHECKPOINT_COMPLETION_TARGET=0.9
    command:
      - "postgres"
      - "-c shared_buffers=256MB"
      - "-c effective_cache_size=2GB"
      - "-c work_mem=32MB"
      - "-c max_connections=100"
      - "-c random_page_cost=1.1"
      - "-c effective_io_concurrency=200"
```

---

## 故障排查

### 问题 1：容器无法启动

**症状**：
```bash
docker-compose up -d
# 容器立即退出
```

**解决方案**：

```bash
# 查看详细日志
docker-compose logs backend

# 检查端口占用
netstat -tulpn | grep -E '3000|3003|5432|6379'

# 检查磁盘空间
df -h

# 重建容器
docker-compose down
docker-compose up -d --force-recreate
```

### 问题 2：数据库连接失败

**症状**：
```
Error: Database connection failed
```

**解决方案**：

```bash
# 1. 检查数据库是否运行
docker-compose ps postgres

# 2. 检查数据库日志
docker-compose logs postgres

# 3. 测试连接
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 4. 检查 .env 配置
cat backend/.env | grep DATABASE_URL

# 5. 重启数据库
docker-compose restart postgres
```

### 问题 3：前端无法访问后端

**症状**：
- 前端页面显示但无法加载数据
- 浏览器控制台显示 CORS 错误

**解决方案**：

```bash
# 1. 检查后端是否运行
curl http://localhost:3000/health

# 2. 检查 CORS 配置
cat backend/.env | grep CORS_ALLOWED_ORIGINS

# 3. 临时允许所有域名（仅用于测试）
export CORS_ALLOWED_ORIGINS=*
docker-compose restart backend

# 4. 检查防火墙
sudo ufw status
```

### 问题 4：内存不足

**症状**：
```
Cannot allocate memory
```

**解决方案**：

```bash
# 1. 检查内存使用
free -h

# 2. 创建 Swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. 永久启用 Swap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 4. 限制 Docker 内存使用
# 编辑 /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "max-memory": "2g"
}

# 5. 重启 Docker
sudo systemctl restart docker
```

### 问题 5：端口被占用

**症状**：
```
Error: bind: address already in use
```

**解决方案**：

```bash
# 1. 查找占用端口的进程
sudo lsof -i :3000
sudo lsof -i :3003
sudo lsof -i :5432

# 2. 停止占用端口的进程
sudo kill -9 <PID>

# 3. 或者修改端口
# 编辑 backend/.env
PORT=3001

# 编辑 frontend/.env.local
PORT=3004
```

---

## 监控和维护

### 健康检查脚本

创建 `scripts/health-check.sh`:

```bash
#!/bin/bash
# scripts/health-check.sh - 系统健康检查

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "================================"
echo "  系统健康检查"
echo "================================"
echo ""

# 检查容器状态
echo "→ 容器状态"
docker-compose ps
echo ""

# 检查磁盘空间
echo "→ 磁盘空间"
df -h | grep -E "Filesystem|/dev/"
echo ""

# 检查内存使用
echo "→ 内存使用"
free -h
echo ""

# 检查后端健康
echo "→ 后端健康检查"
BACKEND_HEALTH=$(curl -s http://localhost:3000/health || echo "failed")
if [ "$BACKEND_HEALTH" = "OK" ]; then
    echo -e "  ${GREEN}✓ 后端服务正常${NC}"
else
    echo -e "  ${RED}✗ 后端服务异常${NC}"
fi
echo ""

# 检查前端访问
echo "→ 前端访问检查"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓ 前端服务正常${NC}"
else
    echo -e "  ${RED}✗ 前端服务异常 (HTTP $FRONTEND_STATUS)${NC}"
fi
echo ""

# 检查数据库连接
echo "→ 数据库连接"
DB_CHECK=$(docker exec blog-postgres pg_isready -U blog_user 2>&1)
if echo "$DB_CHECK" | grep -q "accepting connections"; then
    echo -e "  ${GREEN}✓ 数据库正常${NC}"
else
    echo -e "  ${RED}✗ 数据库异常${NC}"
fi
echo ""

# 检查 Redis
echo "→ Redis 连接"
REDIS_CHECK=$(docker exec blog-redis redis-cli ping 2>&1)
if [ "$REDIS_CHECK" = "PONG" ]; then
    echo -e "  ${GREEN}✓ Redis 正常${NC}"
else
    echo -e "  ${RED}✗ Redis 异常${NC}"
fi
echo ""

echo "================================"
echo "  检查完成"
echo "================================"
```

使用方法：

```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

### 自动备份设置

创建定时任务（每天凌晨 2 点自动备份）：

```bash
# 编辑 crontab
crontab -e

# 添加以下行
0 2 * * * /home/deploy/blog/scripts/backup.sh >> /home/deploy/blog/backup.log 2>&1
```

### 日志管理

创建日志清理脚本 `scripts/clean-logs.sh`:

```bash
#!/bin/bash
# scripts/clean-logs.sh - 清理旧日志

echo "→ 清理 Docker 日志..."
docker system prune -af

echo "→ 清理应用日志..."
find ~/blog/logs -name "*.log" -mtime +30 -delete

echo "→ 清理系统日志（保留最近 7 天）"
sudo journalctl --vacuum-time=7d

echo "  ✓ 日志清理完成"
```

---

## 快速切换服务器完整流程

### 流程图

```
旧服务器                        新服务器
    |                              |
    |-- 1. 备份数据                |
    |                              |
    |-- 2. 下载备份                |-- 1. 准备环境
    |                              |
    |                              |-- 2. 部署应用
    |                              |-- 3. 恢复数据
    |                              |-- 4. 更新 DNS
    |                              |
    |-- 3. 更新 DNS ----------------→ 5. 验证服务
    |                              |
    |-- 4. 关闭服务                |
```

### 详细步骤

#### 第 1 步：在旧服务器上备份

```bash
# SSH 到旧服务器
ssh deploy@old-server.com

# 进入项目目录
cd ~/zhengbi-yong.github.io

# 执行备份
chmod +x scripts/backup.sh
./scripts/backup.sh

# 记录备份日期（用于恢复）
ls -lt ~/backups/
```

#### 第 2 步：准备新服务器

```bash
# SSH 到新服务器
ssh root@new-server.com

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 创建部署用户
useradd -m -s /bin/bash deploy
usermod -aG docker deploy

# 切换到 deploy 用户
su - deploy

# 下载项目
git clone https://github.com/your-username/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 配置环境变量
cp backend/.env.example backend/.env
nano backend/.env  # 编辑配置
```

#### 第 3 步：部署到新服务器

```bash
# 执行一键部署
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 验证部署
./scripts/health-check.sh
```

#### 第 4 步：迁移数据

```bash
# 在本地机器上执行
scp deploy@old-server:~/zhengbi-yong.github.io/backups/* ./backup/

# 上传到新服务器
scp ./backup/* deploy@new-server:~/backups/

# 在新服务器上恢复
cd ~/zhengbi-yong.github.io
./scripts/restore.sh 20251226_120000

# 重启服务
docker-compose restart
```

#### 第 5 步：切换 DNS

```bash
# 在域名提供商处更新 DNS 记录
# 将 A 记录从旧服务器 IP 改为新服务器 IP

# 验证 DNS 解析
dig yourdomain.com
```

#### 第 6 步：验证服务

```bash
# 检查网站访问
curl https://yourdomain.com

# 测试登录
curl -X POST https://yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo2024@test.com","password":"demo123456"}'

# 检查管理后台
curl https://yourdomain.com/admin
```

#### 第 7 步：关闭旧服务器（可选）

```bash
# 等待 1-2 天确保新服务器稳定后

# 停止旧服务
cd ~/zhengbi-yong.github.io
docker-compose down

# 或保留旧服务器作为备份
```

---

## 域名和 DNS 配置

### 配置 DNS 记录

在你的域名提供商处添加以下记录：

```
A 记录：
  @        A    123.45.67.89      (主域名)
  www      A    123.45.67.89      (www 子域名)

CNAME 记录（可选）：
  blog    CNAME  @              (blog.yourdomain.com)

AAAA 记录（IPv6，可选）：
  @        AAAA 2001:db8::1      (IPv6 地址)
```

### 配置子域名

可以为不同服务配置子域名：

```
blog.yourdomain.com          → 前端 (3003)
api.blog.yourdomain.com      → 后端 (3000)
admin.blog.yourdomain.com    → 管理后台 (3003)
```

---

## 成本优化

### 服务器选择建议

根据流量选择合适的服务器配置：

| 月 PV | 推荐配置 | 预计成本 |
|-------|---------|---------|
| < 10K | 2核 2GB | $5-10/月 |
| 10K-50K | 2核 4GB | $10-20/月 |
| 50K-100K | 4核 8GB | $20-40/月 |
| 100K-500K | 4核 16GB | $40-80/月 |

### 优化建议

1. **使用 CDN**
   - 静态资源托管到 CDN
   - 减少服务器带宽压力
   - 提高访问速度

2. **数据库优化**
   - 定期清理无用数据
   - 优化慢查询
   - 配置数据库连接池

3. **缓存策略**
   - 启用 Redis 缓存
   - 配置合适的过期时间
   - 缓存静态资源

4. **自动扩容**
   - 监控资源使用
   - 设置告警阈值
   - 必要时升级配置

---

## 安全建议

### 1. 系统安全

```bash
# 禁用 root SSH 登录
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 只允许密钥登录
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# 重启 SSH
sudo systemctl restart sshd

# 安装 fail2ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. 应用安全

```bash
# 定期更新依赖
cd ~/zhengbi-yong.github.io/backend
cargo update

cd frontend
pnpm update

# 检查安全漏洞
cargo audit
pnpm audit
```

### 3. 数据备份

```bash
# 自动备份（每天）
0 2 * * * ~/blog/scripts/backup.sh

# 异地备份（每周）
0 3 * * 0 rsync -avz ~/backups/ user@backup-server:/backups/
```

---

## 应急预案

### 场景 1：服务器宕机

**解决方案**：

1. 使用备用服务器
2. 恢复最新备份
3. 更新 DNS 指向备用服务器

### 场景 2：数据库损坏

**解决方案**：

1. 停止写入操作
2. 从最近的备份恢复
3. 重放 WAL 日志（PostgreSQL）

### 场景 3：被黑客攻击

**解决方案**：

1. 立即隔离服务器
2. 分析入侵日志
3. 修补安全漏洞
4. 从干净的备份恢复

---

## 联系支持

如果遇到部署问题，可以：

1. 查看本文档的故障排查章节
2. 查看项目 Issues
3. 查看数据库文档 `docs/database.md`
4. 查看功能文档 `docs/function.md`

---

## 附录

### 完整的 docker-compose.yml 示例

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: blog-postgres
    environment:
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: blog_password
      POSTGRES_DB: blog_db
      POSTGRES_SHARED_BUFFERS: 256MB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 2GB
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U blog_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: blog-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: blog-backend
    environment:
      DATABASE_URL: postgresql://blog_user:blog_password@postgres:5432/blog_db
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./backend:/app
    command: ./target/release/api

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: blog-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000/v1
    ports:
      - "3003:3000"
    depends_on:
      - backend
    restart: unless-stopped
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
  redis_data:
```

### 生产环境 Dockerfile

后端 `Dockerfile`:

```dockerfile
FROM rust:1.75 as builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/api /app/api
COPY --from=builder /app/migrations /app/migrations

EXPOSE 3000

CMD ["./api"]
```

前端 `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "server.js"]
```

---

**最后更新**: 2025-12-26
**维护者**: Your Name
