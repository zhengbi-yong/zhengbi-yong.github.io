# 首页设计

> 来源：`frontend/src/app/Main.tsx`（实际首页实现）

## 页面结构

实际首页由 7 个 section 组成：

```text
1. AnimatedHeading + AnimatedParagraph   — 英雄区域（带 Framer Motion 入场动画）
2. SocialCard                            — 社交媒体卡片
3. HeroCard                              — 英雄卡片（头像 + 标语）
4. Explore                               — 探索分区
5. FeaturedWork                          — 特色作品展示
6. BlogSection                           — 最新文章列表
7. NewsletterSignup                      — 新闻通讯订阅
```

## Section 1: Hero 英雄区域 (AnimatedHeading)

### 视觉

- **布局**：`min-h-[80vh] flex flex-col justify-center`，居中排版
- **标题**：使用 `<AnimatedHeading>` 组件（Framer Motion 动画），文字 "Zhengbi's Blog"，类名 `font-visitor-serif text-5xl sm:text-6xl md:text-7xl xl:text-8xl`
- **副标题**：使用 `<AnimatedParagraph>` 组件，中文副标题 "探索技术、设计与艺术的交汇点"，类名 `text-visitor-lg max-w-4xl`
- **CTA 按钮**：两个按钮 — "View GitHub"（indigo-600 品牌色，shadow-visitor-glow）和 "Read Blog"（灰色，链接到 /blog）
- **入场动画**：Framer Motion 驱动，标题 `delay={0}`，段落 `delay={0.3}`

### 实现

```tsx
<AnimatedHeading level={1} delay={0} className="font-visitor-serif mb-8 text-5xl sm:text-6xl md:text-7xl xl:text-8xl">
  Zhengbi's Blog
</AnimatedHeading>

<AnimatedParagraph delay={0.3} className="text-visitor-lg mx-auto mb-12 max-w-4xl text-gray-600 dark:text-gray-400">
  探索技术、设计与艺术的交汇点
</AnimatedParagraph>
```

## Section 2: SocialCard

### 布局

- 容器：`max-w-2xl mx-auto`，居中窄列
- 显示社交 ID `[1, 2, 3, 4, 5, 6, 7]`
- 跟随访客主题样式

## Section 3: HeroCard

### 视觉

- 容器：`max-w-6xl mx-auto`
- 展示头像 (`/avatar.png`) + 标题 "Robotics & Multimodal Perception"
- 链接到 `/blog`

## Section 4: Explore

- 使用 `sections/Explore` 组件
- 标题："Explore"
- 包含探索分类/标签网格

## Section 5: FeaturedWork

- 使用 `sections/FeaturedWork` 组件
- 标题："Featured Work"
- 描述："I create innovative and purposeful designs that not only capture attention but also drive meaningful results."
- 默认显示 5 项

## Section 6: BlogSection

- 使用 `sections/BlogSection` 组件
- 标题："Latest Articles"
- 描述："These are my notes and articles on design, development and life thinking."
- 获取最新 6 篇文章（API 调用 `usePosts({ status: 'Published', sort_by: 'published_at', limit: 6 })`），显示 3 篇
- 显示 "View All" 按钮

## Section 7: NewsletterSignup

- 容器：`max-w-4xl mx-auto`
- 新闻通讯订阅表单

## 数据获取

```tsx
const { data: postsData } = usePosts({
  status: 'Published',
  sort_by: 'published_at',
  sort_order: 'desc',
  limit: 6,
  page: 1,
})
const posts = useMemo(() => {
  return (postsData?.posts || []).map(toBlogLikePost)
}, [postsData?.posts])
```

- 通过 `usePosts` hook（React Query）从 API 获取文章
- 通过 `toBlogLikePost` adapter 转换数据格式
- 支持加载态/空态/错误态由 React Query 自动处理

## 组件状态（未使用但已存在）

以下组件位于 `components/home/` 目录中，**已创建但尚未集成到实际首页**：

| 组件 | 用途 | 详细信息 | 状态 |
|------|------|----------|------|
| `home/HeroSection.tsx` | Three.js 粒子沉浸英雄区 | — | 🔄 未集成 |
| `home/BentoGrid.tsx` | 首页 Bento 网格 | — | 🔄 未集成 |
| `home/ProjectGallery.tsx` | 项目展示（横向滚动） | — | 🔄 未集成 |
| `home/MusicExperience.tsx` | 音乐体验区 | — | 🔄 未集成 |
| `home/LatestWriting.tsx` | 最新文章 | — | 🔄 未集成 |
| `home/MegaFooter.tsx` | 全屏 CTA 页脚 | 中文标题「远离颠倒梦想，究竟涅槃」，暗色背景 `bg-[#05080F]`，Framer Motion 滚动入场 | 🔄 未集成 |
| `home/CustomCursor.tsx` | 自定义光标 | 跟随鼠标的自定义指针效果 | 🔄 未集成 |

## 全局交互

### 动画

- **Framer Motion** 是主要的动画库（非 GSAP）
- AnimatedHeading/AnimatedParagraph 组件使用 Framer Motion 入场动画
- 滚动发现动画由 Framer Motion `useInView` 或自定义实现

### 主题与变量

- 使用 `visitor-theme.css` 中定义的 CSS 变量
- 字体家族：`--font-visitor-serif`（Newsreader）、`--font-sans`（Inter）
- 字号使用 `text-visitor-lg` 等 visitor 主题 token
- 间距使用 `py-visitor-xl`、`py-visitor-md` 等 visitor 主题 spacing token
- 圆角使用 `rounded-visitor-md`
- 阴影使用 `shadow-visitor-soft`、`shadow-visitor-glow`

## 响应式

- 移动端：`px-4` 间距，标题 `text-5xl`
- 平板（sm）：`px-6`，标题 `text-6xl`
- 桌面（md/lg）：`px-8`，标题 `text-7xl` / `text-8xl`
- 大屏（2xl）：`px-10`
- CTA 按钮在移动端纵向排列（`flex-col`），桌面端横向（`sm:flex-row`）

## 可访问性

- 语义 HTML：`<section>` 标签
- 焦点样式：按钮有 `focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`
- 链接有 `rel="noreferrer"`（外部链接）
