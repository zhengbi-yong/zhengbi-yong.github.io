# 前端架构设计

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.2.2 (App Router) |
| UI 库 | React | 19.2 |
| 动画 | Framer Motion, GSAP | 最新 |
| 后端通信 | `apiClient.ts` + `backend.ts` | — |
| UI 状态 | Zustand | — |
| 数据获取 | @tanstack/react-query | — |
| 内容层 | velite / Contentlayer | — |
| 富文本编辑 | TipTap | — |
| UI 组件库 | shadcn/ui, pliny | — |
| 主题 | next-themes | — |
| 3D | three.js, @react-three/fiber, @tresjs/core | — |
| 音频乐谱 | Tone.js, abcjs, OpenSheetMusicDisplay | — |
| 化学 | RDKit.js, 3Dmol.js | — |
| 图表 | Nivo, ECharts, AntV G2 | — |
| 白板 | Excalidraw | — |
| 数学渲染 | KaTeX | — |
| 地图 | Leaflet / react-leaflet | — |
| 图标 | lucide-react | — |
| 构建工具 | pnpm, Vitest, Playwright, Storybook, velite, husky, orval | — |

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
│       ├── v1/                 # BFF 代理（后台 API）
│       │   ├── [...path]/     # 通用 BFF 代理路由
│       │   └── posts/         # 博客列表/搜索 API
│       ├── mdx/compile/       # MDX 编译 API
│       ├── visitor/           # 访客记录 API
│       ├── visitors/          # 访客列表 API
│       └── newsletter/        # 订阅 API
│
├── components/
│   ├── admin/                 # 管理后台组件
│   ├── animations/            # 动画组件（GSAP, Framer Motion）
│   ├── audio/                 # 音频/乐谱（Tone.js, abcjs, OpenSheetMusicDisplay）
│   ├── auth/                  # 认证相关组件
│   ├── blog/                  # 博客组件（SearchDashboard 等）
│   ├── book/                  # 书籍阅读界面组件
│   ├── charts/                # 图表组件（Nivo, ECharts, AntV G2）
│   ├── chemistry/             # 化学可视化（RDKit, 3Dmol）
│   ├── editor/                # TipTap 富文本编辑器
│   ├── Excalidraw/            # 白板组件
│   ├── gaussian-splat/        # 3D 高斯溅射渲染
│   ├── geist/                 # Geist 设计系统组件
│   ├── gsap/                  # GSAP 动画封装
│   ├── header/                # 页眉模块（桌面导航、移动菜单、滚动显隐）
│   ├── home/                  # 首页 Section（HeroSection, BentoGrid, ProjectGallery 等）
│   ├── layouts/               # 布局组件（PostLayoutMonograph, BookShelfLayout, PublicPageFrame 等）
│   ├── loaders/               # 加载骨架屏
│   ├── magazine/              # 杂志式博客布局
│   ├── maps/                  # 交互式地图（Leaflet）
│   ├── mdx/                   # MDX 专用组件（CodeBlock 等）
│   ├── media/                 # 媒体组件（Image）
│   ├── navigation/            # 导航组件（TableOfContents 等）
│   ├── performance/           # 性能监控仪表盘
│   ├── post/                  # 文章交互组件（评论、点赞、统计）
│   ├── search/                # 搜索组件（ApiSearchBar, SmartSearchBar）
│   ├── sections/              # 页面节段组件
│   ├── seo/                   # SEO 组件
│   ├── shadcn/                # shadcn/ui 基础组件
│   ├── social-icons/          # 社交图标组件
│   ├── three/                 # Three.js 3D 渲染
│   ├── ui/                    # 自定义 UI 组件
│   ├── visitor/               # 访客主题组件
│   ├── Header.tsx             # 页眉统一入口
│   ├── Footer.tsx             # 页脚（含 ICP 备案）
│   ├── Image.tsx              # 优化图片组件
│   ├── MDXComponents.tsx       # MDX 组件映射注册
│   ├── Link.tsx               # 自定义链接组件
│   ├── MobileNav.tsx           # 移动端导航
│   ├── BackToTop.tsx           # 回到顶部
│   ├── NewsletterSignup.tsx    # 新闻订阅
│   ├── PageTitle.tsx           # 页面标题
│   └── ...                    # 其他平面文件组件
│
├── lib/
│   ├── api/
│   │   ├── generated/         # Orval 自动生成（严禁手改）
│   │   ├── apiClient.ts       # 核心 HTTP 客户端（拦截器、刷新、缓存、重试）
│   │   └── backend.ts         # 类型化 API 端点（auth/post/comment 等）
│   ├── store/
│   │   ├── ui-store.ts        # Zustand：sidebar/theme 状态
│   │   ├── auth-store.ts      # Zustand：user/isAuthenticated
│   │   ├── post-store.ts      # Zustand：like/view 统计数据
│   │   ├── comment-store.ts   # Zustand：按 slug 管理的评论
│   │   ├── blog-store.ts      # Zustand：Contentlayer 缓存
│   │   └── create-store.ts    # Zustand store 工厂
│   ├── providers/
│   │   └── query-provider.tsx  # @tanstack/react-query QueryProvider
│   └── ...                    # 其他工具模块
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

| Store | 存什么 | 技术 | 原因 |
|-------|--------|------|------|
| `ui-store` | sidebar, theme | Zustand | 纯 UI 状态，轻量 |
| `auth-store` | user, isAuthenticated | Zustand | 用户登录态管理，不用 localStorage 存 token |
| `post-store` | like/view/comment 统计 (按 slug) | Zustand | 文章互动数据缓存 |
| `comment-store` | 评论列表 (按 slug) | Zustand | 分页评论、点赞状态 |
| `blog-store` | Contentlayer 文章缓存 | Zustand | 减少 API 调用，缓存过期 1h |
| `@tanstack/react-query` | API 数据缓存/重新获取 | QueryProvider | Server State 管理，缓存/重新验证 |

## 搜索实现

搜索功能采用多组件分层架构：

### 组件层级
1. `SmartSearchBar` — 智能搜索框（建议 + 自动完成 + 实时搜索）
2. `ApiSearchBar` — API 驱动搜索（300ms 防抖 + 下拉结果）
3. `SearchBoxOptimized` — 高性能搜索框（预索引 + 模糊匹配）
4. `SearchDashboard` — 搜索聚合面板（全文搜索 + 标签分类）

### 搜索策略
```typescript
// 1. 前端：SmartSearchBar 提供即时建议（预索引标题/标签）
// 2. 后端：PG FTS 全文搜索（通过 postService.search）
// 3. 生成时：velite/search 脚本构建搜索索引 JSON

// API 入口
const results = await postService.search(query)
```

### 数据流
```
用户输入 → 300ms 防抖 → 前端建议（预索引） → API 搜索（PG FTS）
```

PG FTS 作为主要搜索引擎。搜索索引通过 `velite.config.ts` 中的 search 插件在构建时生成。`generate-search.mjs` 脚本将 Contentlayer 内容构建为可搜索的 JSON 索引。

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
Layer 5: admin-compact.css         → Admin 紧凑模式（--admin-compact-*）
Layer 6: prism.css                 → 代码高亮
```

## 布局收敛

- **唯一活跃布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃
- 统一组件：`TableOfContents`（IntersectionObserver scroll-spy）
- 阅读进度条：`useReadingProgressWithApi`
