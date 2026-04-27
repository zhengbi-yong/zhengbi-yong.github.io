# 前端架构设计

> 来源：ultradesign.md (3章)、design-convergence-plan.md、superpowers specs

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.2.2 (App Router) |
| UI 库 | React | 19.2 |
| 动画 | Framer Motion, GSAP | 最新 |
| 后端通信 | customFetch() + Orval 生成客户端 | — |
| UI 状态 | Zustand (仅 UI 状态) | — |

## 目录结构

```
frontend/src/
├── app/
│   ├── layout.tsx              # 根布局（全局字体/ThemeProvider）
│   ├── proxy.ts                # Next.js 16 前置拦截（权限/CORS）
│   │
│   ├── (public)/               # 公开页面 - 可 SSG/ISR
│   │   ├── page.tsx           # 首页
│   │   ├── blog/              # 博客列表/详情
│   │   ├── tags/              # 标签
│   │   ├── team/              # 团队
│   │   └── music/             # 音乐
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
│       └── v1/[...path]/      # BFF 代理（仅 Client 组件调用）
│
├── components/
│   ├── layouts/               # 布局组件
│   ├── blog/                  # 博客组件
│   ├── ui/                    # shadcn/ui 基础组件
│   ├── chemistry/             # 富媒体（必须 Activity 包裹）
│   └── sandbox/               # 隔离沙箱（Meilisearch 等）
│
└── lib/
    ├── api/
    │   ├── generated/         # Orval 自动生成（严禁手改）
    │   └── mutator.ts         # RSC 认证 Cookie 桥接
    ├── store/
    │   └── ui-store.ts        # Zustand 仅存 UI 状态
    └── utils/
```

## 数据获取规范

| 调用方 | 方式 | 说明 |
|--------|------|------|
| Server Components | `customFetch()` | 直连后端，自动带 Cookie |
| Client Components | `/api/v1/*` Route Handler | 走 BFF 代理 |

### Server Component 获取

```typescript
// lib/api/mutator.ts
import { cookies } from 'next/headers'

export async function customFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isServer = typeof window === 'undefined'
  const headers = new Headers(options.headers)

  if (isServer) {
    const cookieStore = await cookies()
    const session = cookieStore.get('auth_session')
    if (session) {
      headers.set('Cookie', `auth_session=${session.value}`)
    }
  } else {
    options.credentials = 'include'
  }

  const res = await fetch(`${baseUrl}${url}`, { ...options, headers })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.text()}`)
  return res.json()
}
```

## 认证流程

```
登录流程:
1. 用户提交凭据 → Next.js Route Handler
2. Handler 调后端验证
3. 后端颁发 HttpOnly Cookie（含 session_id）
4. 后续请求浏览器自动携带 Cookie
5. mutator.ts 读取 Cookie 传给后端验证
```

**严禁**：不要在 localStorage 存 JWT（XSS 风险）。

## 状态管理职责

| Store | 存什么 | 存哪里 | 原因 |
|-------|--------|--------|------|
| ui-store | theme, sidebar, modal | Zustand | 纯 UI，无敏感数据 |
| ~~auth-store~~ | ~~token~~ | ~~localStorage~~ | **禁止!** XSS 风险 |
| ~~blog-store~~ | ~~posts~~ | ~~localStorage~~ | **禁止!** 用 use cache |

## 搜索降级策略

```typescript
// 默认: PG FTS，无需加载额外 JS
import { searchPosts } from '@/lib/api/generated'

// 按需: 用户触发后才加载 Meilisearch
const MeiliSearchSandbox = dynamic(
  () => import('@/components/sandbox/MeiliSearchSandbox'),
  { ssr: false }
)
```

## 富媒体组件规范

化学/乐谱等 GPU 密集型组件必须用 `<Activity>` 包裹：

```tsx
<Activity mode={isActive ? 'visible' : 'hidden'}>
  <div ref={containerRef}>
    {snapshot && <img src={snapshot} alt="fallback" />}
  </div>
</Activity>
```

- 隐藏时保存 Canvas 快照并暂停渲染循环
- 恢复时继续渲染，从快照无缝过渡
- `prefers-reduced-motion`：关闭所有 WebGL 和动画

## CSS 变量系统（收敛后）

```
Layer 0: geist-tokens.css          → 原始值，无依赖
Layer 1: tailwind.css              → 别名到 geist + 共享语义
Layer 2: article-theme.css (NEW)   → 统一的文章设计系统（--article-*）
Layer 3: admin-theme.css           → Admin 专用（--admin-*）
```

## 布局收敛（已决定）

- **唯一布局**：`PostLayoutMonograph` — 黄金比例双栏、sticky TOC、进度条
- `PostSimple`、`PostBanner`、`PostLayout` 已废弃
- 布局文件约定统一组件：`TagList`、`PostNavigation`、`ReadingProgressBar`、`TableOfContents`
