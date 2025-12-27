# 后端架构

本文档介绍 Rust 后端 API 的架构和组织结构。

## 项目结构

```
backend/
├── crates/
│   ├── api/                # HTTP API 层
│   │   └── src/
│   │       ├── main.rs     # 入口点
│   │       ├── routes/     # 路由处理器
│   │       └── middleware/ # 认证、CORS 等
│   ├── core/               # 核心业务逻辑
│   │   └── src/
│   │       ├── auth/       # 认证逻辑
│   │       ├── posts/      # 文章管理
│   │       └── comments/   # 评论系统
│   ├── db/                 # 数据库模型
│   │   └── src/
│   │       ├── models/     # 数据库表模型
│   │       ├── schema/     # SQLx 查询
│   │       └── pool/       # 连接池
│   ├── shared/             # 共享工具
│   │   └── src/
│   │       ├── config/     # 配置管理
│   │       ├── error/      # 错误处理
│   │       └── utils/      # 工具函数
│   └── worker/             # 后台任务
│       └── src/
│           ├── email/      # 邮件发送
│           └── cleanup/    # 定期清理
├── migrations/             # 数据库迁移
├── docs/                   # API 文档
└── tests/                  # 集成测试
```

## 核心技术

### Axum

**异步 Web 框架**:
```rust
use axum::{Router, routing::get};

let app = Router::new()
    .route("/", get(root))
    .route("/health", get(health_check));
```

### SQLx

**编译时检查的 SQL**:
```rust
sqlx::query!("SELECT * FROM users WHERE id = $1", user_id)
    .fetch_one(&pool)
    .await
```

### Tokio

**异步运行时**:
```rust
#[tokio::main]
async fn main() {
    // 启动服务器
}
```

## 数据流

### 请求处理流程

```
HTTP Request
    ↓
Axum Router
    ↓
Middleware (CORS, Auth, Rate Limit)
    ↓
Route Handler
    ↓
Business Logic (core/*)
    ↓
Database Query (db/*)
    ↓
Response
```

### 认证流程

```
1. POST /v1/auth/login
   ↓
2. 验证用户凭证
   ↓
3. 生成 JWT + Refresh Token
   ↓
4. 返回令牌
   ↓
5. 客户端存储令牌
   ↓
6. 后续请求携带 JWT
   ↓
7. 中间件验证 JWT
   ↓
8. 允许/拒绝访问
```

## Crate 组织

### api

**职责**: HTTP 层、路由、中间件

**依赖**:
```toml
[dependencies]
core = { path = "../core" }
db = { path = "../db" }
shared = { path = "../shared" }
axum = "0.8"
tokio = { version = "1", features = ["full"] }
```

### core

**职责**: 业务逻辑、领域模型

**模块**:
- `auth` - 认证和授权
- `posts` - 文章管理
- `comments` - 评论系统
- `users` - 用户管理

### db

**职责**: 数据库访问、连接管理

**功能**:
- 连接池管理
- SQLx 查询定义
- 迁移管理
- 事务处理

### shared

**职责**: 共享类型和工具

**模块**:
- `config` - 配置加载
- `error` - 错误类型
- `utils` - 通用工具
- `types` - 共享类型

### worker

**职责**: 后台任务、定时作业

**任务**:
- 邮件发送
- 数据清理
- 统计计算
- 缓存预热

## 路由设计

### 路由结构

```
/
├── healthz          # 健康检查
├── readyz           # 就绪检查
├── metrics          # Prometheus 指标
└── v1/
    ├── auth/        # 认证端点
    │   ├── POST /register
    │   ├── POST /login
    │   ├── POST /logout
    │   └── GET  /me
    ├── posts/       # 文章端点
    │   ├── GET  /
    │   ├── GET  /:slug
    │   └── POST /:slug/view
    ├── comments/    # 评论端点
    └── users/       # 用户端点
```

### 示例路由定义

```rust
use axum::Router;

pub fn create_router() -> Router {
    Router::new()
        .route("/healthz", get(health_check))
        .nest("/v1/auth", auth_routes())
        .nest("/v1/posts", post_routes())
        .layer(
            ServiceBuilder::new()
                .layer(CorsLayer::new()...)
                .layer(AuthLayer::new()...)
        )
}
```

## 中间件

### CORS

```rust
use tower_http::cors::CorsLayer;

let cors = CorsLayer::new()
    .allow_origin("http://localhost:3001".parse::<HeaderValue>()?)
    .allow_methods([Method::GET, Method::POST]);
```

### JWT 认证

```rust
pub struct AuthLayer {
    jwt_secret: String,
}

impl<S> Layer<S> for AuthLayer {
    type Service = AuthMiddleware<S>;
}
```

### 速率限制

```rust
use tower_governor::{Governor, GovernorConfigBuilder};

let governor_conf = Box::new(
    GovernorConfigBuilder::default()
        .per_second(60)
        .burst_size(30)
        .finish()
        .unwrap(),
);
```

## 数据库

### 连接池

```rust
use sqlx::postgres::PgPoolOptions;

let pool = PgPoolOptions::new()
    .max_connections(10)
    .connect(&DATABASE_URL)
    .await?;
```

### 查询示例

```rust
// 编译时检查的查询
sqlx::query!(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
    email,
    password_hash
)
.execute(&pool)
.await?
```

### 迁移

```bash
# 创建迁移
sqlx migrate add create_users_table

# 运行迁移
sqlx migrate run

# 回滚迁移
sqlx migrate revert
```

## 配置管理

### 环境变量

```rust
use config::{Config, Environment};

let settings = Config::builder()
    .add_source(File::with_name("config/default"))
    .add_source(File::with_name("config/production").required(false))
    .add_source(Environment::default())
    .build()?;
```

### 配置结构

```rust
#[derive(Deserialize)]
pub struct Settings {
    pub database: DatabaseSettings,
    pub redis: RedisSettings,
    pub jwt: JwtSettings,
    pub server: ServerSettings,
}
```

## 错误处理

### 自定义错误类型

```rust
#[derive(Debug)]
pub enum AppError {
    Database(sqlx::Error),
    Auth(AuthError),
    NotFound(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "Not found"),
            AppError::Auth(_) => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            // ...
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

## 测试

### 单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_user_creation() {
        let user = User::new("test@example.com", "password");
        assert_eq!(user.email, "test@example.com");
    }
}
```

### 集成测试

```rust
#[sqlx::test]
async fn test_login_endpoint(pool: PgPool) -> TestResult {
    // 设置测试数据
    // 发送测试请求
    // 验证响应
    Ok(())
}
```

## 部署

### Docker 镜像

```dockerfile
FROM rust:1.70 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
COPY --from=builder /app/target/release/api /usr/local/bin/api
EXPOSE 3000
CMD ["api"]
```

### Docker Compose

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
```

## 相关文档

- [API 参考](./api-reference.md) - 完整的 API 端点文档
- [数据库设计](./database.md) - 数据库模式和关系
- [测试指南](./testing.md) - 测试策略和工具

---

**最后更新**: 2025-12-27
