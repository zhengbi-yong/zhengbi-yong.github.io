# Payload CMS 3.0 集成测试指南 / Payload CMS 3.0 Integration Testing Guide

**执行日期 / Execution Date**: 2026-01-02
**版本 / Version**: 1.0
**状态 / Status**: 核心功能已完成 95%，待测试验证 / Core functionality 95% complete, pending testing

---

## 执行摘要 / Executive Summary

本文档提供 Payload CMS 3.0 集成的完整测试指南，涵盖从环境准备到性能测试的所有关键环节。测试分为 10 个主要部分，每个部分包含详细的测试步骤、预期结果和故障排查指南。

This document provides a comprehensive testing guide for Payload CMS 3.0 integration, covering all critical aspects from environment setup to performance testing. The guide is divided into 10 main parts, each containing detailed test steps, expected results, and troubleshooting guides.

**测试范围 / Testing Scope**:
- 数据库集成 (PostgreSQL)
- Payload Admin 界面功能
- MDX 到 Payload 的数据迁移
- 前端 ISR 页面渲染
- API 功能测试
- 缓存机制验证
- 性能基准测试
- 回滚机制验证

**预计测试时间 / Estimated Testing Time**: 3-5 小时 / 3-5 hours

---

## 第一部分：测试环境准备 / Part 1: Test Environment Setup

### 1.1 前置条件检查 / Prerequisites Verification

#### 测试步骤 / Test Steps

1. **检查 Docker 服务 / Check Docker Service**

```bash
# 检查 Docker 版本
docker --version
# 预期: Docker version 20.10.0 或更高

# 检查 Docker Compose
docker compose version
# 预期: Docker Compose version v2.20.0 或更高

# 检查运行中的容器
docker ps
# 预期: 显示当前运行的容器列表
```

2. **检查 PostgreSQL 容器 / Check PostgreSQL Container**

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep blog-postgres

# 预期输出示例:
# 7a8b9c0d1e2f   postgres:17   "docker-entrypoint.s…"   2 hours ago   Up 2 hours   0.0.0.0:5432->5432/tcp   blog-postgres

# 如果未运行，启动它
cd deployments/docker/compose-files
docker compose -f docker-compose.payload.yml up -d postgres

# 等待 PostgreSQL 完全启动（约 5-10 秒）
sleep 10
```

3. **检查 Node.js 和 pnpm 版本 / Check Node.js and pnpm Versions**

```bash
# 检查 Node.js 版本（需要 >= 18.17.0）
node --version
# 预期: v18.17.0 或更高

# 检查 pnpm 版本（需要 >= 8.0.0）
pnpm --version
# 预期: 8.0.0 或更高
```

4. **验证环境变量 / Verify Environment Variables**

```bash
# 检查 .env.local 文件是否存在
cd frontend
ls -la .env.local

# 查看环境变量内容
cat .env.local

# 预期内容:
# DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
# PAYLOAD_SECRET=dev-payload-secret-key-for-testing-change-in-production-minimum-32-chars
# PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
# NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

#### 预期结果 / Expected Results

- ✅ Docker 版本 >= 20.10.0
- ✅ PostgreSQL 容器运行正常
- ✅ Node.js 版本 >= 18.17.0
- ✅ pnpm 版本 >= 8.0.0
- ✅ .env.local 文件存在且包含所有必需的环境变量

#### 故障排查 / Troubleshooting

**问题 1: Docker 未运行**
```bash
# Windows: 启动 Docker Desktop
# 或使用命令行
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# 等待 Docker 启动
timeout 30

# 验证
docker ps
```

**问题 2: PostgreSQL 容器未启动**
```bash
# 查看容器日志
docker logs blog-postgres

# 重新启动容器
docker restart blog-postgres

# 如果容器不存在，重新创建
cd deployments/docker/compose-files
docker compose -f docker-compose.payload.yml up -d
```

**问题 3: .env.local 文件不存在**
```bash
# 从示例创建
cp .env.payload.example .env.local

# 或手动创建
cat > frontend/.env.local << 'EOF'
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
PAYLOAD_SECRET=dev-payload-secret-key-for-testing-change-in-production-minimum-32-chars
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001
EOF
```

---

### 1.2 数据库初始化 / Database Initialization

#### 测试步骤 / Test Steps

1. **验证数据库连接 / Verify Database Connection**

```bash
# 使用 psql 连接数据库
psql -U blog_user -d blog_db -h localhost -c "SELECT version();"

# 预期输出:
#                                                  version
# --------------------------------------------------------------------------------------------------------
#  PostgreSQL 17.x on x86_64-pc-linux-gnu, compiled by gcc (GCC) x.x.x.x, 64-bit
```

2. **检查数据库表 / Check Database Tables**

```bash
# 查看 Payload 创建的表（首次启动后）
psql -U blog_user -d blog_db -h localhost -c "\dt payload_*"

# 预期输出（首次启动前应为空）:
# No matching relations found.

# 首次启动后应显示 6 个表:
# payload_collections, payload_globals, payload_users,
# payload_posts, payload_media, payload_preferences
```

3. **测试数据库写入权限 / Test Database Write Permissions**

```bash
# 创建测试表
psql -U blog_user -d blog_db -h localhost -c "
  CREATE TABLE IF NOT EXISTS test_table (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW()
  );
"

# 删除测试表
psql -U blog_user -d blog_db -h localhost -c "DROP TABLE IF EXISTS test_table;"

# 预期: 无错误
```

#### 预期结果 / Expected Results

- ✅ 数据库连接成功
- ✅ PostgreSQL 版本 >= 17.0
- ✅ 有写入权限（CREATE/DROP TABLE 成功）
- ✅ 无认证错误

#### 故障排查 / Troubleshooting

**问题 1: 连接被拒绝**
```bash
# 检查 PostgreSQL 是否监听 5432 端口
netstat -an | grep 5432

# 检查容器端口映射
docker ps | grep blog-postgres

# 检查 PostgreSQL 日志
docker logs blog-postgres --tail 50
```

**问题 2: 认证失败**
```bash
# 检查数据库密码
cat config/config.yml | grep -A 5 "database:"

# 确认环境变量
echo $DATABASE_URL

# 重置用户密码
docker exec -it blog-postgres psql -U postgres -c "
  ALTER USER blog_user WITH PASSWORD 'blog_password';
"
```

**问题 3: 数据库不存在**
```bash
# 创建数据库
docker exec -it blog-postgres psql -U postgres -c "
  CREATE DATABASE blog_db OWNER blog_user;
"
```

---

### 1.3 Payload 服务启动 / Payload Service Startup

#### 测试步骤 / Test Steps

1. **停止现有开发服务器 / Stop Existing Dev Server**

```bash
# 查找占用 3001 端口的进程
netstat -ano | findstr :3001

# 或使用 PowerShell
Get-NetTCPConnection -LocalPort 3001 -State Listen

# 如果找到进程，终止它
taskkill /F /PID <进程ID>

# 或使用 PowerShell
Stop-Process -Id <进程ID> -Force
```

2. **启动 Next.js 开发服务器 / Start Next.js Dev Server**

```bash
cd frontend

# 启动开发服务器（会自动初始化 Payload）
pnpm dev

# 预期输出:
#   ▲ Next.js 15.x.x
#   - Local:        http://localhost:3001
#   - Network:      http://192.168.x.x:3001
#
#   ✓ Ready in x.xs
```

3. **验证 Payload 初始化 / Verify Payload Initialization**

```bash
# 在另一个终端窗口中
cd frontend

# 检查生成的 Payload 类型文件
ls -la src/payload-types.ts

# 预期: 文件存在且最近修改

# 查看文件内容（前 30 行）
head -n 30 src/payload-types.ts

# 预期: 包含 TypeScript 类型定义
```

#### 预期结果 / Expected Results

- ✅ 开发服务器成功启动在端口 3001
- ✅ 无 TypeScript 错误
- ✅ Payload 自动初始化成功
- ✅ payload-types.ts 文件自动生成
- ✅ 控制台无严重错误

#### 故障排查 / Troubleshooting

**问题 1: 端口 3001 被占用**
```bash
# Windows/Cygwin 查找进程
netstat -ano | findstr :3001

# 终止进程
taskkill /F /PID <PID>

# 或使用其他端口
PORT=3002 pnpm dev
```

**问题 2: Payload 初始化失败**
```bash
# 检查数据库连接
psql -U blog_user -d blog_db -h localhost -c "SELECT 1;"

# 检查 Payload 配置
cat frontend/payload.config.ts

# 重新生成 payload-types.ts
rm frontend/src/payload-types.ts
pnpm dev
```

**问题 3: TypeScript 类型错误**
```bash
# 清理并重新安装
cd frontend
rm -rf node_modules .next
pnpm install
pnpm dev
```

---

### 1.4 环境验证 / Environment Verification

#### 测试步骤 / Test Steps

1. **验证 Payload Admin 访问 / Verify Payload Admin Access**

```bash
# 使用 curl 测试
curl -I http://localhost:3001/admin

# 预期 HTTP 状态码:
# HTTP/1.1 200 OK
```

2. **验证 API 端点 / Verify API Endpoints**

