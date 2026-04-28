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
│   <!-- 无 BFF 代理路由 -->
│
├── components/
│   ├── layouts/               # PostLayoutMonograph 等布局组件
│   ├── sections/              # Explore, FeaturedWork, BlogSection 等页面区块
│   ├── home/                  # HeroCard, SocialCard 等首页组件
│   ├── ui/                    # 自定义 UI 组件（非 shadcn）
│   ├── shadcn/ui/             # shadcn/ui 基础组件（button, card, dialog 等）
│   ├── visitor/               # 访客主题组件（typography, cards, micro-interactions）
│   ├── navigation/            # TableOfContents 等导航组件
│   ├── chemistry/             # 化学/乐谱等富媒体组件
│   ├── mdx/                   # MDX 渲染组件
│   └── post/                  # 文章组件（BackendComments 等）
│
├── lib/
│   ├── api/
│   │   ├── generated/         # Orval 自动生成（严禁手改）
│   │   ├── apiClient.ts       # 核心 HTTP 客户端（拦截器、刷新、缓存、重试）
│   │   └── backend.ts         # 类型化 API 端点（auth/post/comment 等）
│   └── store/
│       └── ui-store.ts        # Zustand UI 状态（theme, sidebar, modal）
│
├── e2e/                       # Playwright E2E 测试
├── tests/                     # Vitest 单元测试
└── data/blog/                 # MDX 静态内容源
```

> **注意**：`e2e/`、`tests/`、`data/blog/` 实际位于 `frontend/` 根目录（而非 `frontend/src/` 下）。

## 数据获取规范

| 调用方 | 方式 | 说明 |
|--------|------|------|
| Server Components | 委托给 Client Components 处理（usePosts 等 hook） | 通过 SSR 传给 Client 组件，浏览器端利用 fetch 获取数据 |
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
| ui-store | theme, sidebar, modal | Zustand | 纯 UI，无敏感数据 |
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
Layer 1: tailwind.css              → 别名到 geist + 共享语义（最先导入）
Layer 2: monograph-theme.css       → 长文阅读主题（--monograph-*）
Layer 3: visitor-theme.css         → 访客主题（--visitor-*）
Layer 4: admin-theme.css           → Admin 专用（--admin-*）
Layer 5: admin-compact.css         → Admin 紧凑模式
Layer 6: prism.css                 → 代码高亮
```

## 布局收敛

- **唯一活跃文章布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃（PostLayout 在旧版 layouts/CLAUDE.md 中仍有记录，但不使用）
- **活跃布局**：`AuthorLayout` — 作者页布局
- 统一组件：`TableOfContents`（IntersectionObserver scroll-spy）
- 阅读进度条：`useReadingProgressWithApi`
