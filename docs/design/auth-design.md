# 认证与授权设计

> 当前实现：JWT 双令牌（access_token + refresh_token），HttpOnly Cookie 为主，Authorization Header 为辅。
> CSRF 保护：双重提交 Cookie 模式（HMAC-SHA256 签名 + Redis nonce 放重放）。

## 核心原则

- 不用 localStorage 存 JWT
- 使用 HttpOnly Cookie 传递身份凭证（主路径）
- 同时兼容 `Authorization: Bearer {token}` Header（调试与第三方集成）
- JWT 仅作签名校验（CPU 运算），中间件不查数据库
- 令牌黑名单检查在 handler 层，不在中间件层
- 登出时不检查黑名单，直接撤销 DB 中的 refresh token 并清空 Cookie

## 令牌模型

```
双令牌系统:
  access_token  — 短期（15 分钟），JWT 签名
  refresh_token — 长期（7 天），带上 family_id 支持令牌旋转

存储:
  access_token  → HttpOnly Cookie (access_token) + 可选 Authorization Header
  refresh_token → HttpOnly Cookie (refresh_token) + 可选 Body 返回
```

## CSRF 保护（双重提交 Cookie）

| Cookie | HttpOnly | 用途 |
|--------|----------|------|
| `csrf_token` | `true` | 浏览器自动通过 Cookie header 发送，后端验证 |
| `XSRF-TOKEN` | `false` | JavaScript 读取后通过 `X-CSRF-Token` header 提交 |

- 使用 **HMAC-SHA256 签名**验证 token 真实性（非简单 UUID 校验）
- Token 结构：`base64(nonce(16B) || timestamp(8B) || signature(32B))`
- **Nonce 一次有效**：Redis `SET NX` 放重放检测（burn-after-reading）
- Token 有效期：1 小时（基于 timestamp 新鲜度检查）
- CSRF 中间件仅应用于状态改变操作（POST / PUT / PATCH / DELETE）
- 每个请求验证通过后自动**刷新 CSRF token**（新 nonce 通过 Set-Cookie 发放）

### 前端集成

```javascript
// 1. 登录后浏览器自动获得 csrf_token + XSRF-TOKEN cookie
// 2. 发写请求时读取 XSRF-TOKEN cookie 并设为 header
const xsrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

fetch('/api/...', {
  method: 'POST',
  credentials: 'include',
  headers: { 'X-CSRF-Token': xsrfToken, /* ... */ },
  body: JSON.stringify(data),
});
```

## 登录流程

```
1. 用户提交凭据 → POST /auth/login
2. 后端验证凭据（Argon2id）
3. 成功 → 签发 access_token(15min) + refresh_token(7天)
4. 返回 JSON (含 access_token) + 设置三个 HttpOnly Cookie
5. 后续请求: Cookie → axum 读取 → extract_token() 决定来源
```

## Cookie 安全设置

所有身份 Cookie 使用以下安全属性：

| 属性 | 生产环境 | 开发环境 |
|------|---------|---------|
| `HttpOnly` | `true` | `true` |
| `SameSite` | `Lax` | `Lax` |
| `Secure` | `true` (需要 HTTPS) | `false` (允许 HTTP) |
| `Path` | `/` | `/` |

- **生产环境**：`Secure=true` 配合 HTTPS，`SameSite=Lax` 防止 CSRF
- **开发环境**：`Secure=false`（localhost 一般为 HTTP），`SameSite=Lax`
- **不使用 `SameSite=None`**：因为浏览器强制要求 `Secure`，而开发环境是 HTTP
- **前端**通过 `credentials: 'include'` 自动携带这些 Cookie
- XSRF-TOKEN Cookie 唯一例外：`HttpOnly=false`（前端 JS 需要读取它发 header）

## 中间件设计

### 认证中间件

```rust
pub async fn auth_middleware(
    request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    // 1. 从 Authorization: Bearer 提取 Token（优先）
    // 2. 若没有则从 access_token Cookie 提取
    // 3. 验证 JWT 签名和过期时间（纯 CPU，无 I/O）
    // 4. 注入 AuthUser 到请求扩展
    // 注: 不查 Redis 黑名单，不查数据库
}
```

### 可选认证（不强制登录）

```rust
pub async fn optional_auth_middleware(
    request: Request,
    next: Next,
) -> Response {
    // 尝试解析 token，失败也继续
    // 注入 Option<AuthUser>
}
```