```bash
# 测试 Payload API
curl http://localhost:3001/api/posts

# 预期输出（首次运行）:
# {"docs":[],"totalDocs":0,"hasNextPage":false,"hasPrevPage":false}

# 测试 Local API（需要从代码调用，见后续部分）
```

3. **检查数据库表创建 / Check Database Table Creation**

```bash
# 查看 Payload 创建的表
psql -U blog_user -d blog_db -h localhost -c "\dt payload_*"

# 预期输出（应包含 6 个表）:
#                    List of relations
#  Schema |           Name           | Type  |  Owner
# --------+--------------------------+-------+----------
#  public | payload_collections      | table | blog_user
#  public | payload_globals          | table | blog_user
#  public | payload_payload_preferences | table | blog_user
#  public | payload_posts           | table | blog_user
#  public | payload_media           | table | blog_user
#  public | payload_users           | table | blog_user
```

#### 预期结果 / Expected Results

- ✅ Payload Admin 可访问（HTTP 200）
- ✅ API 端点正常响应
- ✅ 数据库表自动创建（6 个 payload_* 表）
- ✅ 无控制台错误

#### 故障排查 / Troubleshooting

**问题 1: Payload Admin 404**
```bash
# 检查 Next.js 路由
ls -la frontend/src/app/admin

# 确认 payload.config.ts 配置
grep -A 5 "admin:" frontend/payload.config.ts

# 重启开发服务器
# Ctrl+C 停止，然后重新运行 pnpm dev
```

**问题 2: 数据库表未创建**
```bash
# 检查 Payload 日志
# 在 pnpm dev 输出中查找错误信息

# 手动触发初始化
cd frontend
pnpm payload migrate:up

# 如果失败，检查数据库连接
psql -U blog_user -d blog_db -h localhost -c "SELECT 1;"
```

---

## 第二部分：数据库测试 / Part 2: Database Testing

### 2.1 数据库连接测试 / Database Connection Testing

#### 测试步骤 / Test Steps

1. **测试 Payload 数据库池 / Test Payload Database Pool**

```bash
# 在 Payload 启动后，查看连接数
psql -U blog_user -d blog_db -h localhost -c "
  SELECT count(*) as connections
  FROM pg_stat_activity
  WHERE datname = 'blog_db';
"

# 预期: >= 1（Payload 建立的连接）
```

2. **测试连接池配置 / Test Connection Pool Configuration**

```bash
# 查看 Payload 配置的最大连接数
grep -A 10 "db: postgresAdapter" frontend/payload.config.ts

# 预期配置:
#   max: 20,
#   idle: 5,
#   connectionTimeoutMillis: 10000,

# 查看数据库最大连接设置
docker exec -it blog-postgres psql -U postgres -c "SHOW max_connections;"

# 预期: >= 20
```

3. **压力测试连接池 / Stress Test Connection Pool**

```bash
# 创建测试脚本
cat > /tmp/test_db_pool.sh << 'EOF'
#!/bin/bash
for i in {1..20}; do
  curl -s http://localhost:3001/api/posts > /dev/null &
done
wait
echo "Completed 20 concurrent requests"
EOF

chmod +x /tmp/test_db_pool.sh
/tmp/test_db_pool.sh

# 预期: 无连接超时错误
```

#### 预期结果 / Expected Results

- ✅ Payload 成功建立数据库连接
- ✅ 连接池配置正确（max: 20, idle: 5）
- ✅ 并发请求无连接泄漏
- ✅ 无 "connection timeout" 错误

#### 故障排查 / Troubleshooting

**问题 1: 连接池耗尽**
```bash
# 查看活跃连接
psql -U blog_user -d blog_db -h localhost -c "
  SELECT state, count(*)
  FROM pg_stat_activity
  WHERE datname = 'blog_db'
  GROUP BY state;
"

# 如果 idle 连接过多，调整 Payload 配置
# 编辑 frontend/payload.config.ts
# 将 idle: 5 改为 idle: 2
```

**问题 2: 连接超时**
```bash
# 增加 connectionTimeoutMillis
# 编辑 frontend/payload.config.ts
# connectionTimeoutMillis: 10000 → 20000

# 重启服务器
```

---

### 2.2 表结构验证 / Table Structure Verification

#### 测试步骤 / Test Steps

1. **验证 Posts 表结构 / Verify Posts Table Structure**

```bash
psql -U blog_user -d blog_db -h localhost -c "
  \d payload_posts
"

# 预期输出（主要列）:
#                                 Table "public.payload_posts"
#       Column       |            Type             | Collation | Nullable | Default
# --------------------+-----------------------------+-----------+----------+---------
#  id                 | integer                     |           | not null |
#  title              | text                        |           |          |
#  slug               | text                        |           |          |
#  content            | text                        |           |          |
#  summary            | text                        |           |          |
#  date               | timestamp without time zone |           |          |
#  draft              | boolean                     |           |          |
#  _status            | character varying(255)      |           |          |
#  createdAt          | timestamp without time zone |           |          |
#  updatedAt          | timestamp without time zone |           |          |
```

2. **验证 Users 表结构 / Verify Users Table Structure**

```bash
psql -U blog_user -d blog_db -h localhost -c "
  \d payload_users
"

# 预期应包含认证字段:
# - email (unique, not null)
# - password (hashed)
# - name
# - roles
```

3. **验证 Media 表结构 / Verify Media Table Structure**

```bash
psql -U blog_user -d blog_db -h localhost -c "
  \d payload_media
"

# 预期应包含:
# - filename (unique)
# - mimeType
# - filesize
# - width
# - height
# - url
```

4. **检查索引和外键 / Check Indexes and Foreign Keys**

```bash
# 查看 Posts 表的索引
psql -U blog_user -d blog_db -h localhost -c "
  \d payload_posts
" | grep "Indexes:"

# 预期应包含:
# - "payload_posts_pkey" PRIMARY KEY, btree (id)
# - "_payload_posts_slug_key" UNIQUE CONSTRAINT, btree (slug)

# 查看外键关系
psql -U blog_user -d blog_db -h localhost -c "
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'payload_posts';
"

# 预期应显示:
# - authors → payload_users
# - categories → payload_categories
# - tags → payload_tags
```

#### 预期结果 / Expected Results

- ✅ 所有 Collection 表存在
- ✅ 主键约束正确
- ✅ 唯一约束正确（slug, email）
- ✅ 外键关系正确
- ✅ 时间戳字段存在（createdAt, updatedAt）

#### 故障排查 / Troubleshooting

**问题 1: 表结构不完整**
```bash
# 删除所有 Payload 表并重新初始化
psql -U blog_user -d blog_db -h localhost -c "
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO blog_user;
"

# 重启 Payload 服务器
```

**问题 2: 缺少索引**
```bash
# 手动创建索引
psql -U blog_user -d blog_db -h localhost -c "
  CREATE INDEX IF NOT EXISTS idx_posts_date
  ON payload_posts(date DESC);
"
```

---

### 2.3 初始数据测试 / Initial Data Testing

#### 测试步骤 / Test Steps

1. **创建测试用户 / Create Test User**

```bash
# 使用 Payload Admin 创建（见第三部分）
# 或使用 Local API（需要编写脚本）

# 验证用户创建
psql -U blog_user -d blog_db -h localhost -c "
  SELECT id, email, name, roles
  FROM payload_users;
"

# 预期: 至少有一个用户
```

2. **创建测试文章 / Create Test Post**

```bash
# 通过 Payload Admin 创建（见第三部分）
# 或使用 API:

curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章",
    "slug": "test-post",
    "content": "这是一篇测试文章",
    "summary": "测试摘要",
    "draft": false
  }'

# 验证文章创建
psql -U blog_user -d blog_db -h localhost -c "
  SELECT id, title, slug, draft
  FROM payload_posts;
"

# 预期: 显示新创建的文章
```

3. **测试数据关系 / Test Data Relationships**

```bash
# 创建标签和分类（通过 Admin 或 API）
# 然后创建文章并关联它们

curl -X POST http://localhost:3001/api/tags \
  -H "Content-Type: application/json" \
  -d '{"name": "测试标签", "slug": "test-tag"}'

curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "测试分类", "slug": "test-category"}'

# 验证关系
psql -U blog_user -d blog_db -h localhost -c "
  SELECT t.name, p.title
  FROM payload_tags t
  JOIN payload_posts_tags pt ON t.id = pt.tag_id
  JOIN payload_posts p ON pt.post_id = p.id;
"

# 预期: 显示标签和文章的关联关系
```

#### 预期结果 / Expected Results

- ✅ 可以创建用户
- ✅ 可以创建文章
- ✅ 可以创建标签和分类
- ✅ 关系表正确工作（posts_tags, posts_categories）
- ✅ 时间戳自动生成

#### 故障排查 / Troubleshooting

**问题 1: 无法创建数据**
```bash
# 检查权限
psql -U blog_user -d blog_db -h localhost -c "
  SELECT * FROM information_schema.role_table_grants
  WHERE table_name = 'payload_posts';
"

# 确保有 INSERT 权限
```

