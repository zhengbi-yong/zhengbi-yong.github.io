# MSW (Mock Service Worker) 集成指南

## 概述

MSW (Mock Service Worker) 是一个 API mocking 库,通过拦截网络请求来模拟 API 响应。相比传统的 mock 方法,MSW 提供了更真实的测试体验。

**优势**:
- ✅ 真实的网络请求拦截
- ✅ 与实际 API 调用代码完全一致
- ✅ 可在开发环境手动测试
- ✅ 支持复杂场景(延迟、错误、分页等)
- ✅ 类型安全

## 安装

```bash
pnpm add -D msw
```

## 项目结构

```
frontend/src/mocks/
├── handlers.ts              # 统一导出所有 handlers
├── server.ts                # Node.js server (Vitest/Node.js)
├── browser.ts               # Browser worker (开发环境手动测试)
└── handlers/
    ├── auth.ts              # 认证 API handlers
    └── blog.ts              # 博客 API handlers
```

## 使用方法

### 1. 测试环境 (自动集成)

MSW 已在 `tests/setup.ts` 中全局配置,所有测试自动启用:

```typescript
// tests/setup.ts
import { server } from '../src/mocks/server'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
```

### 2. 编写使用 MSW 的测试

#### 示例 1: 使用默认 handlers

```typescript
import { describe, it, expect } from 'vitest'
import { authProvider } from '@/lib/providers/refine-auth-provider'

describe('Auth Provider (MSW)', () => {
  it('should login successfully', async () => {
    // MSW 会拦截 /v1/auth/login 请求并返回预设的 mock 数据
    const result = await authProvider.login({
      email: 'admin@example.com',
      password: 'password123',
    })

    expect(result.success).toBe(true)
  })
})
```

#### 示例 2: 覆盖默认 handlers

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

