# 博客阅读体验设计

> 来源：superpowers/specs/2026-03-29-art-level-blog-reading-design.md（已实施）

## 布局系统

### 三栏非对称网格 (3-Column Asymmetric Grid)

```
Desktop (>= 1024px):
┌───────────────────────────────────────────────────────┐
│  Progress Bar (3px, fixed top, solid accent color)     │
├───────────────────────────────────────────────────────┤
│                    Article Hero                         │
├──────────────────────────┬─────┬──────────────────────┤
│                          │ 40px│  TOC Sidebar (220px)  │
│    Main Content (1fr)    │ gap │  position: sticky     │
│    minmax(0, 1fr)        │     │  top: 5rem            │
│    no max-width cap      │     │  scroll-spy active    │
│                          │     │                       │
├──────────────────────────┴─────┴──────────────────────┤
│              Recommended Articles / Author Bio          │
└───────────────────────────────────────────────────────┘
```

Tablet (768-1023px)：同 Desktop 三栏布局（sticky sidebar 继续显示），无 FAB
Mobile (< 768px)：单栏，TOC 为右下 FAB 按钮 + 底部滑出面板

### 当前实现

| 组件 | 状态 |
|------|------|
| PostLayoutMonograph | ✅ 唯一活跃布局 |
| PostSimple | ❌ 已废弃 |
| PostBanner | ❌ 已废弃 |
| PostLayout | ❌ 已废弃 |

> **路由路径**：`app/blog/[...slug]/`（使用 catch-all 路由段，而非 `app/posts/[slug]/`）

## 排版系统

### 字体栈

```css
--font-sans: var(--font-inter), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: var(--font-jetbrains-mono), 'SFMono-Regular', ui-monospace, monospace;
--font-serif: var(--font-newsreader), Georgia, serif;
```

> **说明**：实际加载的字体是 **Inter**（无衬线）、**JetBrains Mono**（等宽）和 **Newsreader**（衬线，正文/标题），通过 `next/font/google` 加载。文档此前提到的 PingFang SC 和 Noto Sans SC 不在当前字体栈中。衬线变量 `--font-serif` 通过 CSS 自定义属性在 `tailwind.css` 中引用，未出现在 `@theme` 的 `--font-serif` 配置中，但 Newsreader 字体已加载并可通过 CSS 变量 `var(--font-newsreader)` 使用。

> **全局样式文件**：项目不使用 `globals.css`。所有全局样式通过 `src/styles/tailwind.css` 管理，该文件在 `layout.tsx` 中通过 `import '@/styles/tailwind.css'` 引入。

### 字号比例（Fibonacci-based）

| 元素 | 大小 | 行高 | 字间距 |
|------|------|------|--------|
| h1 | 2.25rem (36px) | 1.3 | -0.02em |
| h2 | 1.75rem (28px) | 1.35 | -0.01em |
| h3 | 1.375rem (22px) | 1.4 | 0 |
| h4 | 1.125rem (18px) | 1.45 | 0 |
| Body | 1rem (16px) | 1.65 (统一) | 0 |
| Small | 0.875rem (14px) | 1.5 | 0.01em |

### CJK 特殊处理

> **⚠️ 尚未实现**：本项目当前不包含 CJK 特殊处理。正文行高统一使用 `var(--line-height-body): 1.65`，未区分 CJK 与 Latin。`:lang(zh)` 选择器、`.cjk-content` class 及 CJK 特定段落间距均未在代码中实现。如后续需要，应添加对应的 CSS 规则。

## TOC 组件 (TableOfContents)

- `scroll` 事件 + `getBoundingClientRect` API 实现 scroll-spy（**非** IntersectionObserver）
- 算法：寻找视口顶部最近的 heading，根据其在视口上半部/下半部决定高亮自身或前一条
- 当前活动 section 用品牌色左边框高亮
- 点击平滑滚动（`scroll-behavior: smooth`），80px 偏移补偿固定元素
- 移动端折叠为浮动按钮+底部面板（Portal 渲染到 `document.body`）
- 移动端断点：768px（`< 768px` = 移动端 FAB，`768-1023px` = 平板端 sticky sidebar，`>= 1024px` = 桌面端 sticky sidebar）

## 阅读进度条 (ReadingProgressBar)

- `position: fixed; top: 0; left: 0; z-index: 50;`，位于 `monograph-article` 容器顶部
- 高度：**3px**，实色背景（使用 CSS 自定义属性 `var(--mono-accent)`，非渐变）
- 背景轨道使用 `var(--mono-border)` 半透明底色
- 宽度 = `scrollY / (scrollHeight - clientHeight)`，由 `useHeadingObserver` 中的 `updateProgress` 在 scroll 事件中计算
- 进度条无 `requestAnimationFrame` 节流 — 直接绑定 `passive scroll` 事件，通过 `lastProgressRef` 过滤小于 1% 的变化

## 代码块

- App 风格卡片 + macOS 窗口装饰
- 红/黄/绿三色圆点 + 语言标签
- 复制按钮（点击→勾号→2s 返回）
- **代码块背景跟随主题**：light mode 使用 `--mono-code-bg: #F5F3F0`，dark mode 使用 `--mono-code-bg: #1E1E1E`（**非常深色**）。非文字背景色始终保持在 light mode 下为浅色，dark mode 下为深色，减少阅读疲劳。

## 表格

- 桌面：清水平线、交替行着色、header 底部边框
- 移动端（< 768px）：卡片折叠模式，`data-label` 注入表头文本（⚠️ 未实现 — 当前使用标准 prose 表格样式）

## 微交互动效

| 元素 | 触发器 | 动画 | 时长 |
|------|--------|------|------|
| 文章卡片 | hover | `border-color` 过渡 | 200ms |
| TOC 指示器 | scroll | 左边框滑动到新位置 | 200ms |
| 进度条 | scroll | 宽度过渡（GPU） | 100ms |
| 复制按钮 | click | 图标切换 + 提示 | 150ms |
| 评论区域 | scroll | 页面内联评论列表 | 150ms |
| 暗色模式 | click | CSS 变量过渡 | 200ms |

> **注**：上述微交互动效的时长标注为设计规范参考值，实际实现中（如代码块复制按钮的 2s 返回提示等）部分动画时长可能与此处不同。微交互动效的最终表现以代码实现为准，本表列的为原始规格。

所有动画使用 `will-change: transform` 和 `transform: translateZ(0)` 开启 GPU 合成。

> **注**：`will-change` 和 `transform` 相关要求为性能优化指南，并非强制约束。实际应用中根据具体情况判断是否需要启用 GPU 合成，避免滥用 `will-change` 导致性能反效果。