**问题 2: Slug 冲突**
```bash
# Payload 会自动添加后缀处理冲突
# 如果看到 "test-post-1"，说明自动处理正常
```

---

## 第三部分：Payload Admin 界面测试 / Part 3: Payload Admin UI Testing

### 3.1 管理员账户创建 / Admin Account Creation

#### 测试步骤 / Test Steps

1. **访问 Payload Admin / Access Payload Admin**

```bash
# 在浏览器中打开
open http://localhost:3001/admin

# 或使用 Windows 命令
start http://localhost:3001/admin
```

2. **创建第一个用户 / Create First User**

- 首次访问会显示 "Create First User" 页面
- 填写表单:
  - **Email**: admin@test.com
  - **Password**: [强密码，至少 8 字符]
  - **Confirm Password**: [重复密码]
  - **Name**: 管理员
- 点击 "Create User"

3. **验证账户创建 / Verify Account Creation**

```bash
# 检查数据库
psql -U blog_user -d blog_db -h localhost -c "
  SELECT id, email, name, roles, createdAt
  FROM payload_users;
"

# 预期输出:
#  id |       email       |  name  |  roles  |        createdAt
# ----+-------------------+--------+---------+------------------------
#   1 | admin@test.com    | 管理员  | {admin} | 2026-01-02 xx:xx:xx
```

#### 预期结果 / Expected Results

- ✅ 成功访问 Payload Admin
- ✅ 显示 "Create First User" 页面
- ✅ 用户创建成功
- ✅ 自动登录到 Admin Dashboard
- ✅ 数据库中用户角色为 "admin"

#### 故障排查 / Troubleshooting

**问题 1: 无法访问 /admin**
```bash
# 检查 Payload 路由配置
grep -r "admin:" frontend/payload.config.ts

# 确认 Next.js 编译无错误
# 查看 pnpm dev 输出
```

**问题 2: 用户创建失败**
```bash
# 检查控制台错误（浏览器开发者工具）
# 检查 Payload 日志

# 清除浏览器缓存并重试
```

---

### 3.2 Collections 功能测试 / Collections Functionality Testing

#### 测试步骤 / Test Steps

1. **测试 Posts Collection / Test Posts Collection**

```bash
# 在 Admin 中导航到 Posts
# 点击 "Create New Post"

# 填写表单:
# - Title: "测试文章标题"
# - Slug: (自动生成) "test-post-title"
# - Content: "这是文章内容"
# - Summary: "文章摘要"
# - Date: (默认今天)
# - Draft: ❌ (取消勾选)

# 点击 "Save"

# 预期: 成功保存并返回 Posts 列表
```

2. **验证文章创建 / Verify Post Creation**

```bash
# 检查数据库
psql -U blog_user -d blog_db -h localhost -c "
  SELECT id, title, slug, draft, createdAt
  FROM payload_posts
  ORDER BY createdAt DESC
  LIMIT 5;
"

# 预期: 显示新创建的文章
```

3. **测试编辑功能 / Test Edit Function**

```bash
# 在 Posts 列表中点击刚创建的文章
# 修改 Title 为 "测试文章标题（已修改）"
# 点击 "Save"

# 验证更新
psql -U blog_user -d blog_db -h localhost -c "
  SELECT title, updatedAt
  FROM payload_posts
  WHERE slug = 'test-post-title';
"

# 预期: updatedAt 时间戳更新
```

4. **测试删除功能 / Test Delete Function**

```bash
# 在 Posts 列表中点击文章
# 点击 "Delete" 按钮
# 确认删除

# 验证删除
psql -U blog_user -d blog_db -h localhost -c "
  SELECT count(*) FROM payload_posts
  WHERE slug = 'test-post-title';
"

# 预期: count = 0
```

5. **测试其他 Collections / Test Other Collections**

重复上述步骤测试:
- **Authors Collection**: 创建作者资料
- **Tags Collection**: 创建标签
- **Categories Collection**: 创建分类
- **Media Collection**: 上传测试图片
- **Users Collection**: 创建新用户并测试权限

#### 预期结果 / Expected Results

- ✅ 可以创建所有类型的 Collection
- ✅ 表单验证正常工作
- ✅ 编辑功能正常
- ✅ 删除功能正常
- ✅ 列表分页和搜索正常
- ✅ 关系字段正常工作（选择作者、标签等）

#### 故障排查 / Troubleshooting

**问题 1: 表单提交失败**
```bash
# 检查浏览器控制台错误
# 检查 Payload 日志
# 验证必填字段是否填写
```

**问题 2: 图片上传失败**
```bash
# 检查 frontend/public/media 目录权限
ls -la frontend/public/media

# 创建目录（如果不存在）
mkdir -p frontend/public/media
chmod 755 frontend/public/media
```

---

### 3.3 字段验证 / Field Validation

#### 测试步骤 / Test Steps

1. **测试必填字段验证 / Test Required Field Validation**

```bash
# 尝试创建没有 Title 的文章
# 点击 "Create New Post"
# 留空 Title
# 点击 "Save"

# 预期: 显示验证错误 "Title is required"
```

2. **测试唯一字段验证 / Test Unique Field Validation**

```bash
# 创建两篇 slug 相同的文章
# 第一篇: slug = "duplicate-slug"
# 第二篇: 尝试设置 slug = "duplicate-slug"

# 预期: Payload 自动添加后缀，变成 "duplicate-slug-2"
```

3. **测试格式验证 / Test Format Validation**

```bash
# 测试日期字段
# 尝试输入无效日期

# 测试 URL 字段（如果有）
# 尝试输入无效 URL

# 预期: 显示格式验证错误
```

#### 预期结果 / Expected Results

- ✅ 必填字段验证正常
- ✅ 唯一字段自动处理冲突
- ✅ 格式验证正常工作
- ✅ 自定义验证规则生效（如果配置）

#### 故障排查 / Troubleshooting

**问题 1: 验证未生效**
```bash
# 检查 Collection 配置
grep -A 20 "validate:" frontend/src/collections/Posts.ts

# 确认验证规则正确定义
```

---

### 3.4 权限测试 / Permission Testing

#### 测试步骤 / Test Steps

1. **创建不同角色的用户 / Create Users with Different Roles**

```bash
# 在 Users Collection 中创建:
# 1. Editor: editor@test.com (role: editor)
# 2. User: user@test.com (role: user)
```

2. **测试 Editor 权限 / Test Editor Permissions**

```bash
# 使用 editor@test.com 登录
# 尝试:
# - 创建文章 ✅ 应该成功
# - 编辑自己的文章 ✅ 应该成功
# - 删除自己的文章 ✅ 应该成功
# - 编辑他人文章 ❌ 应该拒绝
# - 删除他人文章 ❌ 应该拒绝
# - 修改设置 ❌ 应该拒绝
```

3. **测试 User 权限 / Test User Permissions**

```bash
# 使用 user@test.com 登录
# 尝试:
# - 查看文章 ✅ 应该成功
# - 创建文章 ❌ 应该拒绝
# - 编辑文章 ❌ 应该拒绝
```

#### 预期结果 / Expected Results

- ✅ Admin 可以执行所有操作
- ✅ Editor 可以管理自己的内容
- ✅ User 只有读取权限
- ✅ 权限控制正确实施

#### 故障排查 / Troubleshooting

**问题 1: 权限未生效**
```bash
# 检查 Collection 访问控制配置
grep -A 10 "access:" frontend/src/collections/Posts.ts

# 确认权限规则正确定义
```

---

## 第四部分：数据迁移测试 / Part 4: Data Migration Testing

### 4.1 MDX 到 Payload 迁移 / MDX to Payload Migration

#### 测试步骤 / Test Steps

1. **运行迁移脚本 / Run Migration Script**

```bash
cd frontend

# 运行 MDX 到 Payload 迁移
pnpm migrate:mdx

# 预期输出:
# 📄 找到 143 个 MDX 文件
# 开始迁移...
#
# [1/143] 正在处理: welcome.mdx
#   - Frontmatter 解析成功
#   - 内容迁移成功
#   - 标签创建: 2 个
#   - 分类创建: 1 个
# ✓ 成功
#
# ...
#
# ✅ 迁移完成!
# 📊 统计:
#    成功: 143 篇
#    失败: 0 篇
#    标签: 50 个
#    分类: 10 个
```

2. **验证迁移结果 / Verify Migration Results**

```bash
# 检查文章数量
psql -U blog_user -d blog_db -h localhost -c "
  SELECT COUNT(*) as total_posts FROM payload_posts;
"

# 预期: 143（或实际 MDX 文件数）

# 检查标签数量
psql -U blog_user -d blog_db -h localhost -c "
  SELECT COUNT(*) as total_tags FROM payload_tags;
"

# 预期: > 0

# 检查分类数量
psql -U blog_user -d blog_db -h localhost -c "
  SELECT COUNT(*) as total_categories FROM payload_categories;
"

# 预期: > 0
```

3. **验证内容完整性 / Verify Content Integrity**

