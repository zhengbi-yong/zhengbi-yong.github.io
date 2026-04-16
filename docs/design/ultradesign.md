# zhengbi-yong.github.io 架构设计

> 版本: 3.1.0
> 日期: 2026-04-08
> 目的: 开发者实施指南

---

## 一、技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | Next.js | 16.2.2 | React框架, App Router |
| UI库 | React | 19.2 | <Activity/>状态冻结 |
| 后端框架 | Rust Axum | 0.8 | HTTP服务, OpenAPI路由 |
| 数据库 | PostgreSQL | 18 | 主数据, FTS, ltree |
| 缓存 | Redis | 7.4.x | 会话, 限流, 热点缓存 |
| 搜索 | PG FTS + Meilisearch | 1.12 | 全文检索 |
| 对象存储 | MinIO/S3 | - | 媒体文件 |
| 容器编排 | K3s | - | 生产部署 |
| 认证 | WebAuthn + Argon2id | - | 无密码登录 |

---

## 二、系统架构

```
用户浏览器
    │
    │ HTTPS + HttpOnly Cookie
    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 16 前端 (Port 3001)                │
│  App Router │ Activity组件 │ Orval生成的TS客户端 │ BFF代理    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP JSON / W3C Trace Context
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Rust Axum 后端 (Port 3000)                 │
│  OpenAPI路由 │ SQLx连接池 │ WebAuthn │ Tower中间件         │
└──────────────┬─────────────────────┬────────────────────────┘
                │                     │
                ▼                     ▼
        ┌──────────────┐     ┌──────────────┐
        │ PostgreSQL   │     │   Redis      │
        │ (数据持久化) │     │ (会话/限流) │
        └──────┬───────┘     └──────────────┘
               │ CDC (WAL)
               ▼
        ┌──────────────┐
        │ MeiliBridge   │ (异步Worker)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │ Meilisearch  │ (按需启用)
        └──────────────┘
```

---

## 三、前端架构

### 3.1 目录结构

```
frontend/src/
├── app/
│   ├── layout.tsx              # 根布局 (全局字体/ThemeProvider)
│   ├── proxy.ts              # Next.js 16 前置拦截 (权限/CORS)
│   │
│   ├── (public)/             # 公开页面 - 可SSG/ISR
│   │   ├── page.tsx         # 首页
│   │   ├── blog/
│   │   │   ├── page.tsx     # 博客列表 (use cache缓存)
│   │   │   └── [...slug]/
│   │   │       ├── page.tsx       # 博客详情
│   │   │       ├── loading.tsx    # 流式骨架屏
│   │   │       ├── error.tsx
│   │   │       └── not-found.tsx
│   │   ├── tags/
│   │   ├── team/
│   │   └── music/
│   │
│   ├── (admin)/              # 管理后台 - 严格SSR+权限
│   │   └── admin/
│   │       ├── layout.tsx   # 侧边栏+Auth校验
│   │       ├── page.tsx     # 仪表盘
│   │       ├── posts/
│   │       ├── users/
│   │       ├── comments/
│   │       └── media/
│   │
│   └── api/
│       └── v1/[...path]/    # BFF代理 (仅Client组件调用)
│
├── components/
│   ├── layouts/             # 布局组件
│   ├── blog/                # 博客组件
│   ├── ui/                 # shadcn/ui基础组件
│   ├── chemistry/           # 富媒体 (必须Activity包裹)
│   │   ├── ThreeDmol.tsx    # 3D化学结构
│   │   ├── RDKitStructure.tsx
│   │   └── MusicScore.tsx   # 乐谱
│   └── sandbox/             # 隔离沙箱 (Meilisearch等)
│       └── MeiliSearchSandbox.tsx
│
└── lib/
    ├── api/
    │   ├── generated/       # Orval自动生成 (禁止手改!)
    │   │   ├── client.ts
    │   │   └── models/
    │   └── mutator.ts       # RSC认证Cookie桥接
    ├── store/
    │   └── ui-store.ts      # Zustand仅存UI状态
    └── utils/
        └── imageLoader.ts    # 自定义图片加载器
```

