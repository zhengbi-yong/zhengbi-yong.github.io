# 认证与授权设计

> 当前实现：JWT 双令牌（access_token + refresh_token），HttpOnly Cookie 为主，Authorization Header 为辅。
> 注：生产环境中所有路由前缀为 `/api/v1/`，例如实际路径为 `/api/v1/auth/login`。

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

## 注册流程

```
1. 用户提交注册信息 → POST /auth/register
   { email, username, password }
2. 后端校验输入（邮箱格式、用户名规则、密码复杂度）
3. 检查邮箱和用户名唯一性
4. Argon2id 哈希密码
5. 创建用户记录（status='active'，email_verified=false）
6. 签发 access_token(15min) + refresh_token(7天)
7. 返回 JSON（含 access_token）+ 设置两个 HttpOnly Cookie
```

> 注册成功后自动登录（即签发令牌）。若需邮箱验证，待邮件系统就绪后补充 `email_verified` 流程。

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

> ⚠️ `optional_auth_middleware` 定义在 `api/src/middleware/auth.rs` 中，但当前**未挂载到任何路由**——属于死代码。设计初衷是为公开路由提供可选的个性化数据（如根据登录状态展示不同视图），但尚未实现路由级接入。

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

## 限流

```
全局限流策略（Lua 脚本原子执行，双窗口：秒级 + 分钟级）：

密钥格式:
  rl:s:{ip}:{route_hash}:{second_bucket}  → 秒级窗口
  rl:m:{ip}:{route_hash}:{minute_bucket}  → 分钟级窗口

各端点限额（默认值，可通过环境变量覆盖）:
  POST /auth/login, /auth/register  → 100 次/分钟 + 5 次/秒  (RATE_LIMIT_AUTH_RPM / RATE_LIMIT_AUTH_RPS)
  POST /posts/*/view                 → 1000 次/分钟 + 10 次/秒 (RATE_LIMIT_VIEW_RPM / RATE_LIMIT_VIEW_RPS)
  POST /posts/*/comments             → 20 次/分钟 + 2 次/秒   (RATE_LIMIT_COMMENT_RPM / RATE_LIMIT_COMMENT_RPS)
  其他                               → 6000 次/分钟 + 100 次/秒 (RATE_LIMIT_DEFAULT_RPM / RATE_LIMIT_DEFAULT_RPS)

失败模式（可配置）:
  fail_open  → 限流后端不可用时放行（默认，保证可用性）
  fail_close → 限流后端不可用时拒绝（安全优先）
```

> 限流使用 Redis Lua 脚本保证原子性，非简单 INCR+EXPIRE。每个请求同时检查秒级和分钟级窗口，任一窗口超限即拒绝。TTL：秒级窗口 2 秒，分钟级窗口 60 秒。
>
> 以上限额均为**默认值**，可通过环境变量覆盖：
> - `RATE_LIMIT_AUTH_RPM` / `RATE_LIMIT_AUTH_RPS` — 认证端点（登录/注册）每分钟/每秒允许次数
> - `RATE_LIMIT_VIEW_RPM` / `RATE_LIMIT_VIEW_RPS` — 查看文章每分钟/每秒允许次数
> - `RATE_LIMIT_COMMENT_RPM` / `RATE_LIMIT_COMMENT_RPS` — 评论端点每分钟/每秒允许次数
> - `RATE_LIMIT_DEFAULT_RPM` / `RATE_LIMIT_DEFAULT_RPS` — 其他所有端点每分钟/每秒允许次数

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
  ⚠️ **已知差距**：`revoke_csrf_token()` 函数已实现（`api/src/middleware/csrf.rs`），但登出 handler **未调用它**——登出时不会撤销当前 CSRF token。这意味着登出后 CSRF token 在剩余有效期内仍可被使用。这是一个已知安全差距，需后续修复。

⚠️ 已知限制 — 当前 CSRF 仅应用于 admin 路由（admin_routes、post_admin_routes、comment_admin_routes、admin_team_members_routes），未覆盖所有 state-changing 路由（如公开评论提交）。这是一个已知差距，后续应推广到所有非 GET|HEAD|OPTIONS 请求。
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