```bash
# 随机选择 5 篇文章验证
psql -U blog_user -d blog_db -h localhost -c "
  SELECT title, slug, LENGTH(content) as content_length
  FROM payload_posts
  ORDER BY RANDOM()
  LIMIT 5;
"

# 预期: 所有文章都有非空内容

# 验证特定文章（如 welcome.mdx）
psql -U blog_user -d blog_db -h localhost -c "
  SELECT title, slug, summary, draft
  FROM payload_posts
  WHERE slug = 'welcome';
"

# 预期: 文章存在且内容正确
```

#### 预期结果 / Expected Results

- ✅ 所有 143 篇 MDX 文件成功迁移
- ✅ 所有标签和分类正确创建
- ✅ 文章内容完整保留
- ✅ Frontmatter 字段正确映射
- ✅ 文章关系正确建立（作者、标签、分类）

#### 故障排查 / Troubleshooting

**问题 1: 迁移失败**
```bash
# 查看详细错误日志
pnpm migrate:mdx 2>&1 | tee migration.log

# 检查特定文件
grep "Error:" migration.log

# 手动测试单个文件
cd frontend/scripts
ts-node migrate-mdx-to-payload.ts --file=../../data/blog/welcome.mdx
```

**问题 2: 内容为空**
```bash
# 检查原始 MDX 文件
cat frontend/data/blog/welcome.mdx

# 检查迁移脚本解析
grep -A 10 "parseMDX" frontend/scripts/migrate-mdx-to-payload.ts
```

**问题 3: 关系未建立**
```bash
# 手动修复关系
psql -U blog_user -d blog_db -h localhost -c "
  UPDATE payload_posts
  SET tags = (
    SELECT ARRAY_AGG(id)
    FROM payload_tags
    WHERE name = ANY(ARRAY['标签1', '标签2'])
  )
  WHERE slug = 'some-post';
"
```

---

### 4.2 数据完整性验证 / Data Integrity Verification

#### 测试步骤 / Test Steps

1. **验证 Frontmatter 字段映射 / Verify Frontmatter Mapping**

```bash
# 检查日期字段
psql -U blog_user -d blog_db -h localhost -c "
  SELECT title, date, createdAt
  FROM payload_posts
  WHERE date IS NOT NULL
  LIMIT 5;
"

# 预期: 日期正确映射

# 检查 draft 状态
psql -U blog_user -d blog_db -h localhost -c "
  SELECT draft, COUNT(*)
  FROM payload_posts
  GROUP BY draft;
"

# 预期: 显示草稿和已发布文章数量
```

2. **验证作者关系 / Verify Author Relationships**

```bash
# 检查文章作者关联
psql -U blog_user -d blog_db -h localhost -c "
  SELECT
    p.title,
    json_agg(a.name) as authors
  FROM payload_posts p
  LEFT JOIN payload_posts_authors pa ON p.id = pa.post_id
  LEFT JOIN payload_authors a ON pa.author_id = a.id
  GROUP BY p.id
  LIMIT 5;
"

# 预期: 显示文章和作者关联
```

3. **验证媒体文件引用 / Verify Media References**

```bash
# 检查文章中的图片引用
psql -U blog_user -d blog_db -h localhost -c "
  SELECT title, content
  FROM payload_posts
  WHERE content LIKE '%![](%'
  LIMIT 5;
"

# 预期: 显示包含图片的文章
```

#### 预期结果 / Expected Results

- ✅ 所有 Frontmatter 字段正确映射
- ✅ 日期和时间戳正确
- ✅ 作者关系正确建立
- ✅ 标签和分类关系正确
- ✅ 图片引用保留

#### 故障排查 / Troubleshooting

**问题 1: 日期字段错误**
```bash
# 检查原始 MDX frontmatter
head -20 frontend/data/blog/welcome.mdx

# 检查日期解析逻辑
grep -A 5 "date:" frontend/scripts/migrate-mdx-to-payload.ts
```

**问题 2: 作者未关联**
```bash
# 检查 Authors Collection
psql -U blog_user -d blog_db -h localhost -c "SELECT * FROM payload_authors;"

# 如果为空，需要先创建作者，然后手动关联
```

---

### 4.3 化学公式保留测试 / Chemical Equation Preservation Testing

#### 测试步骤 / Test Steps

1. **查找包含化学公式的文章 / Find Articles with Chemical Equations**

```bash
# 搜索包含 \ce{} 的文章
psql -U blog_user -d blog_db -h localhost -c "
  SELECT title, slug
  FROM payload_posts
  WHERE content LIKE '%\\ce%'
  LIMIT 10;
"

# 预期: 返回包含化学公式的文章列表
```

2. **验证化学公式语法 / Verify Chemical Equation Syntax**

```bash
# 提取并显示化学公式
psql -U blog_user -d blog_db -h localhost -c "
  SELECT content
  FROM payload_posts
  WHERE content LIKE '%\\ce%'
  LIMIT 1;
" | grep -o "\\ce{[^}]*}"

# 预期: 显示类似 \ce{H2O} 的公式
```

3. **前端渲染测试 / Frontend Rendering Test**

```bash
# 在浏览器中访问包含化学公式的文章
# 例如: http://localhost:3001/blog/moteus

# 使用浏览器开发者工具检查 KaTeX 渲染
# 预期: 化学公式正确显示为渲染后的数学符号
```

#### 预期结果 / Expected Results

- ✅ `\ce{}` 语法完整保留
- ✅ 无特殊字符转义问题
- ✅ 前端使用 KaTeX 正确渲染
- ✅ 公式格式正确（下标、上标、箭头等）

#### 故障排查 / Troubleshooting

**问题 1: 化学公式被转义**
```bash
# 检查数据库中的原始内容
psql -U blog_user -d blog_db -h localhost -c "
  SELECT content
  FROM payload_posts
  WHERE slug = 'moteus';
" | head -50

# 如果看到 \\ce{...} 而不是 \ce{...}，说明过度转义
# 需要修复迁移脚本
```

**问题 2: 前端未渲染**
```bash
# 检查 KaTeX 是否加载
# 在浏览器控制台运行:
typeof katex

# 预期: "object"

# 检查 mhchem 插件
katex.__define

# 预期: 包含 mhchem
```

---

### 4.4 迁移性能测试 / Migration Performance Testing

#### 测试步骤 / Test Steps

1. **测量迁移时间 / Measure Migration Time**

```bash
# 清空数据库并重新迁移
psql -U blog_user -d blog_db -h localhost -c "
  TRUNCATE TABLE payload_posts CASCADE;
  TRUNCATE TABLE payload_tags CASCADE;
  TRUNCATE TABLE payload_categories CASCADE;
"

# 计时迁移
time pnpm migrate:mdx

# 预期:
# real: 5-15 分钟（取决于文章数量和大小）
# user: 8-10 分钟
# sys: 1-2 分钟
```

2. **内存使用监控 / Memory Usage Monitoring**

```bash
# 在另一个终端监控内存
watch -n 2 'ps aux | grep "ts-node" | grep migrate'

# 预期: 内存使用稳定，无持续增长
```

3. **数据库性能 / Database Performance**

```bash
# 监控数据库查询
docker exec -it blog-postgres psql -U postgres -c "
  SELECT pid, query, state, wait_event
  FROM pg_stat_activity
  WHERE datname = 'blog_db'
  ORDER BY query_start;
"

# 预期: 无长时间运行的查询
```

#### 预期结果 / Expected Results

- ✅ 迁移时间合理（< 20 分钟）
- ✅ 内存使用稳定（< 1GB）
- ✅ 无数据库连接超时
- ✅ 无内存泄漏

#### 故障排查 / Troubleshooting

**问题 1: 迁移太慢**
```bash
# 批量大小优化
# 编辑迁移脚本，增加批量大小
# findFiles batch size: 50 → 100

# 并行处理（如果支持）
```

**问题 2: 内存溢出**
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm migrate:mdx
```

---

## 第五部分：前端页面测试 / Part 5: Frontend Page Testing

### 5.1 ISR 博客页面 / ISR Blog Pages

#### 测试步骤 / Test Steps

1. **访问博客列表页 / Access Blog List Page**

```bash
# 在浏览器中访问
open http://localhost:3001/blog

# 或使用 curl 测试
curl -I http://localhost:3001/blog

# 预期: HTTP/1.1 200 OK
```

2. **访问博客详情页 / Access Blog Detail Page**

```bash
# 访问测试文章
open http://localhost:3001/blog/welcome

# 或使用 curl
curl http://localhost:3001/blog/welcome | head -50

# 预期: 显示文章内容
```

3. **测试静态生成 / Test Static Generation**

```bash
# 检查 .next 目录中生成的页面
ls -la frontend/.next/server/app/blog

# 预期: 包含生成的 HTML 文件
```

#### 预期结果 / Expected Results

- ✅ 博客列表页正常显示
- ✅ 文章详情页正常显示
- ✅ 页面包含正确的元数据
- ✅ 响应时间 < 1s
- ✅ 无 404 错误

#### 故障排查 / Troubleshooting

**问题 1: 页面 404**
```bash
# 检查 Next.js 路由配置
ls -la frontend/src/app/blog/[...slug]/

