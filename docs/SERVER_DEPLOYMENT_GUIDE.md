# 服务器部署指南

本文档描述如何将博客系统部署到 Ubuntu 服务器。

## 前置要求

- Ubuntu 服务器（推荐 20.04+）
- 2GB+ RAM
- 20GB+ 磁盘空间
- Docker 和 Docker Compose 已安装
- 服务器 root 或 sudo 权限

## 部署步骤

### 1. 本地构建 Docker 镜像

在本地开发机器上执行：

```bash
# 克隆项目（如果还没有）
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 构建所有 Docker 镜像
npm run build

# 导出镜像为 tar 文件
npm run export
```

这将生成 `docker-images-export/` 目录，包含所有镜像 tar 文件。

### 2. 上传镜像到服务器

```bash
# 上传镜像文件
scp -r docker-images-export/ ubuntu@your-server-ip:~/blog-deployment/

# 上传项目配置文件
cd server-setup
scp .env.production ubuntu@your-server-ip:~/blog/.env
scp docker-compose.server.yml ubuntu@your-server-ip:~/blog/docker-compose.yml
scp nginx.conf ubuntu@your-server-ip:~/blog/nginx.conf
scp site.conf ubuntu@your-server-ip:~/blog/site.conf
```

### 3. 服务器配置

SSH 登录到服务器：

```bash
ssh ubuntu@your-server-ip
```

#### 3.1 创建项目目录

```bash
mkdir -p ~/blog/nginx
cd ~/blog
```

#### 3.2 导入 Docker 镜像

```bash
cd ~/blog-deployment
bash import-images.sh
```

#### 3.3 配置防火墙

```bash
# 开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend API (可选)
sudo ufw allow 3001/tcp  # Frontend (可选)

# 启用防火墙
sudo ufw enable
```

**重要：** 在云服务商控制台配置安全组规则，开放上述端口。

#### 3.4 配置系统 Nginx

```bash
# 备份原配置
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# 复制配置文件
sudo cp ~/blog/site.conf /etc/nginx/sites-available/default

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

#### 3.5 启动服务

```bash
cd ~/blog
docker compose up -d
```

### 4. 验证部署

```bash
# 检查服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 测试访问
curl http://localhost
curl http://localhost:3000
curl http://localhost:3001
```

### 5. 配置域名和 HTTPS（可选）

#### 5.1 更新配置文件

编辑 `~/.env`：

```bash
# 更新域名
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-domain.com
```

编辑 `/etc/nginx/sites-available/default`：

```nginx
server_name your-domain.com;
```

#### 5.2 安装 SSL 证书

```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 6. 管理服务

```bash
cd ~/blog

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新镜像后重新部署
docker compose down
docker compose up -d
```

## 配置文件说明

### .env 文件

包含所有环境变量配置，重要字段：

- `JWT_SECRET`, `PASSWORD_PEPPER`, `SESSION_SECRET`: 安全密钥（必须修改）
- `CORS_ALLOWED_ORIGINS`: 允许的前端域名
- `NEXT_PUBLIC_API_URL`: 前端访问后端的 URL
- `NEXT_PUBLIC_SITE_URL`: 站点 URL

### docker-compose.yml

使用本地构建的镜像，包含以下服务：
- PostgreSQL 17
- Redis 7.4
- Backend (Rust API)
- Frontend (Next.js)

### Nginx 配置

反向代理配置：
- `/` → Frontend (localhost:3001)
- `/api` → Backend (localhost:3000)

## 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker compose logs backend
docker compose logs frontend

# 检查端口占用
sudo netstat -tlnp | grep -E '3000|3001|80|443'
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 容器
docker logs blog-postgres

# 进入容器测试
docker exec -it blog-postgres psql -U blog_user -d blog_db
```

### CORS 错误

确保 `.env` 文件中的 `CORS_ALLOWED_ORIGINS` 包含正确的域名。

### 无法从外网访问

1. 检查服务器防火墙：`sudo ufw status`
2. 检查云服务商安全组规则
3. 测试本地访问：`curl http://localhost`

## 更新部署

当有新版本时：

```bash
# 本地重新构建
npm run build
npm run export

# 上传新镜像
scp docker-images-export/blog-backend-local.tar ubuntu@your-server-ip:~/blog-deployment/
scp docker-images-export/blog-frontend-local.tar ubuntu@your-server-ip:~/blog-deployment/

# 服务器上更新
ssh ubuntu@your-server-ip
cd ~/blog-deployment
docker load -i blog-backend-local.tar
docker load -i blog-frontend-local.tar

cd ~/blog
docker compose down
docker compose up -d
```

## 安全建议

1. 修改所有默认密码和密钥
2. 使用强密码（至少 32 位随机字符串）
3. 配置 HTTPS
4. 定期更新系统和 Docker 镜像
5. 配置防火墙只开放必要端口
6. 定期备份数据库

## 备份

```bash
# 备份数据库
docker exec blog-postgres pg_dump -U blog_user blog_db > backup.sql

# 备份到本地
scp ubuntu@your-server-ip:~/blog/backup.sql ./backup/
```

## 监控

查看资源使用情况：

```bash
# 容器资源使用
docker stats

# 磁盘使用
df -h

# 内存使用
free -h
```
