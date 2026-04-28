# 首页设计

> 当前主页基于 `visitor-theme` 系统，使用 `Main.tsx` 渲染。沉浸式 6-section 重设计（Three.js 粒子 + BentoGrid + ProjectGallery + MusicExperience + LatestWriting + MegaFooter）为**规划中**的改造，组件已存在于 `src/components/home/` 但**未接入活跃路由**。

## 页面结构（当前活跃）

当前首页由 Main.tsx 渲染 7 个区域：

```
1. Hero Section           — 大标题 + 副标题 + CTA 按钮（"View GitHub" / "Read Blog"）
2. Social Card            — 堆叠社交媒体卡片（悬停展开动画）
3. HeroCard               — 视差效果头像卡片 + 装饰 SVG
4. Explore                — 探索区域
5. Featured Work          — 特色作品展示
6. Blog Section           — 最新文章列表
7. Newsletter Signup      — 新闻订阅
```

## Section 1: Hero Section

### 视觉

- **背景**：纯色背景，无 WebGL 粒子（Three.js 粒子为**规划中**重设计内容）
- 背景色 CSS 变量：`--visitor-bg-primary: #ffffff;`（暗色：`--visitor-dark-bg-primary: #0f0f1a;`），对应十六进制 `#05080F` 深色基调

### 字体

- 主标题：`"Zhengbi's Blog"`，字号 `text-5xl sm:text-6xl md:text-7xl xl:text-8xl`
- 副标题："探索技术、设计与艺术的交汇点"
- 衬线字体（`font-visitor-serif`）
- 入场动画：**Framer Motion** `initial={{ opacity: 0, y: 30 }}` → `animate={{ opacity: 1, y: 0 }}`（AnimatedHeading），easing `cubic-bezier(0.16, 1, 0.3, 1)`
- 副标题同样使用 Framer Motion 淡入（AnimatedParagraph）
- 标题逐字动画通过 `AnimatedText` 组件实现（Framer Motion staggerChildren 逐字模糊→清晰）

### CTA 按钮

- "View GitHub"（indigo-600 primary 按钮）
- "Read Blog"（灰色 secondary 按钮）
- 使用 CSS 变量 `--ease-visitor: cubic-bezier(0.16, 1, 0.3, 1)` 过渡

## Section 2: Social Card

### SocialCard 组件

- 社交媒体图标卡片（72x72px 圆角卡片）
- 桌面端：卡片堆叠排列，translateX + rotate 偏移，悬停时展开成网格
- 移动端（< 768px）：flex-wrap 正常排列
- 展开动画使用 `cubic-bezier(0.34, 1.2, 0.64, 1)`，带逐项延迟
- 使用 `--radius-panel`、`--surface-elevated`、`--border-subtle` 等 CSS 变量样式

## Section 3: HeroCard

### HeroCard 组件

- 视差效果头像卡片（Astro 项目风格）
- 三层视差：WebCase 层（strength: 25）、ColorPicker 层（strength: 40）、Color 层（strength: 50）
- 通过 `requestAnimationFrame` 实现平滑动画，缓动因子 0.08
- 自定义光标指示器（箭头图标），缓动因子 0.12
- 装饰 SVG：取色器 + 渐变色条
- 四个角落的装饰小方块
- 移动端（< 768px）禁用视差和自定义光标

## Section 4: Explore

### Explore 组件

- 探索区域，展示分类入口
- 标题 "Explore"

## Section 5: Featured Work

### Featured Work 组件

- 展示特色作品，最多 5 项
- 标题 "Featured Work"，描述文案

## Section 6: Blog Section

### BlogSection 组件

- 最新文章列表，最多 3 篇
- 标题 "Latest Articles"，描述 "These are my notes and articles on design, development and life thinking."
- "View All" 按钮

## Section 7: Newsletter

### NewsletterSignup 组件

- 新闻邮件订阅区域
- max-width 4xl 居中布局

## 全局样式

### 主题系统 — CSS 变量

主页使用 visitor-theme CSS 变量系统，非 Glassmorphism：

```css
/* 卡片 */
--surface-elevated: rgba(255, 255, 255, 0.9);
--border-subtle: rgba(15, 23, 42, 0.08);
/* 暗色 */
--visitor-dark-bg-primary: #0f0f1a;
```

### 滚动动画

- **Framer Motion `whileInView`**（非 GSAP ScrollTrigger）
- 标题：`initial={{ opacity: 0, y: 30 }}`，duration: 1s
- 内容：`initial={{ opacity: 0, y: 20 }}`，duration: 0.8s
- 过渡缓动：`cubic-bezier(0.16, 1, 0.3, 1)` (expo-out)

### 自定义鼠标指针

- 仅在 HeroCard 图片区域悬停时触发的自定义光标（箭头图标 + 外圈指示器）
- 非全站全局自定义指针

## 性能目标

| 指标 | 目标 |
|------|------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Performance | > 85 |
| Animation FPS | >= 60fps |

## 可访问性

- `prefers-reduced-motion`：禁用视差和 3D 效果
- WCAG 2.2 AA 对比度
- 键盘导航：所有焦点元素有明确 focus ring
- 语义 HTML：`<section>`、`<article>`、`<nav>`、`aria-label`

---

## 规划中的沉浸式重设计（未接入）

以下内容来自 `superpowers/specs/2026-04-03-immersive-homepage-redesign.md`，组件代码已存在于 `src/components/home/`（BentoGrid、ProjectGallery、MusicExperience、LatestWriting、MegaFooter）但**未接入活跃路由**，待后续启用。

### 页面结构

```
1. Immersive Hero          — 全屏 Three.js 粒子 + 双语标题（规划中）
2. Bento Grid Content Hub  — 模块化网格展示最新内容（规划中）
3. Projects Gallery        — 横向滚动项目展示（规划中）
4. Music Experience        — 音频响应乐谱可视化（规划中）
5. Latest Writing          — 编辑风格文章列表（规划中）
6. Mega Footer             — 全屏 CTA 页脚（规划中）
```

### 说明

- 各组件依赖 Three.js WebGL 粒子、Web Audio API AnalyserNode（实时频谱）、OSMD 矢量乐谱等重型功能
- 接入前需完成路由整合、移动端适配和性能基准测试
- 当前主页推荐在 visitor-theme 上迭代，待体验完善后再切换
