# 前端架构设计

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.2.2 (App Router) |
| UI 库 | React | 19.2 |
| 动画 | Framer Motion, GSAP | 最新 |
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
│   │       ├── layout.tsx     # 侧边栏 + Auth 校验 (RefineProvider + AdminLayout)
│   │       ├── page.tsx       # 仪表盘概览
│   │       ├── posts/         # 文章管理 (new, edit, show, versions, preview, manage)
│   │       ├── users/         # 用户管理
│   │       ├── comments/      # 评论管理
│   │       ├── media/         # 媒体管理
│   │       ├── team/          # 团队管理
│   │       ├── analytics/     # 分析面板
│   │       ├── monitoring/    # 监控 (metrics, health)
│   │       └── settings/      # 系统设置
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
│   └── chemistry/             # 化学/乐谱等富媒体组件
│
├── lib/
│   ├── api/
│   │   ├── apiClient.ts       # 核心 HTTP 客户端（拦截器、刷新、缓存、重试）
│   │   └── backend.ts         # 类型化 API 端点（auth/post/comment 等）
│   ├── store/
│   │   ├── ui-store.ts        # Zustand 仅存 UI 状态
│   │   ├── auth-store.ts      # 认证状态（user, isAuthenticated）
│   │   ├── blog-store.ts      # 博客列表缓存
│   │   ├── post-store.ts      # 文章统计与互动
│   │   └── comment-store.ts   # 评论管理
│   ├── ui/
│   │   └── UIStore.ts         # Zustand UI 状态（loading/notifications/modal/sidebar/colorMode）
│   └── utils/
│
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

- 使用 `withCredentials: true` 自动发送 HttpOnly Cookie
- **不再从 localStorage 读取 token**
- 401 时自动尝试刷新 token，失败后跳转登录页

## 状态管理职责

| Store | 存什么 | 存哪里 | 原因 |
|-------|--------|--------|------|
| ui-store | theme, sidebar | Zustand | 纯 UI，无敏感数据 |
| UIStore | loading, notifications, modals, sidebar, colorMode | Zustand (with devtools) | UI 层级管理 |
| auth-store | user, isAuthenticated, isLoading, error | Zustand (in-memory) | 认证状态，不存 token（HttpOnly Cookie） |
| blog-store | searchQuery, filteredPosts, allPosts (cache) | Zustand (in-memory) | 博客列表缓存，减少 API 调用 |
| post-store | stats, likedPosts | Zustand (in-memory) | 文章统计与互动状态 |
| comment-store | comments, likedComments, loading | Zustand (in-memory) | 评论管理状态 |

> **注意**：所有 Zustand Store 均不存储 JWT token。认证通过 HttpOnly Cookie 自动携带（`credentials: 'include'`）。

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

| Layer | 文件 | 说明 |
|-------|------|------|
| 入口 | `tailwind.css` | 全局基础样式，`@import` 导入 geist-tokens.css |
| 变量 | `geist-tokens.css` | Geist 设计变量，被 tailwind.css 导入 |
| 主题 | `monograph-theme.css` | 长文阅读主题（--monograph-*），运行时条件加载 |
| 主题 | `visitor-theme.css` | 访客主题（--visitor-*），运行时条件加载 |
| 主题 | `admin-theme.css` | Admin 专用（--admin-*），运行时条件加载 |

## 布局收敛

- **唯一活跃布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃
- 统一组件：`TableOfContents`（IntersectionObserver scroll-spy）
- 阅读进度条：`components/hooks/useReadingProgressWithApi`