describe('Error Handling', () => {
  it('should handle 500 error', async () => {
    // 覆盖默认 handler
    server.use(
      http.post('http://localhost:4010/v1/auth/login', () => {
        return HttpResponse.json(
          { success: false, error: 'Internal Server Error' },
          { status: 500 },
        )
      }),
    )

    const result = await authProvider.login({
      email: 'admin@example.com',
      password: 'password123',
    })

    expect(result.success).toBe(false)
  })
})
```

#### 示例 3: 测试网络延迟

```typescript
it('should show loading state during API call', async () => {
  server.use(
    http.post('http://localhost:4010/v1/auth/login', async () => {
      // 模拟 2 秒延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      return HttpResponse.json({ success: true, data: { user: {} } })
    }),
  )

  // 测试 loading 状态...
})
```

### 3. 可用的 API Handlers

#### 认证 API (`/v1/auth/*`)

**Login**
```typescript
POST /v1/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}

// Success Response
{
  "success": true,
  "data": {
    "access_token": "mock-jwt-token-...",
    "refresh_token": "refresh-mock-jwt-token-...",
    "user": { "id": "1", "username": "admin", "email": "admin@example.com", "role": "admin" }
  }
}

// Error Response (401)
{
  "success": false,
  "error": { "code": "INVALID_CREDENTIALS", "message": "邮箱或密码错误", "type": "401" }
}
```

**Register**
```typescript
POST /v1/auth/register
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

**Get Current User**
```typescript
GET /v1/auth/me
Headers: Authorization: Bearer {token}
```

**Logout**
```typescript
POST /v1/auth/logout
```

**Refresh Token**
```typescript
POST /v1/auth/refresh
{
  "refresh_token": "refresh-..."
}
```

#### 博客 API (`/v1/posts/*`)

**List Posts**
```typescript
GET /v1/posts?page=1&limit=20&status=published&tag=react&search=query

{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Get Single Post**
```typescript
GET /v1/posts/:slug
```

**Create Post**
```typescript
POST /v1/posts
{
  "title": "New Post",
  "content": "...",
  "status": "published"
}
```

**Update Post**
```typescript
PUT /v1/posts/:id
```

**Delete Post**
```typescript
DELETE /v1/posts/:id
```

**Comments**
```typescript
GET /v1/posts/:slug/comments
POST /v1/posts/:slug/comments
DELETE /v1/comments/:id
```

**Tags**
```typescript
GET /v1/tags
```

### 4. 测试数据工厂

使用预定义的工厂函数生成测试数据:

```typescript
import {
  createUserFactory,
  createPostFactory,
  createCommentFactory,
  createAuthToken,
  UserPresets,
} from '@/tests/lib/factories'

// 创建用户
const admin = createUserFactory({ role: 'admin' })
const user = createUserFactory({ username: 'testuser' })

// 使用预设
const verifiedUser = UserPresets.verifiedUser()

// 创建文章
const post = createPostFactory({
  title: 'Test Post',
  status: 'published',
})

// 创建评论
const comment = createCommentFactory({
  post_slug: post.slug,
  content: 'Great article!',
})

// 创建 token
const token = createAuthToken()
```

## 开发环境手动测试

### 启用 MSW Browser Worker

1. 设置环境变量:
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK=true
```

2. 在 `layout.tsx` 中导入 worker:
```typescript
if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
  import('@/mocks/browser')
}
```

3. 启动开发服务器:
```bash
pnpm dev
```

现在所有 API 请求都会被 MSW 拦截并返回 mock 数据。

## 最佳实践

### 1. 测试隔离

每个测试后自动重置 handlers:
```typescript
afterEach(() => {
  server.resetHandlers() // 恢复默认 handlers
})
```

### 2. 错误场景测试

```typescript
it('should handle network error', () => {
  server.use(
    http.post('/api/login', () => {
      return HttpResponse.error() // 网络错误
    }),
  )
  // 测试错误处理...
})

it('should handle 500 error', () => {
  server.use(
    http.post('/api/login', () => {
      return HttpResponse.json(
        { error: 'Server Error' },
        { status: 500 },
      )
    }),
  )
  // 测试错误处理...
})
```

### 3. 条件性响应

```typescript
server.use(
  http.post('/api/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'error@example.com') {
      return HttpResponse.json({ error: 'Forced error' }, { status: 400 })
    }
    return HttpResponse.json({ success: true })
  }),
)
```

### 4. 动态 handlers

```typescript
let callCount = 0
server.use(
  http.get('/api/data', () => {
    callCount++
    if (callCount === 1) {
      return HttpResponse.json({ data: [] }, { status: 200 })
    }
    return HttpResponse.json({ data: ['item1', 'item2'] })
  }),
)
```

## 调试技巧

### 1. 查看所有请求

```typescript
server.printHandlers() // 打印所有注册的 handlers
```

### 2. 记录请求

```typescript
server.use(
  http.post('/api/login', async ({ request }) => {
    console.log('Request:', await request.json())
    return HttpResponse.json({ success: true })
  }),
)
```

### 3. 禁用特定 handler

```typescript
server.use(
  http.post('/api/login', () => {
    // 不返回 response,请求会到达真实 API
    return passthrough()
  }),
)
```

## 性能优化

MSW 默认添加 50-100ms 延迟模拟真实网络。可以在 handlers 中调整:

```typescript
http.get('/api/fast', () => {
  return HttpResponse.json({ data: [] }, { delay: 0 }) // 立即返回
})

http.get('/api/slow', () => {
  return HttpResponse.json({ data: [] }, { delay: 5000 }) // 5 秒延迟
})
```

## 常见问题

### Q: 测试运行缓慢怎么办?

A: 减少 handlers 中的延迟时间:
```typescript
// 修改 handlers/auth.ts 和 handlers/blog.ts
ctx.delay(0) // 移除延迟
```

### Q: 如何测试未定义的 API 端点?

A: 使用 `onUnhandledRequest: 'bypass'` 让请求通过到真实 API,或在测试中临时添加 handler:
```typescript
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})
```

### Q: MSW 与 vi.mock() 冲突?

A: 移除 `vi.mock()` 调用,MSW 会拦截实际的 `fetch`/`XMLHttpRequest`。

### Q: 如何 mock 文件上传?

A: MSW 可以处理 multipart/form-data:
```typescript
http.post('/api/upload', async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get('file') as File
  return HttpResponse.json({ url: '/uploads/file.jpg' })
})
```

## 相关资源

- [MSW 官方文档](https://mswjs.io/)
- [Testing Library 文档](https://testing-library.com/)
- [Vitest 文档](https://vitest.dev/)
- 项目示例: `tests/lib/providers/refine-auth-provider-msw.test.ts`
