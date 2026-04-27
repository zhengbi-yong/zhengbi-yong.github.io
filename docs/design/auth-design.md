# 认证与授权设计

> 来源：ultradesign.md (3.3节、4.3节)

## 核心原则

- 不用 localStorage 存 JWT
- 使用 HttpOnly Cookie 传递身份凭证
- JWT 仅作签名校验（CPU 运算），中间件不查数据库

## 登录流程

```
1. 用户提交凭据 → Next.js Route Handler
2. Handler 调后端验证凭据
3. 后端校验成功 → 颁发 HttpOnly Cookie（含 session_id）
4. 后续请求浏览器自动携带 Cookie
5. mutator.ts 读取 Cookie 传给后端验证
```

## 中间件设计

### 认证中间件

```rust
pub async fn auth_middleware(
    Extension(auth_user): Extension<AuthUser>,
    request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    // 1. 从 Authorization Header 提取 Bearer Token（或从 Cookie）
    // 2. 验证 JWT 签名和过期时间
    // 3. 检查 Redis 黑名单（如果 token 被撤销）
    // 4. 从数据库加载用户信息
    // 5. 注入 AuthUser 到请求扩展
}
```

### 可选认证（不强制登录）

```rust
pub async fn optional_auth_middleware(
    Extension(auth_user): Extension<Option<AuthUser>>,
    request: Request,
    next: Next,
) -> Response {
    // 尝试解析 token，失败也继续
}
```

## 中间件职责边界

### 中间件只做

- JWT 签名验证（公钥 + CPU）
- 令牌过期检查
- 将 `AuthUser` 注入 Extension

### 中间件不做

- ❌ 数据库查询（用户权限、封禁状态）
- ❌ 外部 API 调用
- ❌ 复杂业务逻辑

### 原因

中间件在每个请求链上执行。如果每次请求都查数据库：
1. 增加延迟（即使是 SELECT）
2. 可能阻塞后续中间件
3. 放大数据库连接池压力

### 正确做法

```rust
// 中间件: 只验证签名
pub async fn auth_middleware(
    request: Request, next: Next
) -> Result<Response, AuthError> {
    let token = extract_token(&request);
    let claims = jwt.verify(&token)?;   // 纯 CPU 运算
    request.extensions_mut().insert(claims);
    next.run(request).await
}

// Handler: 在需要时才查数据库
pub async fn delete_user(
    AuthUser(auth_user): AuthUser,
    State(db): State<PgPool>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<()>, StatusCode> {
    // 只有到达这里才查数据库
    let target = sqlx::query_as!(...).fetch_one(&db).await?;
    if auth_user.role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }
    // 执行删除...
}
```

## 技术决策

| 决策点 | 旧方案 | 新方案 | 原因 |
|--------|--------|--------|------|
| JWT 存储 | localStorage | HttpOnly Cookie | 防止 XSS 窃取 |
| 密码哈希 | bcrypt | Argon2id | 更安全的 KDF |
| 令牌黑名单 | DB 查询 | Redis | 低延迟、自动过期 |
| 登录方式 | 密码 | WebAuthn + 密码（过渡） | 最终目标是无密码 |
