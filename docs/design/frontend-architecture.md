# 前端架构设计

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.2.2 (App Router) |
| UI 库 | React | 19.2 |
| 动画 | Framer Motion | 最新 |
| 后端通信 | `apiClient.ts` + `backend.ts` | — |
| UI 状态 | Zustand (仅 UI 状态) | — |

## 目录结构

```text
frontend/src/
├── app/
│   ├── layout.tsx              # 根布局（全局字体/ThemeProvider/suppressHydrationWarning）
│   │
│   ├── (public)/               # 公开页面路由组
│   │   ├── layout.tsx         # 公开页外壳
│   │   └── blog/[...slug]/
│   │
│   ├── (admin)/                # 管理后台 - 严格 SSR+权限
│   │   └── admin/
│   │       ├── layout.tsx     # RefineProvider + AdminLayout（侧栏 + Auth 校验）
│   │       ├── page.tsx       # 仪表盘
│   │       ├── posts/         # 文章管理（list, new, edit, show, preview, versions）
│   │       ├── posts-manage/  # 文章管理（Refine 版）
│   │       ├── posts-refine/  # 文章管理（Refine 替代版）
│   │       ├── users/         # 用户管理
│   │       ├── users-refine/  # 用户管理（Refine 版）
│   │       ├── comments/      # 评论管理
│   │       ├── media/         # 媒体管理
│   │       ├── settings/      # 设置
│   │       ├── monitoring/    # 监控（health, metrics）
│   │       ├── analytics/     # 分析
│   │       ├── team/          # 团队（list, new, edit）
│   │       └── test/          # 测试页面
│   │
│   └── api/
│       ├── v1/[...path]/      # BFF 代理（仅 Client 组件调用）
│       ├── v1/posts/          # 文章 API 路由
│       ├── mdx/compile/       # MDX 编译路由
│       ├── visitors/          # 访客统计路由
│       ├── visitor/           # 单个访客路由
│       └── newsletter/        # 新闻通讯路由
│
├── components/
│   ├── layouts/               # PostLayoutMonograph 等布局组件
│   ├── blog/                  # 博客组件（SearchDashboard 等）
│   ├── home/                  # 首页 Section（HeroSection, BentoGrid, ProjectGallery 等）
│   ├── ui/                    # shadcn/ui + 自定义 UI 组件（Loader, Skeleton, Toast 等）
│   ├── post/                  # 文章相关组件
│   ├── auth/                  # 认证相关组件
│   ├── MDXComponents/         # MDX 渲染组件
│   ├── header/                # 页眉组件（Header.tsx → header/HeaderOptimized.tsx）
│   ├── sections/              # 页面 Section（Explore, FeaturedWork, BlogSection 等）
│   ├── social-icons/          # 社交图标组件
│   ├── navigation/            # TableOfContents 等导航组件
│   ├── loaders/               # 加载状态组件（Skeleton, ListSkeleton 等）
│   ├── magazine/              # 杂志风格博客布局组件
│   └── chemistry/             # 化学/乐谱等富媒体组件
│
├── lib/
│   ├── api/
│   │   ├── apiClient.ts       # 核心 HTTP 客户端（拦截器、缓存、重试）
│   │   ├── backend.ts         # 类型化 API 端点（auth/post/comment/admin 等）
│   │   └── resolveBackendApiBaseUrl.ts  # API Base URL 解析
│   ├── store/
│   │   ├── auth-store.ts      # 认证状态（Zustand）
│   │   ├── blog-store.ts      # 博客缓存（Zustand）
│   │   ├── comment-store.ts   # 评论状态（Zustand）
│   │   ├── post-store.ts      # 文章交互（Zustand）
│   │   └── ui-store.ts        # UI 状态（Zustand）
│   └── hooks/
│       ├── useBlogData.ts     # 数据获取 hooks（usePosts, usePost 等，基于 React Query）
│       └── ...
│   └── utils/
├── e2e/                       # Playwright E2E 测试
├── tests/                     # Vitest 单元测试
└── data/blog/                 # MDX 静态内容源
```

> **注意**：`e2e/`、`tests/`、`data/blog/` 实际位于 `frontend/` 根目录（而非 `frontend/src/` 下）。

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
  async patch<T>(url, data, options?)
  async delete<T>(url, options?)
  async getText(url, options?)  // 返回纯文本（用于 Prometheus metrics 等非 JSON 端点）
}

// lib/api/backend.ts — 类型封装
export const postService = {
  async list(params): Promise<PaginatedResponse<PostListItem>>
  async get(slug): Promise<PostDetail>
  async likePost(slug): Promise<void>    // POST /posts/{slug}/likes
  async unlikePost(slug): Promise<void>  // DELETE /posts/{slug}/likes
}

// lib/hooks/useBlogData.ts — React Query hooks
export function usePosts(params): UseQueryResult<PostListResponse>  // 带缓存/重新获取
export function usePost(slug): UseQueryResult<PostDetail>           // 单篇文章
export function useSearch(query): UseQueryResult<SearchResponse>    // 搜索

// 推荐使用 hook 模式（内部自动处理缓存、加载态、错误态）
const { data: posts, isLoading, error } = usePosts({ page: 1 })
```

- 使用 `withCredentials: true` 自动发送 HttpOnly Cookie
- **不再从 localStorage 读取 token**
- 401 时自动尝试刷新 token，失败后跳转登录页

## 状态管理职责

| Store | 存什么 | 存哪里 | 原因 |
|-------|--------|--------|------|
| auth-store | user, isAuthenticated | Zustand | 认证状态管理 |
| ui-store | theme, sidebar, modal | Zustand | 纯 UI，无敏感数据 |
| blog-store | posts, categories, tags | Zustand | 博客内容缓存 |
| comment-store | comments, likedComments | Zustand | 评论交互 |
| post-store | stats, likedPosts | Zustand | 文章交互 |
| ~~auth-store~~ | ~~token~~ | ~~localStorage~~ | **禁止!** XSS 风险 |
| ~~blog-store~~ | ~~posts~~ | ~~localStorage~~ | **禁止!** 用 API 获取 |

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
Layer 0: geist-tokens.css          → 原始值，无依赖
Layer 1: tailwind.css              → 别名到 geist + 共享语义
Layer 2: monograph-theme.css       → 长文阅读主题（--monograph-*）
Layer 3: visitor-theme.css         → 访客主题（--visitor-*）
Layer 4: admin-theme.css           → Admin 专用（--admin-*）
```

## 布局收敛

- **唯一活跃布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃
- 统一组件：`TableOfContents`（IntersectionObserver scroll-spy）
- 阅读进度条：`useReadingProgressWithApi`
