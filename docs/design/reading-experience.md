# 博客阅读体验设计

> 来源：superpowers/specs/2026-03-29-art-level-blog-reading-design.md（已实施）

## 布局系统

### 三栏网格布局

```
Desktop (>= 1024px):
┌────────────────────────────────────────────────────────────────────┐
│  Progress Bar (3px, fixed top, --mono-accent solid color)          │
├────────────────────────────────────────────────────────────────────┤
│                          Article Hero                               │
├────────────────────────────┬──────────────────────────────────────┤
│                            │                                       │
│    Main Content            │     TOC Sidebar                       │
│    (1fr — fills remaining) │     220px                             │
│    gap: 40px               │     position: sticky                  │
│    optimal line length:    │     top: 2rem                         │
│    65-75 chars/line        │     scroll-spy active                 │
│                            │                                       │
├────────────────────────────┴──────────────────────────────────────┤
│                Recommended Articles / Author Bio                    │
└────────────────────────────────────────────────────────────────────┘
```

Tablet (768-1023px)：内容全宽，TOC 折叠为浮动按钮（右下 FAB + 底部面板）
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

### 字号比例（Fluid clamp()）

| 元素 | 大小（流体） | 行高 | 字间距 |
|------|-------------|------|--------|
| h1 | `clamp(2rem, 1.6rem + 2vw, 3.5rem)` | 1.3 | -0.02em |
| h2 | `clamp(1.5rem, 1.3rem + 1vw, 2.25rem)` | 1.35 | -0.01em |
| h3 | `clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem)` | 1.4 | 0 |
| h4 | `clamp(1.1rem, 1rem + 0.5vw, 1.375rem)` | 1.45 | 0 |
| Body | `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)` | 1.75 (CJK) / 1.6 (Latin) | 0 |
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
- 移动端断点：768px（Monograph 的 1280px 过晚，原 768px 为标准断点）

> **⚠️ 潜在 Bug**：`(public)/blog/[...slug]/DynamicPostPage.tsx` 未向 TOC 组件传递 `showTOC` 属性，可能导致 TOC 侧边栏在文章中无法正常显示。需要确认该组件是否正确接收并传递此 prop。

## 阅读进度条 (ReadingProgressBar)

- `position: fixed; top: 0; left: 0; z-index: 50;`
- 高度：3px，纯色强调色 `--mono-accent`
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
