# Route Specification v1.0

> **参考标准**: Stripe API, Google AIP, GitHub API, JSON:API, Microsoft REST Guidelines  
> **最后更新**: 2026-05-03  
> **强制等级**: 🔴 Must / 🟡 Should / 🟢 May

---

## 1. 核心原则 (Core Principles)

### 1.1 资源导向 (Resource-Oriented) 🔴

每个 URL 路径段代表一个资源或资源集合。禁止在 URL 中使用动词。

| ✅ 正确 | ❌ 错误 | 原因 |
|---------|---------|------|
| `POST /posts/{id}/likes` | `POST /posts/{id}/like` | 资源是 likes 集合 |
| `POST /auth/login` | `POST /login` | auth 是资源命名空间 |
| `GET /search?q=term` | `GET /searchPosts` | 搜索是资源，查询是参数 |
| `DELETE /comments/{id}` | `POST /comments/{id}/delete` | HTTP DELETE 就是动词 |

### 1.2 复数名词 (Plural Nouns) 🔴

所有集合资源使用复数形式。

| ✅ | ❌ |
|----|-----|
| `/posts` | `/post` |
| `/categories` | `/category` |
| `/users` | `/user` |

### 1.3 一致的 ID 命名 (Consistent ID Naming) 🔴

所有资源的主键参数统一命名为 `{id}`，不使用语义化名称。

| ✅ | ❌ |
|----|-----|
| `/posts/{id}` | `/posts/{slug}` |
| `/posts/{id}/comments` | `/posts/{slug}/comments` |
| `/admin/posts/{id}` | `/admin/posts/{postId}` |
| `/comments/{id}` | `/comments/{comment_id}` |

**例外**: 仅当参数语义显著不同且无法用 `{id}` 区分时，才使用描述性名称。  
例如：`/admin/posts/{id}/versions/{number}`（version 用数字不是 ID）。

### 1.4 kebab-case URL (Kebab-Case URLs) 🔴

所有 URL 路径段使用小写字母 + 连字符。

| ✅ | ❌ |
|----|-----|
| `/reading-progress` | `/readingProgress` |
| `/forgot-password` | `/forgot_password` |
| `/batch/export-zip` | `/batch/exportZip` |

### 1.5 无尾部斜杠 (No Trailing Slash) 🟡

URL 不以 `/` 结尾。

---

## 2. HTTP 方法语义 (HTTP Method Semantics)

| 方法 | 语义 | 幂等 | 安全 |
|------|------|------|------|
| `GET` | 读取资源 | ✅ | ✅ |
| `POST` | 创建资源 / 触发操作 | ❌ | ❌ |
| `PUT` | 完整替换资源 | ✅ | ❌ |
| `PATCH` | 部分更新资源 | ❌* | ❌ |
| `DELETE` | 删除资源 | ✅ | ❌ |

\* PATCH 可实现为幂等，但不要求。

### 2.1 方法选择规则 🔴

- `GET` — 只读操作，包括列表、详情、搜索
- `POST` — 创建新资源、批量操作、触发副作用
- `PUT` — 完整替换（用户资料全量更新、角色变更）
- `PATCH` — 部分更新（文章字段修改、分类信息修改）
- `DELETE` — 删除资源

### 2.2 特殊操作 (Custom Methods) 🟡

当操作无法映射到标准 CRUD 时，使用 `POST` + 动作子资源：

| 操作 | 路由 |
|------|------|
| 导出 | `GET /admin/posts/{id}/export/mdx` |
| 批量导出 | `POST /admin/posts/batch/export` |
| 恢复版本 | `POST /admin/posts/{id}/versions/{number}/restore` |
| 重索引 | `POST /admin/search/reindex` |

**禁止**使用 Google AIP 的 `:` 语法（`/users:batchDelete`），它破坏 URL 语义统一性。

---

## 3. 认证边界 (Auth Boundary) 🔴

### 3.1 公开路由 / 管理路由分层

| 路由前缀 | 认证要求 | 角色要求 |
|----------|----------|----------|
| `/api/v1/auth/*` | 部分需要 | 无 |
| `/api/v1/posts/*` | 部分需要（写操作需要登录） | 无 |
| `/api/v1/users/*` | 部分需要 | 无 |
| `/api/v1/comments/*` | 写操作需要登录 | 无 |
| `/api/v1/search/*` | 无 | 无 |
| `/api/v1/tags/*` | 无（公开读） | 无 |
| `/api/v1/categories/*` | 无（公开读） | 无 |
| `/api/v1/admin/*` | **必须** | **admin** |