# 确认 page.payload.tsx 存在
# 或检查是否使用 page.tsx
```

**问题 2: 内容未显示**
```bash
# 检查 Payload Local API 调用
# 在浏览器控制台查看网络请求
# 检查 /api/search 端点响应
```

---

### 5.2 内容渲染测试 / Content Rendering Testing

#### 测试步骤 / Test Steps

1. **测试 Markdown 渲染 / Test Markdown Rendering**

```bash
# 访问包含多种 Markdown 格式的文章
# 应包含:
# - 标题 (#, ##, ###)
# - 列表 (无序、有序)
# - 代码块
# - 引用
# - 粗体/斜体

# 在浏览器中检查渲染结果
# 预期: 所有格式正确显示
```

2. **测试代码高亮 / Test Code Highlighting**

```bash
# 访问包含代码块的文章
# 检查语法高亮是否正常

# 在浏览器控制台运行
document.querySelectorAll('pre code')

# 预期: 找到代码元素且包含高亮类
```

3. **测试图片渲染 / Test Image Rendering**

```bash
# 访问包含图片的文章
# 检查图片是否正确加载

# 在浏览器控制台运行
document.querySelectorAll('img')

# 预期: 所有图片 src 有效
```

#### 预期结果 / Expected Results

- ✅ Markdown 格式正确渲染
- ✅ 代码高亮正常
- ✅ 图片正确加载
- ✅ 内部链接正常工作
- ✅ 外部链接在新标签页打开

#### 故障排查 /Troubleshooting

**问题 1: 代码未高亮**
```bash
# 检查是否导入 highlight.js
grep -r "highlight" frontend/src/app/blog/

# 确认 CSS 加载
```

---

### 5.3 数学/化学公式渲染 / Math and Chemical Equation Rendering

#### 测试步骤 / Test Steps

1. **测试数学公式 / Test Math Equations**

```bash
# 访问包含 LaTeX 数学公式的文章
# 检查公式是否使用 KaTeX 渲染

# 在浏览器控制台运行
document.querySelectorAll('.katex')

# 预期: 找到渲染的 KaTeX 元素
```

2. **测试化学公式 / Test Chemical Equations**

```bash
# 访问包含 \ce{} 的文章（如 moteus）
# 检查化学公式是否正确渲染

# 示例: \ce{H2O} 应显示为 H₂O
# 示例: \ce{2H2 + O2 -> 2H2O} 应显示为反应方程式

# 预期: 所有化学公式正确显示
```

#### 预期结果 / Expected Results

- ✅ 数学公式正确渲染（KaTeX）
- ✅ 化学公式正确渲染（mhchem）
- ✅ 公式字体正确
- ✅ 公式大小适中
- ✅ 支持复杂公式（矩阵、积分等）

#### 故障排查 / Troubleshooting

**问题 1: 公式未渲染**
```bash
# 检查 KaTeX 加载
typeof katex

# 检查 mhchem 插件
# 应该在 katex 配置中启用
```

---

### 5.4 响应式布局 / Responsive Layout

#### 测试步骤 / Test Steps

1. **测试桌面视图 / Test Desktop View**

```bash
# 在浏览器开发者工具中设置视口大小
# 1920x1080 (桌面)

# 检查:
# - 导航栏正常
# - 文章宽度适中
# - 侧边栏（如果有）正常
# - 图片自适应
```

2. **测试平板视图 / Test Tablet View**

```bash
# 设置视口大小
# 768x1024 (平板)

# 检查:
# - 布局适配
# - 字体大小可读
# - 触摸目标足够大
```

3. **测试移动视图 / Test Mobile View**

```bash
# 设置视口大小
# 375x667 (手机)

# 检查:
# - 单列布局
# - 汉堡菜单（如果有）
# - 图片宽度 100%
# - 文字大小合适
```

#### 预期结果 / Expected Results

- ✅ 桌面视图正常
- ✅ 平板视图适配
- ✅ 移动视图适配
- ✅ 无横向滚动
- ✅ 触摸友好

#### 故障排查 /Troubleshooting

**问题 1: 移动端布局错乱**
```bash
# 检查 CSS 媒体查询
grep -r "@media" frontend/src/app/blog/

# 确认响应式断点
```

---

## 第六部分：API 测试 / Part 6: API Testing

### 6.1 Local API 测试 / Local API Testing

#### 测试步骤 / Test Steps

1. **测试 Posts API / Test Posts API**

```bash
# 获取所有文章（不包括草稿）
curl -s "http://localhost:3001/api/posts?where[draft][equals]=false" | jq .

# 预期输出:
# {
#   "docs": [
#     {
#       "id": 1,
#       "title": "...",
#       "slug": "...",
#       ...
#     }
#   ],
#   "totalDocs": 143,
#   "hasNextPage": false,
#   "hasPrevPage": false
# }
```

2. **测试单个文章查询 / Test Single Post Query**

```bash
# 获取特定文章
curl -s "http://localhost:3001/api/posts/1" | jq .

# 预期: 返回 ID 为 1 的文章
```

3. **测试分页 / Test Pagination**

```bash
# 获取第一页（每页 10 篇）
curl -s "http://localhost:3001/api/posts?page=1&limit=10" | jq .

# 预期: 返回 10 篇文章和分页信息
```

#### 预期结果 / Expected Results

- ✅ API 正常响应
- ✅ JSON 格式正确
- ✅ 数据完整
- ✅ 分页正常工作
- ✅ 过滤器正常工作（draft, date 等）

#### 故障排查 /Troubleshooting

**问题 1: API 无响应**
```bash
# 检查 Payload 是否初始化
curl http://localhost:3001/api/posts

# 查看错误日志
# 在 pnpm dev 终端查看
```

---

### 6.2 搜索 API 测试 / Search API Testing

#### 测试步骤 / Test Steps

1. **测试基本搜索 / Test Basic Search**

```bash
# 搜索关键词
curl -s "http://localhost:3001/api/search?q=化学" | jq .

# 预期输出:
# {
#   "results": [
#     {
#       "id": 10,
#       "title": "化学方程式配平",
#       "slug": "chemical-equations",
#       "summary": "...",
#       "url": "/blog/chemical-equations",
#       "date": "2025-01-01T00:00:00.000Z",
#       "tags": [...],
#       "categories": [...]
#     }
#   ]
# }
```

2. **测试空搜索 / Test Empty Search**

```bash
# 空查询
curl -s "http://localhost:3001/api/search?q=" | jq .

# 预期: {"results": []}
```

3. **测试无结果搜索 / Test No Results Search**

```bash
# 不存在的关键词
curl -s "http://localhost:3001/api/search?q=xyzxyz" | jq .

# 预期: {"results": []}
```

4. **性能测试 / Performance Test**

```bash
# 测量搜索响应时间
time curl -s "http://localhost:3001/api/search?q=化学" > /dev/null

# 预期: < 500ms
```

#### 预期结果 / Expected Results

- ✅ 搜索结果正确
- ✅ 按标题和摘要搜索
- ✅ 过滤草稿文章
- ✅ 响应时间 < 500ms
- ✅ 支持中文搜索

#### 故障排查 /Troubleshooting

**问题 1: 搜索返回空结果**
```bash
# 检查数据库中是否有数据
psql -U blog_user -d blog_db -h localhost -c "
  SELECT COUNT(*) FROM payload_posts WHERE draft = false;
"

# 检查搜索 API 实现
cat frontend/src/app/api/search/route.ts
```

---

### 6.3 重新验证 API 测试 / Revalidation API Testing

#### 测试步骤 / Test Steps

1. **测试基本重新验证 / Test Basic Revalidation**

```bash
# 触发重新验证
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug":"blog/welcome"}' | jq .

# 预期输出:
# {
#   "revalidated": true,
#   "now": 1735814400000
# }
```

2. **测试缺少 slug 参数 / Test Missing slug Parameter**

```bash
# 不提供 slug
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# 预期输出:
# {
#   "error": "Missing slug parameter"
# }
# HTTP 状态: 400
```

3. **验证缓存失效 / Verify Cache Invalidation**

```bash
# 1. 访问页面并记录时间
curl -I http://localhost:3001/blog/welcome

# 2. 修改文章（在 Payload Admin 中）
# 3. 触发重新验证
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug":"blog/welcome"}'

# 4. 再次访问页面
curl http://localhost:3001/blog/welcome | grep "修改后的内容"

# 预期: 显示新内容
```

#### 预期结果 / Expected Results

- ✅ 重新验证成功
- ✅ 返回正确的时间戳
- ✅ 缺少参数时返回错误
- ✅ 缓存正确失效
- ✅ 页面内容更新

#### 故障排查 /Troubleshooting

**问题 1: 重新验证失败**
```bash
# 检查 API 路由
ls -la frontend/src/app/api/revalidate/

# 确认 route.ts 存在且正确
```

---

### 6.4 错误处理 / Error Handling

#### 测试步骤 / Test Steps

1. **测试 404 错误 / Test 404 Errors**

```bash
# 访问不存在的文章
curl -I http://localhost:3001/blog/nonexistent

# 预期: HTTP 404
```

2. **测试无效 JSON / Test Invalid JSON**

```bash
# 发送无效 JSON
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{invalid json}' | jq .

# 预期: HTTP 400 + 错误信息
```

3. **测试数据库错误 / Test Database Errors**

```bash
# 停止 PostgreSQL
docker stop blog-postgres

