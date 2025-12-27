# Admin Panel 快速启动指南

## 🚀 快速启动

### 1. 启动后端

```bash
cd backend

# Windows (PowerShell)
$env:DATABASE_URL="postgresql://blog_user:blog_password@localhost:5432/blog_db"; $env:REDIS_URL="redis://localhost:6379"; $env:JWT_SECRET="dev-secret-key-for-testing-only-32-chars"; $env:ENVIRONMENT="development"; $env:CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007,http://localhost:3008"; $env:SESSION_SECRET="dev-session-secret"; $env:PASSWORD_PEPPER="dev-pepper"; $env:SMTP_HOST="localhost"; $env:SMTP_PORT="587"; $env:SMTP_USERNAME="dev@example.com"; $env:SMTP_PASSWORD="dev-password"; $env:SMTP_FROM="noreply@example.com"; cargo run --bin api
```

### 2. 启动前端

```bash
cd frontend
pnpm dev
```

访问: http://localhost:3000/admin

### 3. 登录

```
邮箱: admin@test.com
密码: xK9#mP2$vL8@nQ5*wR4
```

---

## 📊 管理面板页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 仪表板 | `/admin` | 统计概览 |
| 文章管理 | `/admin/posts` | 18 篇文章 |
| 评论管理 | `/admin/comments` | 16 条评论 |
| 用户管理 | `/admin/users` | 用户列表 |

---

## 🔑 关键修复点

### Refine v5 useList 结构

```typescript
// ✅ 正确用法
const queryResult = useList({ resource: 'admin/posts' })
const data = queryResult.result?.data
const isLoading = queryResult.query?.isPending
```

### 自定义 DataProvider

**文件**: `frontend/lib/providers/refine-data-provider.ts`

- 使用 axios 添加认证拦截器
- 支持多种响应格式（`data`, `posts`, `comments`, `users`）
- 兼容 Refine v5（不使用 HttpError 类）

---

## ⚠️ 常见问题

### CORS 错误

确保后端启动时设置了：
- `ENVIRONMENT="development"`
- `CORS_ALLOWED_ORIGINS` 包含前端端口

### 数据不显示

检查浏览器控制台：
1. Network 标签：API 请求是否返回 200
2. Console 标签：是否有 JavaScript 错误

### 端口被占用

```bash
# 查找占用端口的进程
netstat -ano | findstr ":3000"

# 杀死进程
taskkill /F /PID <PID>
```

---

## 📝 详细文档

完整的修复记录请查看: [REFINE_ADMIN_PANEL_FIX.md](./REFINE_ADMIN_PANEL_FIX.md)
