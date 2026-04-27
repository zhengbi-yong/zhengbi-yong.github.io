# 多模态富文本编辑器系统 — 综合工程设计文档

> 版本: 1.1.0 | 日期: 2026-04-26
> 技术选型: Next.js 16 + TipTap + Reactjs Tiptap Editor / Rust Axum 0.8 + PostgreSQL 17 / 双轨存储
> 作者: Zhengbi Yong

---

## 目录

- [总体架构](#总体架构)
- [P1 基础设施与安全网关](#p1-基础设施与安全网关)
- [P2 核心编辑器集成与水合隔离](#p2-核心编辑器集成与水合隔离)
- [P3 数学公式与 KaTeX 渲染管线](#p3-数学公式与-katex-渲染管线)
- [P4 AST 转换管线与 MDX 双向映射](#p4-ast-转换管线与-mdx-双向映射)
- [P5 多媒体处理与存储](#p5-多媒体处理与存储)
- [P6 测试矩阵与性能优化](#p6-测试矩阵与性能优化)
- [P7 实时协作与 CRDT 同步](#p7-实时协作与-crdt-同步-扩展阶段)
- [P8 企业级数据隐私与合规体系](#p8-企业级数据隐私与合规体系-扩展阶段)

---

## 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户浏览器                              │
│  ┌─────────────────┐          ┌─────────────────────────┐   │
│  │  编辑模式        │          │  阅读模式                │   │
│  │  (Client-Side)  │          │  (SSR / SSG)            │   │
│  │  TipTap Editor  │          │  MDX -> React 组件       │   │
│  └────────┬────────┘          └────────────┬────────────┘   │
└───────────┼────────────────────────────────┼────────────────┘
            │ JSON (写入)                     │ MDX (读取)
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js 16 BFF 层 (Port 3001)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ /api/editor/* │  │ /api/upload  │  │ SSR 渲染引擎     │  │
│  │ (代理转发)    │  │ (文件代理)   │  │ (compileMDX)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / gRPC
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Rust Axum 后端 (Port 3000)                      │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ 文章CRUD │ │ 认证中间件│ │ 文件上传 │ │ 版本管理     │   │
│  │ Routes   │ │ JWT+CSRF │ │ Multipart│ │ Versions     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              异步任务调度器 (tokio::spawn)             │   │
│  │  ┌────────────────────┐  ┌────────────────────────┐  │   │
│  │  │ JSON->MDX 编译     │  │ 版本快照 & 审计日志     │  │   │
│  │  │ (Rust unifast 主引擎│  │ (含密码学签章)         │  │   │
│  │  │  Node.js 备引擎)   │  │                        │  │   │
│  │  └────────────────────┘  └────────────────────────┘  │   │
│  │  ┌────────────────────┐  ┌────────────────────────┐  │   │
│  │  │ Yrs CRDT 同步      │  │ DROP 合规轮询          │  │   │
│  │  │ (WebSocket 多路复用)│  │ (45天周期)             │  │   │
│  │  └────────────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │ PostgreSQL │ │   Redis    │ │  S3/MinIO   │
   │  (双轨表)  │ │  (会话缓存)│ │ (媒体存储)  │
   └────────────┘ └────────────┘ └────────────┘
```

### 核心设计原则

1. **写入侧与读取侧分离 (CQRS)**: content_json 是唯一真相源, content_mdx 是派生缓存
2. **编辑器客户端隔离**: TipTap 严格运行在浏览器, 不参与 SSR
3. **数据层纯净性**: JSON 节点只存语义数据 (如 LaTeX 源码), 不存渲染结果
4. **多媒体外置**: 二进制资产存 S3, JSON 中仅保留元数据和 URL 指针
5. **审计可追溯**: 每次保存生成版本快照, 支持完整的编辑历史回溯

### 技术栈版本锁定

| 组件 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.x | 前端框架, App Router, Turbopack 默认构建 |
| React | 19.x (含 React Compiler) | UI 渲染, 自动记忆化 |
| TipTap | 2.x (最新) | 无头编辑器核心 (ProseMirror) |
| reactjs-tiptap-editor | 最新 | 编辑器 UI 组件 (Shadcn/Tailwind) |
| KaTeX | 0.16+ | 数学公式渲染 |
| Tailwind CSS | 4.x | 样式系统 |
| Shadcn/UI | 最新 | UI 组件库 |
| Rust | 2024 edition | 后端语言 |
| Axum | 0.8.x | Web 框架 (/{id} 路由语法) |
| SQLx | 0.8.x | 数据库驱动 |
| PostgreSQL | 17.x | 主数据库 |
| Redis | 7.4.x | 会话缓存 |
| unifast / mdx-rs | 最新 | Rust 原生 AST 转换编译器 |
| Yrs (y-crdt) | 最新 | Rust 原生 Yjs CRDT 协作引擎 |
| Playwright | 最新 | E2E 与视觉回归测试 |

---

## P1 基础设施与安全网关

### 1.1 目标

搭建 Next.js 16 + Rust Axum 0.8 的容器化微服务骨架, 配置 PostgreSQL 双轨存储数据模型,
部署集成 JWT 与 CSRF 防御的强类型 API 网关. 本阶段完成后, 系统具备用户认证、
文章基础 CRUD (纯文本) 和数据库读写能力.

### 1.2 数据库 Schema 设计

#### 1.2.1 用户表

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,           -- Argon2id 哈希
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    role            VARCHAR(20) NOT NULL DEFAULT 'author',
                    -- 'admin' | 'editor' | 'author' | 'viewer'
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
```

#### 1.2.2 文章表 (双轨存储核心)

```sql
CREATE TABLE articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    summary         TEXT,                    -- 文章摘要
    cover_image_url TEXT,                    -- 封面图 URL

    -- ========== 双轨存储 ==========
    content_json    JSONB NOT NULL DEFAULT '{}',
                    -- 写入侧: TipTap ProseMirror JSON AST
                    -- 这是系统的 Single Source of Truth
    content_mdx     TEXT DEFAULT '',
                    -- 读取侧: 由后台异步编译生成的 MDX 文本
                    -- 前端 SSR 阅读模式直接读取此字段
    mdx_compiled_at TIMESTAMPTZ,
                    -- MDX 最后编译时间, 用于判断是否需要重新编译

    -- ========== 元数据 ==========
    author_id       UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
                    -- 'draft' | 'published' | 'archived'
    tags            TEXT[] DEFAULT '{}',
    layout          VARCHAR(20) DEFAULT 'standard',
                    -- 'standard' | 'magazine' | 'minimal'
    is_featured     BOOLEAN DEFAULT false,
    view_count      INTEGER DEFAULT 0,
    word_count      INTEGER DEFAULT 0,

    -- ========== 时间戳 ==========
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- JSONB GIN 索引: 支持对 JSON 内部节点的高速检索
CREATE INDEX idx_articles_content_json ON articles USING GIN (content_json jsonb_path_ops);
-- 常规查询索引
CREATE INDEX idx_articles_slug ON articles (slug);
CREATE INDEX idx_articles_status ON articles (status);
CREATE INDEX idx_articles_author ON articles (author_id);
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);
CREATE INDEX idx_articles_published_at ON articles (published_at DESC);
```

#### 1.2.3 版本历史表 (审计追踪)

```sql
CREATE TABLE article_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    content_json    JSONB NOT NULL,          -- 该版本的完整 JSON 快照
    title           VARCHAR(255),
    editor_id       UUID NOT NULL REFERENCES users(id),
    change_summary  TEXT,                    -- 变更摘要 (可选)
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (article_id, version_number)
);

CREATE INDEX idx_versions_article ON article_versions (article_id, version_number DESC);
```

#### 1.2.4 媒体资产表

```sql
CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size       BIGINT NOT NULL,         -- 字节数
    storage_path    TEXT NOT NULL,            -- S3/本地存储路径
    url             TEXT NOT NULL,            -- 访问 URL
    width           INTEGER,                 -- 图片/视频宽度
    height          INTEGER,                 -- 图片/视频高度
    duration        FLOAT,                   -- 音视频时长 (秒)
    uploader_id     UUID NOT NULL REFERENCES users(id),
    article_id      UUID REFERENCES articles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_article ON media_assets (article_id);
CREATE INDEX idx_media_uploader ON media_assets (uploader_id);
```

### 1.3 Rust Axum 后端骨架

#### 1.3.1 项目结构

```
backend/crates/
├── api/
│   └── src/
│       ├── main.rs              -- 入口, 启动 Axum 服务
│       ├── routes/
│       │   ├── mod.rs
│       │   ├── auth.rs          -- 登录/注册/刷新 Token
│       │   ├── articles.rs      -- 文章 CRUD
│       │   ├── versions.rs      -- 版本历史查询
│       │   ├── upload.rs        -- 文件上传
│       │   └── health.rs        -- 健康检查
│       ├── middleware/
│       │   ├── mod.rs
│       │   ├── auth.rs          -- JWT 验证中间件
│       │   ├── csrf.rs          -- CSRF 双提交 Cookie
│       │   └── rate_limit.rs    -- 速率限制
│       ├── models/
│       │   ├── mod.rs
│       │   ├── article.rs       -- 文章数据模型
│       │   ├── user.rs          -- 用户数据模型
│       │   └── media.rs         -- 媒体资产模型
│       ├── services/
│       │   ├── mod.rs
│       │   ├── article_service.rs
│       │   ├── auth_service.rs
│       │   └── mdx_compiler.rs  -- JSON->MDX 编译调度
│       └── utils/
│           ├── mod.rs
│           ├── errors.rs        -- 统一错误处理
│           └── validation.rs    -- 自定义校验器
├── core/                        -- 业务逻辑
├── db/                          -- 数据库模型与迁移
└── shared/                      -- 共享工具
```

#### 1.3.2 核心 API 端点

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/auth/register | 用户注册 | 无 |
| POST | /api/v1/auth/login | 用户登录, 返回 JWT | 无 |
| POST | /api/v1/auth/refresh | 刷新 Token | JWT |
| POST | /api/v1/auth/logout | 登出, 清除 Cookie | JWT |
| GET | /api/v1/articles | 文章列表 (分页, 筛选) | 可选 |
| GET | /api/v1/articles/{slug} | 获取单篇文章 | 可选 |
| POST | /api/v1/articles | 创建文章 | JWT + CSRF |
| PUT | /api/v1/articles/{id} | 更新文章 (触发双轨写入) | JWT + CSRF |
| DELETE | /api/v1/articles/{id} | 删除文章 | JWT + CSRF |
| GET | /api/v1/articles/{id}/versions | 获取版本历史 | JWT |
| GET | /api/v1/articles/{id}/versions/{v} | 获取特定版本 | JWT |
| POST | /api/v1/upload | 上传媒体文件 | JWT + CSRF |
| GET | /api/v1/health | 健康检查 | 无 |

> **Axum 0.8 路由语法变更**: 全面采用 `/{id}` 大括号路径参数语法 (废弃旧版 `/:id`),
> 与 OpenAPI 规范对齐, 消除路由前缀冲突导致的运行时 Panic.

#### 1.3.3 认证机制

```
登录流程:
1. POST /auth/login { email, password }
2. Axum 验证 Argon2id 哈希
3. 生成 JWT (有效期 15 分钟)
4. 设置 HttpOnly Cookie:
   Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/
5. 设置 CSRF Cookie:
   Set-Cookie: XSRF-TOKEN=<random>; Secure; SameSite=Strict; Path=/
6. 前端后续请求携带:
   - Cookie 自动附带 access_token
   - Header: X-XSRF-TOKEN=<从 Cookie 读取的值>
7. Axum 中间件同时验证 JWT 有效性 + CSRF Token 匹配
```

JWT Payload 结构:
```json
{
  "sub": "user-uuid",
  "role": "author",
  "exp": 1714200000,
  "iat": 1714199100
}
```

#### 1.3.4 请求校验 (Serde + Validator)

```rust
use axum_valid::ValidatedJson;
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct CreateArticlePayload {
    #[validate(length(min = 1, max = 255, message = "标题长度 1-255 字符"))]
    pub title: String,

    #[validate(length(min = 1, max = 255))]
    pub slug: String,

    pub content: serde_json::Value,  // TipTap JSON AST

    #[validate(length(max = 500))]
    pub summary: Option<String>,

    pub tags: Option<Vec<String>>,
}

// Axum 提取器自动校验, 非法数据返回 422
pub async fn create_article(
    auth: AuthUser,                                    // JWT 中间件注入
    ValidatedJson(payload): ValidatedJson<CreateArticlePayload>,
    State(state): State<AppState>,
) -> Result<Json<ArticleResponse>, AppError> {
    // payload 已通过校验, 安全使用
    let article = state.article_service
        .create(auth.user_id, payload)
        .await?;
    Ok(Json(article.into()))
}
```

#### 1.3.5 统一错误响应

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数校验失败",
    "details": [
      { "field": "title", "message": "标题长度 1-255 字符" }
    ]
  }
}
```

HTTP 状态码映射:
- 400: 请求格式错误
- 401: 未认证
- 403: 权限不足
- 404: 资源不存在
- 409: 冲突 (如 slug 重复)
- 422: 校验失败
- 429: 速率限制
- 500: 服务器内部错误

#### 1.3.6 Tower 中间件纵深防御

Axum 0.8 通过 Tower 中间件栈在 HTTP 边界构建多层安全防线:

```rust
use axum::extract::DefaultBodyLimit;
use tower_http::limit::RequestBodyLimitLayer;

let app = Router::new()
    .merge(article_routes())
    .merge(auth_routes())
    // 全局 Payload 体积钳制: 阻断超过 10MB 的请求, 防止 OOM 攻击
    .layer(RequestBodyLimitLayer::new(10 * 1024 * 1024))
    // 文件上传路由单独放宽至 100MB
    .route("/api/v1/upload", post(upload_file)
        .layer(DefaultBodyLimit::max(100 * 1024 * 1024)))
    // CORS 配置
    .layer(CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_credentials(true))
    // 速率限制
    .layer(RateLimitLayer::new(60, Duration::from_secs(60)));
```

| 防护层 | 实现组件 | 拦截原理 |
|--------|----------|----------|
| Payload 体积钳制 | `RequestBodyLimitLayer` | 握手阶段阻断超限请求, 杜绝 OOM 攻击 |
| JSON 流式校验 | `Json<T>` + `validator` 宏 | Serde 低内存反序列化 + 强类型 Schema 校验 |
| 状态并发隔离 | `State(Arc<RwLock<T>>)` | Rust 所有权模型保证零数据竞争 |
| CSRF 双提交 | 自定义中间件 | Cookie + Header Token 双重匹配 |
| JWT 认证 | 自定义中间件 | 每请求验证签名, 过期, 角色权限 |

### 1.4 Next.js 16 前端骨架

#### 1.4.1 Next.js 16 核心特性集成

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack 已成为 Next.js 16 默认构建器 (基于 Rust/SWC)
  // 提供 ~10x HMR 速度, 2-5x 生产构建提速

  experimental: {
    // 文件系统缓存: 跨次重启持久化 AST 解析工件, 毫秒级冷启动
    turbopackFileSystemCacheForDev: true,

    // 局部预渲染 (PPR): 静态外壳 + 流式动态内容
    ppr: true,
  },

  // 显式缓存组件模型: 未标注 'use cache' 的组件默认实时渲染
  cacheComponents: true,
};

export default nextConfig;
```

**Next.js 16 性能优化策略:**

| 特性 | 配置 | 效果 |
|------|------|------|
| Turbopack | 默认启用 | HMR 提速 ~10x, 生产构建提速 2-5x |
| React Compiler | 自动记忆化 | 消除手动 useMemo/useCallback, 优化 AST 重渲染 |
| `use cache` 指令 | 页面/组件/函数级 | 显式控制缓存粒度, 搭配 `cacheLife('hours')` |
| PPR (Partial Prerendering) | `experimental.ppr: true` | 静态外壳 CDN 瞬返 + `<Suspense>` 流式注水 |
| V8 字节码缓存 | 自动 (Serverless 边缘) | MDX 渲染函数跳过 AST 解析, TTFB 数倍提升 |

**阅读页缓存示例:**

```typescript
// app/(main)/blog/[slug]/page.tsx
'use cache';
import { cacheLife } from 'next/cache';

export default async function ArticlePage({ params }) {
  cacheLife('hours');  // 缓存有效期: 小时级
  const article = await fetchArticle(params.slug);
  // ... SSR 渲染 MDX
}
```

#### 1.4.1 路由结构

```
frontend/src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/
│   ├── layout.tsx               -- 主布局 (导航栏, 侧边栏)
│   ├── page.tsx                 -- 首页
│   ├── blog/
│   │   ├── page.tsx             -- 文章列表
│   │   └── [slug]/page.tsx      -- 文章阅读页 (SSR, 读取 content_mdx)
│   └── projects/
│       └── page.tsx
├── editor/
│   └── [id]/page.tsx            -- 编辑器页面 (Client-Side)
├── admin/                       -- Payload CMS 管理面板
├── api/
│   ├── editor/
│   │   └── [...path]/route.ts   -- BFF 代理转发到 Axum
│   └── upload/
│       └── route.ts             -- 文件上传代理
└── layout.tsx                   -- 根布局
```

#### 1.4.2 BFF 代理层

Next.js API Routes 作为 BFF (Backend For Frontend), 将前端请求代理到 Axum:

```typescript
// app/api/editor/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const response = await fetch(`${BACKEND_URL}/api/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': req.headers.get('cookie') || '',
      'X-XSRF-TOKEN': req.headers.get('x-xsrf-token') || '',
    },
    body: await req.text(),
  });
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
```

### 1.5 Docker 容器化

```yaml
# docker-compose.editor.yml
services:
  frontend:
    build: ./frontend
    ports: ["3001:3001"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000
      - BACKEND_URL=http://backend:3000
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://blog_user:blog_password@postgres:5432/blog_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - RUST_LOG=info
    depends_on: [postgres, redis]

  postgres:
    image: postgres:17
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: blog_db
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: blog_password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7.4-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

### 1.6 P1 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P1-01 | 服务启动 | `docker compose up -d` 后所有服务健康 | `curl http://localhost:3000/api/v1/health` 返回 200 |
| P1-02 | 数据库表结构 | articles, users, article_versions, media_assets 表存在且字段正确 | `\d articles` 检查列和索引 |
| P1-03 | 用户注册 | POST /auth/register 成功创建用户 | 返回 201, 数据库有记录 |
| P1-04 | 用户登录 | POST /auth/login 返回 JWT Cookie | 响应包含 Set-Cookie: access_token |
| P1-05 | CSRF 防御 | 无 X-XSRF-TOKEN 的写请求被拒绝 | POST /articles 无 CSRF Token 返回 403 |
| P1-06 | 文章创建 | POST /articles 写入 content_json | 数据库 content_json 字段非空 |
| P1-07 | 文章读取 | GET /articles/{slug} 返回完整文章 | 响应包含 content_json 和 content_mdx |
| P1-08 | 输入校验 | 超长标题 (>255字符) 被拒绝 | 返回 422 + 错误详情 |
| P1-09 | 速率限制 | 60秒内超过60次请求被限流 | 返回 429 Too Many Requests |
| P1-10 | 前端页面 | Next.js 首页和文章列表页可访问 | 浏览器访问 http://localhost:3001 正常渲染 |

---

## P2 核心编辑器集成与水合隔离

### 2.1 目标

在 Next.js 16 前端中集成 TipTap 编辑器 (使用 reactjs-tiptap-editor 作为 UI 层),
解决 SSR 水合冲突, 实现基础富文本编辑 (段落, 标题, 列表, 粗体, 斜体, 链接, 代码块, 引用, 表格),
并与 Axum 后端完成 JSON 内容的保存与加载闭环.

### 2.2 水合冲突 (Hydration Mismatch) 解决方案

#### 2.2.1 问题根因

TipTap 在初始化时重度依赖浏览器 DOM API (window, document, Selection API).
Next.js 默认在服务器端执行组件渲染 (SSR), 服务端生成的 HTML 与客户端 React 首次挂载时
构建的组件树存在结构性差异, 导致 React 协调算法检测到 DOM 不匹配而崩溃.

#### 2.2.2 三层隔离策略

```
第一层: 'use client' 指令
  └─ 声明编辑器组件为客户端组件, 不参与服务端渲染计算

第二层: immediatelyRender: false
  └─ 强制 TipTap 延迟初始化到 useEffect 之后
  └─ 服务端输出纯净占位符, 客户端水合后再注入编辑器 DOM

第三层: next/dynamic + { ssr: false }
  └─ 从路由层面彻底切断 SSR 尝试
  └─ 实现代码分割, 防止 ProseMirror 引擎阻塞关键渲染路径
```

#### 2.2.3 实现代码

```typescript
// frontend/src/components/editor/EditorLoader.tsx
'use client';

import dynamic from 'next/dynamic';
import { EditorSkeleton } from './EditorSkeleton';

// 第三层: 动态加载, 彻底禁用 SSR
const TiptapEditor = dynamic(
  () => import('./TiptapEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

interface EditorLoaderProps {
  articleId?: string;
  initialContent?: Record<string, unknown>;
  onSave?: (content: Record<string, unknown>) => Promise<void>;
}

export function EditorLoader(props: EditorLoaderProps) {
  return <TiptapEditor {...props} />;
}
```

```typescript
// frontend/src/components/editor/TiptapEditor.tsx
'use client';  // 第一层: 客户端组件声明

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useRef } from 'react';

interface TiptapEditorProps {
  articleId?: string;
  initialContent?: Record<string, unknown>;
  onSave?: (content: Record<string, unknown>) => Promise<void>;
}

export default function TiptapEditor({
  articleId,
  initialContent,
  onSave,
}: TiptapEditorProps) {
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    // 第二层: 核心开关 - 延迟渲染, 避免水合错误
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: false,  // 后续用 ShikiCodeBlock 替代
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: '开始编写你的文章...',
      }),
    ],

    content: initialContent || { type: 'doc', content: [] },

    // 自动保存: 内容变更后 3 秒触发
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        handleAutoSave(editor.getJSON());
      }, 3000);
    },
  });

  const handleAutoSave = useCallback(async (json: Record<string, unknown>) => {
    if (!onSave) return;
    try {
      await onSave(json);
    } catch (err) {
      console.error('自动保存失败:', err);
    }
  }, [onSave]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!editor) return <EditorSkeleton />;

  return (
    <div className="editor-container">
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-lg max-w-none dark:prose-invert"
      />
    </div>
  );
}
```

```typescript
// frontend/src/components/editor/EditorSkeleton.tsx
export function EditorSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-10 bg-muted rounded w-full" />       {/* 工具栏占位 */}
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  );
}
```

### 2.3 编辑器页面路由

```typescript
// frontend/src/app/editor/[id]/page.tsx
import { EditorLoader } from '@/components/editor/EditorLoader';
import { fetchArticleForEdit } from '@/lib/api/articles';

interface EditorPageProps {
  params: { id: string };
}

export default async function EditorPage({ params }: EditorPageProps) {
  // 服务端获取文章数据 (content_json)
  const article = await fetchArticleForEdit(params.id);

  return (
    <div className="min-h-screen bg-background">
      <EditorLoader
        articleId={params.id}
        initialContent={article.content_json}
        onSave={async (content) => {
          // 客户端保存逻辑在 EditorLoader 内部处理
        }}
      />
    </div>
  );
}
```

### 2.4 工具栏组件设计

基于 reactjs-tiptap-editor 的 Shadcn/UI 工具栏, 按功能分组:

```
┌─────────────────────────────────────────────────────────────────┐
│ [B] [I] [S] [Code] │ [H1][H2][H3] │ [UL][OL][Task] │ [Quote] │
│ [Link][Image][Video]│ [Table]      │ [CodeBlock]    │ [Math]  │
│ [Undo][Redo]        │ [Align L/C/R]│ [Color][BgColor]│ [More] │
└─────────────────────────────────────────────────────────────────┘
```

工具栏按钮调用 TipTap 命令链:
```typescript
// 示例: 切换粗体
<ToolbarButton
  onClick={() => editor.chain().focus().toggleBold().run()}
  isActive={editor.isActive('bold')}
  icon={<BoldIcon />}
  tooltip="粗体 (Ctrl+B)"
/>
```

### 2.5 内容保存与加载 API 对接

```typescript
// frontend/src/lib/api/articles.ts

// 保存文章内容 (写入侧 -> content_json)
export async function saveArticleContent(
  articleId: string,
  content: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`/api/editor/articles/${articleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': getCsrfToken(),
    },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`保存失败: ${res.status}`);
}

// 加载文章内容 (编辑模式 -> content_json)
export async function fetchArticleForEdit(
  articleId: string
): Promise<{ content_json: Record<string, unknown>; title: string }> {
  const res = await fetch(`/api/editor/articles/${articleId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`加载失败: ${res.status}`);
  return res.json();
}
```

### 2.6 TipTap JSON 数据结构示例

编辑器内部状态以 ProseMirror JSON 格式表示:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [
        { "type": "text", "text": "文章标题" }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "这是一段 " },
        {
          "type": "text",
          "marks": [{ "type": "bold" }],
          "text": "加粗"
        },
        { "type": "text", "text": " 文本." }
      ]
    },
    {
      "type": "table",
      "content": [
        {
          "type": "tableRow",
          "content": [
            {
              "type": "tableHeader",
              "content": [
                { "type": "paragraph", "content": [{ "type": "text", "text": "列1" }] }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 2.7 P2 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P2-01 | 编辑器加载 | 编辑器页面无 SSR 错误, 无水合警告 | 浏览器控制台无 Hydration Mismatch 错误 |
| P2-02 | 骨架屏 | 编辑器加载期间显示骨架屏占位 | 视觉确认加载动画 |
| P2-03 | 基础格式 | 粗体/斜体/删除线/代码 可切换 | 工具栏按钮点击后文本样式变化 |
| P2-04 | 标题层级 | H1-H4 标题可切换 | 选中文本后切换标题级别 |
| P2-05 | 列表 | 有序/无序/任务列表可创建 | 输入 `- ` 或 `1. ` 自动转换 |
| P2-06 | 表格 | 可插入/编辑/删除表格 | 工具栏插入表格, 可增删行列 |
| P2-07 | 链接 | 可插入/编辑超链接 | 选中文本后添加链接, 点击可编辑 |
| P2-08 | 引用块 | 可插入块引用 | 输入 `> ` 自动转换 |
| P2-09 | 自动保存 | 编辑后 3 秒自动保存到后端 | Network 面板观察 PUT 请求 |
| P2-10 | 内容加载 | 打开已有文章, 编辑器正确显示内容 | 保存后刷新页面, 内容一致 |
| P2-11 | JSON 完整性 | editor.getJSON() 输出完整 AST | 控制台打印 JSON, 结构正确 |
| P2-12 | 快捷键 | Ctrl+B/I/U 等快捷键生效 | 键盘操作验证 |
| P2-13 | 暗色模式 | 编辑器支持暗色/亮色主题切换 | 切换主题后编辑器样式正确 |
| P2-14 | 代码分割 | 编辑器 JS 不出现在首页 bundle 中 | `next build` 后检查 chunk 分布 |

---

## P3 数学公式与 KaTeX 渲染管线

### 3.1 目标

深度集成 @tiptap/extension-mathematics, 实现数学公式在编辑器中的无缝输入与实时渲染.
建立 "数据层存储纯文本 LaTeX 源码, 视图层按需 KaTeX 编译渲染" 的读写分离机制,
确保公式数据在 JSON 存储和 MDX 转换中的无损性.

### 3.2 架构: 数学公式的读写分离

```
┌─────────────────────────────────────────────────────────┐
│                    编辑模式 (写入侧)                      │
│                                                          │
│  用户输入: $E=mc^2$                                      │
│       │                                                  │
│       ▼                                                  │
│  ProseMirror Input Rule (正则捕获)                       │
│       │                                                  │
│       ▼                                                  │
│  Transaction: 创建 inlineMath 节点                       │
│       │                                                  │
│       ▼                                                  │
│  JSON 数据层 (仅存储 LaTeX 源码):                        │
│  { "type": "inlineMath", "attrs": { "latex": "E=mc^2" }}│
│       │                                                  │
│       ▼                                                  │
│  NodeView 拦截渲染 -> KaTeX 引擎编译                     │
│       │                                                  │
│       ▼                                                  │
│  视图层: 渲染为带 CSS 类的数学符号 HTML DOM               │
│  <span class="tiptap-mathematics-render">...</span>      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    阅读模式 (读取侧)                      │
│                                                          │
│  content_mdx 中的公式: $E=mc^2$                          │
│       │                                                  │
│       ▼                                                  │
│  remark-math 解析为 MDAST math 节点                      │
│       │                                                  │
│       ▼                                                  │
│  rehype-katex 编译为 HTML                                │
│       │                                                  │
│       ▼                                                  │
│  Next.js SSR 输出完整的数学公式 HTML                      │
└─────────────────────────────────────────────────────────┘
```

### 3.3 TipTap 数学扩展集成

#### 3.3.1 扩展安装与配置

```bash
pnpm add @tiptap/extension-mathematics katex
```

```typescript
// frontend/src/components/editor/extensions/mathematics.ts
import Mathematics from '@tiptap/extension-mathematics';

export const MathematicsExtension = Mathematics.configure({
  // KaTeX 渲染选项
  katexOptions: {
    throwOnError: false,       // 公式语法错误时不崩溃, 显示错误提示
    strict: false,             // 宽松模式, 兼容更多 LaTeX 语法
    trust: false,              // 禁止 \url 等可能的 XSS 向量
    macros: {
      // 预定义常用宏, 减少用户输入量
      '\\R': '\\mathbb{R}',
      '\\N': '\\mathbb{N}',
      '\\Z': '\\mathbb{Z}',
      '\\C': '\\mathbb{C}',
    },
  },
});
```

#### 3.3.2 编辑器扩展注册

```typescript
// 在 TiptapEditor.tsx 的 extensions 数组中添加
import { MathematicsExtension } from './extensions/mathematics';

const editor = useEditor({
  immediatelyRender: false,
  extensions: [
    StarterKit,
    MathematicsExtension,
    // ... 其他扩展
  ],
});
```

### 3.4 输入规则 (Input Rules) 机制

#### 3.4.1 内联公式触发

用户输入 `$LaTeX$` 时, ProseMirror 的 nodeInputRule 通过正则表达式捕获:

```
正则: /(?<!\$)\$([^$\s](?:[^$]*[^$\s])?)\$/
解释:
  (?<!\$)     负向后行断言: 前面不能是 $ (防止 $$ 被误捕获)
  \$          开始界定符
  ([^$\s]...) 捕获组: 至少一个非空白非$字符
  \$          结束界定符

触发: 用户输入 $E=mc^2$ 后按空格或回车
结果: 文本被替换为 inlineMath 节点
```

#### 3.4.2 块级公式触发

用户输入 `$$` 后回车, 进入块级公式编辑模式:

```
正则: /\$\$\s*$/
触发: 在空行输入 $$ 后回车
结果: 创建 math_block 节点, 用户在其中输入 LaTeX
退出: 再次输入 $$ 或点击外部区域
```

#### 3.4.3 公式编辑交互

```
┌──────────────────────────────────────────┐
│  点击已有公式:                            │
│  ┌────────────────────────────────────┐  │
│  │  E = mc²  (KaTeX 渲染视图)         │  │
│  └────────────────────────────────────┘  │
│           │ 点击                         │
│           ▼                              │
│  ┌────────────────────────────────────┐  │
│  │  E=mc^2  (LaTeX 源码编辑模式)      │  │
│  │  [光标在此编辑]                     │  │
│  └────────────────────────────────────┘  │
│           │ 点击外部 / 按 Escape         │
│           ▼                              │
│  ┌────────────────────────────────────┐  │
│  │  E = mc²  (重新渲染)               │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 3.5 JSON 数据模型

#### 3.5.1 内联公式节点

```json
{
  "type": "inlineMath",
  "attrs": {
    "latex": "E=mc^2"
  }
}
```

#### 3.5.2 块级公式节点

```json
{
  "type": "math",
  "attrs": {
    "latex": "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}"
  }
}
```

#### 3.5.3 复杂公式示例 (矩阵)

```json
{
  "type": "math",
  "attrs": {
    "latex": "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ax+by \\\\ cx+dy \\end{pmatrix}"
  }
}
```

### 3.6 KaTeX 样式集成

```typescript
// frontend/src/app/layout.tsx 或编辑器组件中引入 KaTeX CSS
import 'katex/dist/katex.min.css';
```

自定义样式覆盖:
```css
/* frontend/src/styles/editor-math.css */

/* 内联公式: 与文本对齐 */
.tiptap .tiptap-mathematics-editor {
  padding: 0 4px;
  border-radius: 4px;
  background: var(--math-editor-bg, hsl(var(--muted)));
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}

/* 块级公式: 居中显示, 带边框 */
.tiptap .tiptap-mathematics-render--block {
  display: block;
  text-align: center;
  padding: 16px 0;
  margin: 16px 0;
  overflow-x: auto;
}

/* 公式选中态 */
.tiptap .tiptap-mathematics-editor.ProseMirror-selectednode {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* 暗色模式适配 */
.dark .tiptap .tiptap-mathematics-render .katex {
  color: hsl(var(--foreground));
}
```

### 3.7 边缘情况处理

| 场景 | 问题 | 解决方案 |
|------|------|----------|
| 货币符号 `$100` | remark-math 误判为公式界定符 | 转换管线中对孤立 $ 强制转义为 `\$` |
| 多行矩阵公式 | `$$` 未独占首尾行导致解析失败 | 序列化时确保 `$$` 前后各有空行 |
| LaTeX 中的 `<` `>` | 与 JSX 标签冲突 | 在 MDX 转换时对公式内容不做 JSX 解析 |
| 公式语法错误 | KaTeX 编译失败 | `throwOnError: false`, 显示红色错误提示 |
| 超长公式 | 溢出编辑器容器 | `overflow-x: auto` 水平滚动 |
| 空公式 | 用户输入 `$$` 后未填内容 | 显示占位提示 "输入 LaTeX 公式" |

### 3.8 P3 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P3-01 | 内联公式输入 | 输入 `$E=mc^2$` 后自动转为渲染公式 | 编辑器中输入, 观察实时渲染 |
| P3-02 | 块级公式输入 | 输入 `$$` 回车后进入块级公式编辑 | 输入多行公式, 确认居中渲染 |
| P3-03 | 公式编辑 | 点击已渲染公式可切换到 LaTeX 编辑模式 | 点击公式, 修改源码, 点击外部重新渲染 |
| P3-04 | KaTeX 渲染正确性 | 常见公式 (分数, 积分, 矩阵, 求和) 渲染正确 | 输入 10 个不同类型公式, 对比 KaTeX 官方渲染 |
| P3-05 | JSON 数据纯净 | getJSON() 中公式节点仅包含 LaTeX 源码 | 控制台检查 JSON, 无 HTML 渲染结果 |
| P3-06 | 错误容错 | 输入错误 LaTeX 不导致编辑器崩溃 | 输入 `$\frac{$` 等非法语法, 编辑器正常运行 |
| P3-07 | 暗色模式 | 公式在暗色主题下清晰可读 | 切换暗色模式, 公式颜色正确 |
| P3-08 | 货币符号 | 普通 `$100` 不被误判为公式 | 输入 "价格是 $100" 不触发公式转换 |
| P3-09 | 复杂公式 | 多行矩阵/对齐环境正确渲染 | 输入 `\begin{aligned}...\end{aligned}` |
| P3-10 | 保存完整性 | 含公式的文章保存后重新加载, 公式完整 | 保存 -> 刷新 -> 公式内容一致 |

---

## P4 AST 转换管线与 MDX 双向映射

### 4.1 目标

构建从 TipTap JSON (ProseMirror AST) 到 MDX 纯文本的无损双向转换管线.
在 Axum 后端部署 Rust 原生 AST 编译器 (unifast/mdx-rs), 实现高性能 AST 转换,
确保数学公式, 自定义组件, 富文本格式在转换过程中零丢失.
同时保留 Node.js Unified.js 作为降级备选方案.

### 4.2 转换架构

```
┌─────────────────────────────────────────────────────────────┐
│                    JSON -> MDX 正向转换                       │
│                                                              │
│  TipTap JSON (ProseMirror AST)                               │
│       │                                                      │
│       ▼  [Step 1] 自定义适配器                               │
│  MDAST (Markdown Abstract Syntax Tree)                       │
│       │                                                      │
│       ▼  [Step 2] remark-math 注入数学节点语义               │
│  MDAST + Math Nodes (inlineMath / math)                      │
│       │                                                      │
│       ▼  [Step 3] remark-mdx 处理 JSX 组件节点              │
│  MDAST + Math + MDX JSX Nodes                                │
│       │                                                      │
│       ▼  [Step 4] mdast-util-to-markdown + 扩展              │
│  MDX 纯文本字符串                                            │
│       │                                                      │
│       ▼  写入 PostgreSQL content_mdx 字段                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MDX -> JSON 反向转换                       │
│                                                              │
│  MDX 纯文本字符串                                            │
│       │                                                      │
│       ▼  [Step 1] remark-parse 词法/语法分析                 │
│  MDAST                                                       │
│       │                                                      │
│       ▼  [Step 2] remark-math 识别数学节点                   │
│  MDAST + Math Nodes                                          │
│       │                                                      │
│       ▼  [Step 3] remark-mdx 解析 JSX                       │
│  MDAST + Math + MDX Nodes                                    │
│       │                                                      │
│       ▼  [Step 4] 自定义适配器 (MDAST -> ProseMirror)        │
│  TipTap JSON (ProseMirror AST)                               │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 转换引擎部署方案

#### 4.3.1 架构选择: Rust 原生编译器 (主) + Node.js Unified.js (备)

```
Axum 后端 (Rust)
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  文章保存触发编译                                          │
│       │                                                   │
│       ▼                                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [主引擎] Rust 原生 AST 编译器 (unifast / mdx-rs)  │  │
│  │  - 原生 Rust 结构体重塑 MDX 解析/生成流             │  │
│  │  - GFM 表格, 数学公式, JSX 解析为内置遍历通道       │  │
│  │  - 相比 unified.js 管线提速 ~25x                    │  │
│  │  - 零 GC 开销, 零 V8 调度损耗                       │  │
│  └────────────────────────────────────────────────────┘  │
│       │                                                   │
│       ▼ (编译失败时降级)                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [备引擎] Node.js Sidecar (Unified.js 生态)        │  │
│  │  - remark-prosemirror + remark-math + remark-mdx   │  │
│  │  - 生态成熟, 数百个插件, 边缘情况覆盖广             │  │
│  │  - 通过 HTTP 调用, 独立进程隔离                     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**选择 Rust 原生编译器作为主引擎的理由:**
- 消除 V8 引擎调度损耗和 JavaScript 单线程 GC 开销
- 在权威基准测试中, 相比 unified + remark 管线实现 ~25x 速度提升
- 插件扩展 (GFM 表格, 数学公式隔离, JSX 解析) 直接下沉为原生遍历通道
- 与 Axum 后端同进程运行, 消除跨进程 HTTP 调用延迟
- 利用 Rust 模式匹配构建严密的节点映射字典

**保留 Node.js 备引擎的理由:**
- Unified.js 生态成熟, 边缘情况覆盖更广
- remark-prosemirror 直接提供 ProseMirror <-> MDAST 映射
- 作为 Rust 编译器尚未覆盖的节点类型的降级通道
- 通过 HTTP 调用解耦, 可独立扩缩容

#### 4.3.2 Rust 编译器 crate 结构

```
backend/crates/
├── mdx-compiler/                    -- Rust 原生 MDX 编译器 crate
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs                   -- 公共 API
│       ├── json_to_mdx.rs           -- 正向转换: JSON -> MdAst -> MDX
│       ├── mdx_to_json.rs           -- 反向转换: MDX -> MdAst -> JSON
│       ├── node_handlers.rs         -- ProseMirror 节点映射字典
│       ├── sanitizer.rs             -- 边缘情况清洗 (孤立$, JSX隔离)
│       └── tests/
│           ├── roundtrip.rs         -- 往返测试
│           └── fixtures/            -- 测试用例
│
└── api/src/services/
    └── mdx_compiler.rs              -- 编译调度: 主引擎 -> 备引擎降级
```

#### 4.3.3 Node.js 备引擎项目结构 (保留)

```
services/ast-compiler/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              -- HTTP 服务入口 (Fastify)
│   ├── compiler/
│   │   ├── json-to-mdx.ts    -- 正向转换: JSON -> MDX
│   │   ├── mdx-to-json.ts    -- 反向转换: MDX -> JSON
│   │   ├── node-handlers.ts  -- ProseMirror 节点映射字典
│   │   └── sanitizer.ts      -- 边缘情况清洗器
│   └── routes/
│       └── compile.ts         -- API 路由
├── tests/
│   ├── json-to-mdx.test.ts
│   ├── mdx-to-json.test.ts
│   └── fixtures/              -- 测试用例 JSON/MDX 文件
└── Dockerfile
```

### 4.4 Rust 原生编译器核心实现

#### 4.4.0 Rust 节点映射与模式匹配

```rust
// backend/crates/mdx-compiler/src/node_handlers.rs
use serde_json::Value;

/// ProseMirror JSON 节点 -> MdAst 节点的 Rust 原生映射
/// 利用 Rust 模式匹配实现严密的节点类型分发
pub fn pm_node_to_mdast(node: &Value) -> MdAstNode {
    let node_type = node["type"].as_str().unwrap_or("unknown");

    match node_type {
        // 数学公式节点 (核心): 无损提取 LaTeX 源码
        "math" | "mathBlock" => MdAstNode::Math {
            value: node["attrs"]["latex"].as_str().unwrap_or("").to_string(),
            display: true,
        },
        "inlineMath" => MdAstNode::InlineMath {
            value: node["attrs"]["latex"].as_str().unwrap_or("").to_string(),
        },

        // 基础文本节点
        "paragraph" => MdAstNode::Paragraph {
            children: convert_inline_content(&node["content"]),
        },
        "heading" => MdAstNode::Heading {
            depth: node["attrs"]["level"].as_u64().unwrap_or(1) as u8,
            children: convert_inline_content(&node["content"]),
        },
        "blockquote" => MdAstNode::Blockquote {
            children: convert_block_content(&node["content"]),
        },
        "codeBlock" => MdAstNode::Code {
            lang: node["attrs"]["language"].as_str().map(String::from),
            value: extract_text_content(&node["content"]),
        },

        // 自定义多模态组件 -> MDX JSX 元素
        "interactiveChart" | "moleculeViewer" | "threeScene" => {
            convert_custom_component(node)
        },

        // 未知节点类型: 记录警告, 降级为段落
        unknown => {
            tracing::warn!("未知 ProseMirror 节点类型: {}", unknown);
            MdAstNode::Paragraph {
                children: vec![MdAstNode::Text {
                    value: format!("[未知节点: {}]", unknown),
                }],
            }
        }
    }
}
```

```rust
// backend/crates/mdx-compiler/src/json_to_mdx.rs
use crate::node_handlers::pm_node_to_mdast;
use crate::sanitizer::sanitize_for_mdx;

/// 正向转换: ProseMirror JSON -> MDX 纯文本
/// 使用 Rust 原生 AST 遍历, 零 GC 开销
pub fn convert_json_to_mdx(pm_json: &serde_json::Value) -> Result<String, CompileError> {
    // Step 1: ProseMirror JSON -> MdAst 内存树
    let content = pm_json["content"].as_array()
        .ok_or(CompileError::InvalidStructure("缺少 content 数组"))?;

    let mut mdast_nodes: Vec<MdAstNode> = Vec::with_capacity(content.len());
    for node in content {
        mdast_nodes.push(pm_node_to_mdast(node));
    }

    // Step 2: 边缘情况清洗 (孤立$转义, JSX安全隔离)
    sanitize_for_mdx(&mut mdast_nodes);

    // Step 3: MdAst -> MDX 文本序列化
    let mut output = String::with_capacity(4096);
    for node in &mdast_nodes {
        serialize_mdast_node(node, &mut output)?;
    }

    Ok(output)
}
```

```rust
// backend/crates/mdx-compiler/src/sanitizer.rs

/// 防御机制一: 孤立美元符号转义
/// 将纯文本中的 $100 等非公式美元符号转义为 \$100
pub fn escape_lone_dollar_signs(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();

    for i in 0..len {
        if chars[i] == '$' {
            // 检查是否为孤立 $ (后跟数字, 或前后无匹配的 $)
            let next_is_digit = i + 1 < len && chars[i + 1].is_ascii_digit();
            if next_is_digit {
                result.push_str("\\$");
                continue;
            }
        }
        result.push(chars[i]);
    }
    result
}

/// 防御机制二: JSX 安全隔离 (Surgical Cloaking)
/// 在 AST 遍历 (如生成 TOC, 提取摘要) 时保护 JSX 组件内部标签不被破坏
pub fn cloak_jsx_components(nodes: &mut Vec<MdAstNode>) {
    for node in nodes.iter_mut() {
        if let MdAstNode::MdxJsxFlowElement { name, .. } = node {
            // 标记为受保护区域, 后续遍历跳过内部解析
            // 防止 <SurveyForm /> 等组件的闭合标签被意外破坏
        }
    }
}
```

#### 4.4.1 编译调度: 主引擎 -> 备引擎降级

```rust
// backend/crates/api/src/services/mdx_compiler.rs
use mdx_compiler::convert_json_to_mdx;

pub struct MdxCompilerService {
    /// Node.js 备引擎 HTTP 客户端
    fallback_client: reqwest::Client,
    fallback_url: String,
}

impl MdxCompilerService {
    /// 编译 JSON -> MDX, 主引擎失败时自动降级到 Node.js 备引擎
    pub async fn compile(&self, json: &serde_json::Value) -> Result<String, CompileError> {
        // 尝试 Rust 原生编译器 (主引擎)
        match convert_json_to_mdx(json) {
            Ok(mdx) => {
                tracing::debug!("Rust 原生编译成功");
                Ok(mdx)
            }
            Err(e) => {
                tracing::warn!("Rust 编译失败, 降级到 Node.js: {}", e);
                // 降级到 Node.js Unified.js 备引擎
                self.compile_via_nodejs(json).await
            }
        }
    }

    async fn compile_via_nodejs(&self, json: &serde_json::Value) -> Result<String, CompileError> {
        let response = self.fallback_client
            .post(format!("{}/compile/json-to-mdx", self.fallback_url))
            .json(&serde_json::json!({ "prosemirrorJson": json }))
            .send().await?;
        let result: CompileResponse = response.json().await?;
        Ok(result.mdx)
    }
}
```

### 4.5 Node.js 备引擎核心逻辑 (保留)

#### 4.5.1 ProseMirror 节点映射字典 (nodeHandlers)

```typescript
// services/ast-compiler/src/compiler/node-handlers.ts
import type { MdastNode } from 'remark-prosemirror';

// ProseMirror 节点类型 -> MDAST 节点类型 映射
export const prosemirrorToMdastHandlers: Record<string, (pmNode: any) => MdastNode> = {

  // ===== 基础文本节点 =====
  paragraph: (pmNode) => ({
    type: 'paragraph',
    children: convertInlineContent(pmNode.content),
  }),

  heading: (pmNode) => ({
    type: 'heading',
    depth: pmNode.attrs.level,
    children: convertInlineContent(pmNode.content),
  }),

  blockquote: (pmNode) => ({
    type: 'blockquote',
    children: convertBlockContent(pmNode.content),
  }),

  // ===== 列表节点 =====
  bulletList: (pmNode) => ({
    type: 'list',
    ordered: false,
    children: pmNode.content.map(convertListItem),
  }),

  orderedList: (pmNode) => ({
    type: 'list',
    ordered: true,
    start: pmNode.attrs?.start || 1,
    children: pmNode.content.map(convertListItem),
  }),

  // ===== 数学公式节点 (核心) =====
  math: (pmNode) => ({
    type: 'math',                    // 块级公式 -> MDAST math 节点
    value: pmNode.attrs.latex,       // 无损提取 LaTeX 源码
  }),

  inlineMath: (pmNode) => ({
    type: 'inlineMath',              // 内联公式 -> MDAST inlineMath 节点
    value: pmNode.attrs.latex,
  }),

  // ===== 代码块 =====
  codeBlock: (pmNode) => ({
    type: 'code',
    lang: pmNode.attrs.language || null,
    value: pmNode.content?.[0]?.text || '',
  }),

  // ===== 表格 =====
  table: (pmNode) => ({
    type: 'table',
    children: pmNode.content.map(convertTableRow),
  }),

  // ===== 水平分割线 =====
  horizontalRule: () => ({
    type: 'thematicBreak',
  }),

  // ===== 图片 =====
  image: (pmNode) => ({
    type: 'image',
    url: pmNode.attrs.src,
    alt: pmNode.attrs.alt || '',
    title: pmNode.attrs.title || null,
  }),

  // ===== 自定义多模态组件 =====
  interactiveChart: (pmNode) => ({
    type: 'mdxJsxFlowElement',
    name: 'InteractiveChart',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'dataSource', value: pmNode.attrs.dataSource },
      { type: 'mdxJsxAttribute', name: 'chartType', value: pmNode.attrs.chartType },
    ],
    children: [],
  }),

  moleculeViewer: (pmNode) => ({
    type: 'mdxJsxFlowElement',
    name: 'MoleculeViewer',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'smiles', value: pmNode.attrs.smiles },
    ],
    children: [],
  }),

  threeScene: (pmNode) => ({
    type: 'mdxJsxFlowElement',
    name: 'ThreeScene',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'modelPath', value: pmNode.attrs.modelPath },
    ],
    children: [],
  }),
};
```

#### 4.5.2 正向转换: JSON -> MDX (Node.js 备引擎)

```typescript
// services/ast-compiler/src/compiler/json-to-mdx.ts
import { unified } from 'unified';
import remarkStringify from 'remark-stringify';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import { prosemirrorToMdast } from 'remark-prosemirror';
import { prosemirrorToMdastHandlers } from './node-handlers';
import { sanitizeForMdx } from './sanitizer';

export async function convertJsonToMdx(
  prosemirrorJson: Record<string, unknown>
): Promise<string> {
  // Step 1: ProseMirror JSON -> MDAST
  const mdast = prosemirrorToMdast(prosemirrorJson, {
    handlers: prosemirrorToMdastHandlers,
  });

  // Step 2: 边缘情况清洗
  sanitizeForMdx(mdast);

  // Step 3: MDAST -> MDX 文本
  const file = await unified()
    .use(remarkMath)
    .use(remarkMdx)
    .use(remarkStringify, {
      bullet: '-',
      emphasis: '*',
      strong: '**',
      rule: '---',
      fences: true,
    })
    .stringify(mdast);

  return String(file);
}
```

#### 4.5.3 反向转换: MDX -> JSON (Node.js 备引擎)

```typescript
// services/ast-compiler/src/compiler/mdx-to-json.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkMdx from 'remark-mdx';
import { mdastToProsemirror } from 'remark-prosemirror';
import { mdastToProsemirrorHandlers } from './node-handlers';

export async function convertMdxToJson(
  mdxText: string
): Promise<Record<string, unknown>> {
  // Step 1: MDX 文本 -> MDAST
  const mdast = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkMdx)
    .parse(mdxText);

  // Step 2: MDAST -> ProseMirror JSON
  const prosemirrorJson = mdastToProsemirror(mdast, {
    handlers: mdastToProsemirrorHandlers,
  });

  return prosemirrorJson;
}
```

### 4.6 边缘情况防御策略

#### 4.6.1 孤立美元符号转义

```typescript
// services/ast-compiler/src/compiler/sanitizer.ts
import { visit } from 'unist-util-visit';

export function sanitizeForMdx(tree: any): void {
  visit(tree, 'text', (node: any) => {
    // 对不参与闭合公式结构的孤立 $ 强制转义
    // 匹配: $后面跟数字 (如 $100), 或 $后面是空格/行尾
    node.value = node.value.replace(
      /\$(?=\d)/g,       // $100 -> \$100
      '\\$'
    );
  });

  // 确保块级公式 $$ 独占首尾行
  visit(tree, 'math', (node: any) => {
    // 多行公式: 确保 value 前后无多余空行
    node.value = node.value.trim();
  });
}
```

#### 4.6.2 完整的边缘情况清单

| 编号 | 场景 | 输入 | 期望输出 | 处理策略 |
|------|------|------|----------|----------|
| E-01 | 货币符号 | `$100` | `\$100` | 正则替换孤立 $ |
| E-02 | 多行矩阵 | `$$\n\begin{pmatrix}...\end{pmatrix}\n$$` | 保持原样 | $$ 独占行 |
| E-03 | LaTeX 中的 `<` | `$a < b$` | `$a < b$` | 公式内容不做 JSX 解析 |
| E-04 | LaTeX 中的 `&` | `$a & b$` (对齐) | `$a & b$` | 公式内容不做 HTML 实体转义 |
| E-05 | 嵌套引号 | `$\text{"hello"}$` | 保持原样 | 公式内部字符串不转义 |
| E-06 | 空公式 | `{ "type": "math", "attrs": { "latex": "" } }` | 跳过, 不输出 | 过滤空节点 |
| E-07 | JSX 组件属性含特殊字符 | `<Chart data="a&b" />` | 正确转义 | mdxJsxAttribute 处理 |
| E-08 | 连续公式 | `$a$$b$` | `$a$ $b$` | 插入空格分隔 |

### 4.7 转换服务 API

#### 4.7.1 端点定义

```
POST /compile/json-to-mdx
  Request:  { "prosemirrorJson": { ... } }
  Response: { "mdx": "# Title\n\n$E=mc^2$\n..." }

POST /compile/mdx-to-json
  Request:  { "mdx": "# Title\n\n$E=mc^2$\n..." }
  Response: { "prosemirrorJson": { ... } }

GET /health
  Response: { "status": "ok", "version": "1.0.0" }
```

#### 4.7.2 Axum 编译调度 (主引擎 -> 备引擎)

```rust
// backend/crates/api/src/services/mdx_compiler.rs
// 注意: 此处调用 4.4.1 中定义的 MdxCompilerService
// 主引擎 (Rust unifast) 失败时自动降级到 Node.js 备引擎
// 详见 4.4.1 编译调度代码
```

#### 4.7.3 异步编译触发 (文章保存后)

```rust
// backend/crates/api/src/services/article_service.rs
pub async fn update_article(&self, id: Uuid, payload: UpdateArticlePayload) -> Result<Article> {
    // 1. 更新 content_json (同步, 立即返回)
    let article = sqlx::query_as!(Article,
        "UPDATE articles SET content_json = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        &payload.content, id
    ).fetch_one(&self.pool).await?;

    // 2. 异步触发 MDX 编译 (不阻塞响应)
    //    使用 MdxCompilerService: Rust 主引擎 -> Node.js 备引擎自动降级
    let pool = self.pool.clone();
    let compiler = self.mdx_compiler.clone();
    tokio::spawn(async move {
        match compiler.compile(&article.content_json).await {
            Ok(mdx) => {
                let _ = sqlx::query!(
                    "UPDATE articles SET content_mdx = $1, mdx_compiled_at = NOW() WHERE id = $2",
                    mdx, id
                ).execute(&pool).await;
            }
            Err(e) => {
                tracing::error!("MDX 编译失败: article_id={}, error={}", id, e);
            }
        }
    });

    // 3. 写入版本历史
    self.create_version(&article).await?;

    Ok(article)
}
```

### 4.8 转换正确性保证: 往返测试 (Round-trip Test)

核心原则: JSON -> MDX -> JSON 往返转换后, 数据必须语义等价.

```typescript
// services/ast-compiler/tests/roundtrip.test.ts
import { convertJsonToMdx } from '../src/compiler/json-to-mdx';
import { convertMdxToJson } from '../src/compiler/mdx-to-json';

describe('Round-trip conversion', () => {
  const testCases = [
    {
      name: '基础段落',
      json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] },
    },
    {
      name: '内联公式',
      json: { type: 'doc', content: [{ type: 'paragraph', content: [
        { type: 'text', text: '能量公式: ' },
        { type: 'inlineMath', attrs: { latex: 'E=mc^2' } },
      ] }] },
    },
    {
      name: '块级公式',
      json: { type: 'doc', content: [{ type: 'math', attrs: {
        latex: '\\int_{0}^{\\infty} e^{-x} dx = 1'
      } }] },
    },
    {
      name: '混合内容 (标题+公式+代码+表格)',
      json: { /* 复杂混合内容 */ },
    },
  ];

  for (const tc of testCases) {
    it(`往返测试: ${tc.name}`, async () => {
      const mdx = await convertJsonToMdx(tc.json);
      const roundTripped = await convertMdxToJson(mdx);
      expect(roundTripped).toMatchObject(tc.json);  // 语义等价
    });
  }
});
```

### 4.9 Docker 部署

```yaml
# 追加到 docker-compose.editor.yml
  ast-compiler:
    build: ./services/ast-compiler
    ports: ["4000:4000"]
    environment:
      - PORT=4000
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### 4.10 P4 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P4-01 | Rust 编译器 | Rust 原生 mdx-compiler crate 编译通过 | `cargo test -p mdx-compiler` 零失败 |
| P4-02 | Node.js 备引擎 | AST 转换备用服务健康运行 | `curl http://localhost:4000/health` 返回 200 |
| P4-03 | 基础转换 | 段落/标题/列表 JSON -> MDX 正确 | Rust + Node.js 双引擎单元测试通过 |
| P4-04 | 公式转换 | 内联/块级公式 LaTeX 无损转换 | `$E=mc^2$` 往返测试通过 |
| P4-05 | 复杂公式 | 矩阵/对齐/多行公式正确转换 | 10 个复杂公式往返测试 |
| P4-06 | 表格转换 | 表格结构完整保留 | 含合并单元格的表格往返测试 |
| P4-07 | 代码块转换 | 语言标记和内容完整 | ` ```rust\nfn main() ``` ` 往返测试 |
| P4-08 | 自定义组件 | JSX 组件节点正确映射 | `<InteractiveChart />` 往返测试 |
| P4-09 | 边缘情况 | 货币 $, 特殊字符不导致解析崩溃 | E-01 到 E-08 全部通过 |
| P4-10 | 降级机制 | Rust 编译失败时自动降级到 Node.js | 发送 Rust 不支持的节点类型, Node.js 接管 |
| P4-11 | 异步编译 | 文章保存后 content_mdx 自动更新 | 保存文章, 查询数据库 content_mdx 非空 |
| P4-12 | 编译失败容错 | 编译失败不影响文章保存 | 发送畸形 JSON, 文章仍保存成功 |
| P4-13 | Rust 性能基准 | 10KB JSON Rust 转换耗时 < 20ms | 压力测试 100 次取平均值 (对比 Node.js < 500ms) |
| P4-14 | 阅读渲染 | content_mdx 在 Next.js SSR 中正确渲染 | 浏览器访问文章页, 公式/格式正确 |

---

## P5 多媒体处理与存储

### 5.1 目标

实现编辑器中图片, 视频, 音频等多媒体资产的上传, 存储与渲染.
多媒体二进制文件存储在 S3/MinIO 对象存储中, JSON 数据层仅保留元数据和 URL 指针,
避免 Base64 内联导致的 JSONB 膨胀和 TOAST 性能惩罚.

### 5.2 多媒体存储架构

```
┌──────────────────────────────────────────────────────────┐
│                    上传流程                                │
│                                                           │
│  用户拖拽/选择文件                                         │
│       │                                                   │
│       ▼                                                   │
│  前端: FormData 封装                                      │
│       │                                                   │
│       ▼  POST /api/v1/upload                              │
│  Axum: axum_typed_multipart 流式接收                      │
│       │                                                   │
│       ├─ MIME 类型二次校验 (magic bytes, 不信任 Content-Type)│
│       ├─ 文件大小限制 (图片 10MB, 视频 100MB)              │
│       ├─ 生成唯一文件名 (UUID + 原始扩展名)                │
│       │                                                   │
│       ▼                                                   │
│  S3/MinIO 对象存储                                        │
│       │                                                   │
│       ▼  返回访问 URL                                     │
│  写入 media_assets 表 (元数据)                            │
│       │                                                   │
│       ▼  返回给前端                                       │
│  编辑器插入节点: { type: "image", attrs: { src: url } }   │
└──────────────────────────────────────────────────────────┘
```

### 5.3 JSON 数据模型 (仅元数据, 不含二进制)

#### 5.3.1 图片节点

```json
{
  "type": "image",
  "attrs": {
    "src": "/api/v1/media/550e8400-e29b-41d4-a716-446655440000.webp",
    "alt": "实验结果对比图",
    "title": "图 3.1: 机器人抓取成功率",
    "width": 800,
    "height": 600,
    "alignment": "center"
  }
}
```

#### 5.3.2 视频节点

```json
{
  "type": "video",
  "attrs": {
    "src": "/api/v1/media/660e8400-e29b-41d4-a716-446655440001.mp4",
    "poster": "/api/v1/media/660e8400-poster.webp",
    "width": 1280,
    "height": 720,
    "duration": 125.5,
    "mimeType": "video/mp4"
  }
}
```

#### 5.3.3 嵌入式内容节点 (YouTube, Bilibili)

```json
{
  "type": "embed",
  "attrs": {
    "provider": "youtube",
    "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "width": 560,
    "height": 315
  }
}
```

### 5.4 Axum 文件上传处理

```rust
// backend/crates/api/src/routes/upload.rs
use axum::extract::Multipart;
use uuid::Uuid;

const MAX_IMAGE_SIZE: usize = 10 * 1024 * 1024;   // 10 MB
const MAX_VIDEO_SIZE: usize = 100 * 1024 * 1024;   // 100 MB

const ALLOWED_IMAGE_TYPES: &[&str] = &[
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"
];
const ALLOWED_VIDEO_TYPES: &[&str] = &[
    "video/mp4", "video/webm"
];

pub async fn upload_file(
    auth: AuthUser,
    mut multipart: Multipart,
    State(state): State<AppState>,
) -> Result<Json<UploadResponse>, AppError> {
    let field = multipart.next_field().await?
        .ok_or(AppError::BadRequest("缺少文件字段"))?;

    let original_name = field.file_name()
        .unwrap_or("unknown").to_string();
    let content_type = field.content_type()
        .unwrap_or("application/octet-stream").to_string();

    // 流式读取, 不将整个文件加载到内存
    let data = field.bytes().await?;

    // MIME 类型二次校验 (基于 magic bytes)
    let detected_type = infer::get(&data)
        .map(|t| t.mime_type())
        .unwrap_or(&content_type);

    // 文件大小限制
    let max_size = if detected_type.starts_with("image/") {
        MAX_IMAGE_SIZE
    } else if detected_type.starts_with("video/") {
        MAX_VIDEO_SIZE
    } else {
        return Err(AppError::BadRequest("不支持的文件类型"));
    };

    if data.len() > max_size {
        return Err(AppError::BadRequest("文件超过大小限制"));
    }

    // 生成唯一文件名
    let ext = original_name.rsplit('.').next().unwrap_or("bin");
    let filename = format!("{}.{}", Uuid::new_v4(), ext);

    // 上传到 S3/MinIO
    let storage_path = state.storage.upload(&filename, &data, detected_type).await?;
    let url = format!("/api/v1/media/{}", filename);

    // 获取图片尺寸 (如果是图片)
    let (width, height) = if detected_type.starts_with("image/") {
        extract_image_dimensions(&data)?
    } else {
        (None, None)
    };

    // 写入 media_assets 表
    let asset = sqlx::query_as!(MediaAsset,
        r#"INSERT INTO media_assets
           (filename, original_name, mime_type, file_size, storage_path, url,
            width, height, uploader_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *"#,
        filename, original_name, detected_type, data.len() as i64,
        storage_path, url, width, height, auth.user_id
    ).fetch_one(&state.pool).await?;

    Ok(Json(UploadResponse {
        url: asset.url,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
    }))
}
```

### 5.5 前端上传集成

```typescript
// frontend/src/components/editor/extensions/image-upload.ts
import Image from '@tiptap/extension-image';

export const ImageUploadExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
      alignment: { default: 'center' },
    };
  },
});

// 上传处理函数
export async function handleImageUpload(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/editor/upload', {
    method: 'POST',
    headers: { 'X-XSRF-TOKEN': getCsrfToken() },
    credentials: 'include',
    body: form,
  });

  if (!res.ok) throw new Error('上传失败');
  const { url } = await res.json();
  return url;
}

// 在编辑器中使用
editor.chain().focus().setImage({
  src: url,
  alt: '描述文字',
  width: 800,
  height: 600,
}).run();
```

### 5.6 图片优化策略

| 策略 | 实现方式 | 效果 |
|------|----------|------|
| WebP 转换 | 后端上传时自动转换为 WebP | 体积减少 25-35% |
| 响应式图片 | 生成多尺寸缩略图 (320/640/1024/原图) | 按设备加载合适尺寸 |
| 懒加载 | `<Image loading="lazy" />` | 减少首屏加载量 |
| 占位符 | 生成 BlurHash 低分辨率占位 | 避免布局偏移 (CLS) |
| CDN 缓存 | 静态资源通过 CDN 分发 | 降低服务器负载 |

### 5.7 MDX 转换中的多媒体处理

图片节点在 JSON -> MDX 转换时映射为标准 Markdown 图片语法:

```markdown
![实验结果对比图](/api/v1/media/550e8400.webp "图 3.1: 机器人抓取成功率")
```

视频和嵌入式内容映射为 MDX JSX 组件:

```mdx
<VideoPlayer
  src="/api/v1/media/660e8400.mp4"
  poster="/api/v1/media/660e8400-poster.webp"
  width={1280}
  height={720}
/>

<EmbedPlayer provider="youtube" url="https://www.youtube.com/embed/..." />
```

### 5.8 P5 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P5-01 | 图片上传 | 拖拽/选择图片后成功上传并显示 | 编辑器中拖入图片, 确认显示 |
| P5-02 | 文件类型校验 | 非图片/视频文件被拒绝 | 上传 .exe 文件, 返回 400 |
| P5-03 | 大小限制 | 超过限制的文件被拒绝 | 上传 15MB 图片, 返回 400 |
| P5-04 | MIME 校验 | 伪装扩展名的文件被识别 | 将 .exe 改名为 .jpg 上传, 被拒绝 |
| P5-05 | 元数据记录 | media_assets 表正确记录文件信息 | 查询数据库, 字段完整 |
| P5-06 | JSON 纯净 | 图片节点仅含 URL, 无 Base64 | 检查 content_json, 无 data:image |
| P5-07 | 图片尺寸 | 上传后自动提取宽高信息 | 检查返回的 width/height |
| P5-08 | 视频上传 | MP4/WebM 视频上传成功 | 上传视频, 编辑器中可播放 |
| P5-09 | MDX 转换 | 图片/视频节点正确转为 MDX | 检查 content_mdx 中的图片语法 |
| P5-10 | 阅读渲染 | 文章页中图片/视频正确显示 | 浏览器访问文章, 媒体加载正常 |

---

## P6 测试矩阵与性能优化

### 6.1 目标

建立覆盖数据验证, UI 渲染, AST 转换, 安全性的全方位测试矩阵.
部署 Playwright 视觉回归测试保护数学公式渲染质量,
实施版本审计机制, 优化编辑器加载性能和数据库查询效率.

### 6.2 测试分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    测试金字塔                             │
│                                                          │
│                    ┌──────┐                               │
│                    │ E2E  │  Playwright 视觉回归          │
│                    │ 测试 │  用户流程端到端验证            │
│                   ┌┴──────┴┐                              │
│                   │ 集成   │  API 端到端测试               │
│                   │ 测试   │  数据库读写验证               │
│                  ┌┴────────┴┐                             │
│                  │  单元    │  Rust: 校验/转换/业务逻辑    │
│                  │  测试    │  TS: AST 转换/组件渲染       │
│                 ┌┴──────────┴┐                            │
│                 │  静态分析   │  TypeScript 类型检查        │
│                 │            │  cargo clippy / ESLint      │
│                 └────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Rust 后端测试

#### 6.3.1 单元测试

```rust
// backend/crates/api/tests/unit/article_validation.rs

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_valid_article_payload() {
        let payload = json!({
            "title": "测试文章",
            "slug": "test-article",
            "content": {
                "type": "doc",
                "content": [
                    { "type": "paragraph", "content": [{ "type": "text", "text": "Hello" }] }
                ]
            }
        });
        let result: Result<CreateArticlePayload, _> = serde_json::from_value(payload);
        assert!(result.is_ok());
    }

    #[test]
    fn test_empty_title_rejected() {
        let payload = CreateArticlePayload {
            title: "".to_string(),
            slug: "test".to_string(),
            content: json!({}),
            summary: None,
            tags: None,
        };
        let validation = payload.validate();
        assert!(validation.is_err());
    }

    #[test]
    fn test_title_max_length() {
        let payload = CreateArticlePayload {
            title: "a".repeat(256),
            slug: "test".to_string(),
            content: json!({}),
            summary: None,
            tags: None,
        };
        let validation = payload.validate();
        assert!(validation.is_err());
    }

    #[test]
    fn test_content_json_preserves_math_nodes() {
        let content = json!({
            "type": "doc",
            "content": [{
                "type": "inlineMath",
                "attrs": { "latex": "E=mc^2" }
            }]
        });
        // 序列化 -> 反序列化后 LaTeX 源码完整
        let serialized = serde_json::to_string(&content).unwrap();
        let deserialized: serde_json::Value = serde_json::from_str(&serialized).unwrap();
        assert_eq!(
            deserialized["content"][0]["attrs"]["latex"].as_str().unwrap(),
            "E=mc^2"
        );
    }
}
```

#### 6.3.2 集成测试

```rust
// backend/crates/api/tests/integration/article_crud.rs

#[tokio::test]
async fn test_create_and_read_article() {
    let app = setup_test_app().await;
    let token = login_test_user(&app).await;

    // 创建文章
    let create_res = app.post("/api/v1/articles")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "title": "集成测试文章",
            "slug": "integration-test",
            "content": {
                "type": "doc",
                "content": [
                    { "type": "heading", "attrs": { "level": 1 },
                      "content": [{ "type": "text", "text": "标题" }] },
                    { "type": "inlineMath", "attrs": { "latex": "a^2+b^2=c^2" } }
                ]
            }
        }))
        .send().await;
    assert_eq!(create_res.status(), 201);

    let article: ArticleResponse = create_res.json().await;

    // 读取文章
    let read_res = app.get(&format!("/api/v1/articles/{}", article.slug))
        .send().await;
    assert_eq!(read_res.status(), 200);

    let read_article: ArticleResponse = read_res.json().await;
    assert_eq!(read_article.title, "集成测试文章");
    // 验证 content_json 中的数学节点完整
    assert!(read_article.content_json.to_string().contains("a^2+b^2=c^2"));
}

#[tokio::test]
async fn test_dual_track_storage() {
    let app = setup_test_app().await;
    let token = login_test_user(&app).await;

    // 创建含公式的文章
    let res = app.post("/api/v1/articles")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "title": "双轨测试",
            "slug": "dual-track-test",
            "content": {
                "type": "doc",
                "content": [
                    { "type": "paragraph", "content": [{ "type": "text", "text": "公式: " }] },
                    { "type": "math", "attrs": { "latex": "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" } }
                ]
            }
        }))
        .send().await;
    assert_eq!(res.status(), 201);

    // 等待异步 MDX 编译完成
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;

    // 验证 content_mdx 已生成
    let article = app.get("/api/v1/articles/dual-track-test").send().await.json::<ArticleResponse>().await;
    assert!(!article.content_mdx.is_empty());
    assert!(article.content_mdx.contains("\\sum_{i=1}^{n}"));
}
```

### 6.4 AST 转换测试

```typescript
// services/ast-compiler/tests/json-to-mdx.test.ts

describe('JSON -> MDX 转换', () => {
  it('段落文本', async () => {
    const json = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] }],
    };
    const mdx = await convertJsonToMdx(json);
    expect(mdx.trim()).toBe('Hello World');
  });

  it('内联公式', async () => {
    const json = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [
          { type: 'text', text: '能量公式: ' },
          { type: 'inlineMath', attrs: { latex: 'E=mc^2' } },
        ],
      }],
    };
    const mdx = await convertJsonToMdx(json);
    expect(mdx).toContain('$E=mc^2$');
  });

  it('块级公式独占行', async () => {
    const json = {
      type: 'doc',
      content: [{ type: 'math', attrs: { latex: '\\int_0^1 x^2 dx' } }],
    };
    const mdx = await convertJsonToMdx(json);
    expect(mdx).toMatch(/^\$\$\n.*\n\$\$/m);
  });

  it('货币符号不被误判', async () => {
    const json = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '价格是 $100' }] }],
    };
    const mdx = await convertJsonToMdx(json);
    expect(mdx).toContain('\\$100');
  });

  it('自定义 JSX 组件', async () => {
    const json = {
      type: 'doc',
      content: [{
        type: 'interactiveChart',
        attrs: { dataSource: '/data/chart.json', chartType: 'bar' },
      }],
    };
    const mdx = await convertJsonToMdx(json);
    expect(mdx).toContain('<InteractiveChart');
    expect(mdx).toContain('dataSource="/data/chart.json"');
  });
});
```

### 6.5 Playwright 视觉回归测试

#### 6.5.1 测试配置

```typescript
// frontend/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  use: {
    baseURL: 'http://localhost:3001',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'visual-regression',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  // 统一在 Linux Docker 镜像中执行, 消除跨平台字体差异
  // CI 中使用: npx playwright test --project=visual-regression
});
```

#### 6.5.2 数学公式视觉测试

```typescript
// frontend/tests/visual/math-rendering.spec.ts
import { test, expect } from '@playwright/test';

test.describe('数学公式渲染', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor/test-article');
    await page.waitForSelector('.tiptap');
  });

  test('内联公式渲染正确', async ({ page }) => {
    // 输入公式
    await page.locator('.tiptap').type('$E=mc^2$ ');
    await page.waitForSelector('.tiptap-mathematics-render');

    // 精确锁定公式 DOM 节点截图
    const mathNode = page.locator('.tiptap-mathematics-render').first();
    await expect(mathNode).toHaveScreenshot('inline-math-emc2.png', {
      animations: 'disabled',     // 冻结动画
      maxDiffPixelRatio: 0.01,    // 允许 1% 像素差异
    });
  });

  test('块级公式渲染正确', async ({ page }) => {
    await page.locator('.tiptap').type('$$');
    await page.keyboard.press('Enter');
    await page.locator('.tiptap').type('\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}');
    await page.keyboard.press('Escape');

    const blockMath = page.locator('.tiptap-mathematics-render--block').first();
    await expect(blockMath).toHaveScreenshot('block-math-gaussian.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });
  });

  test('复杂矩阵公式', async ({ page }) => {
    // 通过 API 加载预设内容
    await page.evaluate(() => {
      // 注入包含矩阵公式的测试内容
    });

    const mathNode = page.locator('.tiptap-mathematics-render--block').first();
    await expect(mathNode).toHaveScreenshot('matrix-formula.png', {
      animations: 'disabled',
      mask: [page.locator('.timestamp')],  // 遮罩动态内容
    });
  });
});
```

#### 6.5.3 视觉测试规范

| 规范项 | 要求 | 原因 |
|--------|------|------|
| 截图目标 | 精确锁定 `.tiptap-mathematics-render` 节点 | 避免全屏截图受滚动条/视口影响 |
| 动画冻结 | `animations: 'disabled'` | 消除光标闪烁和 CSS 过渡 |
| 动态遮罩 | `mask: [page.locator('.timestamp')]` | 屏蔽时间戳等不稳定元素 |
| 基准环境 | Playwright 官方 Linux Docker 镜像 | 消除跨平台字体渲染差异 |
| 差异阈值 | `maxDiffPixelRatio: 0.01` (1%) | 允许亚像素级抗锯齿差异 |
| 基准更新 | `npx playwright test --update-snapshots` | 仅在确认 UI 变更后更新 |

### 6.6 版本审计机制

#### 6.6.1 自动版本快照

每次文章保存时, 自动创建版本快照:

```rust
// backend/crates/api/src/services/article_service.rs
async fn create_version(&self, article: &Article) -> Result<()> {
    let latest_version = sqlx::query_scalar!(
        "SELECT COALESCE(MAX(version_number), 0) FROM article_versions WHERE article_id = $1",
        article.id
    ).fetch_one(&self.pool).await?;

    sqlx::query!(
        r#"INSERT INTO article_versions
           (article_id, version_number, content_json, title, editor_id)
           VALUES ($1, $2, $3, $4, $5)"#,
        article.id,
        latest_version + 1,
        &article.content_json,
        &article.title,
        &article.author_id,
    ).execute(&self.pool).await?;

    Ok(())
}
```

#### 6.6.2 版本对比 API

```
GET /api/v1/articles/{id}/versions
  -> 返回版本列表 [{ version_number, editor_id, created_at, change_summary }]

GET /api/v1/articles/{id}/versions/{v}
  -> 返回特定版本的完整 content_json

GET /api/v1/articles/{id}/diff?from=3&to=5
  -> 返回两个版本之间的 JSON diff
```

### 6.7 性能优化

#### 6.7.1 前端性能

| 优化项 | 措施 | 目标指标 |
|--------|------|----------|
| 编辑器代码分割 | `dynamic({ ssr: false })` | 首页 JS 不含编辑器代码 |
| KaTeX 按需加载 | 仅在含公式的页面加载 KaTeX CSS/JS | 无公式页面减少 ~200KB |
| 图片懒加载 | `loading="lazy"` + BlurHash 占位 | LCP < 2s |
| 自动保存防抖 | 3 秒防抖, 避免频繁请求 | 减少 API 调用 80% |
| 编辑器实例缓存 | 页面切换时保留编辑器状态 | 避免重复初始化 |

#### 6.7.2 后端性能

| 优化项 | 措施 | 目标指标 |
|--------|------|----------|
| 连接池 | SQLx 连接池 (min=5, max=20) | 避免连接耗尽 |
| JSONB GIN 索引 | `jsonb_path_ops` 操作符类 | 节点检索 < 10ms |
| MDX 编译缓存 | content_json 未变时跳过编译 | 减少无效编译 |
| 版本清理 | 保留最近 100 个版本, 旧版本归档 | 控制表膨胀 |
| 响应压缩 | gzip/brotli 压缩 JSON 响应 | 传输体积减少 60-70% |

#### 6.7.3 性能基准

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 编辑器首次加载 | < 3s (含代码分割) | Lighthouse Performance |
| 文章保存 (API 响应) | < 200ms (p95) | 后端日志 |
| MDX 异步编译 | < 2s (10KB JSON) | 转换服务日志 |
| 文章列表查询 | < 50ms (p95) | 数据库慢查询日志 |
| 文章阅读页 SSR | < 500ms (TTFB) | Lighthouse |
| 图片上传 (5MB) | < 3s | 前端 Network 面板 |

### 6.8 安全加固

#### 6.8.1 XSS 防御

```
MDX 输出前必须经过 DOMPurify 清洗:
- 剥离所有 <script> 标签
- 剥离 javascript: URI
- 剥离 onerror, onload 等事件处理器
- 白名单策略: 仅允许已知安全的 HTML 标签和属性
```

#### 6.8.2 内容安全策略 (CSP)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval';     // KaTeX 需要 eval
  style-src 'self' 'unsafe-inline';     // KaTeX 内联样式
  img-src 'self' data: blob: https:;    // 图片来源
  font-src 'self';                      // KaTeX 字体
  connect-src 'self' ws:;               // API + WebSocket
```

#### 6.8.3 速率限制

```
全局: 60 请求/分钟/IP
文章保存: 10 请求/分钟/用户
文件上传: 20 请求/分钟/用户
登录尝试: 5 请求/分钟/IP (失败后递增冷却)
```

### 6.9 CI/CD 集成

```yaml
# .github/workflows/editor-tests.yml
name: Editor Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test --workspace

  ast-compiler-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd services/ast-compiler && npm ci && npm test

  visual-regression:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.49.0-jammy
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd frontend && pnpm install && pnpm build
      - run: cd frontend && npx playwright test --project=visual-regression
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diff
          path: frontend/tests/visual/test-results/
```

### 6.10 P6 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P6-01 | Rust 单元测试 | 所有单元测试通过 | `cargo test --workspace` 零失败 |
| P6-02 | AST 转换测试 | 往返测试全部通过 | `npm test` 零失败 |
| P6-03 | 集成测试 | API CRUD 端到端通过 | 集成测试套件零失败 |
| P6-04 | 视觉回归 | 公式截图与基准匹配 | Playwright 视觉测试通过 |
| P6-05 | 版本历史 | 每次保存生成版本快照 | 保存 3 次, 查询到 3 个版本 |
| P6-06 | 版本回溯 | 可加载历史版本内容 | GET /versions/{v} 返回正确 JSON |
| P6-07 | 编辑器加载性能 | 首次加载 < 3s | Lighthouse 测量 |
| P6-08 | API 响应性能 | 文章保存 p95 < 200ms | 压力测试 100 次 |
| P6-09 | XSS 防御 | 恶意脚本被清洗 | 注入 `<script>alert(1)</script>`, 不执行 |
| P6-10 | CSRF 防御 | 跨站请求被拒绝 | 无 CSRF Token 的 POST 返回 403 |
| P6-11 | 速率限制 | 超频请求被限流 | 快速发送 100 次请求, 后续返回 429 |
| P6-12 | CI 流水线 | 所有测试在 CI 中通过 | GitHub Actions 绿色通过 |

---

## P7 实时协作与 CRDT 同步 (扩展阶段)

### 7.1 目标

基于 Rust 原生 Yjs 实现 (Yrs 库) 构建多人实时协作编辑能力,
消除部署独立 Node.js Hocuspocus 服务器的运维成本,
将同步延迟压缩至微秒级别.

### 7.2 架构: Rust 原生 CRDT 同步

```
┌──────────────────────────────────────────────────────────┐
│  浏览器 A                    浏览器 B                     │
│  TipTap + y-prosemirror      TipTap + y-prosemirror      │
│       │                           │                       │
│       └───── WebSocket ──────────┘                       │
│                    │                                      │
│                    ▼                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Axum WebSocket Handler                            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Yrs (Rust 原生 Yjs 实现)                    │  │  │
│  │  │  - Actor 模型 (Kameo) 管理文档实例            │  │  │
│  │  │  - 单 WebSocket 多文档多路复用                │  │  │
│  │  │  - CRDT 变更指令合并, 冲突自动解决            │  │  │
│  │  │  - 微秒级同步延迟                             │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**选择 Rust 原生 Yrs 而非 Node.js Hocuspocus 的理由:**
- 与 Axum 同进程运行, 消除跨进程通信开销
- Rust 零 GC 特性保证同步延迟稳定在微秒级
- Actor 模型 (Kameo) 天然支持高并发文档实例管理
- 单 WebSocket 连接多文档多路复用, 减少连接数

### 7.3 P7 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P7-01 | WebSocket 连接 | 客户端成功建立 WS 连接 | 浏览器 DevTools 确认 WS 握手 |
| P7-02 | 双人同步 | 两个浏览器实时看到对方编辑 | 打开两个标签页, 输入文字互相可见 |
| P7-03 | 冲突解决 | 同时编辑同一段落不丢失内容 | 两端同时输入, 最终内容包含双方输入 |
| P7-04 | 离线恢复 | 断网后重连, 离线编辑自动合并 | 断开网络 -> 编辑 -> 重连 -> 内容合并 |
| P7-05 | 同步延迟 | 端到端延迟 < 100ms (局域网) | 性能测量工具 |

---

## P8 企业级数据隐私与合规体系 (扩展阶段)

### 8.1 目标

构建响应加州 DELETE 法案 (DROP 平台) 和洛杉矶县信息安全政策的合规体系,
实现自动化数据删除, 加密审计追踪和基于角色的细粒度访问控制.

### 8.2 加州 DELETE 法案 (DROP 平台) 对接

#### 8.2.1 强制周期性 API 轮询

```rust
// backend/crates/worker/src/drop_compliance.rs

/// DROP 平台数据删除请求轮询守护进程
/// 法律要求: 每 45 天必须拉取一次删除清单
/// 未执行将面临 $200/次/天 的行政罚款, 无补救宽限期
pub async fn drop_polling_daemon(pool: PgPool, config: DropConfig) {
    let mut interval = tokio::time::interval(Duration::from_secs(45 * 24 * 3600));

    loop {
        interval.tick().await;

        match fetch_drop_deletion_list(&config).await {
            Ok(deletion_list) => {
                for request in deletion_list {
                    process_deletion_request(&pool, request).await;
                }
            }
            Err(e) => {
                // 关键: 轮询失败必须告警, 不能静默忽略
                tracing::error!("DROP 平台轮询失败: {}", e);
                alert_compliance_team(e).await;
            }
        }
    }
}
```

#### 8.2.2 确定性哈希清除 (90 天窗口)

```rust
/// 从 DROP 拉取数据后, 90 天内必须完成物理擦除
/// 级联删除: users -> articles -> article_versions -> media_assets
async fn process_deletion_request(pool: &PgPool, request: DeletionRequest) {
    // 1. 加密比对: 将请求 ID 与数据库用户进行哈希匹配
    let matched_user = sqlx::query_as!(User,
        "SELECT * FROM users WHERE email_hash = $1",
        hash_for_comparison(&request.identifier)
    ).fetch_optional(pool).await;

    if let Some(user) = matched_user {
        // 2. 级联删除所有关联数据
        sqlx::query!("DELETE FROM article_versions WHERE editor_id = $1", user.id)
            .execute(pool).await;
        sqlx::query!("DELETE FROM media_assets WHERE uploader_id = $1", user.id)
            .execute(pool).await;
        sqlx::query!("DELETE FROM articles WHERE author_id = $1", user.id)
            .execute(pool).await;
        sqlx::query!("DELETE FROM users WHERE id = $1", user.id)
            .execute(pool).await;

        // 3. 写入抑制名单 (防止二次复活)
        sqlx::query!(
            "INSERT INTO suppression_list (identifier_hash, deleted_at) VALUES ($1, NOW())",
            hash_for_comparison(&request.identifier)
        ).execute(pool).await;

        // 4. 记录合规审计日志
        log_compliance_action(pool, "DROP_DELETION", &user.id).await;
    }
}
```

#### 8.2.3 加密抑制名单

```sql
-- 防止已删除用户通过第三方数据同步或日志回放被二次复活
CREATE TABLE suppression_list (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier_hash TEXT NOT NULL UNIQUE,  -- 单向哈希, 不可逆
    deleted_at      TIMESTAMPTZ NOT NULL,
    source          VARCHAR(50) DEFAULT 'DROP',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 所有新用户注册前必须穿过抑制防线进行碰撞校验
-- INSERT INTO users 前: SELECT EXISTS(SELECT 1 FROM suppression_list WHERE ...)
```

### 8.3 洛杉矶县信息安全政策 (Policies 6.100-6.105)

#### 8.3.1 端点存储加密 (Policy 6.102/6.105)

```yaml
# PostgreSQL 透明数据加密 (TDE)
# 所有 JSONB 数据磁盘扇区强制 AES-256 加密 (FIPS 140-2)
postgresql:
  ssl: true
  ssl_cert_file: /etc/ssl/certs/server.crt
  ssl_key_file: /etc/ssl/private/server.key
  # 全磁盘加密由操作系统层 LUKS/dm-crypt 提供
```

#### 8.3.2 审计日志升级 (Policy 6.105)

```sql
-- article_versions 表升级为法定审计日志
ALTER TABLE article_versions ADD COLUMN
    crypto_signature TEXT;  -- 密码学签章时间戳

-- 每次 AST 变更附带不可篡改的签章
-- 满足 Auditor-Controller 长周期合规审查需求
```

#### 8.3.3 最小权限访问控制 (Policy 6.101)

```rust
// 基于角色的细粒度权限验证
// 不仅验证 JWT 合法性, 更核验用户与文档的权限维度匹配
pub async fn check_article_access(
    user: &AuthUser,
    article: &Article,
    action: Action,
) -> Result<(), AppError> {
    match (user.role.as_str(), action) {
        ("admin", _) => Ok(()),
        ("editor", Action::Read | Action::Write) => Ok(()),
        ("author", Action::Read) => Ok(()),
        ("author", Action::Write) if article.author_id == user.id => Ok(()),
        _ => Err(AppError::Forbidden("权限不足")),
    }
}
```

### 8.4 P8 验收方案

| 编号 | 验收项 | 验收标准 | 验证方法 |
|------|--------|----------|----------|
| P8-01 | DROP 轮询 | 守护进程按周期拉取删除清单 | 日志确认轮询执行 |
| P8-02 | 数据删除 | 匹配用户的所有数据被级联删除 | 删除后查询所有关联表为空 |
| P8-03 | 抑制名单 | 已删除用户无法重新注册 | 尝试注册已删除邮箱, 返回拒绝 |
| P8-04 | 磁盘加密 | PostgreSQL 数据文件加密存储 | 直接读取磁盘文件为密文 |
| P8-05 | 审计签章 | 版本历史包含密码学时间戳 | 查询 crypto_signature 字段非空 |
| P8-06 | 权限隔离 | author 无法编辑他人文章 | 尝试 PUT 他人文章, 返回 403 |

---

## 附录 A: 完整数据流总览

```
┌──────────────────────────────────────────────────────────────────┐
│                        完整数据流                                 │
│                                                                   │
│  [编辑模式]                                                       │
│  用户在 TipTap 中编辑                                             │
│       │                                                           │
│       ▼                                                           │
│  editor.getJSON() -> ProseMirror JSON AST                        │
│       │                                                           │
│       ▼  PUT /api/v1/articles/{id}                                │
│  Axum 接收 -> Serde 反序列化 -> Validator 校验                    │
│       │                                                           │
│       ├─ [同步] 写入 content_json (JSONB) ← Single Source of Truth│
│       ├─ [同步] 写入 article_versions (审计快照)                  │
│       └─ [异步] 调用 AST 转换服务                                 │
│              │                                                    │
│              ▼                                                    │
│         Node.js 微服务: JSON -> MDAST -> MDX                     │
│              │                                                    │
│              ▼                                                    │
│         更新 content_mdx (TEXT)                                   │
│                                                                   │
│  [阅读模式]                                                       │
│  GET /api/v1/articles/{slug}                                      │
│       │                                                           │
│       ▼                                                           │
│  Next.js Server Component 读取 content_mdx                       │
│       │                                                           │
│       ▼                                                           │
│  compileMDX() + remark-math + rehype-katex                       │
│       │                                                           │
│       ▼                                                           │
│  SSR 输出完整 HTML (含渲染后的数学公式)                            │
│       │                                                           │
│       ▼                                                           │
│  用户浏览器接收并展示                                              │
└──────────────────────────────────────────────────────────────────┘
```

## 附录 B: 实施时间线

| 阶段 | 内容 | 预估周期 | 前置依赖 | 交付物 |
|------|------|----------|----------|--------|
| P1 | 基础设施与安全网关 | 1-2 周 | 无 | 可运行的 Docker 环境, 数据库, 认证 API |
| P2 | 编辑器集成与水合隔离 | 1-2 周 | P1 | 可编辑的 TipTap 界面, 基础富文本 CRUD |
| P3 | 数学公式与 KaTeX | 1 周 | P2 | 公式输入/渲染/存储完整闭环 |
| P4 | AST 转换管线 (Rust 主 + Node.js 备) | 2-3 周 | P1, P3 | Rust 原生编译器 + Node.js 降级, 阅读模式 |
| P5 | 多媒体处理 | 1 周 | P1, P2 | 图片/视频上传, 存储, 渲染 |
| P6 | 测试与优化 | 1-2 周 | P1-P5 | 测试套件, CI 流水线, 性能达标 |
| **核心交付** | | **7-11 周** | | |
| P7 | 实时协作 (Yrs CRDT) | 2-3 周 | P1-P3 | 多人实时编辑, WebSocket 同步 |
| P8 | 合规体系 (DROP + LA County) | 2-3 周 | P1, P6 | 数据删除自动化, 审计日志, 加密存储 |
| **含扩展** | | **11-17 周** | | |

## 附录 C: 风险与缓解

| 风险 | 影响 | 概率 | 缓解策略 |
|------|------|------|----------|
| unifast/mdx-rs 不支持某些节点类型 | Rust 编译不完整 | 中 | 自动降级到 Node.js Unified.js 备引擎 |
| remark-prosemirror 不支持某些节点类型 | AST 转换不完整 | 中 | 编写自定义 handler 补充 |
| KaTeX 不支持某些 LaTeX 语法 | 公式渲染失败 | 低 | `throwOnError: false` + 错误提示 |
| 大型 JSON 导致 TOAST 性能问题 | 查询变慢 | 低 | 监控行大小, 双轨读取侧走 TEXT 字段 |
| reactjs-tiptap-editor 停止维护 | UI 组件无更新 | 低 | MIT 许可可 fork, 备选 shadcn-tiptap |
| MDX 编译服务宕机 | 阅读模式降级 | 低 | 降级为直接渲染 content_json |
| 跨平台字体差异导致视觉测试失败 | CI 误报 | 中 | 统一 Docker 镜像执行 |
| ReDoS 攻击 (恶意正则输入) | 转换引擎阻塞 | 低 | Rust 编译器天然抗 ReDoS, 输入长度限制 |
| DROP 平台 API 变更 | 合规轮询失败 | 低 | 监控告警 + 45 天缓冲期内修复 |
| CRDT 合并冲突导致数据异常 | 文档内容损坏 | 低 | Yrs 库成熟度高, 版本快照可回滚 |