# 尝试访问 API
curl http://localhost:3001/api/posts

# 预期: HTTP 500 + 错误信息

# 重启 PostgreSQL
docker start blog-postgres
```

#### 预期结果 / Expected Results

- ✅ 404 错误正确处理
- ✅ 无效输入返回 400
- ✅ 数据库错误返回 500
- ✅ 错误信息清晰
- ✅ 无敏感信息泄露

#### 故障排查 /Troubleshooting

**问题 1: 错误处理不工作**
```bash
# 检查错误处理中间件
grep -r "errorHandler" frontend/src/app/api/
```

---

## 第七部分：ISR 缓存测试 / Part 7: ISR Cache Testing

### 7.1 缓存生成测试 / Cache Generation Testing

#### 测试步骤 / Test Steps

1. **检查静态页面生成 / Check Static Page Generation**

```bash
# 首次构建时查看日志
pnpm build

# 查找生成日志
# 预期: 显示生成的页面数量
# ✓ Generated /blog/welcome
# ✓ Generated /blog/moteus
# ... (共 143 个页面)
```

2. **检查缓存文件 / Check Cache Files**

```bash
# 查看生成的文件
ls -la frontend/.next/server/app/blog

# 预期: 包含 .html 和 .json 文件
```

3. **验证 ISR 配置 / Verify ISR Configuration**

```bash
# 检查 revalidate 时间
grep -r "revalidate" frontend/src/app/blog/[...slug]/page.payload.tsx

# 预期: export const revalidate = 3600
```

#### 预期结果 / Expected Results

- ✅ 所有页面静态生成
- ✅ 缓存文件存在
- ✅ ISR 配置正确（3600 秒）
- ✅ 增量生成正常工作

#### 故障排查 /Troubleshooting

**问题 1: 页面未生成**
```bash
# 检查 generateStaticParams 实现
grep -A 20 "generateStaticParams" frontend/src/app/blog/[...slug]/page.payload.tsx
```

---

### 7.2 重新验证测试 / Revalidation Testing

#### 测试步骤 / Test Steps

1. **测试自动重新验证 / Test Automatic Revalidation**

```bash
# 1. 访问页面（触发缓存）
curl http://localhost:3001/blog/welcome > /tmp/before.html

# 2. 在 Payload Admin 中修改文章
# 添加一些新内容

# 3. 等待 1 秒后重新访问
sleep 1
curl http://localhost:3001/blog/welcome > /tmp/after.html

# 4. 比较差异
diff /tmp/before.html /tmp/after.html

# 预期: 应该有差异（如果 ISR hooks 工作）
```

2. **测试手动重新验证 / Test Manual Revalidation**

```bash
# 使用 revalidate API
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug":"blog/welcome"}'

# 立即访问页面
curl http://localhost:3001/blog/welcome

# 预期: 显示最新内容
```

#### 预期结果 / Expected Results

- ✅ 自动重新验证工作（afterChange hook）
- ✅ 手动重新验证工作
- ✅ 内容立即更新
- ✅ 无缓存不一致

#### 故障排查 /Troubleshooting

**问题 1: 重新验证不工作**
```bash
# 检查 Posts Collection hooks
grep -A 10 "afterChange" frontend/src/collections/Posts.ts

# 确认 revalidatePath 调用存在
```

---

### 7.3 缓存失效测试 / Cache Invalidation Testing

#### 测试步骤 / Test Steps

1. **测试过期时间 / Test Expiration Time**

```bash
# 1. 清除缓存
rm -rf frontend/.next/cache

# 2. 首次访问（生成缓存）
curl -I http://localhost:3001/blog/welcome

# 3. 记录时间
date

# 4. 等待 1 小时（或降低 revalidate 时间测试）

# 5. 再次访问
curl -I http://localhost:3001/blog/welcome

# 预期: 看到 X-Nextjs-Cache 或类似头
```

2. **测试标签失效 / Test Tag-based Invalidation**

```bash
# 如果使用了 revalidateTag
# 可以测试标签失效
```

#### 预期结果 / Expected Results

- ✅ 缓存在指定时间后失效
- ✅ 失效后重新生成
- ✅ 标签失效正常工作（如果使用）

#### 故障排查 /Troubleshooting

**问题 1: 缓存不失效**
```bash
# 检查 Next.js 配置
grep -A 5 "experimental" frontend/next.config.js

# 确认 ISR 配置正确
```

---

### 7.4 性能测试 / Performance Testing

#### 测试步骤 / Test Steps

1. **测试缓存命中性能 / Test Cache Hit Performance**

```bash
# 首次访问（冷缓存）
time curl -s http://localhost:3001/blog/welcome > /dev/null

# 预期: 500-1000ms

# 再次访问（热缓存）
time curl -s http://localhost:3001/blog/welcome > /dev/null

# 预期: < 100ms
```

2. **测试并发性能 / Test Concurrent Performance**

```bash
# 使用 Apache Bench
ab -n 1000 -c 10 http://localhost:3001/blog/welcome

# 预期:
# - Requests per second: > 100
# - Time per request: < 100ms (mean)
```

#### 预期结果 / Expected Results

- ✅ 缓存命中快速（< 100ms）
- ✅ 并发性能良好（> 100 req/s）
- ✅ 无缓存穿透
- ✅ 内存使用稳定

#### 故障排查 /Troubleshooting

**问题 1: 性能差**
```bash
# 检查数据库查询
# 添加日志到 API
# 查看查询时间
```

---

## 第八部分：性能测试 / Part 8: Performance Testing

### 8.1 页面加载性能 / Page Load Performance

#### 测试步骤 / Test Steps

1. **使用 Lighthouse 测试 / Test with Lighthouse**

```bash
# 安装 Lighthouse
npm install -g lighthouse

# 运行 Lighthouse
lighthouse http://localhost:3001/blog/welcome \
  --output html \
  --output-path report.html \
  --chrome-flags="--headless"

# 打开报告
open report.html

# 预期分数:
# - Performance: > 90
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: 100
```

2. **测量关键指标 / Measure Key Metrics**

```bash
# 使用 WebPageTest 或浏览器开发者工具
# 测量:
# - FCP (First Contentful Paint): < 1.8s
# - LCP (Largest Contentful Paint): < 2.5s
# - TTI (Time to Interactive): < 3.8s
# - CLS (Cumulative Layout Shift): < 0.1
```

#### 预期结果 / Expected Results

- ✅ Lighthouse Performance > 90
- ✅ FCP < 1.8s
- ✅ LCP < 2.5s
- ✅ TTI < 3.8s
- ✅ CLS < 0.1

#### 故障排查 /Troubleshooting

**问题 1: 性能分数低**
```bash
# 检查图片大小
# 优化图片

# 检查 JavaScript 大小
# 使用代码分割
```

---

### 8.2 数据库查询性能 / Database Query Performance

#### 测试步骤 / Test Steps

1. **测试查询时间 / Test Query Time**

```bash
# 在 PostgreSQL 中启用查询日志
docker exec -it blog-postgres psql -U postgres -c "
  ALTER SYSTEM SET log_min_duration_statement = 100;
  SELECT pg_reload_conf();
"

# 重启 PostgreSQL
docker restart blog-postgres

# 访问页面并检查日志
docker logs blog-postgres --tail 50

# 预期: 查询时间 < 100ms
```

2. **检查慢查询 / Check Slow Queries**

```bash
# 查看慢查询统计
psql -U blog_user -d blog_db -h localhost -c "
  SELECT query, calls, mean_time
  FROM pg_stat_statements
  WHERE mean_time > 100
  ORDER BY mean_time DESC
  LIMIT 10;
"

# 预期: 无慢查询（> 1s）
```

#### 预期结果 / Expected Results

- ✅ 查询时间 < 100ms
- ✅ 无慢查询
- ✅ 索引正确使用
- ✅ 无 N+1 查询

#### 故障排查 /Troubleshooting

**问题 1: 慢查询**
```bash
# 分析查询计划
EXPLAIN ANALYZE SELECT * FROM payload_posts;

# 添加索引
```

---

### 8.3 API 响应时间 / API Response Time

#### 测试步骤 / Test Steps

1. **测试搜索 API 响应时间 / Test Search API Response Time**

```bash
# 测量响应时间
time curl -s "http://localhost:3001/api/search?q=化学" > /dev/null

# 预期: < 500ms
```

2. **测试重新验证 API 响应时间 / Test Revalidation API Response Time**

```bash
time curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug":"blog/welcome"}' > /dev/null

# 预期: < 200ms
```

#### 预期结果 / Expected Results

- ✅ 搜索 API < 500ms
- ✅ 重新验证 API < 200ms
- ✅ Posts API < 300ms
- ✅ 单篇文章查询 < 200ms

#### 故障排查 /Troubleshooting

**问题 1: API 响应慢**
```bash
# 添加日志
# 检查数据库查询
# 优化查询
```

---

### 8.4 构建性能 / Build Performance

#### 测试步骤 / Test Steps

1. **测量构建时间 / Measure Build Time**

```bash
# 清理构建
cd frontend
rm -rf .next