### 3.2 管理路由中间件覆盖测试 🔴

每个 `admin/` 路由必须被 auth + admin role 中间件覆盖。测试必须验证：
1. 无 token → 401
2. 普通用户 token → 403
3. Admin token → 200/201/204

---

## 4. 子资源嵌套 (Sub-Resource Nesting) 🔴

子资源必须嵌套在父资源下：

```
✅ /posts/{id}/comments        评论属于文章
✅ /posts/{id}/comments/{id}   单个评论
✅ /posts/{id}/versions        版本属于文章
❌ /comments/{id}/like         点赞不属于 comments 的 CRUD — 是 comments 的子资源 likes
✅ /comments/{id}/likes        点赞是评论的 likes 集合
```

嵌套深度不超过 3 层（父/子/操作）：

```
✅ /posts/{id}/versions/{number}/restore  (3层: post → version → restore)
❌ /posts/{id}/versions/{number}/comments/{cid}/likes  (5层: 太深)
```

---

## 5. 批量操作 (Batch Operations)

批量操作使用 `batch` 子资源：

| 操作 | 路由 |
|------|------|
| 批量导出 | `POST /admin/posts/batch/export` |
| 批量导入 | `POST /admin/posts/batch/import` |
| 批量更新角色 | `POST /admin/users/batch/role` |
| 批量删除 | `POST /admin/users/batch/delete` |

**禁止**在集合资源上使用 `POST` 带批量数组 body — 必须显式 `batch` 路径。

---

## 6. 分页与排序 (Pagination & Sorting) 🔴

### 6.1 标准查询参数

| 参数 | 类型 | 默认 | 最大 | 说明 |
|------|------|------|------|------|
| `page` | integer | 1 | — | 页码（从 1 开始） |
| `per_page` | integer | 20 | 100 | 每页数量 |
| `sort` | string | `-created_at` | — | 排序字段（`-` 前缀降序） |
| `q` | string | — | — | 全文搜索关键词 |

**禁止使用 `page_size`、`limit`、`offset`—统一用 `per_page`、`page`。**

### 6.2 分页响应格式 🔴

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 144,
    "total_pages": 8
  }
}
```

---

## 7. 筛选 (Filtering) 🟡

筛选通过查询参数实现，不占用 URL 路径段：

```
✅ GET /posts?category=rust&tag=tutorial&status=published
❌ GET /posts/category/rust/tag/tutorial
```

---

## 8. 版本控制 (Versioning) 🔴

API 版本通过 URL 前缀管理：

```
/api/v1/posts
/api/v2/posts  (未来)
```

Health/metrics 端点不版本化：

```
/.well-known/live
/.well-known/ready
/metrics
/health/detailed
```

---

## 9. 完整路由表 (Complete Route Table)

### 9.1 公开路由

```
# ── 健康检查 ──
GET  /.well-known/live
GET  /.well-known/ready
GET  /health/detailed
GET  /metrics

# ── 认证 ──
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

# ── 当前用户 ──
GET  /api/v1/users/me
PUT  /api/v1/users/me
POST /api/v1/users/me/avatar

# ── 公开用户资料 ──
GET  /api/v1/users/{id}
GET  /api/v1/users/{id}/posts

# ── 文章 ──
GET  /api/v1/posts
GET  /api/v1/posts/{id}
GET  /api/v1/posts/{id}/stats
POST /api/v1/posts/{id}/view
POST /api/v1/posts/{id}/likes
DELETE /api/v1/posts/{id}/likes
GET  /api/v1/posts/{id}/comments
POST /api/v1/posts/{id}/comments
GET  /api/v1/posts/{id}/related
GET  /api/v1/posts/{id}/reading-progress
POST /api/v1/posts/{id}/reading-progress
DELETE /api/v1/posts/{id}/reading-progress

# ── 评论互动 ──
POST   /api/v1/comments/{id}/likes
DELETE /api/v1/comments/{id}/likes

# ── 分类 ──
GET /api/v1/categories
GET /api/v1/categories/tree
GET /api/v1/categories/{id}
GET /api/v1/categories/{id}/posts

# ── 标签 ──
GET /api/v1/tags
GET /api/v1/tags/popular
GET /api/v1/tags/autocomplete
GET /api/v1/tags/{id}
GET /api/v1/tags/{id}/posts

