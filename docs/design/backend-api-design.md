# 后端 API 设计

> 本文件根据 `backend/crates/api/src/main.rs` 路由表中的实际注册为准。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | Rust Axum | 0.8 |
| 数据库 | PostgreSQL (SQLx) | 17+ |
| 缓存 | Redis (deadpool-redis) | 7.4.x |
| 搜索 | PG FTS + Meilisearch | 1.12 (Meilisearch 尚未实装) |

## 项目结构

```text
backend/
├── crates/
│   ├── api/                    # HTTP 服务器（Axum）
│   │   ├── src/
│   │   │   ├── main.rs         # 入口 + 路由组合 + 优雅停机
│   │   │   ├── routes/
│   │   │   │   ├── admin.rs
│   │   │   │   ├── auth.rs
│   │   │   │   ├── categories.rs
│   │   │   │   ├── comments.rs
│   │   │   │   ├── mdx_convert.rs
│   │   │   │   ├── mdx_sync.rs
│   │   │   │   ├── media.rs
│   │   │   │   ├── openapi.rs
│   │   │   │   ├── posts.rs
│   │   │   │   ├── reading_progress.rs
│   │   │   │   ├── search.rs
│   │   │   │   ├── search_optimized.rs
│   │   │   │   ├── tags.rs
│   │   │   │   ├── team_members.rs
│   │   │   │   └── versions.rs
│   │   │   ├── middleware/
│   │   │   │   ├── auth.rs
│   │   │   │   ├── rate_limit.rs
│   │   │   │   ├── csrf.rs
│   │   │   │   └── request_id.rs
│   │   │   ├── metrics/
│   │   │   ├── state.rs
│   │   │   └── outbox.rs
│   │   └── Cargo.toml
│   │
│   ├── core/                   # 业务逻辑（JWT、密码哈希、MDX 转换、Email）
│   ├── db/                     # SQLx 数据库模型
│   ├── shared/                 # 公共类型（AppError、Config 等）
│   ├── worker/                 # CDC Worker
│   └── migrator/               # 迁移工具
│
├── migrations/                 # SQL 迁移
├── openapi/                    # OpenAPI 规范
└── Cargo.toml                  # Workspace 配置
```

## RESTful 规范

```bash
# 资源命名: 名词复数，斜杠子路径
GET    /posts                  # 获取列表
POST   /admin/posts            # 创建（管理端）
GET    /posts/{slug}           # 获取单个
PATCH  /posts/{slug}           # 部分更新（管理端）
DELETE /posts/{slug}           # 删除（管理端）

# 自定义操作: 斜杠子路径
POST   /posts/{slug}/view      # 记录浏览
POST   /posts/{slug}/likes     # 点赞
DELETE /posts/{slug}/likes     # 取消点赞
GET    /tags/autocomplete      # 自动补全
```

## 路由表

### 公开 API (`/api/v1/`)

#### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 注册 |
| POST | /auth/login | 登录 |
| POST | /auth/refresh | 刷新令牌 |
| POST | /auth/logout | 登出 |
| POST | /auth/forgot-password | 忘记密码 |
| POST | /auth/reset-password | 重置密码 |
| GET | /auth/me | 当前用户信息 |

#### 文章
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /posts | 列表（分页） |
| GET | /posts/by-slug | 通过查询参数 slug 获取 |
| GET | /posts/{slug} | 详情 |
| GET | /posts/{slug}/stats | 统计 |
| POST | /posts/{slug}/view | 记录浏览 |
| POST | /posts/{slug}/likes | 点赞 |
| DELETE | /posts/{slug}/likes | 取消点赞 |
| GET | /posts/{slug}/comments | 评论列表 |
| GET | /posts/{slug}/related | 相关文章 |

#### 阅读进度
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /posts/{slug}/reading-progress | 获取进度 |
| POST | /posts/{slug}/reading-progress | 更新进度 |
| DELETE | /posts/{slug}/reading-progress | 重置进度 |
| GET | /reading-progress/history | 阅读历史 |

#### 评论
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /posts/{slug}/comments | 创建评论 |
| POST | /comments/{id}/like | 点赞评论 |
| POST | /comments/{id}/unlike | 取消点赞评论 |

#### 分类 / 标签 / 搜索
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /categories | 分类列表 |
| GET | /categories/tree | 分类树 |
| GET | /categories/{slug} | 分类详情 |
| GET | /categories/{slug}/posts | 分类下文章 |
| GET | /tags | 标签列表 |
| GET | /tags/popular | 热门标签 |
| GET | /tags/autocomplete | 自动补全 |
| GET | /tags/{slug} | 标签详情 |
| GET | /tags/{slug}/posts | 标签下文章 |
| GET | /search | 全文搜索 |
| GET | /search/suggest | 搜索建议 |
| GET | /search/trending | 热门搜索词 |