# 计时构建
time pnpm build

# 预期:
# real: 5-10 分钟
# user: 8-12 分钟
# sys: 1-2 分钟
```

2. **分析构建输出 / Analyze Build Output**

```bash
# 查看构建日志
# 检查:
# - 页面数量
# - 包大小
# - 警告和错误
```

#### 预期结果 / Expected Results

- ✅ 构建时间 < 15 分钟
- ✅ 无严重错误
- ✅ 包大小合理
- ✅ 所有页面生成

#### 故障排查 /Troubleshooting

**问题 1: 构建太慢**
```bash
# 增加 Node.js 内存
export NODE_OPTIONS="--max-old-space-size=4096"

# 使用增量构建
```

---

## 第九部分：回滚测试 / Part 9: Rollback Testing

### 9.1 回滚到 Contentlayer / Rollback to Contentlayer

#### 测试步骤 / Test Steps

1. **备份当前状态 / Backup Current State**

```bash
# 创建备份分支
git branch backup-payload-$(date +%Y%m%d)
git commit -am "Backup before rollback"

# 保存数据库
docker exec blog-postgres pg_dump -U blog_user blog_db > backup.sql
```

2. **切换回 Contentlayer / Switch Back to Contentlayer**

```bash
# 回滚到迁移前的提交
git log --oneline | grep "Contentlayer"

# 找到迁移前的提交
git checkout <commit-hash>

# 或回滚指定数量
git checkout HEAD~10
```

3. **重新安装依赖 / Reinstall Dependencies**

```bash
cd frontend
rm -rf node_modules .next
pnpm install
```

4. **重新构建 / Rebuild**

```bash
pnpm contentlayer build
pnpm dev

# 预期: Contentlayer 正常工作
```

#### 预期结果 / Expected Results

- ✅ 成功回滚到 Contentlayer
- ✅ 所有页面正常显示
- ✅ 无数据丢失
- ✅ 性能正常

#### 故障排查 /Troubleshooting

**问题 1: 回滚后错误**
```bash
# 确保清理缓存
rm -rf .next node_modules
pnpm install
```

---

### 9.2 数据库清理 / Database Cleanup

#### 测试步骤 / Test Steps

1. **清理 Payload 表 / Clean Payload Tables**

```bash
# 删除所有 Payload 表
psql -U blog_user -d blog_db -h localhost -c "
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO blog_user;
  GRANT ALL ON SCHEMA public TO public;
"
```

2. **验证清理 / Verify Cleanup**

```bash
# 检查表
psql -U blog_user -d blog_db -h localhost -c "\dt"

# 预期: 无表（或只有初始表）
```

#### 预期结果 / Expected Results

- ✅ 所有 Payload 表删除
- ✅ 数据库干净
- ✅ 可以重新初始化

#### 故障排查 /Troubleshooting

**问题 1: 无法删除表**
```bash
# 强制终止连接
psql -U blog_user -d blog_db -h localhost -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'blog_db'
    AND pid <> pg_backend_pid();
"
```

---

### 9.3 配置还原 / Configuration Restoration

#### 测试步骤 / Test Steps

1. **还原环境变量 / Restore Environment Variables**

```bash
# 删除 Payload 相关环境变量
rm frontend/.env.local

# 还原原始配置（如果有备份）
cp .env.backup frontend/.env.local
```

2. **验证配置 / Verify Configuration**

```bash
# 检查 Next.js 配置
cat frontend/next.config.js

# 确认没有 Payload 相关配置
```

#### 预期结果 / Expected Results

- ✅ 环境变量还原
- ✅ Next.js 配置正确
- ✅ 无 Payload 残留

#### 故障排查 /Troubleshooting

**问题 1: 配置冲突**
```bash
# 检查所有配置文件
grep -r "payload" frontend/
```

---

## 第十部分：故障排查 / Part 10: Troubleshooting

### 10.1 常见问题 / Common Issues

#### 问题 1: Payload Admin 无法访问

**症状**: 访问 /admin 返回 404

**解决方案**:
```bash
# 1. 检查 Payload 配置
cat frontend/payload.config.ts | grep -A 5 "admin:"

# 2. 确认 Next.js 编译成功
# 查看 pnpm dev 输出

# 3. 清理缓存
rm -rf frontend/.next
pnpm dev
```

#### 问题 2: 数据库连接失败

**症状**: "connection refused" 或 "authentication failed"

**解决方案**:
```bash
# 1. 检查 PostgreSQL 容器
docker ps | grep blog-postgres

# 2. 检查端口映射
docker port blog-postgres

# 3. 测试连接
psql -U blog_user -d blog_db -h localhost -c "SELECT 1;"

# 4. 检查密码
cat frontend/.env.local | grep DATABASE_URL
```

#### 问题 3: 迁移失败

**症状**: 迁移脚本报错或部分文章未迁移

**解决方案**:
```bash
# 1. 查看详细日志
pnpm migrate:mdx 2>&1 | tee migration.log

# 2. 检查失败的文件
grep "Error:" migration.log

# 3. 手动测试单个文件
cd frontend/scripts
ts-node migrate-mdx-to-payload.ts --file=../../data/blog/specific-file.mdx

# 4. 清除并重新迁移
psql -U blog_user -d blog_db -h localhost -c "TRUNCATE payload_posts CASCADE;"
pnpm migrate:mdx
```

#### 问题 4: ISR 不工作

**症状**: 页面内容不更新

**解决方案**:
```bash
# 1. 检查 ISR hooks
grep -A 10 "afterChange" frontend/src/collections/Posts.ts

# 2. 确认 revalidatePath 调用

# 3. 手动触发重新验证
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug":"blog/welcome"}'

# 4. 检查 Next.js 配置
grep -A 5 "experimental" frontend/next.config.js
```

#### 问题 5: 化学公式未渲染

**症状**: 显示 \ce{H2O} 而不是渲染后的公式

**解决方案**:
```bash
# 1. 检查 KaTeX 加载
# 在浏览器控制台:
typeof katex

# 2. 检查 mhchem 插件
katex.__define

# 3. 检查内容是否被转义
psql -U blog_user -d blog_db -h localhost -c "
  SELECT content FROM payload_posts WHERE slug = 'moteus';
" | grep "\\\\ce"

# 如果看到 \\\\ce，说明过度转义，需要修复
```

---

### 10.2 日志查看 / Log Viewing

#### Payload 日志 / Payload Logs

```bash
# 查看开发服务器日志
cd frontend
pnpm dev

# 日志会直接输出到终端
# 查找错误信息
pnpm dev 2>&1 | grep -i "error"
```

#### 数据库日志 / Database Logs

```bash
# 查看 PostgreSQL 日志
docker logs blog-postgres --tail 100

# 实时查看
docker logs -f blog-postgres

# 查看慢查询
docker exec blog-postgres psql -U postgres -c "
  SELECT query, mean_time
  FROM pg_stat_statements
  WHERE mean_time > 100
  ORDER BY mean_time DESC
  LIMIT 10;
"
```

#### Next.js 日志 / Next.js Logs

```bash
# 查看 .next 构建日志
ls -la frontend/.next/

# 查看服务器日志
# 在开发模式下，日志输出到终端
# 在生产模式下，查看 systemd 或进程管理器日志
```

---

### 10.3 调试技巧 / Debugging Tips

#### 1. 启用详细日志 / Enable Verbose Logging

```bash
# 设置 Payload 调试模式
export PAYLOAD_DEBUG=true
cd frontend
pnpm dev

# 启用 Next.js 调试
export DEBUG=*
pnpm dev
```

#### 2. 使用 TypeScript 类型检查 / Use TypeScript Type Checking

```bash
# 运行类型检查
cd frontend
pnpm tsc --noEmit

# 查找类型错误
pnpm tsc --noEmit 2>&1 | grep "error TS"
```

#### 3. 数据库查询分析 / Database Query Analysis

```bash
# 使用 EXPLAIN ANALYZE
psql -U blog_user -d blog_db -h localhost -c "
  EXPLAIN ANALYZE
  SELECT * FROM payload_posts WHERE draft = false;
"

# 查看查询计划
# 检查索引使用
```

#### 4. 浏览器开发者工具 / Browser DevTools

```javascript
// 在浏览器控制台中:

// 1. 检查 API 请求
fetch('/api/posts').then(r => r.json()).then(console.log)

// 2. 检查页面性能
performance.getEntriesByType('navigation')

// 3. 检查缓存
caches.keys().then(console.log)

// 4. 检查 Service Worker
navigator.serviceWorker.getRegistrations().then(console.log)
```

---

## 附录 / Appendix

### A. 测试命令速查表 / Test Commands Cheat Sheet

#### 环境准备 / Environment Setup

```bash
# 检查 Docker
docker --version
docker ps

# 检查 PostgreSQL
docker ps | grep blog-postgres
psql -U blog_user -d blog_db -h localhost -c "SELECT version();"

# 启动开发服务器
cd frontend
pnpm dev
```

#### 数据库操作 / Database Operations

```bash
# 连接数据库
psql -U blog_user -d blog_db -h localhost

# 查看所有表
\dt payload_*

