# 首页设计（当前实现）

> 当前首页基于 **visitor-theme** 框架构建，采用简洁、内容中心的访问者导向布局。
> 以下 BentoGrid / ProjectGallery / MusicExperience / LatestWriting 组件存在于代码库中但**未在 Main.tsx 中使用**，可作为未来的增强方向。

## 页面结构

首页由 7 个明确的 section 组成，所有内容包裹在 `.visitor-content` 容器内：

```
1. Hero Section           — AnimatedHeading + AnimatedParagraph + 双按钮 CTA
2. Social Section         — SocialCard 展示社交媒体链接
3. About Section          — HeroCard（头像 + 介绍 + 链接）
4. Explore Section        — Explore 导航组件
5. Featured Work Section  — FeaturedWork 项目展示
6. Blog Section           — BlogSection 最新文章列表
7. Newsletter Section     — NewsletterSignup 邮件订阅
```

页面底部通过 `(public)/layout.tsx` 的路由判断自动切换到 **MegaFooter**（首页路径 `'/'` 使用 MegaFooter，其他页面使用标准 Footer）。

## Section 1: Hero Section

### 布局

- 全宽居中，`min-h-[80vh]` 垂直居中
- 最大内容宽度 `max-w-7xl`，文字居中

### 内容

- **AnimatedHeading** (`level={1}`): 使用 `font-visitor-serif` 字体，`text-5xl` 至 `xl:text-8xl` 响应式大小
  - 标题文本: "Zhengbi's Blog"
  - 从 `@/components/visitor` 导入
- **AnimatedParagraph**: 副标题说明文字
  - 使用 `text-visitor-lg` 字体大小，`max-w-4xl` 宽度限制
  - 文本: "探索技术、设计与艺术的交汇点"
  - `delay={0.3}` 延迟入场动画
- **双按钮 CTA**:
  - 主按钮: "View GitHub" — 品牌色 `bg-indigo-600`，链接到 `siteMetadata.github`
  - 副按钮: "Read Blog" — 灰色背景，链接到 `/blog`
  - `shadow-visitor-soft` / `shadow-visitor-glow` 阴影效果
  - `ease-visitor` 过渡曲线 (`cubic-bezier(0.16, 1, 0.3, 1)`)

### 视觉效果

- 无 Three.js 粒子背景（当前为纯色/渐变背景，由 `visitor-theme.css` 定义）
- 无 WebGL 渲染
- 动画通过 AnimatedHeading / AnimatedParagraph 组件实现（GSAP/Framer Motion）

## Section 2: Social Section

### 布局

- 居中，`max-w-2xl` 宽度
- `py-visitor-md` 上下间距

### 组件

- **SocialCard**: 展示社交媒体图标链接
  - `displaySocialIds={[1, 2, 3, 4, 5, 6, 7]}`
  - 从 `@/components/home/SocialCard` 导入

## Section 3: About Section

### 布局

- 居中，`max-w-6xl` 宽度
- `py-visitor-lg` 上下间距

### 组件

- **HeroCard**: 个人介绍卡片
  - `imageUrl="/avatar.png"` — 头像
  - `title="Robotics & Multimodal Perception"` — 标题
  - `link="/blog"` — 链接
  - 从 `@/components/home/HeroCard` 导入

## Section 4: Explore Section

### 组件

- **Explore** 导航组件，标题 "Explore"
  - 从 `@/components/sections/Explore` 导入
  - 使用 `visitor-section` class

## Section 5: Featured Work Section

### 组件

- **FeaturedWork**: 精选项目展示
  - `title="Featured Work"`
  - `description="I create innovative and purposeful designs..."`
  - `limit={5}` 展示项目数量
  - 从 `@/components/sections/FeaturedWork` 导入
  - 使用 `visitor-section` class

## Section 6: Blog Section

### 数据流

- 通过 `usePosts` hook 从 API 获取已发布的文章
  - `status: 'Published'`, `sort_by: 'published_at'`, `sort_order: 'desc'`
  - `limit: 6`, `page: 1`