#### 团队成员
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /team-members | 团队成员列表 |
| GET | /team-members/{id} | 团队成员详情 |

### 管理 API（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admin/posts | 列表（含草稿） |
| POST | /admin/posts | 创建 |
| PATCH | /admin/posts/{postId} | 更新 |
| DELETE | /admin/posts/{postId} | 删除 |
| POST | /admin/sync/mdx | 同步 MDX |
| GET | /admin/stats | 仪表盘统计 |
| GET | /admin/users | 用户列表 |
| POST | /admin/users | 创建用户 |
| GET | /admin/users/{id} | 用户详情 |
| PUT | /admin/users/{id} | 更新用户 |
| PUT | /admin/users/{id}/role | 更新角色 |
| DELETE | /admin/users/{id} | 删除用户 |
| POST | /admin/users:batchUpdateRole | 批量更新角色 |
| POST | /admin/users:batchDelete | 批量删除用户 |
| GET | /admin/user-growth | 用户增长 |
| GET | /admin/comments | 评论列表 |
| PUT | /admin/comments/{id}/status | 审核评论 |
| DELETE | /admin/comments/{id} | 删除评论 |
| GET | /admin/media | 媒体列表 |
| GET | /admin/media/unused | 未使用媒体 |
| GET | /admin/media/{id} | 媒体详情 |
| GET | /admin/media/{id}/download-url | 媒体下载链接 |
| PATCH | /admin/media/{id} | 更新媒体 |
| DELETE | /admin/media/{id} | 删除媒体 |
| POST | /admin/media/upload | 上传媒体 |
| POST | /admin/media/presign-upload | 预签名上传 |
| POST | /admin/media/finalize | 完成上传 |
| GET | /admin/team-members | 团队成员列表（管理端） |
| POST | /admin/team-members | 创建团队成员 |
| GET | /admin/team-members/{id} | 团队成员详情（管理端） |
| PUT | /admin/team-members/{id} | 更新团队成员 |
| DELETE | /admin/team-members/{id} | 删除团队成员 |
| POST | /admin/team-members/batch/delete | 批量删除团队成员 |
| POST | /admin/mdx/convert | MDX 转换 |
| POST | /admin/mdx/batch-convert | MDX 批量转换 |
| POST | /admin/mdx/migrate-all | MDX 全量迁移 |
| GET | /admin/posts/{postId}/versions | 版本列表 |
| POST | /admin/posts/{postId}/versions | 创建版本 |
| GET | /admin/posts/{postId}/versions/{versionNumber} | 版本详情 |
| POST | /admin/posts/{postId}/versions/{versionNumber}/restore | 恢复版本 |
| DELETE | /admin/posts/{postId}/versions/{versionNumber} | 删除版本 |
| GET | /admin/posts/{postId}/versions/compare | 比较版本 |
| POST | /admin/search/reindex | 重建搜索索引 |

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

Redis 连接池配置通过 `redis_pool` 配置段管理（wait_timeout, create_timeout, recycle_timeout）。

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
    // 只验证 JWT 签名（CPU 运算，不查数据库/Redis）
    next.run(request).await
}
```

## 优雅停机

```rust
// 1. 收到 SIGTERM/Ctrl+C
// 2. 标记健康检查失败（/livez 返回 503）
// 3. 等待现有请求完成（最多 30s graceful period）
// 4. 关闭数据库和 Redis 连接池
// 5. 退出进程
```

## HTTP 状态码约定

| 状态码 | 场景 |
|--------|------|
| 200 | GET/PUT/PATCH 成功 |
| 201 | POST 创建成功 |
| 204 | DELETE 成功，或 NO_CONTENT 操作 |
| 400 | 参数校验失败 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（重复点赞等） |
| 429 | 限流触发 |
| 500 | 服务器内部错误 |

## 健康检查

| 路径 | 说明 | 类型 |
|------|------|------|
| /.well-known/live | Kubernetes 存活探针 | 只返回 200 |
| /.well-known/ready | Kubernetes 就绪探针 | 检查 DB/Redis/JWT/Email 连接 |
| /health/detailed | 详细健康状态 | 返回 JSON 各组件状态 |
| /metrics | Prometheus 指标 | 返回指标数据 |
