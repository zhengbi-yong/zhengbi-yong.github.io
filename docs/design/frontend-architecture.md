# 前端架构设计

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16 (App Router) |
| UI 库 | React | 19 |
| 动画 | Framer Motion, GSAP | 最新 |
| 后端通信 | `apiClient.ts` + `backend.ts` | — |
| UI 状态 | Zustand + React Context | — |
| 静态站点 | Velite (via contentlayer compatibility shim) | — |
| 搜索/分析 | Pliny | — |

## 目录结构

```text
frontend/src/
├── app/
│   ├── layout.tsx              # 根布局（全局字体/ThemeProvider/suppressHydrationWarning）
│   │
│   ├── blog/[...slug]/         # 博客文章页（公开，位于顶层路由，非 (public) 路由组下）
│   │
│   ├── (public)/               # 公开页面路由组
│   │   └── layout.tsx         # 公开页外壳
│   │
│   ├── (admin)/                # 管理后台路由组 - 严格 SSR+权限
│   │   └── admin/
│   │       ├── layout.tsx     # 侧边栏 + Auth 校验（位于 (admin)/admin/ 下）
│   │       ├── page.tsx       # 仪表盘
│   │       ├── posts-manage/  # 文章管理
│   │       ├── posts/         # 文章子路由（show, preview, new, edit, versions）
│   │       ├── users/
│   │       ├── users-refine/
│   │       ├── comments/
│   │       ├── media/
│   │       ├── settings/
│   │       ├── analytics/
│   │       ├── monitoring/    # 含 metrics/ 和 health/
│   │       ├── team/          # 含 new/ 和 edit/
│   │       └── test/
│   │       ... 共 15+ 个管理页面
│   │
│   └── api/
│       └── v1/[...path]/      # BFF 代理（仅 Client 组件调用）
│
├── components/
│   ├── layouts/               # PostLayoutMonograph 等布局组件
│   ├── blog/                  # 博客组件（SearchDashboard 等）
│   ├── home/                  # 首页 Section（HeroSection, BentoGrid, ProjectGallery 等）
│   ├── ui/                    # shadcn/ui 基础组件
│   ├── navigation/            # TableOfContents 等导航组件
│   ├── chemistry/             # 化学/乐谱等富媒体组件
│   ├── SkipLink.tsx           # 无障碍跳过导航
│   ├── ServiceWorkerRegister.tsx
│   ├── VisitorTracker.tsx
│   ├── I18nProvider.tsx
│   └── LazyLoadedComponents.tsx
│
├── lib/
│   ├── api/
│   │   ├── generated/         # Orval 生成（types + schemas，部分手写补充）
│   │   ├── apiClient.ts       # 核心 HTTP 客户端（拦截器、缓存、重试）
│   │   └── backend.ts         # 类型化 API 端点（auth/post/comment 等）
│   ├── store/
│   │   ├── ui-store.ts        # Zustand UI 状态（theme, sidebar, modal）
│   │   ├── auth-store.ts      # 用户认证状态（不存 token，使用 HttpOnly Cookie）
│   │   ├── blog-store.ts      # 博客内容缓存
│   │   ├── comment-store.ts   # 评论状态
│   │   └── post-store.ts      # 文章交互（点赞、阅读统计）
│   ├── ui/
│   │   └── UIStore.ts         # React Context UI 状态（loading/notifications/modal/sidebar/colorMode）
│   ├── contentlayer/
│   │   └── generated.ts       # Contentlayer 兼容垫片——底层使用 Velite 数据
│   ├── pliny/                 # pliny 垫片（utils/contentlayer, mdx-components）
│   └── utils/
│
├── e2e/                       # Playwright E2E 测试（实际存在于 frontend/e2e/）
├── tests/                     # Vitest 单元测试（实际存在于 frontend/tests/）
└── data/blog/                 # MDX 静态内容源（实际存在于 frontend/data/blog/）
```

> **根布局 providers**：实际代码中，`layout.tsx` 按顺序包裹了以下 providers:
> - `QueryProvider` (React Query)
> - `I18nProvider`
> - `AuthInitializer`
> - `SkipLink`
> - `ServiceWorkerRegister`
> - `VisitorTracker`
> - `ThemeProviders`
> - `ErrorBoundary`
> - `LazyLoadedComponents` (延迟加载 Analytics, KeyboardNavigation, FocusManager)
> - `Toaster` (sonner toast 通知)
>
> 字体加载：Inter, JetBrains Mono, **Newsreader**（文档之前缺失）。

