# 系统功能与测试文档

本文档详细说明博客系统的所有前后端功能及其测试方法。

## 目录

- [用户认证功能](#用户认证功能)
- [文章功能](#文章功能)
- [评论功能](#评论功能)
- [统计功能](#统计功能)
- [管理员功能](#管理员功能)
- [前端功能](#前端功能)

---

## 用户认证功能

### 1. 用户注册

**功能描述**：允许新用户注册账号

#### API 端点
- **URL**: `POST /v1/auth/register`
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "username": "testuser",
    "password": "password123"
  }
  ```
- **响应**:
  ```json
  {
    "access_token": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "testuser",
      "profile": {},
      "email_verified": false
    }
  }
  ```

#### 测试方法

**使用 cURL**:
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

**使用前端**:
1. 访问 `http://localhost:3003/register`
2. 填写注册表单
3. 点击"注册"按钮
4. 验证是否自动登录并跳转到首页

#### 预期结果
- 返回 201 Created
- 返回访问令牌和用户信息
- 用户数据被写入数据库

### 2. 用户登录

**功能描述**：已注册用户登录系统

#### API 端点
- **URL**: `POST /v1/auth/login`
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **响应**:
  ```json
  {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "testuser",
      "profile": {},
      "email_verified": false
    }
  }
  }
  ```

#### 测试方法

**使用 cURL**:
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo2024@test.com",
    "password": "demo123456"
  }'
```

**使用前端**:
1. 访问 `http://localhost:3003/login`
2. 输入邮箱和密码
3. 点击"登录"按钮
4. 验证是否跳转到首页并显示用户名

#### 预期结果
- 返回 200 OK
- 返回访问令牌和刷新令牌
- 令牌被存储在 localStorage
- 前端更新认证状态

### 3. 用户登出

**功能描述**：用户退出登录，清除令牌

#### API 端点
- **URL**: `POST /v1/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **响应**: 204 No Content

#### 测试方法

**使用 cURL**:
```bash
# 首先登录获取 token
TOKEN=$(curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo2024@test.com", "password": "demo123456"}' \
  | jq -r '.access_token')

# 登出
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**使用前端**:
1. 登录后点击右上角用户菜单
2. 点击"登出"
3. 验证是否跳转到登录页
4. 验证 localStorage 中的令牌被清除

#### 预期结果
- 返回 204 No Content
- 刷新令牌被标记为已撤销
- 前端清除存储的令牌

### 4. 刷新令牌

**功能描述**：使用刷新令牌获取新的访问令牌

#### API 端点
- **URL**: `POST /v1/auth/refresh`
- **请求体**:
  ```json
  {
    "refresh_token": "eyJ..."
  }
  ```

#### 测试方法

```bash
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

#### 预期结果
- 返回新的访问令牌
- 旧的刷新令牌被撤销

### 5. 获取当前用户信息

**功能描述**：获取当前登录用户的信息

#### API 端点
- **URL**: `GET /v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`

#### 测试方法

```bash
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### 预期结果
- 返回 200 OK 和用户信息
- 未认证时返回 401 Unauthorized

---

## 文章功能

### 1. 获取文章列表

**功能描述**：获取所有文章的列表（分页）

#### API 端点
- **URL**: `GET /v1/posts?page=1&page_size=10`

#### 测试方法

```bash
curl -X GET "http://localhost:3000/v1/posts?page=1&page_size=10"
```

#### 预期结果
- 返回文章列表数组
- 包含文章 slug、title、tags、category、created_at

### 2. 获取单篇文章

**功能描述**：获取文章的完整内容

#### API 端点
- **URL**: `GET /v1/posts/{slug}`

#### 测试方法

```bash
curl -X GET "http://localhost:3000/v1/posts/chemistry/rdkit-visualization"
```

#### 预期结果
- 返回文章完整内容
- 包含 Markdown 格式的 content
- 包含创建和更新时间

### 3. 记录文章浏览

**功能描述**：记录文章浏览次数（每 10 次刷新写入数据库）

#### API 端点
- **URL**: `POST /v1/posts/{slug}/view`
- **响应**: 204 No Content

#### 测试方法

```bash
curl -X POST "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/view"
```

**使用前端**:
1. 访问任何文章页面
2. 查看浏览计数是否增加

#### 预期结果
- 返回 204 No Content
- Redis 中的浏览计数增加
- 每 10 次浏览写入数据库

### 4. 点赞文章

**功能描述**：点赞或取消点赞文章

#### API 端点
- **点赞**: `POST /v1/posts/{slug}/like`
- **取消点赞**: `DELETE /v1/posts/{slug}/like`
- **Headers**: `Authorization: Bearer <token>`
- **响应**: 204 No Content

#### 测试方法

```bash
# 点赞
curl -X POST "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/like" \
  -H "Authorization: Bearer $TOKEN"

# 取消点赞
curl -X DELETE "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/like" \
  -H "Authorization: Bearer $TOKEN"
```

**使用前端**:
1. 登录后访问文章
2. 点击文章标题下方的"点赞"按钮
3. 验证按钮状态变化
4. 验证点赞数更新

#### 预期结果
- 返回 204 No Content
- 点赞数更新
- 重复点赞返回 409 Conflict
- 未登录返回 401 Unauthorized

### 5. 获取文章统计

**功能描述**：获取文章的统计数据

#### API 端点
- **URL**: `GET /v1/posts/{slug}/stats`

#### 测试方法

```bash
curl -X GET "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/stats"
```

#### 预期结果
- 返回浏览数、点赞数、评论数
- 数据被缓存 5 分钟

---

## 评论功能

### 1. 获取评论列表

**功能描述**：获取文章的所有评论（支持游标分页）

#### API 端点
- **URL**: `GET /v1/posts/{slug}/comments?limit=20&cursor={cursor}`

#### 测试方法

```bash
curl -X GET "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/comments?limit=20"
```

**使用前端**:
1. 访问任何文章页面
2. 滚动到评论区
3. 验证评论显示正确
4. 检查评论的嵌套层级

#### 预期结果
- 返回评论列表
- 评论按时间倒序排列
- 回复评论正确嵌套
- 支持无限滚动加载

### 2. 创建评论

**功能描述**：为文章添加评论或回复

#### API 端点
- **URL**: `POST /v1/posts/{slug}/comments`
- **Headers**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "content": "这是一条评论",
    "parent_id": "uuid-of-parent-comment"  // 可选，用于回复
  }
  ```

#### 测试方法

```bash
# 创建顶级评论
curl -X POST "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一条测试评论"
  }'

# 回复评论
curl -X POST "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一条回复",
    "parent_id": "parent-comment-uuid"
  }'
```

**使用前端**:
1. 登录后访问文章
2. 在评论框输入内容
3. 点击"发表评论"
4. 验证评论立即显示
5. 点击评论的"回复"按钮测试回复功能

#### 预期结果
- 返回 201 Created 和新评论数据
- 评论内容经过 HTML 清理
- 匿名评论用户名显示为 "Anonymous"
- 嵌套深度不超过 5 层

### 3. 点赞评论

**功能描述**：点赞评论

#### API 端点
- **URL**: `POST /v1/comments/{comment_id}/like`
- **Headers**: `Authorization: Bearer <token>`

#### 测试方法

```bash
curl -X POST "http://localhost:3000/v1/comments/{comment_id}/like" \
  -H "Authorization: Bearer $TOKEN"
```

**使用前端**:
1. 登录后访问有评论的文章
2. 点击评论旁的点赞按钮
3. 验证点赞数增加
4. 再次点击验证是否可以取消点赞

#### 预期结果
- 返回 204 No Content
- 点赞数更新
- 重复点赞返回 400 Bad Request

### 4. 取消点赞评论

**功能描述**：取消点赞评论

#### API 端点
- **URL**: `POST /v1/comments/{comment_id}/unlike`
- **Headers**: `Authorization: Bearer <token>`

#### 测试方法

```bash
curl -X POST "http://localhost:3000/v1/comments/{comment_id}/unlike" \
  -H "Authorization: Bearer $TOKEN"
```

#### 预期结果
- 返回 204 No Content
- 点赞数减少
- 未点赞时操作无副作用

---

## 统计功能

### 文章统计数据

**功能描述**：获取文章的浏览、点赞、评论统计

#### API 端点
- **URL**: `GET /v1/posts/{slug}/stats`

#### 测试方法

```bash
curl -X GET "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/stats"
```

#### 预期结果
```json
{
  "slug": "chemistry/rdkit-visualization",
  "view_count": 150,
  "like_count": 5,
  "comment_count": 3,
  "updated_at": "2025-12-26T12:00:00Z"
}
```

---

## 前端功能

### 1. 响应式设计

**功能描述**：支持桌面和移动设备

#### 测试方法
1. 在桌面浏览器访问 `http://localhost:3003`
2. 按 F12 打开开发者工具
3. 点击设备工具栏图标
4. 选择不同设备（iPhone、iPad、Android等）
5. 验证布局自适应

#### 预期结果
- 在移动设备上导航栏变为汉堡菜单
- 文章内容正确换行
- 图片自适应宽度
- 按钮和链接适合触摸操作

### 2. 暗色模式

**功能描述**：支持亮色/暗色主题切换

#### 测试方法
1. 访问任何页面
2. 点击右上角的太阳/月亮图标
3. 验证主题切换
4. 刷新页面验证主题保持

#### 预期结果
- 主题立即切换
- 主题偏好保存到 localStorage
- 所有页面组件正确应用主题

### 3. 文章搜索

**功能描述**：搜索文章标题和内容

#### 测试方法
1. 访问首页
2. 在搜索框输入关键词（如"RDKit"）
3. 按回车或点击搜索
4. 验证搜索结果

#### 预期结果
- 显示匹配的文章
- 高亮搜索关键词
- 支持中英文搜索

### 4. 分类筛选

**功能描述**：按文章分类筛选

#### 测试方法
1. 访问首页
2. 点击分类标签（如"Chemistry"）
3. 验证只显示该分类的文章

#### 预期结果
- URL 更新为 `?category=chemistry`
- 显示分类标题
- 显示该分类的文章列表

### 5. 标签筛选

**功能描述**：按标签筛选文章

#### 测试方法
1. 访问首页
2. 点击文章标签（如"#rdkit"）
3. 验证显示带该标签的所有文章

#### 预期结果
- URL 更新为 `?tag=rdkit`
- 显示相关文章列表
- 标签云显示标签热度

### 6. 化学公式渲染

**功能描述**：渲染 LaTeX 化学公式和分子结构

#### 测试方法
1. 访问 `/chemistry/rdkit-visualization` 或 `/chemistry/test-structure`
2. 验证化学公式正确显示
3. 验证分子结构 2D 图正确渲染
4. 验证交互式分子查看器

#### 预期结果
- 化学公式使用 mhchem 正确渲染
- 分子结构使用 RDKit.js 正确显示
- 支持分子结构交互（缩放、旋转）

### 7. 代码高亮

**功能描述**：Markdown 代码块自动高亮

#### 测试方法
1. 访问包含代码的文章
2. 验证代码块有语法高亮
3. 点击代码块右上角的复制按钮

#### 预期结果
- 代码正确高亮（支持多种语言）
- 行号显示
- 一键复制功能
- 深色主题下代码可读

### 8. 分页功能

**功能描述**：文章列表和评论的分页加载

#### 测试方法
1. 访问首页
2. 滚动到页面底部
3. 点击"加载更多"或翻页按钮
4. 验证新内容加载

#### 预期结果
- 新内容正确追加到页面
- URL 更新（`?page=2`）
- 分页按钮状态正确

---

## 集成测试场景

### 场景 1：完整的用户注册和文章互动流程

```bash
# 1. 注册新用户
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123"
  }'

# 2. 登录获取令牌
RESPONSE=$(curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.access_token')

# 3. 记录浏览
curl -X POST "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/view"

# 4. 点赞文章
curl -X POST "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/like" \
  -H "Authorization: Bearer $TOKEN"

# 5. 发表评论
curl -X POST "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一篇很棒的文章！"
  }'

# 6. 检查统计
curl -X GET "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/stats"

# 7. 登出
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### 场景 2：评论审核流程

```bash
# 1. 管理员登录
ADMIN_RESPONSE=$(curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo2024@test.com",
    "password": "demo123456"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.access_token')

# 2. 获取待审核评论列表
curl -X GET "http://localhost:3000/v1/admin/comments?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. 审核通过评论
curl -X PUT "http://localhost:3000/v1/admin/comments/{comment_id}/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'

# 4. 验证评论在前端显示
# （在浏览器中访问文章页面查看）
```

### 场景 3：用户管理流程

```bash
# 1. 管理员登录
ADMIN_RESPONSE=$(curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo2024@test.com",
    "password": "demo123456"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.access_token')

# 2. 获取用户列表
curl -X GET "http://localhost:3000/v1/admin/users?page=1&page_size=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. 修改用户角色为版主
curl -X PUT "http://localhost:3000/v1/admin/users/{user_id}/role" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "moderator"
  }'

# 4. 删除用户
curl -X DELETE "http://localhost:3000/v1/admin/users/{user_id}" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 性能测试

### 1. 数据库连接池测试

```bash
# 使用 wrk 进行压力测试
wrk -t12 -c400 -d30s --latency \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/v1/posts"
```

预期结果：
- 支持至少 100 个并发连接
- 99% 的请求延迟低于 500ms
- 无连接泄漏

### 2. 缓存性能测试

```bash
# 首次请求（缓存未命中）
time curl -X GET "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/stats"

# 后续请求（缓存命中）
time curl -X GET "http://localhost:3000/v1/posts/chemistry/rdkit-visualization/stats"
```

预期结果：
- 首次请求 > 50ms
- 缓存命中请求 < 10ms

---

## 错误处理测试

### 1. 未认证访问

```bash
# 不带 token 访问需要认证的端点
curl -X GET "http://localhost:3000/v1/auth/me"
```

预期结果：
- 返回 401 Unauthorized
- 返回错误信息：`{"code": 401, "message": "Missing token"}`

### 2. 无效的输入

```bash
# 注册时缺少必填字段
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

预期结果：
- 返回 400 Bad Request
- 返回详细的验证错误信息

### 3. 资源不存在

```bash
# 访问不存在的文章
curl -X GET "http://localhost:3000/v1/posts/non-existent-article"
```

预期结果：
- 返回 404 Not Found
- 返回错误信息：`{"code": 404, "message": "Post not found"}`

---

## 自动化测试脚本

### 创建测试脚本

创建 `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== 用户注册测试 ==="
curl -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }' \
  -w "\n状态码: %{http_code}\n\n"

echo "=== 用户登录测试 ==="
RESPONSE=$(curl -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo2024@test.com",
    "password": "demo123456"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.access_token')
echo "访问令牌: $TOKEN"

echo "=== 获取文章列表测试 ==="
curl -X GET "$BASE_URL/v1/posts?page=1&page_size=10" \
  -w "\n状态码: %{http_code}\n\n"

echo "=== 点赞文章测试 ==="
curl -X POST "$BASE_URL/v1/posts/chemistry/rdkit-visualization/like" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n状态码: %{http_code}\n\n"

echo "=== 获取文章统计测试 ==="
curl -X GET "$BASE_URL/v1/posts/chemistry/rdkit-visualization/stats" \
  -w "\n状态码: %{http_code}\n\n"

echo "=== 发表评论测试 ==="
curl -X POST "$BASE_URL/v1/posts/chemistry/rdkit-visualization/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "自动化测试评论"
  }' \
  -w "\n状态码: %{http_code}\n\n"

echo "=== 用户登出测试 ==="
curl -X POST "$BASE_URL/v1/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\n状态码: %{http_code}\n\n"
```

运行测试：

```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 更多资源

- [API 文档](./API_REFERENCE.md)
- [管理员文档](./admin.md)
- [数据库文档](./database.md)
