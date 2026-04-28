# 首页设计

> 当前首页采用 **访客主题 (Visitor Theme)**，基于实际代码库 `frontend/src/app/Main.tsx` 实现。

## 页面结构

首页由以下 section 组成（从上到下）：

```text
1. Hero Section              — 动画标题 + CTA 按钮（GitHub / Read Blog）
2. SocialCard                — 社交媒体链接
3. HeroCard                  — 英雄卡片（多层视差效果）
4. Explore                   — 探索区域
5. Featured Work             — 特色作品展示
6. BlogSection               — 最新文章（Latest Articles）
7. NewsletterSignup          — 邮件订阅
```

## Section 1: Hero Section

### 视觉

- **标题**：`clamp(3rem, 8vw, 8rem)`，衬线字体（font-visitor-serif）
- **副标题**：双语（"探索技术、设计与艺术的交汇点"）
- **文字动画**：使用 `AnimatedHeading` / `AnimatedParagraph`（Framer Motion，字符逐个揭示）
- 两个 CTA 按钮："View GitHub"（品牌色）和 "Read Blog"（中性色）

### 动画

- `AnimatedHeading` 延迟 0ms，`AnimatedParagraph` 延迟 300ms
- 使用 Framer Motion `whileInView` 触发，非 GSAP ScrollTrigger
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-visitor)

## Section 2: SocialCard

| 属性 | 值 |
|------|-----|
| 显示社交 ID | 1-7 |
| 布局 | `max-w-2xl` 居中 |

## Section 3: HeroCard

### 视差效果

- 鼠标驱动多层视差（easing: 0.08）
- 三层：WebCase (strength: 25), ColorPicker (strength: 40), Color (strength: 50)
- 移动端（< 768px）禁用视差

### 自定义光标

- ⚠️ HeroCard 中包含自定义光标逻辑
- 全局自定义鼠标指针**尚未实现**（仅 HeroCard 内部试验性支持）
- 全局范围无自定义光标效果

## Section 4: Explore

| 属性 | 值 |
|------|-----|
| 标题 | "Explore" |
| 数据 | 从 API 获取 |

## Section 5: Featured Work

| 属性 | 值 |
|------|-----|
| 标题 | "Featured Work" |
| 描述 | "I create innovative and purposeful designs..." |
| 限制 | 5 个项目 |

## Section 6: BlogSection (Latest Articles)

| 属性 | 值 |
|------|-----|
| 标题 | "Latest Articles" |
| 描述 | "These are my notes and articles on design, development and life thinking." |
| 数据 | 通过 `usePosts` hook 从 API 获取，按 published_at 降序，显示 3 篇 |

### 数据流

```typescript
usePosts({ status: 'Published', sort_by: 'published_at', sort_order: 'desc', limit: 6, page: 1 })
→ postsData.posts.map(toBlogLikePost)
→ 传入 BlogSection
```

## Section 7: NewsletterSignup

| 属性 | 值 |
|------|-----|
| 布局 | `max-w-4xl` |

## 关于 HeroSection.tsx

- `home/HeroSection.tsx`（Three.js 粒子沉浸英雄区）**已实现但不在首页使用**
- 该组件用于其他页面，首页使用轻量 `HeroCard` + 文字动画代替

## 全局交互

### 滚动动画

- Framer Motion `whileInView` 驱动（非 GSAP ScrollTrigger）
- 各 section 进入视口时触发淡入/滑入
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`

### 自定义鼠标指针

- **未实现**（全局范围）。HeroCard 内部有实验性自定义光标，但不影响全局。

### 主题

- 首页通过 `import '@/styles/visitor-theme.css'` 加载访客主题
- 支持 Light/Dark 模式

## 性能目标

| 指标 | 目标 |
|------|------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Performance | > 85 |

## 可访问性

- `prefers-reduced-motion`：支持减少动画
- 键盘导航
- 语义 HTML
