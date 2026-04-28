# 博客阅读体验设计

> 来源：superpowers/specs/2026-03-29-art-level-blog-reading-design.md（已实施）

## 布局系统

### 黄金比例非对称双栏

```
Desktop (>= 1280px):
┌───────────────────────────────────────────────────────┐
│  Progress Bar (2px, fixed top, brand gradient)         │
├───────────────────────────────────────────────────────┤
│                    Article Hero                         │
├──────────────────────────────────┬────────────────────┤
│                                 │                     │
│    Main Content (62%)           │   TOC Sidebar (38%) │
│    max-width: none, w-full    │   max-width: 320px  │
│    全宽自适应                  │   position: sticky  │
│                                 │   scroll-spy active │
│                                 │                     │
├──────────────────────────────────┴────────────────────┤
│              Recommended Articles / Author Bio          │
└───────────────────────────────────────────────────────┘
```

Tablet (768-1279px)：内容全宽，TOC 折叠为浮动按钮
Mobile (< 768px)：单栏，TOC 为右下 FAB

### 当前实现

| 组件 | 状态 |
|------|------|
| PostLayoutMonograph | ✅ 唯一活跃布局 |
| PostSimple | ❌ 已废弃 |
| PostBanner | ❌ 已废弃 |
| PostLayout | ❌ 已废弃 |

### 布局网格约束

- 主内容区使用 `max-width: none` 和 `w-full` 实现全宽自适应
- 内容宽度由内层容器控制（而非外层布局网格）
- TOC 栏位：`position: sticky; top: 2rem`

### 双博客详情路由

实际代码中存在两套博客详情路由：

| 路由 | 文件 | 说明 |
|------|------|------|
| `app/blog/[...slug]/page.tsx` | `/blog/[...slug]/` | 主要博客详情路由 |
| `app/(public)/blog/[...slug]/` | `(public)/blog/[...slug]/` | 公开页面路由组中的博客详情 |

两套路由均指向 `DynamicPostPage.tsx` 组件，提供相同的阅读体验。这是 App Router 路由组（Route Group）的设计模式。

## 排版系统

### 字体栈

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
--font-body: 'Inter', system-ui, sans-serif;
/* 通过 next/font/google 加载: Inter, JetBrains Mono, Newsreader */
```

字体通过 `next/font/google` 加载：

```typescript
import { JetBrains_Mono, Inter, Newsreader } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const newsreader = Newsreader({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
})
```

> 注意：不再使用 PingFang SC、Noto Sans SC、Fira Code 等系统字体栈。使用 next/font/google 替代网络字体加载。

### 字号比例（Fibonacci-based）

| 元素 | 大小 | 行高 | 字间距 |
|------|------|------|--------|
| h1 | 2.25rem (36px) | 1.3 | -0.02em |
| h2 | 1.75rem (28px) | 1.35 | -0.01em |
| h3 | 1.375rem (22px) | 1.4 | 0 |
| h4 | 1.125rem (18px) | 1.45 | 0 |
| Body | 1rem (16px) | 1.75 (CJK) / 1.6 (Latin) | 0 |
| Small | 0.875rem (14px) | 1.5 | 0.01em |

### CJK 特殊处理

- 行高 1.75（vs Latin 1.6），中文字符无间距需更多呼吸空间
- 段落间距：CJK 使用 `1.5em`（vs Latin `1em`）
- 通过 CSS `:lang(zh)` 或 `.cjk-content` class 检测

## TOC 组件 (TableOfContents)

- `IntersectionObserver` API 实现 scroll-spy
- 当前活动 section 用品牌色左边框高亮
- 点击平滑滚动（`scroll-behavior: smooth`）
- 移动端折叠为浮动按钮+下拉
- 从 MonographTOC 借鉴 rect-based 精确算法、`aria-current="location"`
- 移动端断点：768px（TOC 主组件使用响应式检测：`window.innerWidth < 768` 判定移动端）

## 阅读进度条 (ReadingProgressBar)

- `position: fixed; top: 0; left: 0; z-index: 50;`
- 高度：2px，品牌渐变背景
- 宽度 = `scrollY / (scrollHeight - clientHeight)`
- `requestAnimationFrame` 节流实现 60fps

## 代码块

- App 风格卡片 + macOS 窗口装饰
- 红/黄/绿三色圆点 + 语言标签
- 复制按钮（点击→勾号→2s 返回）
- **代码块始终深色主题**，即使 light mode 也保持深色背景
- 在长文章中创建视觉锚点，减少阅读疲劳

## 表格

- 桌面：清水平线、交替行着色、header 底部边框
- 移动端（< 768px）：卡片折叠模式，`data-label` 注入表头文本

## 微交互动效

| 元素 | 触发器 | 动画 | 时长 |
|------|--------|------|------|
| 文章卡片 | hover | `translateY(-2px)` + 阴影扩展 | 200ms |
| TOC 指示器 | scroll | 左边框滑动到新位置 | 200ms |
| 进度条 | scroll | 宽度过渡（GPU） | 100ms |
| 复制按钮 | click | 图标切换 + 提示 | 150ms |
| 评论抽屉 | click | 右侧滑入 | 250ms |
| 暗色模式 | click | CSS 变量过渡 | 200ms |

所有动画使用 `will-change: transform` 和 `transform: translateZ(0)` 开启 GPU 合成。
