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
│   │       ├── layout.tsx     # 侧边栏 + Auth 校验
│   │       ├── posts/
│   │       ├── users/
│   │       ├── comments/
│   │       └── media/
│   │
│   └── api/
│       ├── mdx/compile/       # MDX 编译 API
│       └── v1/[...path]/      # BFF 代理（仅 Client 组件调用）
│
├── components/
│   ├── admin/                 # 管理后台组件
│   ├── animations/            # 动画封装（Framer Motion, GSAP）
│   ├── audio/                 # 音频/乐谱工具
│   ├── book/                  # 书籍阅读界面
│   ├── blog/                  # 博客组件（SearchDashboard 等）
│   ├── charts/                # 图表组件（Nivo, ECharts, Three.js）
│   ├── chemistry/             # 化学/乐谱等富媒体组件
│   ├── editor/                # 富文本编辑器组件
│   ├── header/                # 页眉组件
│   ├── home/                  # 首页 Section（HeroCard, SocialCard, BentoGrid 等）
│   ├── layouts/               # PostLayoutMonograph 等布局组件
│   ├── loaders/               # 加载状态组件
│   ├── magazine/              # 杂志风格博客布局
│   ├── maps/                  # 交互式地图组件
│   ├── mdx/                   # MDX 渲染组件（CodeBlock 等）
│   ├── navigation/            # TableOfContents 等导航组件
│   ├── post/                  # 文章相关组件（LikeButton, Comments 等）
│   ├── search/                # 搜索组件
│   ├── sections/              # 页面 Section 组件（Explore, FeaturedWork 等）
│   ├── seo/                   # SEO 组件
│   ├── shadcn/ui/             # shadcn/ui 基础组件
│   ├── three/                 # Three.js 3D 组件
│   └── visitor/               # 访客主题组件（微交互、排版等）
│
├── lib/
│   ├── api/
│   │   ├── apiClient.ts       # 核心 HTTP 客户端（拦截器、刷新、缓存、重试）
│   │   └── backend.ts         # 类型化 API 端点（auth/post/comment 等）
│   ├── store/
│   │   ├── auth-store.ts      # 认证状态（Zustand）
│   │   ├── blog-store.ts      # 博客状态（Zustand）
│   │   ├── post-store.ts      # 文章状态（Zustand）
│   │   ├── comment-store.ts   # 评论状态（Zustand）
│   │   └── create-store.ts    # 创建流程状态（Zustand）
│   ├── ui/
│   │   └── UIStore.ts         # UI 状态（theme/modal/sidebar/toast，Zustand persist）
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
| Server Components | 直接调用 `backend.ts` 或 `apiClient.ts` | 在 Server Component 中直接调用 API 客户端 |
| Client Components | React Query hooks → `backend.ts` → `apiClient.ts` → `fetch` | 基于 fetch 的客户端，Cookie 自动携带（withCredentials） |

数据获取采用 API-Client 模式，通过 `apiClient.ts` 和 `backend.ts` 封装，React Query 管理缓存和状态。

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
| UIStore | theme, modal, sidebar, toast | Zustand (persist) | 全局 UI 状态，需持久化 theme |
| auth-store | 认证状态 (AuthState) | Zustand | 认证信息管理 |
| blog-store | 博客列表状态 | Zustand | 博客数据缓存 |
| post-store | 文章详情状态 | Zustand | 文章数据管理 |
| comment-store | 评论状态 | Zustand | 评论数据管理 |
| create-store | 创建流程状态 | Zustand | 创建文章/内容流程 |
| ~~auth-store (legacy)~~ | ~~token~~ | ~~localStorage~~ | **禁止!** XSS 风险 |
| ~~blog-store (legacy)~~ | ~~posts~~ | ~~localStorage~~ | **禁止!** 用 API 获取 |

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

CSS 主题变量在组件级别导入，而非全局级联加载。各个主题 CSS 文件在需要使用该主题的组件中 import。

```text
Layer 0: geist-tokens.css          → 原始值，无依赖
Layer 1: tailwind.css              → Tailwind 基础样式 + CSS 变量
Layer 2: monograph-theme.css       → 长文阅读主题（--monograph-*）
Layer 3: visitor-theme.css         → 访客主题（--visitor-*），在 `Main.tsx` 中 import
Layer 4: admin-theme.css           → Admin 专用（--admin-*）
```

## 动画库

| 库 | 用途 | 优先级 |
|----|------|--------|
| Framer Motion | 页面过渡、滚动触发动画（whileInView）、布局动画 | 🥇 主力 |
| GSAP | 复杂时间线动画、特定性能敏感场景 | 🥈 辅助 |

## 布局收敛

- **唯一活跃布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃
- 统一组件：`TableOfContents`（IntersectionObserver scroll-spy）
- 阅读进度条：`useReadingProgressWithApi`
