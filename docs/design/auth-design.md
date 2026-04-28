# 认证与授权设计

> 当前实现：JWT 双令牌（access_token + refresh_token），Authorization Header 优先，HttpOnly Cookie 为辅。中间件检查优先级：Authorization: Bearer → access_token Cookie。Cookie 兜底支持浏览器端简化集成，非主要验证路径。

## 核心原则

- 不用 localStorage 存 JWT
- 使用 Authorization: Bearer Header 传递身份凭证（主路径）
- HttpOnly Cookie 作为浏览器端兜底（次要路径）
- JWT 仅作签名校验（CPU 运算），中间件不查数据库
- 令牌黑名单检查在 handler 层，不在中间件层

## 令牌模型

```
双令牌系统:
  access_token  — 短期（15 分钟），JWT 签名
  refresh_token — 长期（7 天），带上 family_id 支持令牌旋转

存储:
  access_token  → HttpOnly Cookie (access_token) + Authorization Header（优先）
  refresh_token → HttpOnly Cookie (refresh_token)（仅 Cookie，不返回 Body）
```

## 登录流程

```
1. 用户提交凭据 → POST /auth/login
2. 后端验证凭据（Argon2id）
3. 成功 → 签发 access_token(15min) + refresh_token(7天)
4. 返回 JSON (含 access_token、user_info、csrf_token) + 设置两个 HttpOnly Cookie
5. 后续请求: Authorization: Bearer → axum 读取 → extract_token() 决定来源
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

> **⚠️ 计划中，尚未实现** — 以下描述为预期设计，handler 层当前未实际执行黑名单检查。

- 撤销的 access_token 存入 Redis: `blacklist:{token_hash}` → `"1"`，TTL = 剩余有效期
- 检查预期在 auth handler 层（`is_token_blacklisted()`），不在中间件层
- 登出时撤销当前 access_token，同时删除 refresh_token

## 技术决策

| 决策点 | 当前方案 | 计划 |
|--------|---------|------|
| JWT 存储 | HttpOnly Cookie + Authorization Header | 维持双路径 |
| 密码哈希 | Argon2id | 维持 |
| 令牌黑名单 | Redis String `blacklist:{token_hash}` | 计划中，尚未在 handler 层实现 |
| 登录方式 | 密码 + JWT | 远期规划 WebAuthn 无密码 |
| 令牌刷新 | family_id 令牌旋转（防重放） | 维持 |
| 中间件职责 | 仅签名校验，无 I/O | 维持 |

> **WebAuthn 无密码登录** — 尚未实施。当前为纯 JWT 密码方案。