# ── 搜索 ──
GET /api/v1/search
GET /api/v1/search/suggest
GET /api/v1/search/trending

# ── 阅读历史 ──
GET /api/v1/reading-progress
```

### 9.2 管理路由 (需 admin 角色)

```
# ── 仪表盘 ──
GET /api/v1/admin/stats
GET /api/v1/admin/user-growth

# ── 文章管理 ──
GET    /api/v1/admin/posts
POST   /api/v1/admin/posts
PATCH  /api/v1/admin/posts/{id}
DELETE /api/v1/admin/posts/{id}
GET    /api/v1/admin/posts/{id}/export/mdx
GET    /api/v1/admin/posts/{id}/export/md
POST   /api/v1/admin/posts/batch/export
GET    /api/v1/admin/posts/batch/export-zip
POST   /api/v1/admin/posts/import/mdx
POST   /api/v1/admin/posts/batch/import

# ── 版本管理 ──
GET    /api/v1/admin/posts/{id}/versions
POST   /api/v1/admin/posts/{id}/versions
GET    /api/v1/admin/posts/{id}/versions/{number}
POST   /api/v1/admin/posts/{id}/versions/{number}/restore
DELETE /api/v1/admin/posts/{id}/versions/{number}
GET    /api/v1/admin/posts/{id}/versions/compare

# ── 分类管理 ──
GET    /api/v1/admin/categories
POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/{id}
DELETE /api/v1/admin/categories/{id}

# ── 标签管理 ──
GET    /api/v1/admin/tags
POST   /api/v1/admin/tags
PATCH  /api/v1/admin/tags/{id}
DELETE /api/v1/admin/tags/{id}

# ── 评论管理 ──
GET    /api/v1/admin/comments
PATCH  /api/v1/admin/comments/{id}
DELETE /api/v1/admin/comments/{id}

# ── 用户管理 ──
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/{id}
PUT    /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}
PUT    /api/v1/admin/users/{id}/role
POST   /api/v1/admin/users/batch/role
POST   /api/v1/admin/users/batch/delete

# ── 媒体管理 ──
GET    /api/v1/admin/media
POST   /api/v1/admin/media/upload
POST   /api/v1/admin/media/presign
POST   /api/v1/admin/media/finalize
GET    /api/v1/admin/media/unused
GET    /api/v1/admin/media/{id}
GET    /api/v1/admin/media/{id}/download
PATCH  /api/v1/admin/media/{id}
DELETE /api/v1/admin/media/{id}

# ── 数据同步 ──
POST /api/v1/admin/sync/mdx
POST /api/v1/admin/mdx/convert
POST /api/v1/admin/mdx/batch-convert
POST /api/v1/admin/mdx/migrate-all
POST /api/v1/admin/mdx/backfill-blocknote

# ── 搜索管理 ──
POST /api/v1/admin/search/reindex

# ── 团队管理 ──
GET    /api/v1/admin/team
POST   /api/v1/admin/team
GET    /api/v1/admin/team/{id}
PUT    /api/v1/admin/team/{id}
DELETE /api/v1/admin/team/{id}

# ── 公开团队信息 ──
GET /api/v1/team
GET /api/v1/team/{id}
```

---

## 10. 反模式清单 (Anti-Patterns)

以下是任何路由审查中必须标记为 ❌ 的模式：

| 反模式 | 示例 | 正确做法 |
|--------|------|----------|
| URL 中使用动词 | `/createPost` | `POST /posts` |
| `:` 批量语法 | `/users:batchDelete` | `/users/batch/delete` |
| 混合 ID 命名 | `/posts/{slug}` + `/admin/posts/{postId}` | 统一 `{id}` |
| 驼峰式 URL | `/readingProgress` | `/reading-progress` |
| 单数集合名 | `/post` | `/posts` |
| 深层嵌套 (>3层) | `/a/{id}/b/{id}/c/{id}/d/{id}` | 拆分或展平 |
| `page_size` 参数 | `?page_size=20` | `?per_page=20` |
| 筛选占路径段 | `/posts/category/rust` | `/posts?category=rust` |
| Admin 路由缺认证 | `admin/posts` 无 auth middleware | 必须 auth + role check |
| 操作作资源 | `POST /posts/{id}/like` | `POST /posts/{id}/likes` |