## 中间件职责边界

### 中间件只做
- JWT 签名验证（HMAC-SHA256，CPU 运算）
- 令牌过期检查
- 将 `AuthUser` 注入 Extension
- **不做任何 I/O**（不查 Redis、不查数据库）

### 中间件不做
- ❌ 数据库查询（用户权限、封禁状态）
- ❌ Redis 黑名单检查（在 handler/auth.rs 中做）
- ❌ 外部 API 调用
- ❌ 复杂业务逻辑

## 令牌黑名单

- 撤销的 access_token 存入 Redis: `blacklist:{token_hash}` → `"1"`，TTL = 剩余有效期
- 检查在 auth handler 层（`is_token_blacklisted()`），不在中间件层
- 登出时撤销当前 access_token，同时删除 refresh_token

### ⚠️ 死代码警告：令牌黑名单

黑名单函数（`is_token_blacklisted`, `blacklist_token`, `blacklist_all_user_tokens`）定义在
`backend/crates/api/src/middleware/auth.rs` 中，但**未在任何 handler 中实际调用**：

| 函数 | 定义位置 | 调用者 |
|------|---------|--------|
| `is_token_blacklisted()` | `middleware/auth.rs:129` | ❌ 未被调用 |
| `blacklist_token()` | `middleware/auth.rs:155` | ❌ 未被调用 |
| `blacklist_all_user_tokens()` | `middleware/auth.rs:184` | ✅ 仅在 `admin.rs:681`（管理员强制登出用户） |

**现状**：
- 登出 handler（`routes/auth.rs:493`）直接撤销 DB 中的 refresh token 并清空 Cookie，**不调用黑名单**
- 刷新 token 时通过 family_id 令牌旋转防重放，**不查黑名单**
- `load_user_from_db()` 是活跃代码，由 admin handler 按需调用

## 技术决策

| 决策点 | 当前方案 | 计划 |
|--------|---------|------|
| JWT 存储 | HttpOnly Cookie + Authorization Header | 维持双路径 |
| 密码哈希 | Argon2id | 维持 |
| 令牌黑名单 | Redis String `blacklist:{token_hash}` | 维持 |
| 登录方式 | 密码 + JWT | 远期规划 WebAuthn 无密码 |
| 令牌刷新 | family_id 令牌旋转（防重放） | 维持 |
| 中间件职责 | 仅签名校验，无 I/O | 维持 |

> **WebAuthn 无密码登录** — 尚未实施。当前为纯 JWT 密码方案。

## API 端点一览

| 端点 | 方法 | 认证方式 | 说明 |
|------|------|---------|------|
| `/auth/register` | POST | 无 | 用户注册 |
| `/auth/login` | POST | 无 | 登录（返回 access_token + 设置 Cookie） |
| `/auth/refresh` | POST | Cookie only 🔒 | 刷新 access token，**不接受 Authorization header**，仅从 `refresh_token` cookie 获取 |
| `/auth/logout` | POST | Cookie only 🔒 | 登出，**不接受 Authorization header**，仅从 `refresh_token` cookie 获取 |
| `/auth/me` | GET | Bearer / Cookie | 获取当前用户信息 |
| `/auth/forgot-password` | POST | 无 | 发送密码重置邮件（始终返回成功，防邮箱枚举） |
| `/auth/reset-password` | POST | 无 | 使用重置令牌更新密码，同时撤销所有 refresh token |

> 🔒 `/auth/refresh` 和 `/auth/logout` 只使用 Cookie 的原因：这些操作需要操作 refresh_token 对应的 DB 记录，
> 而 refresh_token 仅在 Cookie 中传递，不会出现在 JSON body 或 Authorization header 中。
> 只有 `/auth/me` 和需要授权的业务端点才同时支持 Bearer header 和 Cookie。

## AST 转换调用位置

> 注：`ast-conversion.md` 中记载的调用位置已更正。
> AST 转换（`tiptap_json_to_mdx`）的实际调用位置为：
> - `backend/crates/api/src/routes/posts.rs` — 文章读取 fallback 转换
> - `backend/crates/api/src/routes/mdx_sync.rs` — MDX 同步管线
> - `backend/crates/api/src/routes/articles.rs` — 文章写入时转换
>
> **并非 `auth.rs`**，`auth.rs` 中不涉及任何文章 AST 操作。
