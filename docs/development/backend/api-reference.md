# 后端API参考文档

## 基础信息

- **API地址**: `http://localhost:3000`
- **API版本**: v1
- **基础路径**: `/api/v1`

## 认证方式

大多数需要认证的接口使用 `Bearer Token` 认证：

```bash
Authorization: Bearer <access_token>
```

---

## API端点列表

### 🔍 健康检查与监控

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/healthz` | 基础健康检查 | ❌ |
| GET | `/healthz/detailed` | 详细健康检查（含数据库、Redis状态） | ❌ |
| GET | `/readyz` | 就绪检查 | ❌ |
| GET | `/metrics` | Prometheus指标 | ❌ |

**示例:**
```bash
# 基础健康检查
curl http://localhost:3000/healthz

# 响应
{"status":"healthy","timestamp":"2025-12-25T10:30:45.259087199Z","version":"0.1.0","uptime_seconds":5,"services":{}}
```

---

### 🔐 用户认证

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/v1/auth/register` | 用户注册 | ❌ |
| POST | `/v1/auth/login` | 用户登录 | ❌ |
| POST | `/v1/auth/refresh` | 刷新访问令牌 | ❌ |
| POST | `/v1/auth/logout` | 用户登出 | ❌ |
| GET | `/v1/auth/me` | 获取当前用户信息 | ✅ |

#### 1. 用户注册

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "your_password123"
  }'
```

**响应:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "profile": {},
    "email_verified": false
  }
}
```

#### 2. 用户登录

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password123"
  }'
```

#### 3. 获取当前用户信息

```bash
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

#### 4. 刷新令牌

```bash
curl -X POST http://localhost:3000/v1/auth/refresh \
  --cookie "refresh_token=<refresh_token>"
```

#### 5. 用户登出

```bash
curl -X POST http://localhost:3000/v1/auth/logout \
  --cookie "refresh_token=<refresh_token>"
```

---

### 📝 文章相关

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/v1/posts/{slug}/stats` | 获取文章统计信息 | ❌ |
| POST | `/v1/posts/{slug}/view` | 记录文章浏览 | ❌ |
| POST | `/v1/posts/{slug}/like` | 点赞文章 | ✅ |
| DELETE | `/v1/posts/{slug}/like` | 取消点赞 | ✅ |

#### 1. 获取文章统计

```bash
curl http://localhost:3000/v1/posts/hello-world/stats
```

**响应:**
```json
{
  "slug": "hello-world",
  "views": 100,
  "like_count": 5
}
```

#### 2. 记录文章浏览

```bash
curl -X POST http://localhost:3000/v1/posts/hello-world/view
```

#### 3. 点赞文章

```bash
curl -X POST http://localhost:3000/v1/posts/hello-world/like \
  -H "Authorization: Bearer <access_token>"
```

#### 4. 取消点赞

```bash
curl -X DELETE http://localhost:3000/v1/posts/hello-world/like \
  -H "Authorization: Bearer <access_token>"
```

---

### 💬 评论相关

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| GET | `/v1/posts/{slug}/comments` | 获取文章评论列表 | ❌ |
| POST | `/v1/posts/{slug}/comments` | 创建评论 | ✅ |
| POST | `/v1/comments/{id}/like` | 点赞评论 | ✅ |

#### 1. 获取评论列表

```bash
curl http://localhost:3000/v1/posts/hello-world/comments
```

**响应:**
```json
{
  "comments": [
    {
      "id": "comment-uuid",
      "content": "这是一条评论",
      "html_sanitized": "<p>这是一条评论</p>",
      "user": {
        "username": "johndoe",
        "profile": {}
      },
      "created_at": "2025-12-25T10:00:00Z",
      "like_count": 0,
      "replies": []
    }
  ],
  "next_cursor": null
}
```

#### 2. 创建评论

```bash
curl -X POST http://localhost:3000/v1/posts/hello-world/comments \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一条很棒的评论！",
    "parent_id": null
  }'
```

**创建回复评论:**
```bash
curl -X POST http://localhost:3000/v1/posts/hello-world/comments \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "我同意你的观点！",
    "parent_id": "parent-comment-uuid"
  }'
```

#### 3. 点赞评论

```bash
curl -X POST http://localhost:3000/v1/comments/{comment_id}/like \
  -H "Authorization: Bearer <access_token>"
```

---

## 响应格式

### 成功响应
- 状态码: `200 OK`, `201 Created`
- Content-Type: `application/json`

### 错误响应
```json
{
  "code": 400,
  "message": "错误描述"
}
```

常见HTTP状态码：
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `429` - 请求过于频繁（限流）
- `500` - 服务器内部错误

---

## 使用测试脚本

项目提供了一个交互式测试脚本：

```bash
cd backend
./test_api.sh
```

或者直接运行所有测试：

```bash
./test_api.sh all
```

---

## 完整使用示例

```bash
# 1. 注册新用户
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }')

# 提取 access_token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')

# 2. 获取用户信息
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. 获取文章统计
curl http://localhost:3000/v1/posts/hello-world/stats

# 4. 记录浏览
curl -X POST http://localhost:3000/v1/posts/hello-world/view

# 5. 点赞文章
curl -X POST http://localhost:3000/v1/posts/hello-world/like \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 6. 创建评论
curl -X POST http://localhost:3000/v1/posts/hello-world/comments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一条测试评论！"
  }'

# 7. 获取评论列表
curl http://localhost:3000/v1/posts/hello-world/comments
```