- 使用 `toBlogLikePost` adapter 转换数据格式
- `posts` 通过 `useMemo` 缓存

### 组件

- **BlogSection**: 最新文章列表
  - `title="Latest Articles"`
  - `description="These are my notes and articles on design, development and life thinking."`
  - `posts={posts}` — 从 API 获取的文章数据
  - `showViewAllButton={true}` — 显示"查看全部"按钮
  - `limit={3}` — 展示 3 篇文章
  - 从 `@/components/sections/BlogSection` 导入

## Section 7: Newsletter Section

### 布局

- `pb-visitor-xl` 底部大间距
- `max-w-4xl` 宽度居中

### 组件

- **NewsletterSignup**: 邮件订阅表单
  - 从 `@/components/NewsletterSignup` 导入

## 样式系统

### 容器 (visitor-content)

```css
.visitor-content {
  padding: 0 1rem;          /* mobile: px-4 */
  @media sm: padding 0 1.5rem;  /* sm:px-6 */
  @media lg: padding 0 2rem;    /* lg:px-8 */
  @media 2xl: padding 0 2.5rem; /* 2xl:px-10 */
}
```

### 间距系统（Tailwind 自定义 spacing）

| Token | 值 | 用途 |
|-------|-----|------|
| `py-visitor-sm` | 2rem (32px) | 小间距 |
| `py-visitor-md` | 3rem (48px) | 社交区 |
| `py-visitor-lg` | 5rem (80px) | 内容区 |
| `py-visitor-xl` | 8rem (128px) | 底部大间距 |

### 字体系统

| 家族 | 字体栈 |
|------|--------|
| `font-visitor-serif` | `'Playfair Display', 'Georgia', 'Times New Roman', serif` |
| `font-visitor-sans` | `'Inter', 'system-ui', '-apple-system', sans-serif` |
| `font-visitor-mono` | `'JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'` |

### 动画与过渡

- `ease-visitor`: `cubic-bezier(0.16, 1, 0.3, 1)`
- `ease-visitor-out`: `cubic-bezier(0.33, 1, 0.68, 1)`
- `ease-visitor-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)`

### 圆角

| Token | 值 |
|-------|-----|
| `rounded-visitor-sm` | 0.75rem |
| `rounded-visitor-md` | 1rem |
| `rounded-visitor-lg` | 1.5rem |
| `rounded-visitor-xl` | 2rem |

### 阴影

| Token | 值 |
|-------|-----|
| `shadow-visitor-soft` | `0 20px 40px rgba(26, 26, 46, 0.08)` |
| `shadow-visitor-medium` | `0 25px 50px rgba(26, 26, 46, 0.12)` |
| `shadow-visitor-strong` | `0 30px 60px rgba(26, 26, 46, 0.16)` |
| `shadow-visitor-glow` | `0 0 40px rgba(99, 102, 241, 0.15)` |

## 未来可集成组件（存在于代码库但当前未使用）

以下组件存在于 `@/components/home/` 但 **未在 Main.tsx 中导入**：

| 组件 | 文件 | 说明 |
|------|------|------|
| BentoGrid | `@/components/home/BentoGrid.tsx` | 模块化网格展示内容（CSS Grid 布局） |
| BentoCard | `@/components/home/BentoCard.tsx` | BentoGrid 的子卡片组件（当前为 stub） |
| ProjectGallery | `@/components/home/ProjectGallery.tsx` | 项目展示画廊 |
| MusicExperience | `@/components/home/MusicExperience.tsx` | 音频播放器体验 |
| LatestWriting | `@/components/home/LatestWriting.tsx` | 文章列表组件 |

## 性能目标

| 指标 | 目标 |
|------|------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Performance | > 85 |

## 可访问性

- 语义 HTML：`<section>` 包裹各区域
- 所有交互元素（链接、按钮）有 focus ring
- 颜色对比度满足标准
- 链接使用 `rel="noreferrer"` 安全属性
