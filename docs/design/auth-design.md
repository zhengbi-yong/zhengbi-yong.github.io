# 认证与授权设计

> 当前实现：JWT 双令牌（access_token + refresh_token），HttpOnly Cookie 为主，Authorization Header 为辅。

## 核心原则

- 不用 localStorage 存 JWT
- 使用 HttpOnly Cookie 传递身份凭证（主路径）
- 同时兼容 `Authorization: Bearer {token}` Header（调试与第三方集成）
- JWT 仅作签名校验（CPU 运算），中间件不查数据库
- 令牌黑名单检查在 handler 层，不在中间件层

## 密码策略

- 最小长度：12 个字符
- 复杂度要求：至少包含大写字母、小写字母、数字、特殊符号中的三种
- 密码散列：Argon2id（与当前密码哈希方案一致）
- 黑名单检查：注册和修改密码时校验是否在常用密码列表（top 10000）中
- 防止密码泄露：不记录明文密码，不在日志中输出密码相关字段
- 重置令牌有效期：15 分钟

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
3. 成功 → 撤销该用户所有旧 refresh_token（令牌旋转防重放）
4. 签发 access_token(15min) + refresh_token(7天)
5. 返回 JSON (含 access_token) + 设置两个 HttpOnly Cookie
6. 后续请求: Cookie → axum 读取 → extract_token() 决定来源
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

## CSRF 保护

采用 HMAC-SHA256 双提交 Cookie 模式：

```
1. 服务端生成 CSRF token（随机 32 字节，HMAC-SHA256 签名）
2. 写入 csrf_token Cookie（HttpOnly, SameSite=Lax, Secure）
3. 前端在 POST/PUT/DELETE 请求中通过 Header（X-CSRF-Token）提交 token
4. 服务端校验 Header 中的 token 与 Cookie 中的 token 是否匹配
5. Cookie 与 Header 来源不同（Cookie 浏览器自动携带，Header 需 JS 显式设置），
   攻击者无法同时伪造两者
```

> 实现位置：`backend/crates/api/src/middleware/csrf.rs`
>
> 安全考虑：
> - CSRF token 不存储在服务端（无状态验证）
> - 仅对需要身份认证的写操作生效
> - GET/HEAD/OPTIONS 等幂等方法不校验
> - 前端 API 客户端自动附加 `X-CSRF-Token` Header

## 令牌黑名单

- 撤销的 access_token 存入 Redis: `blacklist:{token_hash}` → `"1"`，TTL = 剩余有效期
- 检查在 auth handler 层（`is_token_blacklisted()`），不在中间件层
- 登出时撤销当前 access_token，同时删除 refresh_token

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

## 密码重置流程

```
忘记密码流程:
1. 用户请求重置 → POST /auth/forgot-password
2. 校验邮箱是否存在（不泄露存在性信息，始终返回相同响应）
3. 生成重置令牌（32 字节随机值，SHA-256 哈希后存储）
4. 存入 password_reset_tokens 表（user_id, token_hash, expires_at）
5. 发送重置链接至用户邮箱（含原始令牌，非哈希值）
6. 链接有效期 15 分钟，单次使用后立即失效

重置密码流程:
1. 用户通过重置链接访问 → GET /auth/reset-password?token=xxx
2. 页面显示新密码表单
3. 提交新密码 → POST /auth/reset-password
4. 验证令牌（SHA-256 哈希匹配 + 未过期 + 未使用）
5. 更新用户密码（Argon2id 哈希）
6. 使令牌失效（标记为已使用或删除记录）
7. 撤销该用户所有 refresh_token（强制重新登录）
8. 返回成功响应
```

> 实现位置：`backend/crates/api/src/routes/auth.rs`
>
> 安全考虑：
> - 使用恒定时间比较验证令牌哈希
> - 不泄露用户邮箱是否存在
> - 重置令牌使用一次后即失效（防止重放）
> - 重置成功后撤销所有现有会话
