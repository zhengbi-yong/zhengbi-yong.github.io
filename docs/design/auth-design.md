# 认证与授权设计

> 当前实现：JWT 双令牌（access_token + refresh_token），HttpOnly Cookie 为主，Authorization Header 为辅。

## 核心原则

- 不用 localStorage 存 JWT
- 使用 HttpOnly Cookie 传递身份凭证（主路径）
- 同时兼容 `Authorization: Bearer {token}` Header（调试与第三方集成）
- JWT 仅作签名校验（CPU 运算），中间件不查数据库
- 令牌黑名单检查在 handler 层，不在中间件层

## 令牌模型

```
双令牌系统:
  access_token  — 短期（15 分钟），JWT 签名
  refresh_token — 长期（7 天），带上 family_id 支持令牌旋转

存储:
  access_token  → HttpOnly Cookie (access_token) + 可选 Authorization Header
  refresh_token → HttpOnly Cookie (refresh_token) + 可选 Body 返回
```

## 登录流程

```
1. 用户提交凭据 → POST /auth/login
2. 后端验证凭据（Argon2id）
3. 成功 → 签发 access_token(15min) + refresh_token(7天)
4. 返回 JSON (含 access_token) + 设置两个 HttpOnly Cookie
5. 后续请求: Cookie → axum 读取 → extract_token() 决定来源
```

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

## CSRF 保护

```
使用 HMAC-SHA256 双提交 Cookie 模式 (Double Submit Cookie)：

Token 结构:
  HMAC-CSRF Token = base64(nonce(16B) || timestamp(8B) || HMAC-SHA256(nonce || timestamp))

存储:
  csrf_token Cookie  → HttpOnly; SameSite=Lax; Path=/; Max-Age=3600（浏览器自动发送）
  X-CSRF-Token Header → 前端通过 JS 读取同值后附加（双提交验证）

验证规则:
  GET | HEAD | OPTIONS → 跳过验证（安全方法）
  POST | PUT | PATCH | DELETE → 必须携带有效 CSRF Token
  后端从 Cookie 提取 token，对 Header 中的 token 执行 HMAC 签名比对
  验证通过后自动轮换（生成新 token），每次响应刷新 Cookie

防重放:
  Redis 记录已使用的 nonce: `csrf:nonce:{nonce_base64}` → TTL = token 有效期
  同一 nonce 不可重复使用，防止 token 泄露后的重放攻击

撤销:
  revoke_csrf_token() 将 nonce 写入 Redis，使后续携带该 token 的请求失效
  登出时同时撤销当前 CSRF token
```

## 密码重置流程

```
终端用户                          后端                          数据库
   │                               │                              │
   │  POST /auth/forgot-password    │                              │
   │  { email }                     │                              │
   │──────────────────────────────▶│                              │
   │                               │  SELECT user by email        │
   │                               │─────────────────────────────▶│
   │                               │◀─────────────────────────────│
   │                               │  生成 UUID v4 重置令牌       │
   │                               │  令牌哈希后写入 DB            │
   │                               │  INSERT/UPDATE                │
   │                               │  password_reset_tokens        │
   │                               │  (token_hash, expires_at=1h) │
   │                               │─────────────────────────────▶│
   │                               │  发送邮件（含明文 token URL） │
   │  返回统一消息（防邮箱枚举）    │                              │
   │◀──────────────────────────────│                              │
   │                               │                              │
   │  POST /auth/reset-password    │                              │
   │  { token, new_password }      │                              │
   │──────────────────────────────▶│                              │
   │                               │  SELECT password_reset_tokens│
   │                               │  WHERE token_hash = $1       │
   │                               │    AND expires_at > NOW()    │
   │                               │─────────────────────────────▶│
   │                               │◀─────────────────────────────│
   │                               │  校验新密码复杂度            │
   │                               │  Argon2id 哈希新密码         │
   │                               │  开启事务:                   │
   │                               │    UPDATE users SET          │
   │                               │      password_hash = $1      │
   │                               │    DELETE password_reset_tokens│
   │                               │    WHERE user_id = $1        │
   │                               │─────────────────────────────▶│
   │  返回成功消息                 │                              │
   │◀──────────────────────────────│                              │
   │                               │                              │

关键设计:
  - 令牌有效期 1 小时（expires_at = NOW() + INTERVAL '1 hour'）
  - 使用 ON CONFLICT 避免同一用户重复请求（upsert）
  - 重置后立即清理已用令牌
  - 请求阶段统一返回"如果该邮箱已注册…"消息，防止邮箱枚举攻击
  - 新密码经过 PasswordValidator 校验
  - 密码更新和令牌清理在同一个数据库事务中执行
```

## 技术决策

| 决策点 | 当前方案 | 计划 |
|--------|---------|------|
| JWT 存储 | HttpOnly Cookie + Authorization Header | 维持双路径 |
| 密码哈希 | Argon2id | 维持 |
| 令牌黑名单 | Redis String `blacklist:{token_hash}` | 维持 |
| 登录方式 | 密码 + JWT | 远期规划 WebAuthn 无密码 |
| 令牌刷新 | family_id 令牌旋转（防重放） | 维持 |
| JWT 角色声明 | **不在 JWT 中包含 `role`**。中间件硬编码 `role: "user"`，按需调用 `load_user_from_db()` | 维持（避免角色变更滞后） |
| 中间件职责 | 仅签名校验，无 I/O | 维持 |

> **Role 不在 JWT 中的设计决策**: JWT claims 中的角色信息在令牌有效期内无法变更（直到 token 过期/刷新）。若用户的角色在 15 分钟 access_token 有效期内被管理员修改（例如 user → admin），JWT 中的旧角色仍会生效，造成安全风险。因此，`role` 不由 JWT 携带，中间件构造 `AuthUser` 时使用占位值 `"user"`，角色验证在具体 handler 中通过 `load_user_from_db()` 从数据库实时获取。此设计牺牲了一次数据库查询，换取了角色变更的实时一致性。

> **WebAuthn 无密码登录** — 尚未实施。当前为纯 JWT 密码方案。
