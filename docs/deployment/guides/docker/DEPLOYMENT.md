# Docker 部署完整指南

本指南帮助您在本地构建所有 Docker 镜像，然后在服务器上快速部署。

## 部署架构

```
本地电脑                          服务器
┌─────────────────┐             ┌─────────────────┐
│  1. 本地构建     │             │  3. 部署运行     │
│     构建 Docker  │  推送/导出  │     拉取镜像     │
│     镜像         │ ────────►  │     启动服务     │
│                 │             │                 │
│  2. 推送镜像     │             │  4. 运行时       │
│     Docker Hub   │             │     PostgreSQL  │
│     阿里云       │             │     Redis       │
│     或导出 tar   │             │     Backend     │
└─────────────────┘             │     Frontend    │
                                │     Nginx       │
                                └─────────────────┘
```

## 前提条件

### 本地电脑
- Docker 已安装并运行
- Git 已安装
- 可选：Docker Hub 账号或阿里云容器镜像服务

### 服务器
- Docker 已安装
- Docker Compose 已安装
- 端口 80, 443, 3000, 3001, 5432, 6379 可用

## 方法一：使用镜像仓库（推荐）

适用于有网络连接的环境。

### 步骤 1：本地构建

在本地电脑上运行：

```bash
# 克隆项目（如果还没有）
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 构建所有镜像
bash build-all.sh
```

这将构建：
- `blog-backend:local` - 后端 API 镜像
- `blog-frontend:local` - 前端应用镜像
- 同时拉取所有基础镜像（postgres:17-alpine, redis:7.4-alpine, nginx:1.27-alpine）

### 步骤 2：测试镜像（可选）

```bash
# 本地测试镜像
bash test-local.sh

# 查看日志
docker compose logs -f

# 停止测试
docker compose down
mv deployments/docker/compose-files/docker-compose.yml.backup deployments/docker/compose-files/docker-compose.yml
```

### 步骤 3：推送到镜像仓库

```bash
# 推送到 Docker Hub 或阿里云
bash push-images.sh
```

