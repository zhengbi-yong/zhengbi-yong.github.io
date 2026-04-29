# 前端架构设计

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.2.2 (App Router) |
| UI 库 | React | 19.2 |
| CMS 集成 | Payload CMS | 3.78.0 |
| 管理后台 | Refine (Admin Framework) | 5.x |
| 数据获取 | TanStack React Query | 5.x |
| 静态内容 | Velite | 0.3.1 |
| 国际化 | i18next / react-i18next | 25.x / 16.x |
| 主题切换 | next-themes | 0.4.6 |
| 动画 | Framer Motion, GSAP | 最新 |
| 后端通信 | `apiClient.ts` + `backend.ts` | — |
| UI 状态 | Zustand (仅 UI 状态) | — |
| 样式 | Tailwind CSS | 4.2.1 |

## 目录结构

```text
frontend/src/
├── app/
│   ├── layout.tsx              # 根布局（全局字体/ThemeProvider/suppressHydrationWarning）
│   │
│   ├── (public)/               # 公开页面路由组
│   │   ├── layout.tsx         # 公开页外壳
│   │   └── blog/[...slug]/    # 动态博客详情页（(public) 路由组内的共享布局版本）
│   │
│   ├── blog/                   # 博客路由（直接位于 app/blog/，非路由组内）
│   │   ├── page.tsx           # 博客列表首页
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── [...slug]/         # 博客详情（动态路由 — 实际博客详情入口，页面文件位于此）
│   │   ├── category/[category]/ # 分类页面
│   │   ├── popular/           # 热门文章
│   │   └── page/[page]/       # 列表分页
│   │
│   ├── (admin)/                # 管理后台 - 严格 SSR+权限
│   │   └── admin/
│   │       ├── layout.tsx     # 侧边栏 + Auth 校验
│   │       ├── page.tsx       # 后台首页
│   │       ├── posts/         # 文章列表
│   │       ├── posts/new/     # 新建文章
│   │       ├── posts/edit/[...slug]/  # 编辑文章
│   │       ├── posts/versions/[...slug]/  # 版本历史
│   │       ├── posts/show/[slug]/  # 查看文章
│   │       ├── posts/preview/     # 文章预览
│   │       ├── posts-manage/      # 文章管理
│   │       ├── users/         # 用户管理
│   │       ├── comments/      # 评论管理
│   │       ├── media/         # 媒体管理
│   │       ├── analytics/     # 分析
│   │       ├── monitoring/    # 监控（含 health/ 和 metrics/）
│   │       └── settings/      # 设置
│   │
│   └── api/
│       └── v1/[...path]/      # BFF 代理（仅 Client 组件调用）
│
├── components/
│   ├── layouts/               # PostLayoutMonograph 等布局组件
│   ├── blog/                  # 博客组件（SearchDashboard 等）
│   ├── home/                  # 首页 Section（HeroSection, BentoGrid, ProjectGallery 等）
│   ├── ui/                    # 自定义 UI 组件（EnhancedImage, ExcalidrawModal, LoadingStates, Skeleton, LiveRegion, SwipeContainer, FAB 等）
│   ├── shadcn/ui/             # shadcn/ui 基础组件（button, card, dialog, input, tabs 等）
│   ├── navigation/            # TableOfContents 等导航组件
│   ├── magazine/              # 杂志风格组件（MasonryGrid, FilterBar, HeroSection, RecommendedSection 等）
│   ├── book/                  # 书籍组件（Book, Chapter, ArticleCard 等）
│   ├── editor/                # 编辑器组件（TiptapEditor, MenuBar, SplitEditor, extensions/ 等）
│   ├── auth/                  # 认证组件（AuthButton, AuthModal, AuthInitializer 等）
│   ├── search/                # 搜索组件（ApiSearchBar, SmartSearchBar）
│   ├── loaders/               # 加载状态组件（ComponentLoader, Spinner, Skeleton 系列等）
│   ├── chemistry/             # 化学可视化组件（ChemicalStructure, RDKitStructure, MoleculeFingerprint 等）
│   ├── post/                  # 文章相关组件
│   ├── header/                # 页眉组件（HeaderOptimized, HeaderNavigation, HeaderActions, MobileMenuButton 等）
│   ├── sections/              # 页面区域组件（SectionHeader, PageHeader, Explore, BlogSection, ActionBar 等）
│   ├── three/                 # Three.js 3D 组件
│   ├── social-icons/          # 社交图标组件
│   ├── seo/                   # SEO 相关组件
│   ├── audio/                 # 音频/乐谱组件
│   ├── maps/                  # 地图组件
│   ├── mobile/                # 移动端专用组件
│   ├── visitor/               # 访客交互组件（micro-interactions 等）
│   ├── debug/                 # 调试工具组件
│   ├── ai/                    # AI 相关组件
│   ├── performance/           # 性能监控组件（PerformanceDashboard 等）
│   ├── gaussian-splat/        # 3D Gaussian Splatting 组件
│   ├── charts/                # 图表组件（Nivo, ECharts, Three.js 等）
│   ├── animations/            # 动画包装组件（GSAP, Framer Motion）
│   ├── Excalidraw/            # Excalidraw 白板组件
│   ├── mdx/                   # MDX 渲染组件（CodeBlock 等）
│   ├── admin/                 # 管理后台组件（AdminLayout 等）
│   ├── media/                 # 媒体组件（Image 等）
│   ├── hooks/                 # 自定义 Hooks
│   └── MDXComponents/         # MDX 组件映射注册表
│
├── lib/
│   ├── api/
│   │   ├── generated/         # Orval 自动生成（严禁手改）
│   │   ├── apiClient.ts       # 核心 HTTP 客户端（拦截器、刷新、缓存、重试）
│   │   └── backend.ts         # 类型化 API 端点（auth/post/comment 等）
│   ├── store/
│   │   ├── ui-store.ts        # Zustand UI 状态（theme/sidebar/modal）
│   │   ├── auth-store.ts      # 用户会话状态（token 仅存 HttpOnly Cookie）
│   │   ├── blog-store.ts      # 博客数据缓存（1h 过期）
│   │   ├── post-store.ts      # 文章交互（likes/views）
│   │   ├── comment-store.ts   # 评论管理（分页）
│   │   ├── create-store.ts    # Store 创建工具
│   │   └── core/              # Store 工具函数和类型
│   ├── ui/
│   │   └── UIStore.ts         # UI 状态管理（loading/notifications/modal/sidebar/colorMode）
│   └── utils/
│
├── e2e/                       # Playwright E2E 测试
├── tests/                     # Vitest 单元测试
└── data/blog/                 # MDX 静态内容源
```

