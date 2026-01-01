# 博客系统完整测试指南

> **目标**: 这是一份检查手册式的测试指南，从头到尾运行一遍后能够确保整个系统正常工作
>
> **测试环境**: 前端和后端部署在同一服务器或开发电脑上
>
> **支持系统**: Linux, macOS, Windows

---

## 目录

1. [环境准备](#1-环境准备)
2. [依赖检查与安装](#2-依赖检查与安装)
3. [环境配置](#3-环境配置)
4. [Docker 方式测试（推荐）](#4-docker-方式测试推荐)
5. [本地开发方式测试](#5-本地开发方式测试)
6. [健康检查验证](#6-健康检查验证)
7. [功能测试](#7-功能测试)
8. [测试清理](#8-测试清理)
9. [常见问题排查](#9-常见问题排查)

---

## 1. 环境准备

### 1.1 系统要求

#### 最低硬件要求
- CPU: 2 核心以上
- 内存: 4GB 以上（推荐 8GB）
- 磁盘: 10GB 可用空间

#### 操作系统支持
- **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+, Arch Linux
- **macOS**: 11.0+ (Big Sur)
- **Windows**: 10/11 with WSL2（推荐）或 Windows Terminal

---

## 2. 依赖检查与安装

### 2.1 Docker 和 Docker Compose（所有系统通用）

#### 检查版本
```bash
docker --version          # 应该 >= 20.10
docker compose version    # 应该 >= 2.0
```

#### Linux 安装
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

#### macOS 安装
```bash
# 使用 Homebrew
brew install --cask docker

# 或下载 Docker Desktop for Mac
# https://www.docker.com/products/docker-desktop
```

#### Windows 安装
```bash
# 下载 Docker Desktop for Windows
# https://www.docker.com/products/docker-desktop

# 确保 WSL2 后端已启用
wsl --install
```

---

### 2.2 本地开发依赖（可选，不使用 Docker 时需要）

#### 2.2.1 Rust 工具链（后端）

**检查版本**
```bash
rustc --version           # 应该 >= 1.75
cargo --version
```

**安装（所有系统）**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

#### 2.2.2 Node.js 和 pnpm（前端）

**检查版本**
```bash
node --version            # 应该 >= 20.0
pnpm --version            # 应该 >= 8.0
```

**安装**

**Linux/macOS**
```bash
# 安装 Node.js（使用 fnm）
curl -fsSL https://fnm.vercel.app | bash
fnm install 20
fnm use 20

# 安装 pnpm
npm install -g pnpm
```

**Windows**
```bash
# 下载 Node.js 安装器
# https://nodejs.org/

# 安装 pnpm
npm install -g pnpm
```

#### 2.2.3 PostgreSQL 和 Redis（本地开发）

**使用 Docker（推荐）**
```bash
# 启动 PostgreSQL
docker run -d \
  --name blog-postgres-local \
  -e POSTGRES_USER=blog_user \
  -e POSTGRES_PASSWORD=blog_password \
  -e POSTGRES_DB=blog_db \
  -p 5432:5432 \
  postgres:17-alpine

# 启动 Redis
docker run -d \
  --name blog-redis-local \
  -p 6379:6379 \
  redis:7.4-alpine
```

**或使用系统包管理器（不推荐）**

**Linux**
```bash
# Ubuntu/Debian
sudo apt install postgresql redis-server

# macOS
brew install postgresql redis
brew services start postgresql redis
```

**Windows**
- 下载 PostgreSQL 安装器：https://www.postgresql.org/download/windows/
- 下载 Redis for Windows：https://github.com/microsoftarchive/redis/releases

---

## 3. 环境配置

### 3.1 创建环境变量文件

#### 复制示例配置
```bash
# 从项目根目录
cp .env.docker.example .env
```

#### 生成安全密钥

**Linux/macOS**
```bash
# 生成三个安全密钥
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 32   # PASSWORD_PEPPER
openssl rand -base64 32   # SESSION_SECRET
```

**Windows（PowerShell）**
```powershell
# 生成随机密钥
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

#### 编辑 .env 文件

**必需配置（最小化）**
```env
# 数据库
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=blog_password          # 生产环境请修改
POSTGRES_DB=blog_db
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# 后端
BACKEND_PORT=3000
RUST_LOG=info

# 安全密钥（必须修改！）
JWT_SECRET=your_generated_jwt_secret_here
PASSWORD_PEPPER=your_generated_pepper_here
SESSION_SECRET=your_generated_session_secret_here

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001

# 前端
FRONTEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/v1
NEXT_PUBLIC_USE_API=true
```

**完整配置（生产环境）**
```env
# 包含上述最小配置，加上：

# 邮件（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com

# 监控
PROMETHEUS_ENABLED=true
ENVIRONMENT=production
```

---

## 4. Docker 方式测试（推荐）

> **适用场景**: 快速验证系统功能，不进行开发

### 4.1 启动所有服务

```bash
# 进入项目根目录
cd /path/to/zhengbi-yong.github.io

# 启动核心服务（PostgreSQL + Redis + Backend + Frontend）
docker compose up -d

# 查看启动日志
docker compose logs -f

# 等待所有服务健康（约 1-2 分钟）
# 按 Ctrl+C 退出日志查看
```

### 4.2 检查容器状态

```bash
# 查看所有容器状态
docker compose ps

# 预期输出：
# NAME              STATUS              PORTS
# blog-backend      Up (healthy)        0.0.0.0:3000->3000/tcp
# blog-frontend     Up (healthy)        0.0.0.0:3001->3001/tcp
# blog-postgres     Up (healthy)        0.0.0.0:5432->5432/tcp
# blog-redis        Up (healthy)        0.0.0.0:6379->6379/tcp
```

**状态检查清单**
- [ ] 所有容器 STATUS 为 "Up (healthy)"
- [ ] 所有端口正确映射
- [ ] 没有重启次数异常（restart count > 3）

### 4.3 运行数据库迁移

**重要提示**：

- ✅ **生产环境**（默认）：迁移会在容器启动时**自动运行**
- 🔧 **开发环境**：使用 cargo 命令手动运行迁移（用于调试）

#### 方式1：生产环境（默认，推荐）

```bash
# 启动服务（迁移会自动运行）
docker compose up -d

# 验证迁移已运行
docker compose logs backend | grep "Database migrations completed"

# 预期输出：
# Database migrations completed
```

#### 方式2：开发环境（需要 cargo）

```bash
# 启动开发环境后端
docker compose -f deployments/docker/compose-files/docker-compose.yml -f docker-compose.dev.yml up -d backend

# 进入容器
docker compose exec backend bash

# 在容器内运行迁移
cargo run --bin api -- migrate

# 或使用 Makefile（推荐）
make dev-migrate
```

**验证迁移成功**：

```bash
# 检查数据库表
docker compose exec postgres psql -U blog_user -d blog_db -c "\dt"

# 预期输出：应该看到 17 个表（users, posts, comments 等）
```

### 4.4 创建管理员账户

**生产环境**（使用二进制文件）：

```bash
# 在后端容器中（生产环境）
docker compose exec backend /usr/local/bin/create_admin

# 按提示输入：
# Email: admin@example.com
# Username: admin
# Password: (输入安全密码)
```

**开发环境**（使用 cargo）：

```bash
# 使用 Makefile（推荐）
make dev-create-admin

# 或手动执行
docker compose -f deployments/docker/compose-files/docker-compose.yml -f docker-compose.dev.yml exec backend cargo run --bin create_admin
```

---

## 5. 本地开发方式测试

> **适用场景**: 前后端开发，需要热重载和调试

### 5.1 启动数据库服务

```bash
# 仅启动 PostgreSQL 和 Redis


# 验证数据库连接
docker compose exec postgres pg_isready -U blog_user -d blog_db
# 预期输出：/var/run/postgresql:5432 - accepting connections

# 验证 Redis 连接
docker compose exec redis redis-cli ping
# 预期输出：PONG
```

### 5.2 配置本地环境变量

#### 后端环境变量

创建 `backend/.env`:
```env
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379
HOST=127.0.0.1
PORT=3000
RUST_LOG=debug
JWT_SECRET=your_jwt_secret_at_least_32_characters
PASSWORD_PEPPER=your_password_pepper_at_least_32_characters
SESSION_SECRET=your_session_secret_at_least_32_characters
ENVIRONMENT=development
CORS_ALLOWED_ORIGINS=http://localhost:3001
RATE_LIMIT_PER_MINUTE=1000
```

#### 前端环境变量

创建 `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/v1
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_DISABLE_SW=true
```

### 5.3 启动后端服务

```bash
# 进入后端目录
cd backend

# 方式1：使用 Makefile
make run

# 方式2：直接使用 Cargo
cargo run --bin api

# 预期输出：
# 🚀 Server starting on 127.0.0.1:3000
# 📚 OpenAPI docs available at /swagger-ui/
# ✅ Database connected
# ✅ Redis connected
```

**验证后端启动**（新终端）:
```bash
curl http://localhost:3000/health

# 预期输出（JSON）：
# {"status":"healthy","timestamp":"...","version":"1.8.3",...}
```

### 5.4 运行数据库迁移

```bash
# 在后端目录下，新终端
cd backend

# 方式1：使用 Makefile
make db-migrate

# 方式2：直接运行
cargo run --bin api -- migrate

# 预期输出：
# 🗄️ Running migrations...
# ✅ Migration 0001_initial.sql applied
# ✅ Migration 0002_fix_column_names.sql applied
# ...
```

### 5.5 创建管理员账户

```bash
# 在后端目录下
cargo run --bin create_admin

# 输入：
# Email: admin@test.com
# Username: admin
# Password: Test123!@#
# Confirm: Test123!@#

# 预期输出：✅ Admin user created successfully!
```

### 5.6 启动前端服务

```bash
# 新终端，进入前端目录
cd frontend

# 安装依赖（首次）
pnpm install

# 启动开发服务器
pnpm dev
# 或使用 Makefile
make dev

# 预期输出：
# ▲ Next.js 16.0.10
# - Local:        http://localhost:3001
# - Environments: .env.local
# ✓ Ready in 2.3s
```

**验证前端启动**（浏览器）:
- 访问: http://localhost:3001
- 应该能看到博客首页

---

## 6. 健康检查验证

### 6.1 后端健康检查

#### 基础健康检查
```bash
curl http://localhost:3000/health | jq

# 预期输出：
# {
#   "status": "healthy",
#   "timestamp": "2025-12-31T...",
#   "version": "1.8.3",
#   "uptime_seconds": 123,
#   "services": {}
# }
```

#### 详细健康检查
```bash
curl http://localhost:3000/health/detailed | jq

# 预期输出：
# {
#   "status": "healthy",
#   "timestamp": "...",
#   "version": "1.8.3",
#   "environment": "development",
#   "services": {
#     "database": {
#       "status": "healthy",
#       "response_time_ms": 5
#     },
#     "redis": {
#       "status": "healthy",
#       "response_time_ms": 2
#     },
#     "jwt": { "status": "healthy" },
#     "email": { "status": "disabled" }
#   }
# }
```

#### 就绪检查
```bash
curl http://localhost:3000/readyz

# 预期输出：✅ All services are ready
# HTTP 状态码：200
```

### 6.2 数据库连接检查

```bash
# 使用 Docker Compose
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT version();"

# 或使用 make（需要先进入后端目录）
cd backend && make db-shell

# 在 psql 提示符下执行
\dt                    # 列出所有表
# 预期输出：包含 users, posts, comments, tags, categories 等表

SELECT COUNT(*) FROM users;
# 预期输出：至少 1 个管理员用户
```

### 6.3 Redis 连接检查

```bash
# 使用 Docker Compose
docker compose exec redis redis-cli INFO server

# 或直接连接
docker compose exec redis redis-cli PING
# 预期输出：PONG

# 检查键数量
docker compose exec redis redis-cli DBSIZE
```

### 6.4 前端服务检查

```bash
# 检查前端是否响应
curl -I http://localhost:3001

# 预期输出：
# HTTP/1.1 200 OK
# Content-Type: text/html
```

**浏览器检查清单**
- [ ] 首页正常显示
- [ ] 导航菜单可点击
- [ ] 博客列表页面显示
- [ ] 无 JavaScript 错误（打开浏览器控制台）

---

## 7. 功能测试

### 7.1 API 端点测试

#### 测试工具
```bash
# 安装 jq（用于格式化 JSON 输出）
# Linux
sudo apt install jq          # Ubuntu/Debian
sudo yum install jq          # CentOS/RHEL

# macOS
brew install jq

# Windows（使用 Chocolatey）
choco install jq
```

#### 1. 用户注册和登录

```bash
# 注册新用户
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "TestPass123!@#"
  }' | jq

# 预期输出：
# {
#   "message": "User registered successfully",
#   "user": { "id": "...", "email": "...", "username": "..." }
# }

# 登录
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!@#"
  }' | jq

# 预期输出：
# {
#   "access_token": "eyJ...",
#   "refresh_token": "eyJ...",
#   "user": { ... }
# }

# 保存 access_token 到环境变量
export TOKEN="eyJ..."  # Linux/macOS
set TOKEN=eyJ...       # Windows CMD
$env:TOKEN="eyJ..."    # Windows PowerShell
```

#### 2. 获取当前用户信息

```bash
curl http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq

# 预期输出：当前用户的详细信息
```

#### 3. 文章列表

```bash
curl http://localhost:3000/v1/posts | jq

# 预期输出：文章列表数组
```

#### 4. 搜索功能

```bash
curl "http://localhost:3000/v1/search?q=robotics" | jq

# 预期输出：包含 "robotics" 关键词的文章列表
```

### 7.2 前端功能测试

#### 浏览器测试步骤

1. **首页测试**
   - [ ] 访问 http://localhost:3001
   - [ ] 检查页面标题和元数据
   - [ ] 检查导航栏链接
   - [ ] 检查页脚信息

2. **博客列表测试**
   - [ ] 点击导航栏的 "Blog" 链接
   - [ ] 验证文章列表显示
   - [ ] 检查分页功能（如果有）
   - [ ] 检查搜索框功能

3. **文章详情测试**
   - [ ] 点击任意文章标题
   - [ ] 验证文章内容正确渲染
   - [ ] 检查 MDX 内容（代码高亮、数学公式等）
   - [ ] 检查阅读进度条（如果启用）

4. **认证功能测试**
   - [ ] 点击登录按钮
   - [ ] 使用管理员账户登录
   - [ ] 验证登录后状态变化
   - [ ] 尝试登出

5. **管理后台测试**（需要管理员权限）
   - [ ] 访问 /admin 路径
   - [ ] 验证管理员仪表盘
   - [ ] 检查文章管理功能
   - [ ] 检查评论审核功能

### 7.3 OpenAPI 文档测试

```bash
# 访问 Swagger UI
open http://localhost:3000/swagger-ui/

# 或下载 OpenAPI 规范
curl http://localhost:3000/api-docs/openapi.json -o openapi.json
```

**验证清单**
- [ ] Swagger UI 页面可访问
- [ ] 所有 API 端点已列出
- [ ] 可以尝试 API 调用
- [ ] 模型定义正确

### 7.4 性能监控测试（可选）

```bash
# 启动监控服务
docker compose --profile monitoring up -d prometheus grafana

# 访问 Prometheus
open http://localhost:9090

# 访问 Grafana
open http://localhost:3002
# 默认登录：admin/admin
```

**验证清单**
- [ ] Prometheus 抓取后端指标
- [ ] Grafana 仪表盘显示数据
- [ ] 查询 `/metrics` 端点
```bash
curl http://localhost:3000/metrics
```

---

## 8. 测试清理

### 8.1 停止 Docker 服务

```bash
# 停止所有服务
docker compose down

# 停止并删除卷（会清除数据库数据！）
docker compose down -v

# 停止监控服务
docker compose --profile monitoring down

# 查看容器日志（如果有问题）
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
docker compose logs redis
```

### 8.2 清理本地开发环境

```bash
# 清理前端构建
cd frontend
make clean
# 或手动删除
rm -rf .next out node_modules/.cache

# 清理后端构建
cd backend
make clean
# 或手动删除
cargo clean
```

### 8.3 重置数据库（谨慎使用）

```bash
# 删除所有数据
docker compose down -v

# 重新启动
docker compose up -d postgres redis

# 重新运行迁移
docker compose exec backend cargo run --bin api -- migrate

# 重新创建管理员
docker compose exec backend cargo run --bin create_admin
```

---

## 9. 常见问题排查

### 9.1 端口冲突

**问题**: `Error: listen tcp 0.0.0.0:3000: bind: address already in use`

**解决方案**:

**Linux/macOS**
```bash
# 查找占用端口的进程
lsof -i :3000    # 后端
lsof -i :3001    # 前端
lsof -i :5432    # PostgreSQL
lsof -i :6379    # Redis

# 终止进程
kill -9 <PID>

# 或修改 .env 文件中的端口配置
```

**Windows**
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程
taskkill /PID <PID> /F
```

### 9.2 数据库连接失败

**问题**: `Connection refused: postgresql://...`

**检查清单**:
```bash
# 1. 检查 PostgreSQL 是否运行
docker compose ps postgres

# 2. 检查数据库健康状态
docker compose exec postgres pg_isready -U blog_user

# 3. 检查环境变量
echo $DATABASE_URL  # 应该包含正确的连接信息

# 4. 检查网络连接
docker compose exec backend ping postgres
```

### 9.3 Redis 连接失败

**问题**: `Connection refused: redis://...`

**检查清单**:
```bash
# 1. 检查 Redis 是否运行
docker compose ps redis

# 2. 测试 Redis 连接
docker compose exec redis redis-cli ping

# 3. 检查 Redis 日志
docker compose logs redis
```

### 9.4 前端构建失败

**问题**: `Module not found` 或 `Cannot resolve dependency`

**解决方案**:
```bash
# 清理缓存
cd frontend
rm -rf node_modules .next pnpm-lock.yaml
pnpm store prune

# 重新安装依赖
pnpm install

# 检查 Node.js 版本
node --version  # 应该 >= 20.0

# 如果仍有问题，尝试重新生成 API 类型
pnpm generate:api-types
```

### 9.5 后端编译失败

**问题**: `error: linking with cc failed` 或 Rust 编译错误

**解决方案**:
```bash
# 安装系统依赖
# Ubuntu/Debian
sudo apt install build-essential pkg-config libssl-dev

# macOS
xcode-select --install

# Fedora/CentOS
sudo dnf install gcc openssl-devel

# 清理构建
cd backend
cargo clean

# 重新构建
cargo build
```

### 9.6 Docker 镜像拉取失败

**问题**: `Error: image not found` 或网络超时

**解决方案**:
```bash
# 配置 Docker 镜像加速器（中国用户）
# 编辑 /etc/docker/daemon.json（Linux）
# 或 Docker Desktop 设置（macOS/Windows）

{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}

# 重启 Docker
sudo systemctl restart docker  # Linux
# 或重启 Docker Desktop（macOS/Windows）

# 手动拉取镜像
docker pull postgres:17-alpine
docker pull redis:7.4-alpine
docker pull rustlang/rust:nightly-slim
docker pull node:20-alpine
```

### 9.7 CORS 错误

**问题**: 浏览器控制台显示 `Access-Control-Allow-Origin` 错误

**解决方案**:
```bash
# 检查 CORS_ALLOWED_ORIGINS 配置
grep CORS .env

# 确保前端 URL 在允许列表中
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# 重启后端服务
docker compose restart backend
```

### 9.8 JWT Token 无效

**问题**: `Invalid token` 或 `401 Unauthorized`

**检查清单**:
```bash
# 1. 检查 JWT_SECRET 是否一致
grep JWT_SECRET .env
grep JWT_SECRET backend/.env

# 2. 检查 token 是否过期（默认 1 小时）
# 在后端日志中查找错误
docker compose logs backend | grep -i jwt

# 3. 使用刷新令牌获取新 access token
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<your_refresh_token>"}'
```

---

## 10. 测试记录表

### 10.1 环境信息

| 项目 | 值 | 备注 |
|------|-----|------|
| 操作系统 | Linux / macOS / Windows | 版本：__________ |
| Docker 版本 | __.__.__ | |
| Docker Compose 版本 | __.__.__ | |
| Rust 版本 | __.__.__ | （如使用本地开发）|
| Node.js 版本 | __.__.__ | （如使用本地开发）|
| pnpm 版本 | __.__.__ | （如使用本地开发）|

### 10.2 服务启动检查表

| 服务 | 状态 | 端口 | 健康检查 | 备注 |
|------|------|------|----------|------|
| PostgreSQL | ✅ / ❌ | 5432 | ✅ / ❌ | |
| Redis | ✅ / ❌ | 6379 | ✅ / ❌ | |
| Backend | ✅ / ❌ | 3000 | ✅ / ❌ | |
| Frontend | ✅ / ❌ | 3001 | ✅ / ❌ | |
| Prometheus (可选) | ✅ / ❌ | 9090 | - | |
| Grafana (可选) | ✅ / ❌ | 3002 | - | |

### 10.3 功能测试检查表

| 功能模块 | 测试项 | 结果 | 备注 |
|----------|--------|------|------|
| **后端 API** | /health 端点 | ✅ / ❌ | |
| | /health/detailed 端点 | ✅ / ❌ | |
| | /readyz 端点 | ✅ / ❌ | |
| | /metrics 端点 | ✅ / ❌ | |
| | /swagger-ui/ 文档 | ✅ / ❌ | |
| | 用户注册 | ✅ / ❌ | |
| | 用户登录 | ✅ / ❌ | |
| | 获取用户信息 | ✅ / ❌ | |
| | 文章列表 | ✅ / ❌ | |
| | 搜索功能 | ✅ / ❌ | |
| **前端页面** | 首页加载 | ✅ / ❌ | |
| | 博客列表 | ✅ / ❌ | |
| | 文章详情 | ✅ / ❌ | |
| | MDX 内容渲染 | ✅ / ❌ | |
| | 登录/登出 | ✅ / ❌ | |
| | 管理后台 | ✅ / ❌ | |
| **数据库** | 表结构完整 | ✅ / ❌ | |
| | 迁移成功 | ✅ / ❌ | |
| | 管理员账户创建 | ✅ / ❌ | |

---

## 11. 快速测试命令（速查表）

### Docker 方式

```bash
# 1. 完整启动
docker compose up -d && docker compose logs -f

# 2. 运行迁移
docker compose exec backend cargo run --bin api -- migrate

# 3. 创建管理员
docker compose exec backend cargo run --bin create_admin

# 4. 健康检查
curl http://localhost:3000/health | jq
curl http://localhost:3000/health/detailed | jq

# 5. 访问前端
open http://localhost:3001  # macOS
xdg-open http://localhost:3001  # Linux
start http://localhost:3001  # Windows

# 6. 停止服务
docker compose down
```

### 本地开发方式

```bash
# 1. 启动数据库
docker compose up -d postgres redis

# 2. 启动后端（终端1）
cd backend && make run

# 3. 运行迁移（终端2）
cd backend && make db-migrate

# 4. 创建管理员（终端3）
cd backend && cargo run --bin create_admin

# 5. 启动前端（终端4）
cd frontend && make dev

# 6. 测试
curl http://localhost:3000/health | jq
open http://localhost:3001

# 7. 清理
docker compose down
```

---

## 12. 测试成功标准

✅ **系统正常运行的所有条件**:

1. **基础设施层**
   - [ ] Docker 容器全部健康运行
   - [ ] PostgreSQL 接受连接并包含完整表结构
   - [ ] Redis 响应 PING 命令

2. **后端服务**
   - [ ] HTTP 服务监听 3000 端口
   - [ ] /health 返回 "healthy" 状态
   - [ ] /health/detailed 显示所有子服务健康
   - [ ] Swagger UI 可访问
   - [ ] 至少创建了一个管理员用户

3. **前端服务**
   - [ ] HTTP 服务监听 3001 端口
   - [ ] 首页正常渲染
   - [ ] 浏览器控制台无 JavaScript 错误
   - [ ] 可以访问博客列表和文章详情

4. **集成测试**
   - [ ] 可以注册新用户
   - [ ] 可以登录并获取 token
   - [ ] 前端可以调用后端 API
   - [ ] 文章内容正确显示

---

## 附录 A: 配置文件路径

```
项目根目录/
├── .env                           # Docker 环境变量
├── .env.docker.example            # 环境变量模板
├── deployments/docker/compose-files/docker-compose.yml             # Docker 编排配置
├── Makefile                       # 根目录 Makefile
├── backend/
│   ├── .env                       # 后端本地环境变量
│   ├── Makefile                   # 后端 Makefile
│   ├── Cargo.toml                 # Rust 依赖配置
│   └── migrations/                # 数据库迁移文件
└── frontend/
    ├── .env.local                 # 前端本地环境变量
    ├── Makefile                   # 前端 Makefile
    ├── package.json               # Node.js 依赖配置
    └── next.config.js             # Next.js 配置
```

---

## 附录 B: 有用的调试命令

```bash
# 查看容器资源使用
docker stats

# 查看后端日志（实时）
docker compose logs -f backend

# 查看数据库日志
docker compose logs postgres | tail -100

# 进入容器调试
docker compose exec backend bash
docker compose exec postgres sh
docker compose exec redis sh

# 测试数据库连接
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT 1;"

# 测试 Redis 连接
docker compose exec redis redis-cli INFO

# 查看网络配置
docker network inspect zhengbi-yong-github-io_blog-network

# 重建镜像（无缓存）
docker compose build --no-cache

# 完全清理并重建
docker compose down -v
docker compose up -d --force-recreate
```

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-31
**适用项目版本**: v1.8.3+

---

## 快速参考

**最快速的测试方式**（5分钟验证）:
```bash
# 1. 一键启动
docker compose up -d

# 2. 等待健康检查（约1-2分钟）
docker compose ps

# 3. 运行迁移
docker compose exec backend cargo run --bin api -- migrate

# 4. 测试
curl http://localhost:3000/health && open http://localhost:3001
```

**如果一切正常，你应该看到**:
- ✅ 所有容器状态为 "Up (healthy)"
- ✅ 健康检查返回 `{"status":"healthy",...}`
- ✅ 浏览器显示博客首页
- 🎉 **恭喜！系统运行正常！**