# 查看表结构
\d payload_posts

# 查询文章
SELECT id, title, slug FROM payload_posts LIMIT 10;

# 统计数量
SELECT COUNT(*) FROM payload_posts;
SELECT COUNT(*) FROM payload_tags;
SELECT COUNT(*) FROM payload_categories;
```

#### Payload Admin / Payload Admin

```bash
# 访问 Admin
open http://localhost:3001/admin

# 创建用户（首次访问）
# 填写表单并提交
```

#### 数据迁移 / Data Migration

```bash
# 运行迁移
cd frontend
pnpm migrate:mdx

# 验证迁移
psql -U blog_user -d blog_db -h localhost -c "
  SELECT COUNT(*) FROM payload_posts;
"
```

#### API 测试 / API Testing

```bash
# 测试 Posts API
curl -s "http://localhost:3001/api/posts" | jq .

# 测试搜索
curl -s "http://localhost:3001/api/search?q=化学" | jq .

# 测试重新验证
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug":"blog/welcome"}' | jq .
```

#### 性能测试 / Performance Testing

```bash
# Lighthouse
lighthouse http://localhost:3001/blog/welcome \
  --output html --output-path report.html

# Apache Bench
ab -n 1000 -c 10 http://localhost:3001/blog/welcome

# 响应时间
time curl -s http://localhost:3001/blog/welcome > /dev/null
```

#### 回滚操作 / Rollback Operations

```bash
# 备份数据库
docker exec blog-postgres pg_dump -U blog_user blog_db > backup.sql

# 回滚代码
git checkout <commit-hash>

# 清理数据库
psql -U blog_user -d blog_db -h localhost -c "
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO blog_user;
"
```

---

### B. 预期结果对比表 / Expected Results Comparison Table

| 测试项 | 预期结果 | 如何验证 |
|--------|----------|----------|
| **环境准备** | | |
| Docker 版本 | >= 20.10.0 | `docker --version` |
| PostgreSQL 版本 | >= 17.0 | `psql -c "SELECT version();"` |
| Node.js 版本 | >= 18.17.0 | `node --version` |
| .env.local 存在 | ✅ | `ls -la frontend/.env.local` |
| **数据库** | | |
| 连接成功 | ✅ | `psql -c "SELECT 1;"` |
| 表创建 | 6 个 payload_* 表 | `\dt payload_*` |
| **Payload Admin** | | |
| 访问成功 | HTTP 200 | `curl -I /admin` |
| 用户创建 | ✅ | 查询 payload_users |
| **数据迁移** | | |
| 文章数量 | 143 篇 | `SELECT COUNT(*) FROM payload_posts;` |
| 标签数量 | > 0 | `SELECT COUNT(*) FROM payload_tags;` |
| 分类数量 | > 0 | `SELECT COUNT(*) FROM payload_categories;` |
| **API** | | |
| Posts API | JSON + docs 数组 | `curl /api/posts \| jq .` |
| 搜索 API | results 数组 | `curl /api/search?q=x \| jq .` |
| 重新验证 API | revalidated: true | `curl -X POST /api/revalidate` |
| **性能** | | |
| Lighthouse | > 90 | Lighthouse 报告 |
| FCP | < 1.8s | Lighthouse |
| LCP | < 2.5s | Lighthouse |
| 搜索响应 | < 500ms | `time curl /api/search` |
| **前端** | | |
| 博客列表页 | HTTP 200 | `curl -I /blog` |
| 文章详情页 | HTTP 200 | `curl -I /blog/welcome` |
| 化学公式渲染 | KaTeX 渲染 | 浏览器检查 |
| 数学公式渲染 | KaTeX 渲染 | 浏览器检查 |

---

### C. 性能基准 / Performance Benchmarks

#### 页面加载性能 / Page Load Performance

| 指标 | 良好 | 需改进 | 差 |
|------|------|--------|-----|
| Lighthouse Performance | 90-100 | 50-89 | 0-49 |
| First Contentful Paint (FCP) | 0-1.8s | 1.8-3.0s | > 3.0s |
| Largest Contentful Paint (LCP) | 0-2.5s | 2.5-4.0s | > 4.0s |
| Time to Interactive (TTI) | 0-3.8s | 3.8-7.3s | > 7.3s |
| Cumulative Layout Shift (CLS) | 0-0.1 | 0.1-0.25 | > 0.25 |

#### API 性能 / API Performance

| API 端点 | 良好 | 可接受 | 需优化 |
|----------|------|--------|--------|
| /api/posts | < 300ms | 300-1000ms | > 1000ms |
| /api/posts/:id | < 200ms | 200-500ms | > 500ms |
| /api/search | < 500ms | 500-1500ms | > 1500ms |
| /api/revalidate | < 200ms | 200-500ms | > 500ms |

#### 数据库性能 / Database Performance

| 操作 | 良好 | 可接受 | 需优化 |
|------|------|--------|--------|
| 单篇文章查询 | < 10ms | 10-50ms | > 50ms |
| 文章列表查询 (20条) | < 50ms | 50-200ms | > 200ms |
| 搜索查询 | < 100ms | 100-500ms | > 500ms |
| 关联查询 (作者/标签) | < 100ms | 100-300ms | > 300ms |

#### 迁移性能 / Migration Performance

| 指标 | 良好 | 可接受 | 需优化 |
|------|------|--------|--------|
| 143 篇文章迁移时间 | 5-10 分钟 | 10-20 分钟 | > 20 分钟 |
| 内存使用 | < 1GB | 1-2GB | > 2GB |
| 错误率 | 0% | < 1% | > 1% |

---

### D. 测试报告模板 / Test Report Template

```markdown
# Payload CMS 3.0 集成测试报告

**测试日期**: [YYYY-MM-DD]
**测试人员**: [姓名]
**环境**: [开发/测试/生产]
**Payload 版本**: 3.69.0

---

## 执行摘要

- [ ] 所有测试通过
- [ ] 部分测试失败
- [ ] 测试阻塞

**通过率**: X/XX (XX%)

---

## 测试结果

### 1. 环境准备
- [x] Docker 检查
- [x] PostgreSQL 检查
- [x] Node.js 检查
- [x] 环境变量检查

**备注**: [任何问题或观察]

### 2. 数据库测试
- [x] 数据库连接
- [x] 表结构验证
- [x] 初始数据测试

**备注**: [任何问题或观察]

### 3. Payload Admin 测试
- [x] 管理员账户创建
- [x] Collections 功能
- [x] 字段验证
- [x] 权限测试

**备注**: [任何问题或观察]

### 4. 数据迁移测试
- [x] MDX 到 Payload 迁移
- [x] 数据完整性验证
- [x] 化学公式保留
- [x] 迁移性能

**迁移统计**:
- 成功: XX 篇
- 失败: XX 篇
- 时间: XX 分钟

**备注**: [任何问题或观察]

### 5. 前端页面测试
- [x] ISR 博客页面
- [x] 内容渲染
- [x] 数学/化学公式
- [x] 响应式布局

**备注**: [任何问题或观察]

### 6. API 测试
- [x] Local API
- [x] 搜索 API
- [x] 重新验证 API
- [x] 错误处理

**备注**: [任何问题或观察]

### 7. ISR 缓存测试
- [x] 缓存生成
- [x] 重新验证
- [x] 缓存失效
- [x] 性能

**备注**: [任何问题或观察]

### 8. 性能测试
- [x] 页面加载性能
- [x] 数据库查询性能
- [x] API 响应时间
- [x] 构建性能

**Lighthouse 分数**:
- Performance: XX
- Accessibility: XX
- Best Practices: XX
- SEO: XX

**备注**: [任何问题或观察]

### 9. 回滚测试
- [x] 回滚到 Contentlayer
- [x] 数据库清理
- [x] 配置还原

**备注**: [任何问题或观察]

---

## 问题清单

| ID | 问题描述 | 严重性 | 状态 | 解决方案 |
|----|----------|--------|------|----------|
| 1 | [描述] | 高/中/低 | 开发中/已解决 | [描述] |
| 2 | [描述] | 高/中/低 | 开发中/已解决 | [描述] |

---

## 建议

1. [改进建议 1]
2. [改进建议 2]
3. [改进建议 3]

---

## 签名

**测试人员**: ________________ **日期**: ________________

**审核人员**: ________________ **日期**: ________________
```

---

## 总结 / Conclusion

本测试指南提供了 Payload CMS 3.0 集成的全面测试流程。按照本指南执行测试可以确保:

This testing guide provides a comprehensive testing process for Payload CMS 3.0 integration. Following this guide ensures:

- ✅ 所有核心功能正常工作
- ✅ 数据迁移成功且完整
- ✅ 性能达到预期标准
- ✅ 回滚机制可靠
- ✅ 问题有明确的解决方案

如有任何问题或需要补充测试，请参考:
- Payload 官方文档: https://payloadcms.com/docs
- 项目迁移报告: `docs/migration/payload-cms-migration.md`
- 文件组织原则: `docs/development/best-practices/file-organization.md`

---

**文档版本**: 1.0
**最后更新**: 2026-01-02
**维护者**: Claude Code
**状态**: 已完成 / Completed
