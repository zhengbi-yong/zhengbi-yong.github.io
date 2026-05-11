---
title: Route Extension Rules v1.0
---

# Route Extension Rules v1.0

> 参照: Stripe API · Google AIP · GitHub API · JSON:API · Microsoft REST Guidelines  
> 强制等级: 🔴 MUST / 🟡 SHOULD / 🟢 MAY  
> **任何 PR 违反 🔴 规则将被自动拒绝。**

---

## 目录

1. [快速决策表](#快速决策表)
2. [后端 API 规则](#后端-api-规则)
3. [前端页面规则](#前端页面规则)
4. [扩展新资源流程](#扩展新资源流程)
5. [代码审查清单](#代码审查清单)
6. [常见反模式](#常见反模式)
7. [自动化验证](#自动化验证)

---

## 快速决策表

| 你想做什么 | 正确做法 | 错误做法 |
|-----------|---------|---------|
| 列出文章 | `GET /api/v1/posts?per_page=20` | `GET /api/v1/getPosts?page_size=20` |
| 获取一篇文章 | `GET /api/v1/posts/{id}` | `GET /api/v1/posts/{slug}` |
| 创建文章 | `POST /api/v1/admin/posts` | `POST /api/v1/posts/create` |
| 批量删除 | `POST /admin/users/batch/delete` | `POST /admin/users:batchDelete` |
| 前端标签页 | `/blog/tag/{tag}` | `/tags/{tag}` |
| 实验功能 | `/lab/{name}` | `/excalidraw` |

---

## 后端 API 规则

### 🔴 #1: URL 路径段命名

```yaml
✅ 正确:
  /api/v1/posts                          # 复数名词
  /api/v1/posts/{id}                     # 统一 {id} 参数
  /api/v1/posts/{id}/comments            # 子资源嵌套
  /api/v1/posts/{id}/reading-progress    # kebab-case
  /api/v1/admin/users/batch/role         # batch 子资源

❌ 错误:
  /api/v1/post                           # 单数
  /api/v1/posts/{slug}                   # 不一致命名
  /api/v1/posts/{post_id}                # snake_case
  /api/v1/posts/{postId}                 # camelCase
  /api/v1/admin/users:batchUpdateRole    # : 语法
```

### 🔴 #2: HTTP 方法映射

| 操作 | 方法 | 示例 | 幂等 |
|------|------|------|------|
| 列表 | `GET` | `GET /posts` | ✅ |
| 详情 | `GET` | `GET /posts/{id}` | ✅ |
| 创建 | `POST` | `POST /admin/posts` | ❌ |
| 全量更新 | `PUT` | `PUT /users/me` | ✅ |
| 部分更新 | `PATCH` | `PATCH /admin/posts/{id}` | ❌* |
| 删除 | `DELETE` | `DELETE /admin/posts/{id}` | ✅ |
| 触发操作 | `POST` | `POST /admin/search/reindex` | ❌ |

\* PATCH 可实现为幂等，但不要求。

### 🔴 #3: 认证边界

所有 `/admin/` 前缀路由必须经过 `auth_middleware` + `csrf_middleware`：

```rust
// ✅ 正确
category_admin_routes()
    .layer(auth_middleware)
    .layer(csrf_middleware)

// ❌ 错误 — 无认证保护
category_routes()  // 混合公开+管理路由
```

### 🔴 #4: 分页参数

```yaml
✅ 统一使用:
  per_page: integer (默认 20, 最大 100)
  page: integer (默认 1)
  sort: string (默认 "-created_at")

❌ 禁止:
  page_size, limit, offset, start
```

### 🔴 #5: 参数命名

所有资源主键统一命名为 `{id}`：

```yaml
✅:
  GET /posts/{id}
  GET /categories/{id}
  GET /admin/users/{id}
  GET /admin/posts/{id}/versions/{number}  # version 用 number

❌:
  GET /posts/{slug}
  GET /admin/users/{userId}
  GET /admin/posts/{post_id}
```

**唯一例外**: `{number}` 用于版本号（语义为序号而非 ID）。

### 🟡 #6: 批量操作

使用 `batch` 子资源，HTTP 方法为 `POST`：

```
POST /admin/users/batch/role     # 批量改角色
POST /admin/users/batch/delete   # 批量删除
POST /admin/posts/batch/export   # 批量导出
POST /admin/posts/batch/import   # 批量导入
```

### 🟡 #7: 路由函数命名

```rust
// 公开路由：{resource}_public_routes()
fn post_public_routes() -> Router<AppState> { ... }
fn category_public_routes() -> Router<AppState> { ... }

// 管理路由：{resource}_admin_routes() — 需要 auth middleware
fn post_admin_routes() -> Router<AppState> { ... }
fn category_admin_routes() -> Router<AppState> { ... }

// 认证路由：auth_{action}_routes()
fn auth_routes() -> Router<AppState> { ... }
fn auth_me_routes() -> Router<AppState> { ... }
```

### 🟢 #8: 文件名

```yaml
✅:
  routes/posts.rs
  routes/comments.rs
  routes/reading_progress.rs
  routes/mdx_convert.rs

❌:
  routes/Posts.ts           # 大写
  routes/post_routes.rs     # 冗余 _routes 后缀
  routes/adminStuff.rs      # camelCase
```

---

## 前端页面规则

### 🔴 #1: URL 模式

```yaml
✅:
  /blog/[...slug]                      # 文章详情
  /blog/page/[page]                   # 文章分页
  /blog/category/[category]           # 分类
  /blog/tag/[tag]                     # 标签 (与分类一致)
  /blog/tag/[tag]/page/[page]         # 标签分页
  /blog/popular                        # 热门文章
  /users/[username]                    # 用户公共主页
  /admin/posts/new                     # 新建文章
  /admin/posts/edit/[...slug]         # 编辑文章
  /settings/themes                     # 设置子页面
  /lab/{name}                          # 实验功能

❌:
  /tags/[tag]                          # 与 blog 分离
  /tags/[tag]/page/[page]             # 同上
  /excalidraw                          # 实验页在根路径
  /music/[name]                        # 同上
  /experiment/spark-test               # 同上
```

### 🔴 #2: 目录结构

```
app/
├── blog/
│   ├── [...slug]/page.tsx            # 文章详情
│   ├── page/[page]/page.tsx          # 分页列表
│   ├── category/[category]/page.tsx  # 分类页
│   ├── tag/[tag]/page.tsx            # 标签页 (NEW)
│   ├── tag/[tag]/page/[page]/page.tsx
│   └── popular/page.tsx
├── users/
│   └── [username]/page.tsx           # 公共主页
├── (admin)/admin/                     # 管理后台 (route group)
│   ├── posts/page.tsx                # 文章列表
│   ├── posts/new/page.tsx            # 新建
│   ├── posts/edit/[...slug]/page.tsx # 编辑
│   └── ...
├── lab/                               # 实验功能
│   ├── excalidraw/page.tsx
│   ├── experiment/page.tsx
│   └── music/[name]/page.tsx
├── settings/
│   └── themes/page.tsx
└── login/page.tsx
```

### 🔴 #3: 重定向规则

移动路由后必须添加 301 重定向：

```javascript
// next.config.js
async redirects() {
  return [
    { source: '/old-path', destination: '/new-path', permanent: true },
    { source: '/old-path/:param', destination: '/new-path/:param', permanent: true },
  ]
}
```

### 🟡 #4: API 客户端

所有 API 调用通过 `lib/api/backend.ts`，不直接在组件中 fetch：

```typescript
// ✅
import { authService } from '@/lib/api/backend'
const profile = await authService.getPublicProfile(username)

// ❌
const res = await fetch(`http://localhost:3000/api/v1/users/${username}`)
```

---

## 扩展新资源流程

### 添加新后端资源 (例如: `newsletters`)

#### Step 1: 主路由注册

```rust
// main.rs

// 公开路由
fn newsletter_public_routes() -> Router<AppState> {
    Router::new()
        .route("/newsletters", get(list_newsletters))
        .route("/newsletters/{id}", get(get_newsletter))
}

// 管理路由
fn newsletter_admin_routes() -> Router<AppState> {
    Router::new()
        .route("/admin/newsletters", post(create_newsletter))
        .route("/admin/newsletters/{id}", patch(update_newsletter))
        .route("/admin/newsletters/{id}", delete(delete_newsletter))
}

// 在 v1_routes() 中注册
fn v1_routes(state: AppState) -> Router<AppState> {
    auth_routes()
        .merge(newsletter_public_routes())     // 公开，无 auth
        .merge(
            newsletter_admin_routes()
                .layer(auth_middleware)          // 管理，需要 auth
                .layer(csrf_middleware)
        )
        // ...
}
```

#### Step 2: Handler 文件

```rust
// routes/newsletters.rs

#[utoipa::path(
    get,
    path = "/api/v1/newsletters",
    tag = "newsletters",
    params(
        ("page" = u32, Query, description = "页码"),
        ("per_page" = u32, Query, description = "每页数量"),
    ),
    responses((status = 200, body = [Newsletter]))
)]
pub async fn list_newsletters(
    Query(params): Query<ListNewslettersParams>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Newsletter>>, StatusCode> {
    // ...
}
```

#### Step 3: 运行测试

```bash
cargo test --test route_convention_tests
# 必须全部通过
```

### 添加新前端页面

#### Step 1: 确定归属

| 页面类型 | 路径前缀 | 示例 |
|---------|---------|------|
| 博客内容 | `/blog/` | `/blog/tag/rust` |
| 用户功能 | `/users/` | `/users/zhengbi/profile` |
| 管理后台 | `/admin/` | `/admin/newsletters` |
| 设置 | `/settings/` | `/settings/notifications` |
| 实验功能 | `/lab/` | `/lab/wasm-demo` |
| 独立页 | `/` | `/about`, `/search` |

#### Step 2: 创建目录

```bash
mkdir -p app/blog/newsletter/page.tsx
```

#### Step 3: API 调用模式

```typescript
// lib/api/backend.ts — 添加新方法
async getNewsletters(params?: { page?: number; per_page?: number }) {
  const q = new URLSearchParams()
  if (params?.page) q.set('page', String(params.page))
  if (params?.per_page) q.set('per_page', String(params.per_page))
  const r = await api.get(`${BACKEND_API_URL}/newsletters${q.toString() ? '?'+q : ''}`)
  return r.data
}
```

---

## 代码审查清单

### 后端 PR

- [ ] 所有路由 URL 使用 kebab-case 且无动词
- [ ] 参数名统一为 `{id}` (除 `{number}` 外)
- [ ] 管理路由有 `auth_middleware` + `csrf_middleware`
- [ ] 公开路由不包含管理路由
- [ ] 分页参数使用 `per_page` (不是 `page_size`)
- [ ] 批量操作不使用 `:` 语法
- [ ] `cargo test --test route_convention_tests` 全部通过
- [ ] OpenAPI 注解中的 `path` 与实际路由一致
- [ ] 资源使用复数名词

### 前端 PR

- [ ] 页面路径符合目录结构规范
- [ ] 移动路由后添加了 301 重定向
- [ ] API 调用使用 `lib/api/backend.ts` 中的服务
- [ ] 新页面有对应的 sitemap 更新
- [ ] 构建通过 (`pnpm build`)

---

## 常见反模式

### ❌ URL 动词

```yaml
错误: POST /api/v1/posts/createPost
正确: POST /api/v1/admin/posts
原因: HTTP 方法即动词
```

### ❌ 不一致的 ID 命名

```yaml
错误:
  GET /posts/{slug}
  PATCH /admin/posts/{postId}
  DELETE /admin/comments/{comment_id}
正确:
  GET /posts/{id}
  PATCH /admin/posts/{id}
  DELETE /admin/comments/{id}
原因: 统一降低认知负担
```

### ❌ 混合公开/管理路由

```rust
// ❌ 反模式
fn post_routes() -> Router<AppState> {
    Router::new()
        .route("/posts", get(list_posts))            // 公开
        .route("/admin/posts", post(create_post))    // 管理 — 无 auth!
}

// ✅ 正确模式
fn post_public_routes() -> Router<AppState> { /* 只有公开路由 */ }
fn post_admin_routes() -> Router<AppState> { /* 只有管理路由 */ }

// 应用中间件
post_admin_routes().layer(auth_middleware).layer(csrf_middleware)
```

### ❌ 前端标签独立于博客

```yaml
错误:
  /tags/react             # 与博客分离
  /blog/category/rust     # 博客分类在 blog 下
正确:
  /blog/tag/react         # 统一在 blog 下
  /blog/category/rust
原因: 用户心智模型统一
```

### ❌ 实验功能在根路径

```yaml
错误:
  /excalidraw
  /experiment/spark-test
正确:
  /lab/excalidraw
  /lab/experiment/spark-test
原因: 清晰标记非生产功能
```

---

## 自动化验证

项目内置了自动化路由验证测试，任何违反 🔴 规则的代码都无法通过 CI：

```bash
cd backend/crates/api
cargo test --test route_convention_tests
```

**覆盖的规则**:
1. ✅ kebab-case URL 格式
2. ✅ 禁止 URL 中使用动词 (batch/* 白名单)
3. ✅ 统一 `{id}` 参数命名
4. ✅ 无重复路由注册
5. ✅ 禁止 `:` 批量语法
6. ✅ `per_page` 分页参数 (禁止 `page_size`)
7. ✅ 管理路由不混入公开路由函数
8. ✅ HTTP 方法语义
9. ✅ 路由总数健全性
10. ✅ 资源嵌套深度

### 添加新测试

如需添加新的验证规则，编辑 `tests/route_convention_tests.rs`：

```rust
#[test]
fn my_new_rule() {
    let routes = extract_routes_from_source();
    let violations: Vec<_> = routes.iter()
        .filter(|(m, p)| /* 你的检查逻辑 */)
        .collect();
    if !violations.is_empty() {
        panic!("违规详情: {:?}", violations);
    }
}
```

---

## 变更日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-05-03 | 初始版本：10 项核心规则 + 自动化测试 + 前后端完整规范 |
