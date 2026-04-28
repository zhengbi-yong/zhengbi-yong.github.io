# 博客阅读体验设计

> 来源：superpowers/specs/2026-03-29-art-level-blog-reading-design.md（已实施）

## 布局系统

### 非对称三栏编辑网格

实际使用 `monograph-theme.css` 定义的 3 列 CSS Grid 布局，非 62%/38% 比例。

```
Desktop (>= 1024px):
┌────────────────────────────────────────────────────────────┐
│  Progress Bar (3px, fixed top, brand accent color)          │
├────────────────────────────────────────────────────────────┤
│                    Article Hero                             │
├─────────────────────────────┬──────────┬──────────────────┤
│                             │  40px    │                  │
│    Main Content (1fr)       │  gap     │  TOC (220px)     │
│    max-width: none          │          │  position: sticky │
│    optimal line length:     │          │  top: 5rem        │
│    ~65-75 chars/line       │          │  scroll-spy active│
│    (via font-size clamp)    │          │                  │
│                             │          │                  │
├─────────────────────────────┴──────────┴──────────────────┤
│              Recommended Articles / Author Bio              │
└────────────────────────────────────────────────────────────┘
```

Tablet (768-1023px)：内容全宽单栏，TOC 折叠为浮动 FAB 按钮
Mobile (< 768px)：单栏，TOC 为右下 FAB + 底部面板

**布局宽度来源**：CSS 变量 `--mono-grid-sidenote: 220px;`（见 `monograph-theme.css` line 55），gap `clamp(1.5rem, 4vw, 4rem)`。Grid 定义为 `grid-template-columns: minmax(0, 1fr) 40px 220px;`。

### 当前实现

| 组件 | 状态 |
|------|------|
| PostLayoutMonograph | ✅ 唯一活跃布局 |
| PostSimple | ❌ 已废弃 |
| PostBanner | ❌ 已废弃 |
| PostLayout | ❌ 已废弃 |

## 排版系统

### 字体栈

```css
--mono-font-serif: var(--font-newsreader), Georgia, 'Times New Roman', serif;
--mono-font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
--mono-font-mono: var(--font-jetbrains-mono), ui-monospace, 'Cascadia Code', monospace;
```

### 字号比例（Fluid clamp() 值，非 Fibonacci 固定值）

实际使用 `clamp()` 流体排版，基于 Major Third 音阶（ratio 1.25）：

| 元素 | 大小（CSS 变量值） |
|------|-------------------|
| h1 | `clamp(2rem, 1.6rem + 2vw, 3.5rem)` |
| h2 | `clamp(1.5rem, 1.3rem + 1vw, 2.25rem)` |
| h3 | `clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem)` |
| h4 | `clamp(1.1rem, 1rem + 0.5vw, 1.375rem)` |
| Body | `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)` |
| Small | `clamp(0.8125rem, 0.8rem + 0.06vw, 0.875rem)` |

见 `monograph-theme.css` lines 31-36。

### 行高

代码使用单一值 `--line-height-body: 1.65;`（`monograph-theme.css` line 40），：
- 中英文统一使用 `1.65` 行高
- 段落间距统一使用 `--space-1`（基于 rhythm unit 计算）
- **未实现** CJK 专用行高 `1.75` 和 `1.5em` 段落间距（CSS `:lang(zh)` 检测未在 monograph 中应用）
- 标题行高：`--line-height-heading: 1.2;`

## TOC 组件 (TableOfContents)

- `IntersectionObserver` API 实现 scroll-spy（配置：`rootMargin: '-120px 0px -70% 0px'`，threshold `[0, 0.25, 0.5, 0.75, 1]`）
- 当前活动 section 用品牌色左边框高亮
- 点击平滑滚动（80px offset）
- 桌面端：直接渲染在 `monograph-toc-aside`（grid column 3），`position: sticky`，`top: 5rem`，`max-height: calc(100vh - 8rem)`
- 移动端：浮动按钮（bottom: 80px, right: 20px）+ 底部面板（通过 Portal 渲染到 document.body）
- **移动端断点：768px**（文档中之前错误记录为 1024px，实际 CSS 断点 `@media (max-width: 767px)` 见 TOC.module.css line 450）
- Desktop TOC 激活：`min-width: 1024px`（monograph-theme.css line 144）

## 阅读进度条 (ReadingProgressBar)

- `position: fixed; top: 0; left: 0; z-index: 50;`
- 高度：**3px**（非 2px），品牌色背景（`--mono-accent`）
- 宽度 = `scrollY / (scrollHeight - clientHeight)`
- 通过 `useReadingProgressWithApi` hook 实现（含后端同步）
- CSS transition: `width 0.1s ease-out`

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