> **注意**：`e2e/`、`tests/`、`data/blog/` 实际位于 `frontend/` 根目录（而非 `frontend/src/` 下）。
>
> **路由解析说明**：`app/blog/[...slug]/`（含有 `page.tsx`）为实际博客详情入口。`app/(public)/blog/[...slug]/`（仅含 `DynamicPostPage.tsx` 组件导出）提供路由组内的布局共享，但无 `page.tsx` 文件，不构成独立路由。

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
|| ui-store | theme, sidebar, modal | Zustand | 纯 UI，无敏感数据 |
|| UIStore (lib/ui/UIStore.ts) | global loading, notifications, modals, sidebar, colorMode | Zustand | UI 层级状态管理（非 React Context） |

> **注意**：`ui-store.ts` 和 `UIStore.ts` 功能重叠（都管理 theme/sidebar/modal）。建议合并为一个统一 UI Store 以避免状态分散。 (recommend: consolidation)

| auth-store | user, isAuthenticated | Zustand | 存储用户会话状态，token 仅存 HttpOnly Cookie |
| blog-store | posts cache | Zustand | 缓存博客数据，1 小时过期，减少 API 调用 |
| post-store | post stats (likes, views), likedPosts | Zustand | 文章交互状态 |
| comment-store | comments per post, pagination cursor | Zustand | 评论数据分页管理 |
| create-store | 通用 store 创建工具 | Zustand | 用于创建新 store 的辅助函数 |

## 后端 Middleware 集成

| Middleware | 位置 | 职责 |
|-----------|------|------|
| tracing.rs | `backend/crates/api/src/middleware/tracing.rs` | 请求追踪和日志记录中间件 |
| tracing.rs | `backend/crates/api/src/observability/tracing.rs` | 可观测性基础设施（tracing 设置） |

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
Layer 5: admin-compact.css         → 后台紧凑模式

其他 CSS 导入（在根 layout.tsx 中引入）：
- pliny/search/algolia.css         → Pliny Algolia 搜索样式
- leaflet/dist/leaflet.css         → Leaflet 地图样式
- katex/dist/katex.min.css         → KaTeX 数学公式样式
- abcjs/abcjs-audio.css            → ABCJS 乐谱样式
- remark-github-blockquote-alert/alert.css → GitHub 风格的区块引用警告样式
- prism.css                         → 代码高亮样式
```

## 布局收敛

- **唯一活跃布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃
- 统一组件：`TableOfContents`（IntersectionObserver scroll-spy）
- 阅读进度条：`useReadingProgressWithApi`

## 其他应用路由

除上述路由外，`app/` 下还包含以下独立路由页面：

| 路由 | 功能 | 状态 |
|------|------|------|
| `/about/` | 关于页面 | ✅ |
| `/analytics/` | 网站分析仪表盘（含独立 layout） | ✅ |
| `/excalidraw/` | Excalidraw 白板（含独立 layout） | ✅ |
| `/experiment/` | 实验性功能（含 spark-test 子路由） | ✅ |
| `/geist/` | Geist 设计系统展示 | ✅ |
| `/login/` | 用户登录页面 | ✅ |
| `/music/` | 音乐页面（含 `[name]` 动态路由） | ✅ |
| `/notifications/` | 用户通知页面 | ✅ |
| `/offline/` | 离线页面（PWA） | ✅ |
| `/profile/` | 用户个人资料 | ✅ |
| `/projects/` | 项目展示页面 | ✅ |
| `/reading-list/` | 阅读列表 | ✅ |
| `/reading-history/` | 阅读历史 | ✅ |
| `/search/` | 搜索结果页 | ✅ |
| `/tags/` | 所有标签（含 `[tag]` 动态路由及分页） | ✅ |
| `/team/` | 团队成员展示 | ✅ |
| `/test-api/` | API 测试页面 | ⚠️ 开发辅助 |
| `/test-abc/` | ABC 乐谱测试 | ⚠️ 开发辅助 |
| `/test-abc-mdx/` | ABC MDX 测试 | ⚠️ 开发辅助 |
| `/simple-test/` | 简单测试页面 | ⚠️ 开发辅助 |
| `/visitors/` | 访客统计与地图 | ✅ |
