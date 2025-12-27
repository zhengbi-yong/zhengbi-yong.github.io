# 问题修复总结

## 已修复的问题

### 1. ✅ 用户管理页面 - `useCustom` 错误

**问题**: `Cannot destructure property 'url' of 'undefined' as it is undefined`

**原因**: 代码中导入了 `useCustom` hook 但没有正确使用

**修复**:
- 文件: `frontend/app/admin/users/page.tsx`
- 移除了未使用的 `useCustom` 导入
- 移除了无效的 `useCustom()` 调用

### 2. ✅ 评论管理页面 - 无评论显示

**问题**: 评论管理页面显示为空

**原因**: 用户以普通用户身份登录，没有管理员权限

**解决方案**:
创建了新的管理员账号：
- 邮箱: `admin@test.com`
- 密码: `Admin123XYZ`
- 角色: `admin`

**使用方法**:
1. 退出当前账号
2. 使用管理员凭据登录
3. 访问 http://localhost:3003/admin/comments

### 3. ✅ 文章管理页面 - 从模拟数据迁移到真实API

**问题**: 文章管理页面使用模拟数据，不显示真实统计

**修复内容**:

#### 后端添加新API
**文件**: `backend/crates/api/src/routes/admin.rs`
- 添加了 `PostListQuery` 结构
- 添加了 `PostListResponse` 结构
- 添加了 `PostAdminItem` 结构
- 实现了 `list_posts_admin` 函数，从数据库获取真实文章统计

**文件**: `backend/crates/api/src/main.rs`
- 添加了路由: `.route("/posts", get(blog_api::routes::admin::list_posts_admin))`
- 完整路径: `GET /v1/admin/posts`

#### 前端更新
**文件**: `frontend/app/admin/posts/page.tsx`
- 移除了模拟数据 `MOCK_POSTS`
- 使用 `useList` hook 从 Refine 获取真实数据
- 更新了数据结构以匹配后端 API
- 移除了状态筛选器（后端API未提供状态字段）
- 更新了显示字段：slug, view_count, like_count, comment_count, updated_at

### 4. ✅ Error.tsx - HTML解析错误

**问题**: `Parsing ecmascript source code failed - Expression expected`

**修复**:
- 文件: `frontend/app/error.tsx`
- 移除了不正确的 `<body>` 标签
- 返回纯 JSX 元素而非 HTML 结构

### 5. ✅ Posts API 500错误 - 类型不匹配

**问题**: `/v1/admin/posts` 返回500错误
```
Database error: mismatched types; Rust type `i64` is not compatible with SQL type `INT4`
```

**原因**: 数据库中 `like_count` 和 `comment_count` 是 integer (i32)，但代码定义为 i64

**修复**:
- 文件: `backend/crates/api/src/routes/admin.rs` (line 113-119)
- 修改 `PostAdminItem` 结构体:
  - `like_count: i64` → `like_count: i32`
  - `comment_count: i64` → `comment_count: i32`
- 重新构建并重启后端

**测试结果**:
- Posts API 成功返回17条文章数据
- 所有字段正确显示: slug, view_count, like_count, comment_count, updated_at

### 6. ✅ UserInfo 缺少 role 字段

**问题**: 用户登录后返回的UserInfo不包含role字段，导致前端无法判断用户权限

**修复**:
- 文件: `backend/crates/db/src/models.rs` (line 164-184)
  - 在 `UserInfo` 结构体中添加 `pub role: String` 字段
  - 在 `UserRole` 枚举中添加 `as_str()` 方法用于转换为字符串
  - 在 `From<User> for UserInfo` 实现中添加 `role: user.role.as_str().to_string()`
- 文件: `backend/crates/api/src/routes/auth.rs` (line 370-392)
  - 修改 `me` 函数从数据库查询用户信息以获取最新role
  - 返回的UserInfo现在包含role字段

**测试结果**:
- 登录响应现在包含 `"role":"admin"`
- 前端可以正确获取用户角色信息

## 后端重启说明

由于后端代码已更改，需要重启后端服务：

### Windows
```bash
# 1. 停止现有进程
taskkill /F /IM api.exe

# 2. 重新构建
cd backend
cargo build --bin api

# 3. 启动后端
DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db" \
REDIS_URL="redis://localhost:6379" \
JWT_SECRET="dev-secret-key" \
HOST="127.0.0.1" \
PORT="3000" \
RUST_LOG="debug" \
./target/debug/api
```

### 验证API
测试新的文章管理API:
```bash
# 获取管理员token
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123XYZ"}'

# 测试文章列表API
curl http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer <your-token>"
```

## 数据库中的文章

当前数据库中有以下文章统计：
- motor/encoder_quadrature_encoding
- chemistry/rdkit-visualization
- chemistry/test-structure
- computer/architecture/introduction
- control/multiagent
- economics/bytedance_history
- motor/encoder_tamagawa_protocol
- math/mdx_toturial
- 等等...

## 登录凭据

### 管理员账号（推荐）
- 邮箱: `admin@test.com`
- 密码: `Admin123XYZ`
- 角色: admin

### 普通测试账号
- 邮箱: `test_1766825852@example.com`
- 密码: `TestPass123!ABC`
- 角色: user

## 前端服务状态

前端运行在: http://localhost:3003
- 用户管理: http://localhost:3003/admin/users
- 评论管理: http://localhost:3003/admin/comments
- 文章管理: http://localhost:3003/admin/posts

## 注意事项

1. **必须使用管理员账号登录**才能访问管理功能
2. 后端需要重启才能加载新的API路由
3. 所有数据现在都是真实的数据库数据，不再是模拟数据
4. 文章统计数据来自 `post_stats` 表

## 已知限制

1. 文章管理不提供标题，只显示 slug
2. 没有文章状态筛选（已发布/草稿等）
3. 文章编辑功能尚未实现
4. 删除文章功能尚未实现

这些功能可以在后续添加相应的后端 API。
