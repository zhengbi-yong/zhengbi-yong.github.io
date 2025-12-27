# 博客平台启动脚本说明

本项目提供了两个一键启动脚本，分别用于开发环境和生产环境。

## 脚本文件

| 脚本 | 用途 | 说明 |
|------|------|------|
| `start-dev.sh` | 开发环境 | 启动完整的开发环境 |
| `start-prod.sh` | 生产环境 | 部署生产环境 |

---

## 开发环境脚本 (`start-dev.sh`)

### 功能特点

- 🚀 自动启动所有服务（数据库 + 后端 + 前端）
- 🔄 智能检测已运行的服务，避免重复启动
- 🛠 自动创建开发环境配置文件
- 📊 实时健康检查
- 🎨 彩色输出，清晰易读
- 🧹 优雅停止（Ctrl+C）

### 使用方法

```bash
# 启动完整开发环境
./start-dev.sh

# 仅启动数据库和后端
./start-dev.sh --no-frontend

# 仅启动前端（数据库和后端已运行）
./start-dev.sh --no-backend --no-db

# 清理并重新构建
./start-dev.sh --clean

# 查看帮助
./start-dev.sh --help
```

### 启动的服务

| 服务 | 地址 | 说明 |
|------|------|------|
| Backend API | http://localhost:3000 | Rust 后端 |
| Frontend | http://localhost:3001 | Next.js 前端 |
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 缓存 |

### 开发工具链接

- Swagger UI: http://localhost:3000/swagger-ui/
- API 文档: http://localhost:3000/api-docs/openapi.json
- 健康检查: http://localhost:3000/healthz
- Prometheus 指标: http://localhost:3000/metrics

---

## 生产环境脚本 (`start-prod.sh`)

### 功能特点

- 🐳 Docker 容器化部署
- 📦 自动构建优化镜像
- 🔄 支持服务重启和状态检查
- 📝 完整的日志查看功能
- 🔒 生产环境配置检查
- 🧹 清理构建和容器

### 使用方法

```bash
# 完整部署（构建 + 启动）
./start-prod.sh deploy

# 仅启动服务（镜像已存在）
./start-prod.sh start

# 重启服务
./start-prod.sh restart

# 查看服务状态
./start-prod.sh status

# 查看日志
./start-prod.sh logs backend      # 后端日志
./start-prod.sh logs frontend     # 前端日志
./start-prod.sh logs postgres     # 数据库日志
./start-prod.sh logs redis        # Redis 日志

# 停止服务
./start-prod.sh stop

# 清理构建和容器
./start-prod.sh clean

# 部署时强制重建
./start-prod.sh deploy --force

# 无缓存构建
./start-prod.sh deploy --no-cache

# 仅构建不启动
./start-prod.sh deploy --build-only

# 查看帮助
./start-prod.sh help
```

### 命令参考

| 命令 | 说明 |
|------|------|
| `deploy` | 完整部署（构建镜像 + 启动服务） |
| `start` | 启动服务（不构建） |
| `stop` | 停止所有服务 |
| `restart` | 重启所有服务 |
| `status` | 显示服务状态 |
| `logs [service]` | 查看服务日志 |
| `clean` | 清理构建和停止的容器 |

### 服务选项

| 选项 | 说明 |
|------|------|
| `--build-only` | 仅构建镜像，不启动服务 |
| `--no-cache` | 构建时不使用缓存 |
| `--force` | 强制重新部署（停止现有服务） |
| `--dry-run` | 显示将要执行的操作，不实际执行 |

---

## 生产环境准备

### 1. 创建配置文件

**后端配置** (`backend/.env.production`):

```env
# 数据库配置
DATABASE_URL=postgresql://blog_user:blog_password@blog-postgres:5432/blog_db

# Redis 配置
REDIS_URL=redis://blog-redis:6379

# JWT 密钥（必须更改！）
JWT_SECRET=your-super-secure-jwt-key-at-least-256-bits

# 环境标识
ENVIRONMENT=production
RUST_LOG=info

# 安全配置
PASSWORD_PEPPER=your-password-pepper-here
SESSION_SECRET=your-session-secret-here

# CORS 配置（设置实际的前端域名）
CORS_ORIGIN=https://yourdomain.com

# 监控
PROMETHEUS_ENABLED=true
SENTRY_DSN=your-sentry-dsn
```

**前端配置** (`frontend/.env.production`):

```env
# 后端 API 地址
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1

# 站点 URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 2. 构建镜像

```bash
# 构建所有镜像
./start-prod.sh deploy

# 或分别构建
docker build -t blog-platform-backend:latest backend/
docker build -t blog-platform-frontend:latest frontend/
```

### 3. 部署

```bash
# 启动服务
./start-prod.sh start

# 查看状态
./start-prod.sh status
```

---

## 故障排除

### 问题：端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 终止占用端口的进程
kill -9 <PID>
```

### 问题：Docker 容器无法启动

```bash
# 查看容器日志
docker logs blog-postgres
docker logs blog-api

# 重启容器
docker restart <container_name>
```

### 问题：依赖检查失败

```bash
# 安装 Docker
# https://docs.docker.com/get-docker/

# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 pnpm
npm install -g pnpm
```

---

## 开发工作流示例

### 日常开发流程

```bash
# 1. 启动开发环境
./start-dev.sh

# 2. 开发代码...
# 修改 backend/ 或 frontend/ 中的代码

# 3. 服务会自动重新编译和热重载

# 4. 完成开发后停止
# 按 Ctrl+C
```

### 仅后端开发

```bash
# 启动后端和数据库
./start-dev.sh --no-frontend

# 在另一个终端启动前端（可选）
cd frontend && pnpm dev
```

### 生产部署流程

```bash
# 1. 确保生产配置正确
cat backend/.env.production
cat frontend/.env.production

# 2. 部署
./start-prod.sh deploy

# 3. 检查状态
./start-prod.sh status

# 4. 查看日志
./start-prod.sh logs backend

# 5. 如需重启
./start-prod.sh restart
```

---

## 更多信息

- [使用手册](./usage.md) - 完整的使用指南
- [后端 API 文档](./backend_api_usage.md) - 后端详细文档
- [项目 README](./README.md) - 项目总体说明
