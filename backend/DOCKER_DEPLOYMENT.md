# Docker 部署指南

本指南将帮助你使用 Docker 部署博客后端 API。

## 目录

1. [快速开始](#快速开始)
2. [开发环境](#开发环境)
3. [生产环境](#生产环境)
4. [环境变量配置](#环境变量配置)
5. [Docker 命令参考](#docker-命令参考)
6. [故障排除](#故障排除)

## 快速开始

### 开发环境快速启动

```bash
# 克隆项目
git clone <your-repo-url>
cd blog-backend

# 启动开发环境（包含热重载）
make quick-start
```

### 生产环境快速启动

```bash
# 1. 配置环境变量
cp .env.production .env
# 编辑 .env 文件，设置安全的密码和密钥

# 2. 启动生产环境
make quick-prod
```

## 开发环境

### 启动开发环境

```bash
# 使用 Makefile
make dev-up

# 或使用 docker-compose
docker-compose -f docker-compose.dev.yml up --build
```

开发环境包含：
- 热重载支持（使用 cargo-watch）
- 调试日志级别
- 较宽松的安全设置
- 挂载源代码卷

### 停止开发环境

```bash
make dev-down
```

### 查看日志

```bash
make dev-logs
```

### 进入容器

```bash
make dev-shell
```

## 生产环境

### 准备工作

1. **配置环境变量**
   ```bash
   cp .env.production .env
   nano .env  # 编辑环境变量
   ```

   重要配置项：
   - `POSTGRES_PASSWORD`: 数据库密码
   - `REDIS_PASSWORD`: Redis 密码
   - `JWT_SECRET`: JWT 密钥（至少 256 位）
   - `PASSWORD_PEPPER`: 密码加密盐值
   - `SESSION_SECRET`: 会话密钥

2. **生成安全密钥**
   ```bash
   # 生成 JWT 密钥
   openssl rand -base64 32

   # 生成会话密钥
   openssl rand -hex 32
   ```

3. **配置 SSL 证书（可选）**
   ```bash
   mkdir -p nginx/ssl
   # 将证书文件放入 nginx/ssl/ 目录
   # cert.pem 和 key.pem
   ```

### 启动生产环境

```bash
# 使用 Makefile
make prod-up

# 或使用 docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### 停止生产环境

```bash
make prod-down
```

### 查看日志

```bash
make prod-logs
```

### 进入容器

```bash
make prod-shell
```

## 环境变量配置

### 开发环境默认值

开发环境已经配置了默认值，可以直接运行。

### 生产环境必填项

- `POSTGRES_PASSWORD`: PostgreSQL 数据库密码
- `REDIS_PASSWORD`: Redis 密码
- `JWT_SECRET`: JWT 签名密钥
- `PASSWORD_PEPPER`: 密码加密盐值
- `SESSION_SECRET`: 会话加密密钥
- `CORS_ORIGIN`: 你的前端域名

### 可选配置

- `SMTP_*`: 邮件服务配置
- `SENTRY_DSN`: Sentry 错误监控
- `RUST_LOG`: 日志级别 (info/debug/error)

## Docker 命令参考

### 使用 Makefile

```bash
# 查看所有命令
make help

# 构建
make build

# 清理
make clean

# 测试
make test

# 数据库操作
make db-up      # 启动数据库
make db-down    # 停止数据库
make db-reset   # 重置数据库（删除所有数据）
```

### 直接使用 Docker

```bash
# 构建镜像
docker build -f Dockerfile --target production -t blog-api:latest .

# 运行容器
docker run -d \
  --name blog-api \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  blog-api:latest
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```
   Error: Port 3000 is already allocated
   ```
   解决方案：
   ```bash
   # 查找占用端口的进程
   lsof -i :3000
   # 或更改 docker-compose.yml 中的端口映射
   ```

2. **权限错误**
   ```
   Permission denied
   ```
   解决方案：
   ```bash
   sudo chown -R $USER:$USER .  # 修复本地文件权限
   ```

3. **构建失败**
   ```
   error: failed to compile
   ```
   解决方案：
   ```bash
   # 清理并重新构建
   make clean
   make build
   ```

4. **数据库连接失败**
   ```
   Connection refused
   ```
   解决方案：
   ```bash
   # 检查数据库服务状态
   docker-compose ps
   # 查看数据库日志
   docker-compose logs postgres
   ```

### 调试技巧

1. **查看容器日志**
   ```bash
   docker-compose logs -f [service_name]
   ```

2. **进入容器调试**
   ```bash
   docker-compose exec [service_name] bash
   ```

3. **查看容器资源使用**
   ```bash
   docker stats
   ```

4. **检查健康状态**
   ```bash
   curl http://localhost:3000/health
   ```

## 性能优化

### 生产环境优化

1. **使用多阶段构建**
   - 已在 Dockerfile 中配置
   - 减少最终镜像大小

2. **使用 .dockerignore**
   - 排除不必要的文件
   - 加快构建速度

3. **启用 Gzip 压缩**
   - 已在 Nginx 配置中启用

4. **配置缓存**
   - Redis 用于缓存
   - 静态文件长期缓存

### 监控

1. **健康检查**
   - 自动监控应用状态
   - 支持滚动更新

2. **日志管理**
   - 结构化日志
   - 支持 Sentry 集成

3. **指标收集**
   - Prometheus 指标
   - 自定义业务指标

## 安全最佳实践

1. **使用非 root 用户**
   - 容器内使用 rustuser
   - 最小权限原则

2. **设置强密码**
   - 使用随机生成的密码
   - 定期轮换

3. **启用 HTTPS**
   - 配置 SSL 证书
   - 强制 HTTPS 重定向

4. **安全头**
   - 已在 Nginx 中配置
   - 防止常见攻击

5. **速率限制**
   - API 端点速率限制
   - 认证端点更严格限制

## 备份和恢复

### 数据库备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U blog_user blog_db < backup.sql
```

### 数据卷备份

```bash
# 备份卷
docker run --rm -v blog-backend_postgres_data:/volume -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /volume .

# 恢复卷
docker run --rm -v blog-backend_postgres_data:/volume -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /volume
```