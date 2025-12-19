# 快速开始指南

由于 Rust 项目的依赖版本问题，我们提供了一个简化的部署方案。

## 方法一：使用 Docker 运行数据库，本地运行后端（推荐）

### 1. 启动数据库服务

```bash
cd blog-backend

# 启动 PostgreSQL 和 Redis
./deploy.sh dev

# 或者手动启动
docker compose -f docker-compose.simple.yml up -d
```

### 2. 设置环境变量

```bash
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
```

### 3. 安装 sqlx-cli（用于数据库迁移）

```bash
cargo install sqlx-cli --no-default-features --features rustls,postgres
```

### 4. 运行数据库迁移

```bash
# 首先创建 .sqlx 目录
mkdir -p .sqlx

# 运行迁移
sqlx migrate run --database-url "$DATABASE_URL"
```

### 5. 运行后端（开发模式）

由于代码中存在一些问题，可能需要先修复：

```bash
# 修复导入问题（编辑 crates/api/src/metrics/health.rs）
# 在文件顶部添加：use chrono::DateTime;

# 修复时间方法问题（将 num_milliseconds() 改为 timestamp_millis()）
# (now - start).timestamp_millis() as u64 / 1000

# 然后运行
cargo run --bin blog-api
```

## 方法二：仅数据库容器运行（最简单）

如果只想快速启动数据库服务进行开发：

```bash
# 1. 启动数据库
docker compose -f docker-compose.simple.yml up -d

# 2. 等待服务启动
docker compose -f docker-compose.simple.yml ps

# 3. 查看服务状态
./deploy.sh status
```

## 服务信息

- **PostgreSQL**:
  - 主机: localhost
  - 端口: 5432
  - 用户: blog_user
  - 密码: blog_password
  - 数据库: blog_db

- **Redis**:
  - 主机: localhost
  - 端口: 6379

## 常用命令

```bash
# 查看服务状态
./deploy.sh status

# 停止所有服务
./deploy.sh stop

# 重新启动开发环境
./deploy.sh dev

# 查看日志
docker logs blog-postgres
docker logs blog-redis

# 连接到数据库
psql -h localhost -U blog_user -d blog_db

# 连接到 Redis
redis-cli -h localhost
```

## 注意事项

1. **代码问题**: 当前代码存在一些编译错误，需要修复后才能运行。
2. **Docker 构建问题**: 由于 Rust edition2024 兼容性问题，暂时无法直接构建 Docker 镜像。
3. **建议的开发流程**:
   - 先启动数据库服务
   - 修复代码中的导入和类型错误
   - 运行数据库迁移
   - 本地运行后端服务

## 故障排除

### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker logs blog-postgres

# 重启数据库
docker restart blog-postgres
```

### 2. Redis 连接失败

```bash
# 检查 Redis 是否运行
docker logs blog-redis

# 重启 Redis
docker restart blog-redis
```

### 3. 端口冲突

如果 5432 或 6379 端口被占用，可以修改 `docker-compose.simple.yml` 中的端口映射：

```yaml
ports:
  - "5433:5432"  # 改为其他端口
```