### 3.2 数据获取规范

**核心原则:**

| 调用方 | 方式 | 说明 |
|--------|------|------|
| Server Components | `customFetch()` | 直连后端, 带Cookie |
| Client Components | `/api/v1/*` Route Handler | 走BFF代理 |

```typescript
// lib/api/mutator.ts - Server Component用
import { cookies } from 'next/headers'

export async function customFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isServer = typeof window === 'undefined'
  const headers = new Headers(options.headers)

  if (isServer) {
    // RSC: 从Cookie获取会话
    const cookieStore = await cookies()
    const session = cookieStore.get('auth_session')
    if (session) {
      headers.set('Cookie', `auth_session=${session.value}`)
    }
  } else {
    // Client: 浏览器自动带Cookie
    options.credentials = 'include'
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`)
  }

  return res.json()
}
```

```typescript
// Server Component用法
import { customFetch } from '@/lib/api/mutator'

async function BlogPage() {
  // 直接调后端, 自动带Cookie
  const posts = await customFetch<Post[]>('/api/v1/posts')
  return <BlogList posts={posts} />
}
```

```typescript
// Client Component用法 - Orval生成
import { getPosts } from '@/lib/api/generated'

async function BlogList() {
  // 走BFF代理
  const { data } = await getPosts()
  return <ul>{data?.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### 3.3 认证流程

**不用localStorage存JWT, 改用HttpOnly Cookie:**

```
登录流程:
1. 用户提交凭据 → Next.js Route Handler
2. Handler调后端验证
3. 后端颁发HttpOnly Cookie (含session_id)
4. 后续请求浏览器自动携带Cookie
5. mutator.ts读取Cookie传给后端验证
```

### 3.4 富媒体组件 (Activity + WebGL)

```tsx
// components/chemistry/ThreeDmol.tsx
'use client'

import { Activity } from 'react'
import { useEffect, useRef, useState } from 'react'

export function ThreeDmolViewer({ moleculeData, isActive }: {
  moleculeData: string
  isActive: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (!viewerRef.current) {
      // 初始化 viewer
      viewerRef.current = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: 'white'
      })
      viewerRef.current.addModel(moleculeData, 'pdb')
      viewerRef.current.setStyle({}, { stick: {} })
      viewerRef.current.zoomTo()
    }

    if (isActive) {
      // 恢复可见: 继续渲染
      viewerRef.current.render()
    } else {
      // 隐藏: 保存快照 + 暂停渲染
      if (containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas')
        if (canvas) {
          setSnapshot(canvas.toDataURL())
        }
      }
      viewerRef.current.render = () => {} // 暂停帧循环
    }
  }, [isActive, moleculeData])

  return (
    <Activity mode={isActive ? 'visible' : 'hidden'}>
      <div ref={containerRef} className="w-full h-96 relative">
        {snapshot && (
          <img
            src={snapshot}
            className="absolute inset-0 w-full h-full object-contain"
            alt="Molecule snapshot"
          />
        )}
      </div>
    </Activity>
  )
}
```

### 3.5 搜索降级策略

```tsx
// components/blog/SearchDashboard.tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

// 默认: PG FTS, 无需加载额外JS
import { searchPosts } from '@/lib/api/generated'

// 按需: 用户触发后才加载Meilisearch
const MeiliSearchSandbox = dynamic(
  () => import('@/components/sandbox/MeiliSearchSandbox'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded" />
  }
)

export function SearchDashboard() {
  const [isDeepSearch, setIsDeepSearch] = useState(false)
  const [query, setQuery] = useState('')

  // 普通搜索: 直接调后端PG FTS
  async function handleNormalSearch() {
    const results = await searchPosts({ q: query })
    // 显示结果
  }

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />

      {/* 普通搜索 */}
      <button onClick={handleNormalSearch}>
        搜索
      </button>

      {/* 高级搜索: 用户触发后懒加载 */}
      <button onClick={() => setIsDeepSearch(true)}>
        开启智能纠错 (Meilisearch)
      </button>

      {isDeepSearch && (
        <Suspense fallback={<p>加载中...</p>}>
          <MeiliSearchSandbox initialQuery={query} />
        </Suspense>
      )}
    </div>
  )
}
```

### 3.6 状态管理职责

| Store | 存什么 | 存哪里 | 原因 |
|-------|--------|--------|------|
| ui-store | theme, sidebar, modal | Zustand | 纯UI, 无敏感数据 |
| ~~auth-store~~ | ~~token~~ | ~~localStorage~~ | **禁止!** XSS风险 |
| ~~blog-store~~ | ~~posts~~ | ~~localStorage~~ | **禁止!** 用use cache |

---

## 四、后端架构

### 4.1 项目结构

```
backend/
├── crates/
│   ├── api/                      # HTTP服务器
│   │   ├── src/
│   │   │   ├── main.rs          # 入口 + 优雅停机
│   │   │   ├── lib.rs
│   │   │   ├── routes/
│   │   │   │   ├── auth.rs      # 认证
│   │   │   │   ├── posts.rs
│   │   │   │   ├── comments.rs
│   │   │   │   ├── categories.rs
│   │   │   │   ├── tags.rs
│   │   │   │   ├── media.rs
│   │   │   │   ├── admin.rs
│   │   │   │   ├── search.rs
│   │   │   │   └── team_members.rs
│   │   │   ├── middleware/
│   │   │   │   ├── auth.rs      # JWT验证
│   │   │   │   ├── rate_limit.rs # 滑动窗口限流
│   │   │   │   ├── csrf.rs      # CSRF验证
│   │   │   │   └── request_id.rs
│   │   │   └── state.rs         # AppState
│   │   └── Cargo.toml
│   │
│   ├── core/                     # 业务逻辑 (纯Rust)
│   │   ├── src/
│   │   │   ├── auth.rs          # WebAuthn + Argon2
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── db/                       # SQLx模型
│   │   └── Cargo.toml
│   │
│   └── worker/                   # MeiliBridge CDC Worker
│       └── Cargo.toml
│
├── migrations/                    # SQL迁移
└── Cargo.toml                   # Workspace配置
```

### 4.2 路由语法 (Axum 0.8+)

```rust
// 正确: OpenAPI风格大括号
Router::new()
    .route("/posts", get(list_posts))
    .route("/posts/{slug}", get(get_post))           // 单参数
    .route("/posts/{*path}", get(get_catch_all))    // 捕获全部
    .route("/posts/{slug}/comments", get(get_comments))
    .route("/posts/{slug}/like", post(like_post))

// 错误: 旧语法 (已废弃)
Router::new()
    .route("/posts/:slug", get(get_post))          // 编译警告!
    .route("/posts/*path", get(...))                // 编译错误!
```

### 4.3 认证中间件

```rust
// middleware/auth.rs
pub async fn auth_middleware(
    Extension(auth_user): Extension<AuthUser>,
    request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    // 1. 从Authorization Header提取Bearer Token (或从Cookie)
    // 2. 验证JWT签名和过期时间
    // 3. 检查Redis黑名单 (如果token被撤销)
    // 4. 从数据库加载用户信息
    // 5. 注入AuthUser到请求扩展
}

// 可选认证 (不强制登录)
pub async fn optional_auth_middleware(
    Extension(auth_user): Extension<Option<AuthUser>>,
    request: Request,
    next: Next,
) -> Response {
    // 尝试解析token, 失败也继续
}
```

### 4.4 数据库连接池

```rust
// main.rs
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

let pool = PgPoolOptions::new()
    .max_connections(50)           // 单实例不超过50
    .min_connections(5)            // 保持最小连接
    .acquire_timeout(Duration::from_secs(5))   // 获取超时
    .idle_timeout(Duration::from_secs(600))    // 空闲回收
    .max_lifetime(Duration::from_secs(1800))   // 连接生命周期
    .fetch_dynamic_timeout(true)    // 动态超时
    .connect(&database_url)
    .await?;
```

### 4.5 优雅停机

```rust
// main.rs
use tokio::signal;

async fn run_server(pool: PgPool) {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    // 监听SIGTERM
    tokio::spawn(async move {
        signal::ctrl_c().await.unwrap();
        println!("收到SIGTERM, 开始优雅关闭...");

        // 1. 修改健康检查为失败 (通知负载均衡器停止发请求)
        // set_healthy(false);

        // 2. 等待现有请求完成 (最多30秒)
        tokio::time::sleep(Duration::from_secs(30)).await;

        // 3. 关闭数据库连接池
        pool.close().await;

        println!("优雅关闭完成");
        std::process::exit(0);
    });

    axum::serve(listener, app).await.unwrap();
}
```

### 4.6 禁止模式

```rust
// 禁止: 事务内调外部服务
async fn create_post(pool: &PgPool, redis: &Redis) -> Result<()> {
    let mut tx = pool.begin().await?;

    tx.execute("INSERT INTO posts VALUES ($1)", &[&post]).await?;

    // 禁止! 会导致:
    // 1. 连接池被长事务占用
    // 2. Redis超时会导致事务回滚
    // 3. 可能死锁
    redis.set("post:created", id).await?;

    tx.commit().await
}

// 正确: Outbox模式
async fn create_post(pool: &PgPool) -> Result<()> {
    let mut tx = pool.begin().await?;

    tx.execute("INSERT INTO posts VALUES ($1)", &[&post]).await?;

    // 写Outbox, 不调外部服务
    tx.execute(
        "INSERT INTO outbox_events (topic, payload) VALUES ($1, $2)",
        &["post.created", serde_json::to_json(&post)?]
    ).await?;

    tx.commit().await
    // Worker异步处理 outbox_events, 发Redis/通知等
}

// 禁止: 在中间件里查数据库
async fn bad_middleware(request: Request, next: Next) -> Response {
    // 中间件在每个请求链上执行, 查DB会:
    // 1. 增加延迟
    // 2. 可能阻塞
    let user = db.query_user(&request).await;
    next.run(request).await
}

// 正确: 在handler里查
async fn get_post(
    Extension(state): Extension<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Post>> {
    let post = state.db.get_post_by_slug(&slug).await?;
    Ok(Json(post))
}
```

---

## 五、数据库设计

### 5.1 表结构

#### users (用户表)

```sql
-- 使用ICU Collation替代CITEXT (性能更好)
CREATE COLLATION universal_ci (
    provider = icu,
    locale = 'en-US-u-ks-level2',
    deterministic = false
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),  -- UUIDv7: 时间序列化
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT,                    -- Argon2id (Passkeys可为空)
    webauthn_public_key TEXT,              -- WebAuthn公钥
    role user_role NOT NULL DEFAULT 'user',
    profile JSONB NOT NULL DEFAULT '{}',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ                 -- 软删除
);

-- 部分唯一索引 (仅active用户)
CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE deleted_at IS NULL;

-- JSONB: 使用jsonb_path_ops减少索引体积
CREATE INDEX idx_users_profile ON users USING GIN (profile jsonb_path_ops);
```

#### posts (文章表)

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT,
    summary TEXT,
    cover_image_id UUID REFERENCES media(id),
    status post_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    category_id UUID REFERENCES categories(id),
    author_id UUID REFERENCES users(id),
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    content_hash TEXT,                    -- MDX同步用
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    sync_epoch BIGINT                     -- MDX同步纪元
);

-- 常用查询索引
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at DESC)
    WHERE status = 'published';
