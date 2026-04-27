# 后端 API 设计

> 来源：ultradesign.md (4章、6章)

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | Rust Axum | 0.8 |
| 数据库 | PostgreSQL (SQLx) | 17+ |
| 缓存 | Redis (deadpool-redis) | 7.4.x |
| 搜索 | PG FTS + Meilisearch | 1.12 |

## 项目结构

```
backend/
├── crates/
│   ├── api/                    # HTTP 服务器
│   │   ├── src/
│   │   │   ├── main.rs        # 入口 + 优雅停机
│   │   │   ├── routes/
│   │   │   │   ├── auth.rs
│   │   │   │   ├── posts.rs
│   │   │   │   ├── comments.rs
│   │   │   │   ├── categories.rs
│   │   │   │   ├── tags.rs
│   │   │   │   ├── media.rs
│   │   │   │   ├── admin.rs
│   │   │   │   ├── search.rs
│   │   │   │   └── team_members.rs
│   │   │   ├── middleware/
│   │   │   │   ├── auth.rs
│   │   │   │   ├── rate_limit.rs
│   │   │   │   ├── csrf.rs
│   │   │   │   └── request_id.rs
│   │   │   └── state.rs
│   │   └── Cargo.toml
│   │
│   ├── core/                   # 业务逻辑（纯 Rust）
│   ├── db/                     # SQLx 模型
│   └── worker/                 # MeiliBridge CDC Worker
│
├── migrations/                 # SQL 迁移
└── Cargo.toml                  # Workspace 配置
```

## RESTful 规范

```bash
# 资源命名: 名词复数，不用动词
GET    /posts              # 获取列表
POST   /posts              # 创建
GET    /posts/{slug}       # 获取单个
PATCH  /posts/{slug}       # 部分更新
DELETE /posts/{slug}       # 删除

# 禁止:
POST   /posts/create       # 错误!
GET    /posts/get/{id}     # 错误!

# 自定义操作: 冒号后缀 (AIP-136)
POST   /posts/{slug}:view           # 记录浏览
POST   /posts/{slug}/likes          # 点赞（关联资源）
GET    /tags:autocomplete           # 自定义查询

# 批量操作: 返回 202 + task_id
POST   /admin/posts:bulkDelete
```

## 统一寻址

```bash
GET /posts/{slug}          # 优先查 slug
GET /posts/{uuid}          # 识别为 UUID

# 禁止:
GET /posts/id/{id}         # 不需要
GET /posts/slug/{slug}     # 不需要
```

## 路由表

### 公开 API (`/api/v1/`)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/tokens | 登录 |
| PUT | /auth/tokens | 刷新 |
| DELETE | /auth/tokens | 登出 |
| POST | /users | 注册 |
| GET | /users/me | 当前用户 |
| GET | /posts | 列表 |
| GET | /posts/{identifier} | 详情 |
| POST | /posts/{identifier}:view | 浏览 |
| POST | /posts/{identifier}/likes | 点赞 |
| DELETE | /posts/{identifier}/likes | 取消点赞 |
| GET | /posts/{identifier}/comments | 评论 |
| GET | /categories | 分类 |
| GET | /tags | 标签 |
| GET | /tags:autocomplete | 补全 |
| GET | /search | 搜索 |

### 管理 API (`/api/admin/v1/`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /posts | 列表（含草稿） |
| POST | /posts | 创建 |
| PATCH | /posts/{id} | 更新 |
| DELETE | /posts/{id} | 删除 |
| POST | /posts:syncFromMdx | 同步 MDX |
| POST | /users:bulkDelete | 批量删除 |
| POST | /media:generateUploadUrl | 预签名 URL |
| GET | /statistics | 统计 |

## Axum 0.8 路由语法

```rust
// 正确: OpenAPI 风格大括号
Router::new()
    .route("/posts", get(list_posts))
    .route("/posts/{slug}", get(get_post))
    .route("/posts/{*path}", get(get_catch_all))

// 错误: 旧冒号语法（已废弃）
Router::new()
    .route("/posts/:slug", get(get_post))       // 编译警告!
    .route("/posts/*path", get(...))              // 编译错误!
```

## 数据库连接池

```rust
let pool = PgPoolOptions::new()
    .max_connections(50)           // 单实例不超过 50
    .min_connections(5)            // 保持最小连接
    .acquire_timeout(Duration::from_secs(5))
    .idle_timeout(Duration::from_secs(600))
    .max_lifetime(Duration::from_secs(1800))
    .connect(&database_url)
    .await?;
```

## 禁止模式

### 禁止: 事务内调外部服务

```rust
// 禁止! 会导致连接池占用、Redis 超时回滚、死锁
async fn bad(pool: &PgPool, redis: &Redis) -> Result<()> {
    let mut tx = pool.begin().await?;
    tx.execute("INSERT INTO ...").await?;
    redis.set("key", val).await?;   // 禁止
    tx.commit().await
}

// 正确: Outbox 模式
async fn good(pool: &PgPool) -> Result<()> {
    let mut tx = pool.begin().await?;
    tx.execute("INSERT INTO ...").await?;
    tx.execute("INSERT INTO outbox_events ...").await?;
    tx.commit().await               // Worker 异步处理
}
```

### 禁止: 中间件里查数据库

```rust
// 禁止! 每个请求都会触发数据库查询
async fn bad_middleware(request: Request, next: Next) -> Response {
    let user = db.query_user(&request).await;  // 应该在 handler 里
    next.run(request).await
}

// 正确: 中间件只做轻量校验，数据查询下沉到 handler
async fn auth_middleware(
    request: Request, next: Next
) -> Result<Response, AuthError> {
    // 只验证 JWT 签名（CPU 运算）
    // 不查数据库
    next.run(request).await
}
```

## 优雅停机

```rust
async fn run_server(pool: PgPool) {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    tokio::spawn(async move {
        signal::ctrl_c().await.unwrap();
        // 1. 标记健康检查失败 → 负载均衡器停止发新请求
        // set_healthy(false);
        // 2. 等待现有请求完成（最多 30 秒）
        tokio::time::sleep(Duration::from_secs(30)).await;
        // 3. 关闭数据库连接池
        pool.close().await;
        std::process::exit(0);
    });

    axum::serve(listener, app).await.unwrap();
}
```

## HTTP 状态码约定

| 状态码 | 场景 |
|--------|------|
| 200 | GET/PUT/PATCH 成功 |
| 201 | POST 创建成功 |
| 204 | DELETE 成功 |
| 400 | 参数校验失败 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 限流触发 |
| 500 | 服务器内部错误 |
