# Docker 完整部署指南

本文档介绍如何使用Docker Compose一键部署整个博客系统（前端、后端、数据库、缓存、反向代理）。

## 📋 目录

- [系统架构](#系统架构)
- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [生产部署](#生产部署)
- [日常维护](#日常维护)
- [故障排查](#故障排查)

---

## 系统架构

```
┌─────────────────────────────────────────────────┐
│                   Nginx (80/443)                 │
│              反向代理 + SSL终结                   │
└─────────────┬───────────────────┬───────────────┘
              │                   │
      ┌───────▼──────┐    ┌──────▼────────┐
      │   Frontend   │    │    Backend    │
      │   Next.js    │◄───┤    Rust API   │
      │   Port 3001  │    │    Port 3000  │
      └──────────────┘    └───────┬───────┘
                                  │
                    ┌─────────────┴───────────┐
                    │                        │
              ┌─────▼─────┐          ┌──────▼────┐
              │ PostgreSQL│          │   Redis   │
              │  Port 5432│          │ Port 6379 │
              └───────────┘          └───────────┘
```

### 模块说明

| 服务 | 技术 | 端口 | 说明 |
|------|------|------|------|
| **Frontend** | Next.js 16 | 3001 | React应用，SSR模式 |
| **Backend** | Rust + Axum | 3000 | RESTful API服务 |
| **PostgreSQL** | PostgreSQL 15 | 5432 | 主数据库 |
| **Redis** | Redis 7 | 6379 | 缓存和会话存储 |
| **Nginx** | Nginx Alpine | 80/443 | 反向代理和SSL |

---

## 前置要求

### 硬件要求

- **CPU**: 2核心或以上
- **内存**: 4GB或以上
- **磁盘**: 20GB或以上

### 软件要求

- **操作系统**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+) 或 macOS/Windows with WSL2
- **Docker**: 20.10或以上
- **Docker Compose**: 2.0或以上

### 安装Docker

**Ubuntu/Debian:**
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

**macOS:**
```bash
# 使用Homebrew安装
brew install --cask docker

# 或下载安装包
# https://www.docker.com/products/docker-desktop
```

**Windows:**
```bash
# 下载Docker Desktop
# https://www.docker.com/products/docker-desktop
```

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env

# 编辑环境变量（必须修改安全配置！）
nano .env
```

**必须修改的配置:**
```bash
# 生成安全的密钥
JWT_SECRET=$(openssl rand -base64 32)
PASSWORD_PEPPER=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# 更新.env文件
sed -i "s/your_jwt_secret.*/$JWT_SECRET/" .env
sed -i "s/your_password_pepper.*/$PASSWORD_PEPPER/" .env
sed -i "s/your_session_secret.*/$SESSION_SECRET/" .env

# 设置数据库密码
sed -i "s/your_secure_postgres_password_here/$(openssl rand -base64 16)/" .env
```

### 3. 启动所有服务

```bash
# 构建并启动所有容器
docker compose up -d

# 查看启动日志
docker compose logs -f

# 等待所有服务健康（约1-2分钟）
docker compose ps
```

### 4. 验证部署

```bash
# 测试前端
curl -I http://localhost:3001

# 测试后端API
curl http://localhost:3000/v1/posts

# 测试Nginx
curl -I http://localhost
```

### 5. 访问应用

- **前端**: http://localhost 或 http://localhost:3001
- **后端API**: http://localhost:3000/v1/
- **管理面板**: http://localhost:3000/admin/

---

## 详细配置

### 端口映射

编辑`.env`文件修改端口：

```bash
# 前端端口
FRONTEND_PORT=3001

# 后端端口
BACKEND_PORT=3000

# 数据库端口（通常不暴露给外网）
POSTGRES_PORT=5432

# Redis端口（通常不暴露给外网）
REDIS_PORT=6379
```

### 域名配置

1. **DNS设置**

在你的域名提供商处添加A记录：
```
A    zhengbi-yong.top    ->    你的服务器IP
```

2. **更新环境变量**

```bash
# .env文件
NEXT_PUBLIC_SITE_URL=https://zhengbi-yong.top
CORS_ALLOWED_ORIGINS=https://zhengbi-yong.top
```

3. **重启服务**

```bash
docker compose down
docker compose up -d
```

### SSL证书配置（Let's Encrypt）

#### 方法1: 使用Certbot

```bash
# 安装Certbot
sudo apt-get install certbot python3-certbot-nginx

# 停止Nginx容器
docker compose stop nginx

# 获取证书
sudo certbot certonly --standalone \
  -d zhengbi-yong.top \
  -d www.zhengbi-yong.top

# 复制证书到项目目录
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/zhengbi-yong.top/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/zhengbi-yong.top/privkey.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/zhengbi-yong.top/chain.pem nginx/ssl/

# 设置权限
sudo chown -R $USER:$USER nginx/ssl
chmod 644 nginx/ssl/*.pem

# 启用Nginx HTTPS配置
# 编辑 nginx/conf.d/blog.conf，取消HTTPS部分的注释

# 重启Nginx
docker compose up -d nginx
```

#### 方法2: 自动续期

```bash
# 创建续期脚本
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
docker compose stop nginx
sudo certbot renew --quiet
sudo cp /etc/letsencrypt/live/zhengbi-yong.top/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/zhengbi-yong.top/privkey.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/zhengbi-yong.top/chain.pem nginx/ssl/
docker compose start nginx
EOF

chmod +x renew-ssl.sh

# 添加到crontab（每月1号凌晨3点）
crontab -e
# 添加: 0 3 1 * * /path/to/renew-ssl.sh
```

---

## 生产部署

### 服务器推荐配置

| 访问量 | CPU | 内存 | 磁盘 | 带宽 |
|--------|-----|------|------|------|
| < 1000 PV/天 | 2核 | 4GB | 40GB | 1Mbps |
| 1000-10000 PV/天 | 4核 | 8GB | 80GB | 3Mbps |
| > 10000 PV/天 | 8核 | 16GB | 160GB | 5Mbps |

### 性能优化

#### 1. 数据库优化

```bash
# 编辑 docker-compose.yml
# 添加PostgreSQL优化配置
services:
  postgres:
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "work_mem=4MB"
```

#### 2. Redis持久化

```bash
# Redis默认开启AOF持久化
# 如需调整持久化策略，编辑docker-compose.yml
services:
  redis:
    command: redis-server --appendonly yes --appendfsync everysec
```

#### 3. 前端缓存

Nginx已经配置了静态资源缓存：
- `/_next/static`: 365天
- 图片文件: 30天

#### 4. 后端连接池

后端默认使用连接池，可通过环境变量调整：
```bash
# .env
DATABASE_POOL_SIZE=10
REDIS_POOL_SIZE=10
```

### 安全加固

#### 1. 防火墙配置

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5432/tcp   # 拒绝外部访问数据库
sudo ufw deny 6379/tcp   # 拒绝外部访问Redis
sudo ufw reload
```

#### 2. Docker安全

```bash
# 创建专用Docker用户
sudo useradd -m -s /bin/bash dockeradmin
sudo usermod -aG docker dockeradmin

# 限制容器资源
# 编辑 docker-compose.yml，添加：
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

#### 3. 定期更新

```bash
# 更新镜像
docker compose pull
docker compose up -d

# 清理旧镜像
docker image prune -a
```

---

## 日常维护

### 查看日志

```bash
# 所有服务
docker compose logs -f

# 特定服务
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres

# 最近100行
docker compose logs --tail=100
```

### 服务管理

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启特定服务
docker compose restart backend

# 重新构建并启动
docker compose up -d --build

# 扩展服务（多实例）
docker compose up -d --scale backend=3
```

### 数据库管理

#### 连接数据库

```bash
# 进入PostgreSQL容器
docker compose exec postgres psql -U blog_user -d blog_db

# 备份数据库
docker compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 恢复数据库
docker compose exec -T postgres psql -U blog_user blog_db < backup.sql
```

#### 自动备份

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/blog"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker compose exec -T postgres pg_dump -U blog_user blog_db > $BACKUP_DIR/db_$DATE.sql

# 备份Redis
docker compose exec redis redis-cli --rdb /data/dump.rdb
docker cp blog-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 压缩备份
tar czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/*_$DATE.*
rm $BACKUP_DIR/*_$DATE.*

# 删除30天前的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# 添加到crontab（每天凌晨2点）
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

### 监控

#### 健康检查

```bash
# 检查所有服务状态
docker compose ps

# 检查服务健康
docker compose exec frontend curl -f http://localhost:3001 || echo "Frontend down"
docker compose exec backend curl -f http://localhost:3000/health || echo "Backend down"
```

#### 资源监控

```bash
# 容器资源使用
docker stats

# 磁盘使用
docker system df

# 查看特定服务日志
docker compose logs --tail=100 -f backend | grep ERROR
```

---

## 故障排查

### 常见问题

#### 1. 前端无法启动

**症状**: `docker compose logs frontend` 显示编译错误

**解决方案**:
```bash
# 检查环境变量
docker compose config

# 重新构建前端
docker compose build --no-cache frontend
docker compose up -d frontend

# 查看详细日志
docker compose logs frontend --tail=100
```

#### 2. 后端无法连接数据库

**症状**: `docker compose logs backend` 显示连接错误

**解决方案**:
```bash
# 检查数据库是否健康
docker compose ps postgres

# 等待数据库完全启动
docker compose logs postgres

# 手动测试连接
docker compose exec backend pg_isready -h postgres -p 5432
```

#### 3. Nginx 502错误

**症状**: 访问网站显示502 Bad Gateway

**解决方案**:
```bash
# 检查上游服务
docker compose ps
curl http://localhost:3001  # 前端
curl http://localhost:3000/v1/posts  # 后端

# 检查Nginx配置
docker compose exec nginx nginx -t

# 重启Nginx
docker compose restart nginx
```

#### 4. 内存不足

**症状**: 容器频繁重启，日志显示OOM

**解决方案**:
```bash
# 增加swap空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 限制容器内存
# 编辑docker-compose.yml，添加资源限制
```

### 日志位置

```bash
# 容器日志
docker compose logs

# Nginx访问日志
docker compose exec nginx cat /var/log/nginx/access.log

# Nginx错误日志
docker compose exec nginx cat /var/log/nginx/error.log

# PostgreSQL日志
docker compose exec postgres cat /var/log/postgresql/postgresql.log
```

### 重置系统

**警告**: 这会删除所有数据！

```bash
# 停止所有服务
docker compose down

# 删除所有卷（数据）
docker volume rm $(docker volume ls -q)

# 删除所有镜像
docker rmi $(docker images -q)

# 重新开始
docker compose up -d
```

---

## 更新与升级

### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose up -d --build

# 查看更新日志
docker compose logs -f
```

### 数据库迁移

```bash
# 后端启动时自动运行迁移
# 如需手动运行：
docker compose exec backend /app/migrate
```

### 零停机更新

```bash
# 使用滚动更新
docker compose up -d --no-deps --build backend

# 或使用蓝绿部署
# 1. 启动新版本
docker compose -p blog-new up -d
# 2. 测试新版本
curl http://localhost:3001
# 3. 切换流量
# 4. 停止旧版本
docker compose -p blog-old down
```

---

## 附录

### 目录结构

```
zhengbi-yong.github.io/
├── docker-compose.yml          # 主编排文件
├── .env.docker.example         # 环境变量模板
├── frontend/
│   ├── Dockerfile             # 前端Docker镜像
│   └── ...
├── backend/
│   ├── Dockerfile             # 后端Docker镜像
│   ├── docker-compose.yml     # 后端独立编排（可选）
│   └── ...
├── nginx/
│   ├── nginx.conf             # Nginx主配置
│   └── conf.d/
│       └── blog.conf          # 站点配置
└── docs/
    └── deployment/
        └── docker.md          # 本文档
```

### 相关文档

- [架构设计](./architecture.md)
- [单服务器部署](./single-server.md)
- [开发环境搭建](../development/getting-started.md)

### 技术支持

- **GitHub Issues**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues
- **文档**: https://zhengbi-yong.top/docs

---

**最后更新**: 2025-12-28
**作者**: Zhengbi Yong
**版本**: 1.0.0