```

#### comments (评论表) - ltree层级

```sql
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    html_sanitized TEXT NOT NULL,
    status comment_status NOT NULL DEFAULT 'pending',
    path LTREE NOT NULL,                  -- 层级路径: "1.4.7"
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ltree索引 (GIST)
CREATE INDEX idx_comments_path ON comments USING GIST (path);

-- 常用查询
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_pending ON comments(created_at DESC)
    WHERE status = 'pending';
```

#### post_stats (统计表) - HOT优化

```sql
-- fillfactor=70: 为UPDATE预留空间, 激活HOT更新
-- 禁止建索引: 高频UPDATE表不应有索引
CREATE TABLE post_stats (
    post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITH (fillfactor = 70);
```

#### outbox_events (事件外发表) - 表分区

```sql
CREATE TABLE outbox_events (
    id UUID DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY LIST (status);

-- 按状态分区: pending热区, completed/failed冷区
CREATE TABLE outbox_pending
    PARTITION OF outbox_events
    FOR VALUES IN ('pending', 'processing');

CREATE TABLE outbox_completed
    PARTITION OF outbox_events
    FOR VALUES IN ('completed', 'failed');

-- 消费者用 FOR UPDATE SKIP LOCKED 避免争抢
```

### 5.2 Redis数据结构

```
# 限流: 滑动窗口ZSET
ratelimit:{ip}:{route} → ZSET(score=timestamp, member=request_id)
TTL: 滑动窗口时长

# 会话
session:{session_id} → Hash(user_id, expires_at, roles)
TTL: 30分钟

# 挑战码 (WebAuthn防重放)
webauthn_challenge:{user_id} → String(challenge)
TTL: 60秒

# 令牌黑名单
token_blacklist:{jti} → String("1")
TTL: 剩余有效期
```

### 5.3 索引设计原则

| 场景 | 规则 | 示例 |
|------|------|------|
| 主键 | UUIDv7 | `id UUID PRIMARY KEY DEFAULT uuid_generate_v7()` |
| 唯一约束+软删除 | 部分索引 | `WHERE deleted_at IS NULL` |
| 高频UPDATE表 | 禁止索引 | post_stats禁加索引 |
| JSONB | jsonb_path_ops | `USING GIN (profile jsonb_path_ops)` |
| 树形结构 | ltree+GIST | `USING GIST (path)` |

---

## 六、API设计

### 6.1 RESTful规范

```bash
# 资源命名: 名词复数, 不用动词
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
POST   /posts/{slug}/likes          # 点赞 (关联资源)
GET    /tags:autocomplete          # 自定义查询

# 批量操作: 异步任务
POST   /admin/posts:bulkDelete     # 返回202 + task_id
```

### 6.2 统一寻址

```bash
# 不区分ID类型, 后端自动识别
GET /posts/{slug}          # 优先查slug
GET /posts/{uuid}          # 识别为UUID

# 禁止:
GET /posts/id/{id}         # 不需要
GET /posts/slug/{slug}     # 不需要
```

### 6.3 完整路由表

#### 公开API (`/api/v1/`)

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

#### 管理API (`/api/admin/v1/`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /posts | 列表(含草稿) |
| POST | /posts | 创建 |
| PATCH | /posts/{id} | 更新 |
| DELETE | /posts/{id} | 删除 |
| POST | /posts:syncFromMdx | 同步MDX |
| POST | /users:bulkDelete | 批量删除 |
| POST | /media:generateUploadUrl | 预签名URL |
| GET | /statistics | 统计 |

### 6.4 健康检查

```bash
# 存活探针: /.well-known/live
# - 不查任何外部依赖
# - 只检查进程是否存活
# - 用于K8s判断是否需要重启

# 就绪探针: /.well-known/ready
# - 可检查DB/Redis连接
# - 用于K8s判断是否接收流量

# 禁止:
# - /api/v1/* 前缀 (需要认证)
# - /health (太通用)
```

---

## 七、部署架构

### 7.1 容器安全

```yaml
# kubernetes/deployment.yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        readOnlyRootFilesystem: true
        capabilities:
          capDrop: [ALL]           # 丢弃所有capability

      # 临时文件用tmpfs
      volumes:
        - name: tmp
          emptyDir:
            medium: Memory
      volumeMounts:
        - name: tmp
          mountPath: /tmp
```

### 7.2 环境变量与密钥

```yaml
# 禁止: 明文密钥
env:
  - name: JWT_SECRET
    value: "super-secret-key"  # 禁止!

# 正确: 从Secrets挂载
envFrom:
  - secretRef:
      name: app-secrets
env:
  - name: JWT_SECRET_FILE
    value: "/run/secrets/jwt_secret"
```

### 7.3 探针配置

```yaml
#存活探针: 只检查进程, 不查DB
livenessProbe:
  httpGet:
    path: /.well-known/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3

#就绪探针: 可查DB, 确认能服务
readinessProbe:
  httpGet:
    path: /.well-known/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5

# 错误示范:
# livenessProbe:
#   exec:
#     command: ["pg_isready"]  # 禁止! 网络抖动会触发重启
```

### 7.4 构建优化

```dockerfile
# backend/Dockerfile - 多阶段构建
FROM rust:1.80 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
# 先编译依赖 (利用缓存)
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
# 再编译源码
COPY src/ ./src/
RUN cargo build --release

# 运行时: 用scratch镜像
FROM debian:bookworm-slim
COPY --from=builder /app/target/release/api /usr/local/bin/
# 只复制二进制, 不带工具链
CMD ["/usr/local/bin/api"]
```

---

## 八、演进路线

| 阶段 | 内容 | 预期周期 | 关键交付 |
|------|------|----------|----------|
| 1 | 安全基线 | 1-2周 | HttpOnly Cookie, CSRF防护 |
| 2 | 数据库优化 | 2-3周 | UUIDv7迁移, ltree评论 |
| 3 | API契约 | 2周 | Orval配置, TS客户端 |
| 4 | 认证升级 | 2-3周 | WebAuthn集成 |
| 5 | 搜索CDC | 2周 | MeiliBridge部署 |
| 6 | K3s迁移 | 3-4周 | 生产级集群 |

---

## 九、关键技术决策

| 决策点 | 旧方案 | 新方案 | 原因 |
|--------|--------|--------|------|
| 主键生成 | UUIDv4 (随机) | UUIDv7 (时间序) | B-Tree插入效率, 减少页分裂 |
| 软删除+唯一 | 联合唯一索引 | 部分唯一索引 | NULL≠NULL导致约束失效 |
| 评论树 | 递归CTE | ltree | CT E在大数据量下指数衰减 |
| 计数更新 | 实时UPDATE | Redis缓冲+HOT | 减少写放大 |
| JWT存储 | localStorage | HttpOnly Cookie | 防止XSS窃取 |
| 搜索同步 | Outbox轮询 | CDC MeiliBridge | 亚秒级同步 |
| 内容处理 | Contentlayer | Velite | 活跃维护, Zod验证 |
| API类型 | 手动维护 | Orval自动生成 | 前后端类型一致 |
| 部署方式 | Docker Compose | K3s | 探针自愈, 滚动更新 |

---

## 十、本地开发

```bash
# 启动所有服务
docker compose up -d

# 前端开发
cd frontend && pnpm dev

# 后端开发
cd backend && cargo run

# 数据库迁移
cd backend && cargo run -p migrator

# 查看日志
docker compose logs -f
```

---

*版本: 3.1.0*
*配套: GOLDEN_RULES.md (铁律详解)*