脚本会提示您选择：
1. Docker Hub (https://hub.docker.com)
2. 阿里云容器镜像服务 (https://cr.console.aliyun.com)
3. 其他私有仓库

### 步骤 4：服务器部署

将项目代码上传到服务器：

```bash
# 方法 1: 使用 git
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 方法 2: 使用 rsync（只复制部署脚本）
rsync -avz --exclude='node_modules' --exclude='target' \
  /本地路径/ user@server:/远程路径/
```

在服务器上运行：

```bash
# 使用镜像仓库地址和版本号部署
bash deploy-server.sh <registry> <version>

# 示例（Docker Hub）
bash deploy-server.sh docker.io/username v1.8.2

# 示例（阿里云）
bash deploy-server.sh registry.cn-hangzhou.aliyuncs.com/namespace v1.8.2

# 如果不指定版本，默认使用 latest
bash deploy-server.sh docker.io/username
```

## 方法二：离线部署

适用于无网络或网络受限的环境。

### 步骤 1：本地构建

```bash
bash build-all.sh
```

### 步骤 2：导出镜像

```bash
# 导出所有镜像为 tar 文件
bash export-images.sh
```

这将创建 `docker-images-export/` 目录，包含：
- 所有 Docker 镜像的 tar 文件
- `import-images.sh` - 服务器端导入脚本
- `README.md` - 详细说明

### 步骤 3：上传到服务器

```bash
# 使用 scp
scp -r docker-images-export/ user@server:/path/to/project/

# 或使用 rsync
rsync -avz docker-images-export/ user@server:/path/to/project/
```

### 步骤 4：服务器部署

```bash
# 1. 导入镜像
cd docker-images-export
bash import-images.sh

# 2. 返回项目目录
cd ..

# 3. 更新 deployments/docker/compose-files/docker-compose.yml 使用本地镜像
# 编辑 deployments/docker/compose-files/docker-compose.yml，将 build 部分注释掉，添加：
# backend:
#   image: blog-backend:local
# frontend:
#   image: blog-frontend:local

# 4. 启动服务
docker compose up -d
```

## 镜像版本说明

当前使用的镜像版本（2025-12-28）：

| 服务 | 镜像 | 版本 | 说明 |
|------|------|------|------|
| PostgreSQL | postgres | 17-alpine | 最新稳定版，性能提升显著 |
| Redis | redis | 7.4-alpine | 最新稳定版，更好的性能 |
| Nginx | nginx | 1.27-alpine | 最新主线版 |
| Backend | rustlang/rust | nightly-slim | Rust 最新开发版本 |
| Frontend | node | 22-alpine | Node.js 22 LTS |

## 环境变量配置

服务器部署时，脚本会自动生成 `.env` 文件。关键配置项：

```bash
# 数据库配置
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=<自动生成>
POSTGRES_DB=blog_db

# 安全配置（必须修改！）
JWT_SECRET=<自动生成>
PASSWORD_PEPPER=<自动生成>
SESSION_SECRET=<自动生成>

# CORS 配置
CORS_ALLOWED_ORIGINS=https://zhengbi-yong.top

# 域名配置
NEXT_PUBLIC_SITE_URL=https://zhengbi-yong.top
```

⚠️ **安全警告**：生产环境必须修改所有自动生成的密钥！

## 验证部署

### 检查容器状态

```bash
docker compose ps
```

所有服务应该显示为 "Up" 或 "healthy"。

### 检查健康状态

```bash
# PostgreSQL
docker compose exec postgres pg_isready -U blog_user

# Redis
docker compose exec redis redis-cli ping

# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost:3001
```

### 查看日志

```bash
# 所有服务
docker compose logs -f

# 特定服务
docker compose logs -f backend
docker compose logs -f frontend
```

## 常见问题

### 1. 端口被占用

错误：`port is already allocated`

解决：
```bash
# 查看占用进程
lsof -i :<端口号>

# 停止占用进程
kill -9 <PID>

# 或修改 .env 中的端口配置
```

### 2. 镜像拉取失败

错误：`Error response from daemon: pull access denied`

解决：
- 确认已登录 Docker Hub：`docker login`
- 确认镜像名称正确
- 检查网络连接

### 3. 容器启动失败

```bash
# 查看详细日志
docker compose logs <service_name>

# 进入容器排查
docker compose exec backend bash
```

### 4. 内存不足

如果服务器内存较小（< 2GB），可以优化配置：

```yaml
# 在 deployments/docker/compose-files/docker-compose.yml 中添加资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

## 性能优化

### 生产环境推荐配置

| 服务 | 最小配置 | 推荐配置 |
|------|---------|---------|
| 服务器 | 2 CPU, 2GB RAM | 4 CPU, 4GB RAM |
| PostgreSQL | 512MB RAM | 1GB RAM |
| Redis | 128MB RAM | 256MB RAM |
| Backend | 256MB RAM | 512MB RAM |
| Frontend | 256MB RAM | 512MB RAM |

### 启用持久化

所有数据卷已配置：
- `postgres_data` - PostgreSQL 数据
- `redis_data` - Redis 持久化
- `nginx_logs` - Nginx 日志

数据会持久保存在 Docker volumes 中。

## 更新部署

### 更新镜像

```bash
# 本地重新构建
git pull
bash build-all.sh

# 推送新版本
bash push-images.sh

# 服务器更新
bash deploy-server.sh <registry> <new-version>
```

### 零停机更新

```bash
# 拉取新镜像
docker pull <registry>/blog-backend:<new-version>
docker pull <registry>/blog-frontend:<new-version>

# 使用新镜像启动
docker compose up -d --no-deps --build backend frontend

# 清理旧镜像
docker image prune -a
```

## 监控和维护

### 日志管理

```bash
# 查看实时日志
docker compose logs -f --tail=100

# 导出日志
docker compose logs > logs-$(date +%Y%m%d).txt
```

### 数据备份

```bash
# 备份 PostgreSQL
docker compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 备份 Redis
docker compose exec redis redis-cli SAVE
docker cp blog-redis:/data/dump.rdb ./redis-backup.rdb
```

### 清理资源

```bash
# 清理停止的容器
docker container prune -f

# 清理未使用的镜像
docker image prune -a -f

# 清理未使用的卷
docker volume prune -f
```

## 安全建议

1. **修改默认密码**：生产环境必须修改所有自动生成的密钥
2. **启用 HTTPS**：配置 SSL 证书（Let's Encrypt 推荐）
3. **限制端口**：只开放必要的端口（80, 443）
4. **定期更新**：及时更新基础镜像和依赖
5. **监控日志**：定期检查异常日志
6. **备份数据**：定期备份 PostgreSQL 和 Redis 数据

## 支持和帮助

如遇问题，请：
1. 查看日志：`docker compose logs -f`
2. 检查配置：`docker compose config`
3. 提交 Issue：https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues

## 许可证

MIT License
