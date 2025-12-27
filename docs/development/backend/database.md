# 数据库配置与使用指南

## 数据库基本信息

### PostgreSQL 数据库

本项目使用 PostgreSQL 作为主数据库，通过 Docker 容器运行。

#### 连接信息

- **主机**: `localhost`
- **端口**: `5432`
- **数据库名**: `blog_db`
- **用户名**: `blog_user`
- **密码**: `blog_password`
- **Docker 容器名**: `blog-postgres`

#### 连接字符串

```
postgresql://blog_user:blog_password@localhost:5432/blog_db
```

### Redis 缓存

项目使用 Redis 作为缓存层，用于会话管理和 API 响应缓存。

#### 连接信息

- **主机**: `localhost`
- **端口**: `6379`
- **Docker 容器名**: `blog-redis`

#### 连接字符串

```
redis://localhost:6379
```

## 启动和停止数据库

### 启动数据库

```bash
# 启动 PostgreSQL 和 Redis 容器
docker-compose up -d postgres redis

# 或使用 docker 命令单独启动
docker start blog-postgres
docker start blog-redis
```

### 停止数据库

```bash
# 停止所有容器
docker-compose down

# 或单独停止
docker stop blog-postgres
docker stop blog-redis
```

### 查看数据库状态

```bash
# 检查容器状态
docker ps | grep blog

# 查看 PostgreSQL 日志
docker logs blog-postgres

# 查看 Redis 日志
docker logs blog-redis
```

## 数据库管理

### 连接到数据库

#### 使用 psql 命令行工具

```bash
# 从主机连接到数据库
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 连接后执行 SQL 查询
\dt                    # 查看所有表
\du                    # 查看所有用户
\d comments            # 查看表结构
\q                     # 退出
```

#### 使用图形化工具

你也可以使用 PostgreSQL 图形化客户端（如 pgAdmin、DBeaver 等）连接：

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `blog_db`
- **Username**: `blog_user`
- **Password**: `blog_password`

### 数据库结构

#### 主要表结构

**users（用户表）**
```sql
Column          | Type                        | Description
----------------|----------------------------|------------------
id              | UUID                       | 用户唯一标识
email           | TEXT                        | 邮箱地址（唯一）
username        | TEXT                        | 用户名
password_hash   | TEXT                        | 密码哈希
profile         | JSONB                       | 用户配置文件
email_verified  | BOOLEAN                     | 邮箱是否验证
role            | TEXT                        | 用户角色（user/admin/moderator）
created_at      | TIMESTAMPTZ                 | 创建时间
updated_at      | TIMESTAMPTZ                 | 更新时间
```

**posts（文章表）**
```sql
Column          | Type           | Description
----------------|----------------|------------------
slug            | TEXT           | 文章唯一标识（主键）
title           | TEXT           | 文章标题
content         | TEXT           | 文章内容（Markdown）
tags            | TEXT[]         | 文章标签
category        | TEXT           | 文章分类
created_at      | TIMESTAMPTZ     | 创建时间
updated_at      | TIMESTAMPTZ     | 更新时间
```

**post_stats（文章统计表）**
```sql
Column          | Type           | Description
----------------|----------------|------------------
slug            | TEXT           | 文章标识（主键）
view_count      | BIGINT         | 浏览次数
like_count      | INTEGER        | 点赞数
comment_count   | INTEGER        | 评论数
updated_at      | TIMESTAMPTZ     | 更新时间
```

**post_likes（文章点赞表）**
```sql
Column          | Type           | Description
----------------|----------------|------------------
id              | BIGSERIAL      | 主键
slug            | TEXT           | 文章标识
user_id         | UUID           | 用户ID
created_at      | TIMESTAMPTZ     | 创建时间

Unique constraint: (slug, user_id)
```

**comments（评论表）**
```sql
Column              | Type                | Description
--------------------|--------------------|------------------
id                  | UUID               | 评论唯一标识
slug                | TEXT               | 文章标识
user_id             | UUID               | 用户ID（可为空，匿名评论）
parent_id           | UUID               | 父评论ID（回复）
content             | TEXT               | 评论内容
html_sanitized      | TEXT               | HTML 清理后的内容
status              | COMMENT_STATUS     | 评论状态
path                | LTREE              | 评论路径（用于嵌套）
depth               | INTEGER            | 评论深度
like_count          | INTEGER            | 点赞数
created_at          | TIMESTAMPTZ        | 创建时间
updated_at          | TIMESTAMPTZ        | 更新时间
deleted_at          | TIMESTAMPTZ        | 删除时间
created_ip          | INET               | 创建IP
user_agent          | TEXT               | 用户代理
moderation_reason   | TEXT               | 审核原因
```

**comment_likes（评论点赞表）**
```sql
Column          | Type           | Description
----------------|----------------|------------------
id              | BIGSERIAL      | 主键
comment_id      | UUID           | 评论ID
user_id         | UUID           | 用户ID
created_at      | TIMESTAMPTZ     | 创建时间

Unique constraint: (comment_id, user_id)
```