## 数据获取规范

| 调用方 | 方式 | 说明 |
|--------|------|------|
| Server Components | 无需特殊处理，后端返回的 HTML 已包含数据 | SSR 直出 |
| Client Components | `backend.ts` → `apiClient.ts` → `fetch` | 基于 fetch 的客户端，Cookie 自动携带（withCredentials） |

### API 客户端

```typescript
// lib/api/apiClient.ts — 核心客户端
class APIClient {
  async get<T>(url, options?)   // 支持缓存: true=1h, 300000=5min, false=不缓存
  async post<T>(url, data, options?)  // 自动重试 + 错误翻译
  async put<T>(url, data, options?)
  async delete<T>(url, options?)
}

// lib/api/backend.ts — 类型封装
export const postService = {
  async list(params): Promise<PaginatedResponse<PostListItem>>
  async get(slug): Promise<PostDetail>
  async likePost(slug): Promise<void>    // POST /posts/{slug}/likes
  async unlikePost(slug): Promise<void>  // DELETE /posts/{slug}/likes
}
```

- 使用 `withCredentials: true` / `credentials: 'include'` 自动发送 HttpOnly Cookie
- **不再从 localStorage 读取或刷新 token**
- 401 时**不自动刷新 token**，直接抛出错误，由调用方处理登录跳转

## 状态管理职责

| Store | 存什么 | 存哪里 | 原因 |
|-------|--------|--------|------|
| ui-store | theme, sidebar, modal | Zustand | 纯 UI，无敏感数据 |
| UIStore | loading, notifications, modals, sidebar, colorMode | React Context | UI 层级管理 |
| auth-store | user, isAuthenticated | Zustand | 用户身份状态（**不存 token**，使用 HttpOnly Cookie） |
| blog-store | posts, categories, tags | Zustand | 博客列表缓存，减少 API 请求 |
| comment-store | comments, likedComments | Zustand | 评论管理 |
| post-store | stats, likedPosts | Zustand | 文章交互统计 |

## 搜索降级策略

```typescript
// 默认: PG FTS，后端全文搜索
// 前端触发: SearchDashboard.tsx 中实现
const results = await postService.search(query)
```

PG FTS 作为默认搜索引擎。Meilisearch 的集成在规划中但尚未实装。

## 认证流程

```
1. 用户提交凭据 → POST /auth/login
2. 后端验证 → 颁发 HttpOnly Cookie + JSON body 返回 access_token
3. 后续请求: Cookie 自动发送（withCredentials: true）
4. 也可在 Authorization: Bearer 中传 access_token
```

**严禁**：不要在 localStorage 存 JWT（XSS 风险）。

## CSS 变量系统

```text
| Layer 0: geist-tokens.css          → 原始值，无依赖
| Layer 1: tailwind.css              → 别名到 geist + 共享语义
| Layer 2: monograph-theme.css       → 长文阅读主题（--monograph-*）
| Layer 3: visitor-theme.css         → 访客主题（--visitor-*）
| Layer 4: admin-theme.css           → Admin 专用（--admin-*）
| Layer 5: admin-compact.css         → Admin 紧凑模式
```

## 布局收敛

- **唯一活跃布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃
- 统一组件：`TableOfContents`（IntersectionObserver scroll-spy）
- 阅读进度条：`useReadingProgressWithApi`

## 公开页面路由

除了文档已列的 `blog/[...slug]` 外，实际代码中还有 20+ 个公开页面（位于 `src/app/` 顶层或 `(public)` 路由组下）：
`about`, `analytics`, `blog`, `blog/popular`, `blog/category/[category]`, `blog/page/[page]`,
`excalidraw`, `experiment`, `experiment/spark-test`, `geist`, `login`, `music`, `music/[name]`,
`notifications`, `offline`, `profile`, `projects`, `reading-history`, `reading-list`, `search`,
`simple-test`, `tags`, `tags/[tag]`, `tags/[tag]/page/[page]`, `team`, `test-abc`, `test-abc-mdx`,
`test-api`, `visitors`, `error`, `loading`, `not-found`
