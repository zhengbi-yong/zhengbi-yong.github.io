# Mock Server 使用说明

## ✅ 问题已解决

`pnpm mock` 命令现在可以正常工作了！

---

## 🚀 快速开始

### 启动 Mock Server

```bash
cd frontend
pnpm mock
```

Mock Server 将在 **http://localhost:4010** 启动

你会看到类似的输出：
```
[16:31:59] » [CLI] ►  start     Prism is listening on http://127.0.0.1:4010
```

### 停止 Mock Server

按 `Ctrl+C` 停止服务器

---

## 💡 使用场景

### 场景 1：前端独立开发（不依赖后端）

**终端 1 - 启动 Mock Server**：
```bash
cd frontend
pnpm mock
```

**终端 2 - 启动前端开发服务器**：
```bash
cd frontend
NEXT_PUBLIC_USE_MOCK=true pnpm dev
```

现在前端会使用 Mock Server 的数据，无需等待后端完成！

### 场景 2：测试 API 响应格式

```bash
# 确保 Mock Server 正在运行
curl http://localhost:4010/posts
curl http://localhost:4010/posts/example-post
curl -X POST http://localhost:4010/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 场景 3：运行契约测试

```bash
cd frontend
CI=true pnpm exec playwright test e2e/api-contract.spec.ts
```

---

## 🔧 可用的 API 端点

Mock Server 支持以下端点：

### 文章相关
- `GET /posts` - 文章列表（支持分页）
- `GET /posts/{slug}` - 文章详情

### 认证相关
- `POST /auth/login` - 用户登录

### 示例响应

#### GET /posts
```json
{
  "success": true,
  "data": {
    "items": [{
      "id": "string",
      "slug": "string",
      "title": "string",
      "excerpt": "string",
      "created_at": "2019-08-24T14:15:22Z"
    }],
    "meta": {
      "page": 0,
      "limit": 0,
      "total": 0,
      "total_pages": 0,
      "has_next": true,
      "has_prev": true
    }
  },
  "message": "string"
}
```

#### GET /posts/{slug}
```json
{
  "success": true,
  "data": {
    "id": "string",
    "slug": "string",
    "title": "string",
    "content": "string",
    "excerpt": "string",
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z"
  },
  "message": "string"
}
```

#### POST /auth/login
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "user": {
      "id": "string",
      "email": "user@example.com",
      "username": "string"
    }
  }
}
```

---

## 🐛 常见问题

### Q1: 端口 4010 被占用

**错误信息**：
```
listen EADDRINUSE: address already in use 127.0.0.1:4010
```

**解决方案**：

**Windows**：
```bash
# 查找占用端口的进程
netstat -ano | findstr ":4010"

# 杀掉进程（替换 <PID> 为实际进程 ID）
taskkill /F /PID <PID>
```

**Linux/Mac**：
```bash
lsof -ti:4010 | xargs kill -9
```

### Q2: OpenAPI 规范文件不存在

**错误信息**：
```
⚠️  OpenAPI spec not found at: .../frontend/openapi.json
```

**解决方案**：
```bash
# 从 backend 复制 OpenAPI 规范
cp backend/openapi/openapi.json frontend/openapi.json
```

### Q3: prism 命令未找到

**错误信息**：
```
Command "mock" not found
```

**解决方案**：
```bash
# 安装依赖
cd frontend
pnpm install

# 确保 @stoplight/prism-cli 已安装
pnpm add -D @stoplight/prism-cli@5.14.2
```

---

## 📝 相关命令

| 命令 | 说明 |
|------|------|
| `pnpm mock` | 启动 Mock Server |
| `pnpm generate:types` | 从 OpenAPI 生成 TypeScript 类型 |
| `NEXT_PUBLIC_USE_MOCK=true pnpm dev` | 使用 Mock 启动前端开发服务器 |
| `CI=true pnpm exec playwright test e2e/api-contract.spec.ts` | 运行契约测试 |

---

## 🎯 下一步

1. **开发新功能**
   - 参考 [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
   - 查看前端开发流程

2. **生成类型**
   ```bash
   cd frontend
   pnpm generate:types
   ```

3. **运行测试**
   ```bash
   cd frontend
   pnpm test                    # 单元测试
   CI=true pnpm exec playwright test e2e/api-contract.spec.ts  # 契约测试
   ```

4. **连接真实后端**
   - 停止 Mock Server（Ctrl+C）
   - 启动后端：`cd backend && cargo run --bin api`
   - 启动前端：`cd frontend && pnpm dev`

---

## 💡 提示

- Mock Server 基于 OpenAPI 规范自动生成响应
- 修改 `openapi.json` 后需要重启 Mock Server
- Mock Server 支持所有标准 HTTP 方法（GET, POST, PUT, DELETE 等）
- 可以使用任何 HTTP 客户端测试（curl, Postman, 浏览器等）

---

**需要帮助？**
- 查看 [FRONTEND_BACKEND_GUIDE.md](../FRONTEND_BACKEND_GUIDE.md)
- 查看 [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- 提交 GitHub Issue