**refresh_tokens（刷新令牌表）**
```sql
Column              | Type           | Description
--------------------|----------------|------------------
id                  | BIGSERIAL      | 主键
user_id             | UUID           | 用户ID
token_hash          | TEXT           | 令牌哈希
family_id           | UUID           | 令牌族ID
replaced_by_hash    | TEXT           | 替换令牌哈希
revoked_at          | TIMESTAMPTZ     | 撤销时间
expires_at          | TIMESTAMPTZ     | 过期时间
created_at          | TIMESTAMPTZ     | 创建时间
last_used_at        | TIMESTAMPTZ     | 最后使用时间
created_ip          | INET           | 创建IP
user_agent_hash     | TEXT           | 用户代理哈希
```

**outbox_events（外发事件表）**
```sql
Column          | Type                | Description
----------------|--------------------|------------------
id              | BIGSERIAL           | 主键
topic           | TEXT                | 事件主题
payload         | JSONB               | 事件负载
processed      | BOOLEAN             | 是否已处理
run_after       | TIMESTAMPTZ         | 执行时间
created_at      | TIMESTAMPTZ         | 创建时间
```

#### 枚举类型

**COMMENT_STATUS（评论状态）**
- `pending`: 待审核
- `approved`: 已通过
- `rejected`: 已拒绝
- `spam`: 垃圾评论

**UserRole（用户角色）**
- `user`: 普通用户
- `admin`: 管理员
- `moderator`: 版主

## 常用数据库操作

### 备份数据库

```bash
# 备份整个数据库
docker exec blog-postgres pg_dump -U blog_user blog_db > backup.sql

# 只备份表结构
docker exec blog-postgres pg_dump -U blog_user --schema-only blog_db > schema.sql

# 只备份数据
docker exec blog-postgres pg_dump -U blog_user --data-only blog_db > data.sql
```

### 恢复数据库

```bash
# 从备份文件恢复
docker exec -i blog-postgres psql -U blog_user -d blog_db < backup.sql
```

### 重置数据库

```bash
# ⚠️ 警告：此操作将删除所有数据

# 停止后端服务
# 删除容器和数据卷
docker-compose down -v

# 重新创建数据库
docker-compose up -d postgres

# 运行数据库迁移（启动后端时会自动执行）
```

### 清理缓存

```bash
# 清理 Redis 缓存
docker exec blog-redis redis-cli FLUSHALL

# 清理特定缓存键
docker exec blog-redis redis-cli DEL "post_stats:chemistry/rdkit-visualization"
```

## 数据库迁移

项目使用 SQLx 进行数据库迁移管理。迁移文件位于 `backend/migrations/` 目录。

### 查看迁移状态

```bash
# 查看已应用的迁移
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT * FROM _sqlx_migrations ORDER BY version;"
```

### 手动应用迁移

```sql
-- 在数据库中执行迁移内容
-- 例如：创建 comment_likes 表
CREATE TABLE IF NOT EXISTS comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
```

## 性能优化

### 索引

主要表已创建以下索引：

```sql
-- 用户表
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 文章统计
CREATE INDEX idx_post_stats_slug ON post_stats(slug);

-- 评论表
CREATE INDEX idx_comments_slug ON comments(slug);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_path ON comments USING GIN(path);
```

### 连接池配置

后端应用的数据库连接池配置（在 `.env` 文件中）：

```env
DATABASE_MAX_CONNECTIONS=10
DATABASE_MIN_IDLE=2
```

## 监控和日志

### 查看数据库连接

```bash
# 查看当前连接数
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT count(*) FROM pg_stat_activity;"

# 查看活跃连接
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

### 查看慢查询

```sql
-- 查看执行时间最长的查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 安全建议

1. **生产环境密码**：生产环境中请修改默认密码
   ```bash
   # 修改 docker-compose.yml 中的 POSTGRES_PASSWORD
   ```

2. **网络隔离**：生产环境中建议将数据库放在私有网络

3. **定期备份**：设置定期自动备份任务

4. **访问控制**：限制数据库只允许特定IP访问

## 故障排查

### 数据库无法启动

```bash
# 查看日志
docker logs blog-postgres

# 检查数据卷
docker volume ls

# 重置数据卷（⚠️ 会删除所有数据）
docker-compose down -v
docker-compose up -d postgres
```

### 连接被拒绝

```bash
# 检查端口是否被占用
netstat -an | grep 5432

# 检查容器是否运行
docker ps | grep blog-postgres

# 重启容器
docker restart blog-postgres
```

### 迁移失败

```sql
-- 查看迁移表
SELECT * FROM _sqlx_migrations;

-- 手动标记迁移为失败
-- 然后重新运行迁移
```

## 更多资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Redis 官方文档](https://redis.io/documentation)
- [Docker Compose 文档](https://docs.docker.com/compose/)
