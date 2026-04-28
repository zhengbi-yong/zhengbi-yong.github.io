# 首页沉浸式体验设计

> **来源**：superpowers/specs/2026-04-03-immersive-homepage-redesign.md
>
> **⚠️ 重要提示：本文档描述的是沉浸式首页的旧版/愿景设计，与实际首页实现存在显著差异。**
>
> 实际首页（`frontend/src/app/Main.tsx`）使用的组件：
> - `AnimatedHeading`, `AnimatedParagraph`（来自 `visitor/typography/`）
> - `SocialCard`（来自 `home/SocialCard.tsx`）
> - `HeroCard`（来自 `home/HeroCard.tsx`）
> - `Explore`, `FeaturedWork`, `BlogSection`（来自 `sections/`）
> - `NewsletterSignup`
>
> 以下文档内容为**旧版愿景/未采纳的设计方案**，仅供参考，不反映当前代码状态。

## 页面结构

首页由 6 个 section 组成，构成叙事弧线（⚠️ 以下为旧版设计，未实施）：

```
1. Immersive Hero          — 全屏 WebGL 粒子 + 双语标题
2. Bento Grid Content Hub  — 模块化网格展示最新内容
3. Projects Gallery        — 横向滚动项目展示
4. Music Experience        — 音频响应乐谱可视化
5. Latest Writing          — 编辑风格文章列表
6. Mega Footer             — 全屏 CTA 页脚
```

## Section 1: Immersive Hero

### 视觉

- **背景**：Three.js 流体粒子云（桌面 2000-3000，移动端 500）
- 粒子模拟有机波/数据流运动，颜色在靛蓝/紫/琥珀间渐变的
- 自定义顶点着色器控制粒子位置（噪声位移）
- 自定义片元着色器控制粒子大小和颜色（软圆形衰减）

### 字体

- 主标题：`clamp(3rem, 8vw, 8rem)`，衬线字体（Newsreader/Playfair Display）
- 副标题：双语（英文 + 中文）
- 文字使用 `mix-blend-mode: difference` 确保在粒子上可读
- 入场动画：GSAP SplitText，逐字淡入+模糊→清晰

### 性能

- Three.js `Points` + `ShaderMaterial` GPU 加速渲染
- `IntersectionObserver` 暂停不可见区域的 WebGL
- 移动端粒子减少到 500
- `prefers-reduced-motion`：替换为静态渐变背景

## Section 2: Bento Grid Content Hub

### 布局

CSS Grid: 桌面 4 列、平板 2 列、移动端 1 列

| 模块 | Grid 跨距 | 内容 |
|------|-----------|------|
| Featured Post | 2x2 | 最新/置顶文章 + 封面图 |
| Recent Post 1 | 1x2 | 第二新文章 |
| Recent Post 2 | 1x2 | 第三新文章 |
| Featured Project | 2x1 | 特色项目 + 循环视频 |
| Music Preview | 2x1 | SVG 乐谱 + 播放图标 |

### 视觉风格 — Glassmorphism 2.0

```css
background: rgba(255,255,255,0.03);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 24px;
gap: 16px;
transition: cubic-bezier(0.16, 1, 0.3, 1);
```

## Section 3: Projects Gallery

- 横向滚动画廊：CSS `scroll-snap-type: x mandatory`
- 卡片 4:5 宽高比，上半部封面图/视频，下半部信息
- 拖拽滚动（Framer Motion gesture）
- 3D 倾斜 Hover 效果

## Section 4: Music Experience

- 左右分屏：左 60% OSMD 矢量乐谱 + 右 40% 曲目信息+控制
- Three.js 粒子系统作为背景层（音频响应）
- Web Audio API `AnalyserNode` 提取实时频谱
- 同步播放光标在乐谱上流动

## Section 5: Latest Writing

- 编辑风格布局：左 60% 特色卡片 + 右 40% 两个列表卡片
- 衬线字体标题，慷慨留白
- Hover 效果：行向右移动 8px

## Section 6: Mega Footer

- 全屏 `100vh`，深色背景 `#050505`
- 巨幅声明文字："LET'S CREATE SOMETHING TOGETHER"
- 导航链接 + 社交链接 + 版权信息

## 全局交互

### 自定义鼠标指针

- 默认：小点 + 外圈
- 文章卡片：读书图标
- 项目卡片：箭头图标
- 音乐区：音符图标
- 可点击元素：指针圈放大

### 滚动动画

- GSAP ScrollTrigger 驱动
- 分阶段动效：标题先入（0ms）→ 内容（+100-200ms）
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out)
- 每个 Section 从下方淡入滑动

## 性能目标

> ⚠️ 以下性能目标为旧版设计的**愿景指标**，当前首页未进行系统性的性能追踪。仅供参考。

| 指标 | 目标 |
|------|------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Performance | > 85 |
| Animation FPS | >= 60fps |

## 可访问性

- `prefers-reduced-motion`：禁用所有 WebGL、视差、3D 效果
- WCAG 2.2 AA 对比度
- 键盘导航：所有焦点元素有明确 focus ring
- 语义 HTML：`<section>`、`<article>`、`<nav>`、`aria-label`
