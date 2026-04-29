# 首页沉浸式体验设计

> 来源：superpowers/specs/2026-04-03-immersive-homepage-redesign.md（部分已实施）

## 当前实现

首页使用简洁的单页设计，由 7 个 section 组成（Main.tsx）：

```
1. Hero Section         — 双语标题 + 简介 + CTA 按钮
2. SocialCard           — 社交媒体链接展示
3. HeroCard             — 个人头像 + 标语
4. Explore Section      — 探索导航区域
5. FeaturedWork Section — 精选项目展示
6. BlogSection          — 最新文章列表（从 API 获取）
7. NewsletterSignup     — 邮件订阅
```

### Section 1: Hero Section

> **注意**：`frontend/src/components/home/HeroSection.tsx` 是一个基于 Three.js 粒子系统的沉浸式英雄区组件，已实现但未接入当前活跃首页。当前活跃首页（`Main.tsx`）使用以下内联英雄区标记。

#### 视觉

- 居中布局，`min-h-[80vh]` 全屏高度
- 纯 CSS 背景，无 Three.js/WebGL 粒子
- 文字使用 AnimatedHeading + AnimatedParagraph 组件实现入场动画

#### 内容

- 主标题：`Zhengbi's Blog`，衬线字体 (font-visitor-serif)，`text-5xl` 至 `text-8xl`
- 副标题：`探索技术、设计与艺术的交汇点`，浅色文字
- 两个 CTA 按钮：
  - **View GitHub** — 靛蓝色主按钮，指向 GitHub 链接
  - **Read Blog** — 灰色次按钮，指向 `/blog`

### Section 2: SocialCard

- 居中窄栏（`max-w-2xl`）
- 显示 7 个社交媒体图标（通过 `displaySocialIds` 控制）
- 无玻璃拟态效果，使用默认卡片样式

### Section 3: HeroCard

- 居中宽栏（`max-w-6xl`）
- 显示 `/avatar.png` 头像
- 标语：`Robotics & Multimodal Perception`
- 点击跳转到 `/blog`

### Section 4: Explore

- 使用 `Explore` 组件
- 标题：`Explore`
- 导航枢纽区域

### Section 5: FeaturedWork

- 使用 `FeaturedWork` 组件
- 标题：`Featured Work`
- 描述：`I create innovative and purposeful designs...`
- 最多显示 5 个项目

### Section 6: BlogSection

- 从后端 API 获取已发布的文章（按发布时间降序，最多 6 篇）
- 标题：`Latest Articles`
- 描述：`These are my notes and articles on design, development and life thinking.`
- 显示最新 3 篇文章
- 包含"查看全部"按钮

### Section 7: NewsletterSignup

- 居中窄栏（`max-w-4xl`）
- 邮件订阅表单

### 全局样式

- 使用 `visitor-theme.css` 主题
- 响应式间距：`px-4 sm:px-6 lg:px-8 2xl:px-10`
- 深色模式支持（`dark:` 类）

## 未来规划

> 以下设计组件部分已实现（位于 `frontend/src/components/home/`），Mega Footer 已集成在 `(public)/layout.tsx` 中并在首页路径显示。其余组件尚未接入首页（`Main.tsx`）。

### 计划结构

```
1. Immersive Hero          — 全屏 WebGL 粒子 + 双语标题
2. Bento Grid Content Hub  — 模块化网格展示最新内容
3. Projects Gallery        — 横向滚动项目展示
4. Music Experience        — 音频响应乐谱可视化
5. Latest Writing          — 编辑风格文章列表
6. Mega Footer             — 全屏 CTA 页脚
```

### Section 1: Immersive Hero

#### 视觉

- **背景**：Three.js 流体粒子云（桌面 2000-3000，移动端 500）
- 粒子模拟有机波/数据流运动，颜色在靛蓝/紫/琥珀间渐变的
- 自定义顶点着色器控制粒子位置（噪声位移）
- 自定义片元着色器控制粒子大小和颜色（软圆形衰减）

#### 字体

- 主标题：`clamp(3rem, 8vw, 8rem)`，衬线字体（Newsreader/Playfair Display）
- 副标题：双语（英文 + 中文）
- 文字使用 `mix-blend-mode: difference` 确保在粒子上可读
- 入场动画：GSAP SplitText，逐字淡入+模糊→清晰

#### 性能

- Three.js `Points` + `ShaderMaterial` GPU 加速渲染
- `IntersectionObserver` 暂停不可见区域的 WebGL
- 移动端粒子减少到 500
- `prefers-reduced-motion`：替换为静态渐变背景

### Section 2: Bento Grid Content Hub

#### 布局

CSS Grid: 桌面 4 列、平板 2 列、移动端 1 列

| 模块 | Grid 跨距 | 内容 |
|------|-----------|------|
| Featured Post | 2x2 | 最新/置顶文章 + 封面图 |
| Recent Post 1 | 1x2 | 第二新文章 |
| Recent Post 2 | 1x2 | 第三新文章 |
| Featured Project | 2x1 | 特色项目 + 循环视频 |
| Music Preview | 2x1 | SVG 乐谱 + 播放图标 |

#### 视觉风格 — Glassmorphism 2.0

```css
background: rgba(255,255,255,0.03);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 24px;
gap: 16px;
transition: cubic-bezier(0.16, 1, 0.3, 1);
```

### Section 3: Projects Gallery

- 横向滚动画廊：CSS `scroll-snap-type: x mandatory`
- 卡片 4:5 宽高比，上半部封面图/视频，下半部信息
- 拖拽滚动（Framer Motion gesture）
- 3D 倾斜 Hover 效果

### Section 4: Music Experience

- 左右分屏：左 60% OSMD 矢量乐谱 + 右 40% 曲目信息+控制
- Three.js 粒子系统作为背景层（音频响应）
- Web Audio API `AnalyserNode` 提取实时频谱
- 同步播放光标在乐谱上流动

### Section 5: Latest Writing

- 编辑风格布局：左 60% 特色卡片 + 右 40% 两个列表卡片
- 衬线字体标题，慷慨留白
- Hover 效果：行向右移动 8px

### Section 6: Mega Footer

- 全屏 `100vh`，深色背景 `#050505`
- 巨幅声明文字："LET'S CREATE SOMETHING TOGETHER"
- 导航链接 + 社交链接 + 版权信息

### 全局交互

#### 自定义鼠标指针（已实现但未接入活跃首页）

- 默认：小点 + 外圈
- 文章卡片：读书图标
- 项目卡片：箭头图标
- 音乐区：音符图标
- 可点击元素：指针圈放大

#### 滚动动画

- GSAP ScrollTrigger 驱动（未实现 — 当前使用 Framer Motion whileInView）
- 分阶段动效：标题先入（0ms）→ 内容（+100-200ms）
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out)
- 每个 Section 从下方淡入滑动

### 性能目标

| 指标 | 目标 |
|------|------|
| First Contentful Paint | < 1.5s（目标值，尚未验证） |
| Time to Interactive | < 3s（目标值，尚未验证） |
| Lighthouse Performance | > 85（目标值，尚未验证） |
| Animation FPS | >= 60fps（目标值，尚未验证） |

### 可访问性

- `prefers-reduced-motion`：禁用所有 WebGL、视差、3D 效果
- WCAG 2.2 AA 对比度
- 键盘导航：所有焦点元素有明确 focus ring
- 语义 HTML：`<section>`、`<article>`、`<nav>`、`aria-label`
