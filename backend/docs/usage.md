# Blog Backend API - 使用指南

本文档提供完整的启动和运行说明。

## 目录

- [前置要求](#前置要求)
- [快速启动](#快速启动)
- [详细配置](#详细配置)
- [开发模式](#开发模式)
- [生产部署](#生产部署)
- [故障排除](#故障排除)

---

## 前置要求

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|----------|----------|------|
| Rust | 1.70+ | 1.83+ | 编译运行 |
| Docker | 20.10+ | 24.0+ | 运行数据库 |
| Docker Compose | 2.0+ | 2.20+ | 服务编排 |

### 可选软件

- **sqlx-cli**: 数据库迁移工具
- **cargo-watch**: 热重载开发

---

## 快速启动

### 1. 启动数据库服务

```bash
# 在项目根目录执行
cd /home/sisyphus/zhengbi-yong.github.io/backend

# 启动 PostgreSQL 和 Redis
docker compose up -d postgres redis

# 验证服务状态
docker compose ps
```

预期输出：
```
NAME                IMAGE              STATUS
blog-postgres       postgres:15-alpine Up
blog-redis          redis:7-alpine     Up
```

### 2. 验证数据库连接

```bash
# 检查 PostgreSQL 是否就绪
docker exec blog-postgres pg_isready -U blog_user -d blog_db
```

预期输出：
```
/var/run/postgresql:5432 - accepting connections
```

### 3. 编译项目

```bash
# 确保 PostgreSQL 正在运行（SQLx 需要连接数据库进行编译时检查）
SQLX_OFFLINE=false cargo build
```

### 4. 运行服务器

```bash
# 开发模式运行
cargo run
```

服务器将在 `http://127.0.0.1:3000` 启动。

### 5. 验证服务

```bash
# 健康检查
curl http://localhost:3000/healthz

# 预期输出: {"status":"ok"}

# 查看 Swagger 文档
open http://localhost:3000/swagger-ui/
```

---

## 详细配置

### 环境变量

项目使用 `.env` 文件配置。关键配置项：

```bash
# 数据库配置
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis 配置
REDIS_URL=redis://localhost:6379

# JWT 密钥 (生产环境必须更改)
JWT_SECRET=dev-secret-key-for-testing-only

# 服务器配置
HOST=127.0.0.1
PORT=3000

# 日志级别
RUST_LOG=debug  # 开发环境用 debug，生产环境用 info

# 环境标识
ENVIRONMENT=development

# CORS 配置
CORS_ORIGIN=http://localhost:3000
```

### 数据库迁移

首次运行需要执行数据库迁移：

```bash
# 方式一：通过 cargo 自动执行（推荐）
# 迁移会在首次启动时自动运行

# 方式二：手动执行
sqlx migrate run
```

### 数据库结构

迁移文件位于 `migrations/` 目录：

```
migrations/
├── 001_initial.sql              # 初始表结构
├── 0002_fix_column_names.sql    # 修复列名
└── 0003_fix_post_likes_column.sql # 修复点赞字段
```

---

## 开发模式

### 热重载开发

安装 `cargo-watch` 实现代码变更时自动重新编译：

```bash
# 安装 cargo-watch
cargo install cargo-watch

# 启动热重载
cargo watch -x run
```

### 运行测试

```bash
# 运行所有测试
cargo test

# 运行特定测试
cargo test test_login

# 显示测试输出
cargo test -- --nocapture

# 运行测试并显示详细信息
cargo test -- --show-output
```

### 代码检查

```bash
# 快速检查（不构建）
cargo check

# Clippy 代码检查
cargo clippy -- -D warnings

# 格式化代码
cargo fmt

# 格式化检查
cargo fmt -- --check
```

### API 测试

#### 使用 curl

```bash
# 注册用户
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'

# 登录
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 获取当前用户（需要 JWT token）
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 使用 Postman

导入 `docs/Blog_API.postman_collection.json` 到 Postman。

---

## 生产部署

### 构建优化版本

```bash
# 构建发布版本
cargo build --release

# 二进制文件位置
ls -lh target/release/api
```

### 使用 Docker 部署

```bash
# 构建镜像
docker build -t blog-api:latest .

# 运行容器
docker run -d \
  --name blog-api \
  -p 3000:3000 \
  --env-file .env.production \
  --link blog-postgres:postgres \
  --link blog-redis:redis \
  blog-api:latest
```

### 使用 Docker Compose 部署

```bash
# 启动所有服务
docker compose -f docker-compose.prod.yml up -d

# 查看日志
docker compose -f docker-compose.prod.yml logs -f api
```

### 生产环境配置

创建 `.env.production`：

```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@postgres:5432/blog_db

# Redis 配置
REDIS_URL=redis://redis:6379

# JWT 密钥（必须使用强随机密钥）
JWT_SECRET=your-super-secure-jwt-key-at-least-256-bits

# 环境标识
ENVIRONMENT=production
RUST_LOG=info

# CORS（配置实际的前端域名）
CORS_ORIGIN=https://yourdomain.com

# 安全配置
PASSWORD_PEPPER=your-password-pepper
SESSION_SECRET=your-session-secret

# 监控
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_ENABLED=true
```

### 性能优化

```bash
# 启用所有 CPU 优化
RUSTFLAGS="-C target-cpu=native" cargo build --release

# 使用 LLD 链接器（Linux）
RUSTFLAGS="-C link-arg=-fuse-ld=lld" cargo build --release
```

---

## 故障排除

### 问题 1: 数据库连接失败

**错误信息**: `Connection refused`

**解决方案**:
```bash
# 确认数据库正在运行
docker compose ps

# 重启数据库
docker compose restart postgres

# 检查数据库日志
docker compose logs postgres
```

### 问题 2: SQLx 编译时验证失败

**错误信息**: `error communicating with database`

**解决方案**:
```bash
# 方式一：确保数据库正在运行
docker compose up -d postgres

# 方式二：使用离线模式（需要预先生成 sqlx-data.json）
SQLX_OFFLINE=true cargo build
```

### 问题 3: Redis 连接失败

**错误信息**: `Redis connection error`

**解决方案**:
```bash
# 检查 Redis 状态
docker compose ps redis

# 测试 Redis 连接
docker exec -it blog-redis redis-cli ping
```

### 问题 4: 端口已被占用

**错误信息**: `Address already in use (os error 98)`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 或使用 netstat
netstat -tulpn | grep 3000

# 终止进程
kill -9 <PID>

# 或更改 .env 中的端口
PORT=3001
```

### 问题 5: 权限错误

**错误信息**: `Permission denied`

**解决方案**:
```bash
# 确保有正确的文件权限
chmod +x setup.sh

# 或使用 sudo
sudo cargo run
```

### 问题 6: 依赖冲突

**错误信息**: `package X depends on package Y with version mismatch`

**解决方案**:
```bash
# 清理并重新构建
cargo clean

# 更新依赖
cargo update

# 重新构建
cargo build
```

---

## 日志和调试

### 查看日志

```bash
# 开发模式日志输出到控制台
cargo run

# 设置日志级别
RUST_LOG=debug cargo run
RUST_LOG=info cargo run
RUST_LOG=error cargo run

# 只显示特定模块的日志
RUST_LOG=blog_api=debug cargo run
```

### Prometheus 指标

访问 `http://localhost:3000/metrics` 查看：

- `http_requests_total` - HTTP 请求总数
- `http_request_duration_seconds` - 请求耗时
- `active_connections` - 活跃连接数
- `database_connections_active` - 数据库连接数
- `redis_connections_active` - Redis 连接数

---

## 常用命令

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart api

# 进入数据库容器
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 进入 Redis 容器
docker exec -it blog-redis redis-cli

# 构建项目
cargo build

# 运行项目
cargo run

# 运行测试
cargo test

# 代码检查
cargo clippy

# 格式化代码
cargo fmt
```

---

## API 端点参考

### 健康检查

| 端点 | 方法 | 描述 |
|------|------|------|
| `/healthz` | GET | 基本健康检查 |
| `/healthz/detailed` | GET | 详细健康检查 |
| `/readyz` | GET | 就绪检查 |
| `/metrics` | GET | Prometheus 指标 |

### 认证

| 端点 | 方法 | 描述 |
|------|------|------|
| `/v1/auth/register` | POST | 用户注册 |
| `/v1/auth/login` | POST | 用户登录 |
| `/v1/auth/refresh` | POST | 刷新令牌 |
| `/v1/auth/logout` | POST | 用户登出 |
| `/v1/auth/me` | GET | 获取当前用户 |

### 文章

| 端点 | 方法 | 描述 |
|------|------|------|
| `/v1/posts/:slug/stats` | GET | 获取文章统计 |
| `/v1/posts/:slug/view` | POST | 记录浏览 |
| `/v1/posts/:slug/like` | POST | 点赞文章 |
| `/v1/posts/:slug/like` | DELETE | 取消点赞 |

### 评论

| 端点 | 方法 | 描述 |
|------|------|------|
| `/v1/posts/:slug/comments` | GET | 获取评论列表 |
| `/v1/posts/:slug/comments` | POST | 创建评论 |
| `/v1/comments/:id/like` | POST | 点赞评论 |

---

## 更多资源

- [API 文档](http://localhost:3000/swagger-ui/)
- [README.md](../README.md)
- [Postman Collection](./Blog_API.postman_collection.json)
