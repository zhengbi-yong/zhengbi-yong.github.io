# 设计收敛计划 v2.0

> 制定日期：2025-04
> 更新：整合 10 个子任务 + 3 个 bonus 审计的完整结果

---

## 执行摘要

### 根本问题

博客项目经历多位工程师开发，每人引入独立的设计系统，导致：
- **7+ 套互相冲突的 CSS 变量**（`--geist-*`, `--visitor-*`, `--mono-*`, `--admin-*`, `--shell-*`, `--surface-*`, 死代码 `--color-*`）
- **4 套 TOC 组件**，算法和 UI 各不相同
- **7 个 Reading Progress 文件**，视觉和功能不统一
- **4 套 Post 布局**，但只有 1 个实际被使用
- **大量死代码**，零引用的文件散落各处

### 收敛目标

以 **`PostLayoutMonograph`** 的设计系统（`--mono-*` 变量 + Editorial Grid）为唯一标准布局，融合各设计优点。

---

## 第一阶段：清理死代码（低风险）

### 1.1 确认可删除文件（0 引用）

| # | 文件 | 原因 | 状态 |
|---|------|------|------|
| 1 | `FloatingTOC.tsx` | 纯废弃 re-export，0 引用。PostBanner/PostSimple 直接导入 TableOfContents | ✅ 确认 |
| 2 | `Comments.tsx` | 0 引用，PostBanner/PostSimple 用 Giscus 则直接用 Comments 组件 | ✅ 确认 |
| 3 | `ClientPostReader.tsx` | 0 引用，`return <>{children}</>` 无实际效果 | ✅ 确认 |
| 4 | `CachedPostContent.tsx` | 0 引用，`return null` + 副作用 | ✅ 确认 |
| 5 | `MatterAnimation.example.tsx` | 0 引用，示例文件 | ✅ 确认 |
| 6 | `styles/tokens/` | **已不存在**（已被早期工程师删除或从未创建） | ✅ 确认 |
| 7 | `ThemeSwitch.tsx` | 0 引用，DarkModeToggle 是唯一实现 | ✅ 确认 |
| 8 | `CommentForm.tsx` | 0 引用，BackendComments 已含完整表单 | ✅ 确认 |
| 9 | `CommentListSimple.tsx` | 0 引用，BackendComments 功能超集 | ✅ 确认 |
| 10 | `CommentNotificationButton.tsx` | 0 引用，从未使用 | ✅ 确认 |
| 11 | `ScrollTopAndComment.tsx` | 0 引用，CommentDrawer 已处理滚动 | ✅ 确认 |
| 12 | `RecommendedPosts.tsx` | 0 引用，202 行全是注释代码 | ✅ 确认 |
| 13 | `home/HeroSection.tsx` | 0 引用，未被任何地方导入 | ✅ 确认 |

### 1.2 确认 NOT dead（误报，需保留）

| 文件 | 原因 |
|------|------|
| `Header.tsx` | 被 `LayoutWrapper.tsx` 和 `(public)/layout.tsx` 导入 |
| `HeaderOptimized.tsx` | 实际被 `Header.tsx` 引用 |
| `postLayoutContent.ts` | 被 PostLayout, PostBanner, PostSimple, PostLayoutMonograph 广泛使用 |
| `FloatingTOC.module.css` | 被 TableOfContents 的子组件使用，**不能删除** |

### 1.3 PostSimple / PostBanner 问题

**重要发现**：`DynamicPostPage.tsx` 中：
```typescript
const layouts = { PostSimple, PostLayoutMonograph, PostLayout, PostBanner }
const layoutKey = 'PostLayoutMonograph' // ← 硬编码，只有 Monograph 被渲染
```

PostSimple、PostBanner、PostLayout **导入但从未被选中**，属于 DynamicPostPage 中的死代码。

但 PostSimple 和 PostBanner **自身是独立文件**，需要检查是否被其他地方直接使用：
- `search_files` 结果：PostSimple 和 PostBanner **只被 DynamicPostPage 导入**
- PostSimple/PostBanner 内部用 `FloatingTOC`（→ TableOfContents）

**结论**：PostSimple.tsx、PostBanner.tsx、PostLayout.tsx 三个文件可以删除（只在 DynamicPostPage 中导入但未使用）。

### 执行命令

```bash
# 验证后再删除
rm frontend/src/components/FloatingTOC.tsx
rm frontend/src/components/Comments.tsx
rm frontend/src/components/ClientPostReader.tsx
rm frontend/src/components/CachedPostContent.tsx
rm frontend/src/components/MatterAnimation.example.tsx
rm frontend/src/components/ThemeSwitch.tsx
rm frontend/src/components/post/CommentForm.tsx
rm frontend/src/components/post/CommentListSimple.tsx
rm frontend/src/components/CommentNotificationButton.tsx
rm frontend/src/components/ScrollTopAndComment.tsx
rm frontend/src/components/RecommendedPosts.tsx
rm frontend/src/components/home/HeroSection.tsx

# DynamicPostPage 中的死 import（删除文件后清理）
rm frontend/src/components/layouts/PostSimple.tsx
rm frontend/src/components/layouts/PostBanner.tsx
rm frontend/src/components/layouts/PostLayout.tsx
```

---

## 第二阶段：Reading Progress 收敛（中风险）

### 2.1 文件清单（7 个文件）

| 文件 | 类型 | 核心特征 | 决策 |
|------|------|---------|------|
| `ReadingProgressBar.tsx` | 组件 | gradient + glow + tooltip + Framer Motion，限制 `/blog/` | **保留** |
| `useReadingProgressWithApi.ts` | Hook | 完整功能：auth、save/restore、sendBeacon、2000ms autoSave | **保留** |
| `ReadingProgressWithApi.tsx` | 组件 | 使用 `useReadingProgressWithApi` hook | **合并到 ReadingProgressBar** |
| `blog/ReadingProgressTracker.tsx` | 组件 | 独立实现，70% 与 ReadingProgressWithApi 重叠 | **删除** |
| `ReadingProgress.tsx` | 组件 | 基础版本，无 gradient/glow，hook-based | **删除** |
| `ScrollProgress.tsx` | 组件 | 通用进度，无独特价值 | **删除** |
| `useReadingProgress.ts` | Hook | 基础滚动追踪，无 API 同步 | **删除** |

### 2.2 推荐最终状态

```
src/components/
├── ReadingProgressBar.tsx      # 增强：合并 useReadingProgressWithApi 的 API 同步
src/components/hooks/
└── useReadingProgressWithApi.ts  # 保留：后端进度同步的 canonical hook
```

### 2.3 执行步骤

1. **增强 `ReadingProgressBar.tsx`**：合并 `ReadingProgressWithApi.tsx` 的 API 同步功能（isSaving indicator, resume scroll position, sendBeacon）
2. **PostLayoutMonograph**：`ReadingProgressBar` 替换当前内联实现（如果有 API 同步需求则用 `useReadingProgressWithApi`）
3. **删除**：`ReadingProgress.tsx`、`ScrollProgress.tsx`、`blog/ReadingProgressTracker.tsx`、`useReadingProgress.ts`

---

## 第三阶段：TOC 收敛（中风险）

### 3.1 组件对比

| 特征 | MonographTOC | TableOfContents |
|------|-------------|-----------------|
| 算法 | rect-based "topmost wins"，连续 scroll 事件 | IntersectionObserver + rootMargin fallback |
| 准确性 | 高（实时 rect 测量） | 中（120px offset + 70% rootMargin 有偏差） |
| 嵌套 TOC | ❌ 扁平 | ✅ 树形 |
| 移动端 | FAB + drawer，breakpoint 1280px | FAB + slide-in panel，breakpoint 768px |
| 键盘导航 | ❌ 无 | ❌ 无 |
| aria-current | ✅ 有 | ❌ 缺失 |
| 代码结构 | 单文件 500+ 行 | 模块化（hook + 4 子组件） |
| Dark mode | CSS class | Tailwind dark: |
| 维护性 | ⚠️ 单文件难维护 | ✅ 模块化 |

### 3.2 决策：融合两者优势

**保留 `TableOfContents` 作为标准**（更好的架构），**从 `MonographTOC` 借鉴**：

1. **修复 TableOfContents scroll spy 算法**：用 rect-based fallback 替代粗糙的 rootMargin
2. **添加 `aria-current="location"`**：从 MonographTOC 移植
3. **将 mobile breakpoint 从 768px 改为 1024px**：MonographTOC 的 1280px 过晚
4. **PostLayoutMonograph** 切换到 TableOfContents

### 3.3 执行步骤

| Step | 操作 | 风险 |
|------|------|------|
| 1 | 在 `TableOfContents/index.tsx` 添加 `aria-current="location"` | 低 |
| 2 | 在 `useHeadingObserver.ts` 添加 rect-based fallback 算法 | 中 |
| 3 | 移动端 breakpoint 从 768px → 1024px | 低 |
| 4 | PostLayoutMonograph 改用 TableOfContents | 中 |
| 5 | 删除 `MonographTOC.tsx` | 低 |
| 6 | PostSimple/PostBanner 如需保留则更新（已计划删除） | - |

### 3.4 删除文件

```
src/components/layouts/MonographTOC.tsx        # 合并后删除
src/components/StickyTOC.tsx                    # 已有 TableOfContents
```

---

## 第四阶段：Tag 渲染收敛（低风险）

### 4.1 问题规模

- **18 个地方**有内联 tag 渲染代码
- **10+ 种**不同视觉风格
- `Tag.tsx` 组件只被 4 个文件使用（ListLayout、ListLayoutWithTags、2 个 tag page）

### 4.2 推荐方案：统一 TagList 组件

```tsx
interface TagListProps {
  tags: string[]
  variant?: 'default' | 'visitor' | 'mono' | 'primary' | 'muted'
  max?: number
  linkable?: boolean
  className?: string
  size?: 'xs' | 'sm' | 'md'
}
```

**Variant 映射**：
- `'default'` → `Tag.tsx`（Badge, secondary）
- `'visitor'` → `visitor-tag` CSS class
- `'mono'` → monograph inline CSS
- `'primary'` → Brand color border
- `'muted'` → Muted bordered

### 4.3 执行步骤

1. **创建** `src/components/ui/TagList.tsx`
2. **替换**：PostLayout（174-190）、PostLayoutMonograph（header + footer）、ListLayout、ListLayoutWithTags
3. **评估**：MasonryGrid、HeroSection、ArticleCard 等的 tag 是否也统一（需确认是否影响 magazine 布局）
4. **保留**：`Tag.tsx` 作为单个 tag 渲染的基础组件

---

## 第五阶段：PostNavigation 收敛（低风险）

### 5.1 当前状态

- PostSimple ✅ 有（CSS variable 样式）
- PostBanner ✅ 有（Tailwind 样式）
- **PostLayoutMonograph ❌ 缺失**
- PostLayout ❌ 缺失
- PostSimple 和 PostBanner 实现几乎相同（只是样式系统不同）

### 5.2 推荐 API

```tsx
interface PostNavigationProps {
  prev?: { path: string; title: string }
  next?: { path: string; title: string }
  className?: string
}
```

使用 PostSimple 的 CSS variable 样式（`var(--brand-color)`）作为标准。

### 5.3 执行步骤

1. **创建** `src/components/ui/PostNavigation.tsx`
2. **PostSimple** → 替换为共享组件
3. **PostBanner** → 替换为共享组件
4. **PostLayoutMonograph** → **添加** PostNavigation（当前缺失）
5. **PostLayout** → 如保留则添加

---

## 第六阶段：ListLayoutWithTags 合并（中风险）

### 6.1 关键发现

**ListLayoutWithTags ≠ ListLayout 的扩展**。它**缺乏**：
- 搜索功能
- Zustand 缓存
- 预加载（requestIdleCallback）
- SlideIn 动画
- 过滤后的 post count 显示

CLAUDE.md 文档**错误**地描述了两者关系。

### 6.2 推荐方案

**方案 A（推荐）**：将 tag sidebar 合并到 ListLayout

```tsx
// ListLayout.tsx 新增
interface ListLayoutProps {
  // ... existing props
  showTagSidebar?: boolean
}
```

### 6.3 执行步骤

1. **修改** `ListLayout.tsx`：添加 `showTagSidebar?: boolean` prop
2. **迁移**：将 ListLayoutWithTags 的 sidebar 代码移入 ListLayout 条件渲染
3. **更新**：tag page 使用 `<ListLayout showTagSidebar />`
4. **删除**：`ListLayoutWithTags.tsx`
5. **更新 CLAUDE.md**：修正文档中的错误描述

---

## 第七阶段：Comment 组件精简（低风险）

### 7.1 文件清单（8 个）

| 文件 | 状态 | 保留/删除 |
|------|------|---------|
| `Comments.tsx` (Giscus) | PostBanner/PostSimple 用 | **保留** |
| `BackendComments.tsx` | PostLayoutMonograph 用 | **保留** |
| `CommentDrawer.tsx` | 移动端抽屉 wrapper | **保留** |
| `CommentModeration.tsx` | Admin 独立功能 | **保留** |
| `CommentForm.tsx` | 0 引用 | **删除** |
| `CommentListSimple.tsx` | 0 引用 | **删除** |
| `CommentNotificationButton.tsx` | 0 引用 | **删除** |
| `ScrollTopAndComment.tsx` | 0 引用 | **删除** |

### 7.2 执行命令

```bash
rm frontend/src/components/post/CommentForm.tsx
rm frontend/src/components/post/CommentListSimple.tsx
rm frontend/src/components/CommentNotificationButton.tsx
rm frontend/src/components/ScrollTopAndComment.tsx
```

---

## 第八阶段：Dark Mode Toggle 精简（低风险）

- `ThemeSwitch.tsx` → **删除**（0 引用）
- `DarkModeToggle.tsx` → **保留**

```bash
rm frontend/src/components/ThemeSwitch.tsx
```

---

## 第九阶段：CSS 变量系统重构（高风险）

### 9.1 当前状态

| 文件 | 变量 | 性质 | 依赖 |
|------|------|------|------|
| `geist-tokens.css` | ~50 | 原始值（基础层） | 无 |
| `tailwind.css` | ~80 | 别名到 geist + 共享语义 | geist |
| `visitor-theme.css` | ~60 | 原始值 + 4 个有缺陷的别名 | ⚠️ tailwind |
| `monograph-theme.css` | ~35 | 完全自包含，命名更好 | 无 |
| `admin-theme.css` | ~80 | 原始值 + 5 个别名 | ⚠️ tailwind |
| `styles/tokens/` | ~? | **死代码**，已不存在 | - |

### 9.2 发现的 BUG

```css
/* tailwind.css 中的断裂别名 */
--toc-active-text: var(--color-toc-active-text-light)   /* ← 未定义 */
--toc-active-bg: var(--color-toc-active-bg-light)       /* ← 未定义 */
--toc-hover: var(--color-toc-hover-light)                /* ← 未定义 */
```

### 9.3 命名方案评估

| 命名 | 优势 | 劣势 |
|------|------|------|
| `--mono-*` | 自包含、无 fallback 链、语义分组好 | 需要迁移现有 `--visitor-*` |
| `--visitor-*` | 已有一些使用 | 4 个变量 fallback 到 tailwind（耦合） |

**结论**：`--mono-*` 更好，但需要将 `--visitor-*` 统一进来。

### 9.4 推荐架构

```
Layer 0: geist-tokens.css        → 原始值，无依赖
Layer 1: tailwind.css            → 别名到 geist + 共享语义（--shell-*, --surface-*, --motion-* 等）
Layer 2: article-theme.css (NEW) → 统一的文章设计系统（--article-*）
                                      由 monograph-theme.css 重命名而来
Layer 3: admin-theme.css         → Admin 专用（--admin-*），保持独立
```

### 9.5 执行步骤

| Phase | 操作 | 风险 |
|-------|------|------|
| A | `cp monograph-theme.css article-theme.css` | 低 |
| B | 重命名 `--mono-*` → `--article-*` | **高**（影响所有引用） |
| C | grep 找出所有引用 `--mono-*` 的文件，批量替换 | 高 |
| D | 修复 `tailwind.css` 中 3 个断裂的 TOC 变量 | 低 |
| E | 更新 `PostLayoutMonograph.tsx` 引用 | 中 |
| F | 删除 `monograph-theme.css` | 低 |
| G | 评估 `visitor-theme.css`：如 PostLayout 被废弃则同步迁移 | 中 |

**批量替换命令**：
```bash
# 找出所有 --mono- 引用
grep -r "\-\-mono-" frontend/src/ --include="*.tsx" --include="*.ts" --include="*.css" -l

# 替换（谨慎，先 grep 确认）
sed -i '' 's/--mono-bg/--article-bg/g; s/--mono-text/--article-text/g; ...' frontend/src/**/*.{tsx,ts,css}
```

---

## 第十阶段：Post Layout 收敛（高风险）

### 10.1 关键发现

**只有 `PostLayoutMonograph` 被实际渲染**。`DynamicPostPage.tsx` 中：
```typescript
const layoutKey = 'PostLayoutMonograph'  // 硬编码
const Layout = layouts[layoutKey]       // 只有这一个被执行
```

PostSimple、PostBanner、PostLayout **导入但从未被路由到**。

### 10.2 PostLayoutMonograph 功能缺口

| 缺失功能 | 来源 | 优先级 |
|---------|------|--------|
| Breadcrumb JSON-LD schema | PostLayout lines 82-115 | 🔴 高 |
| Mobile TOC FAB | PostLayout mobile-only | 🔴 高 |
| ArticleAnalytics | PostLayout line 123 | 🟡 中 |
| Motion 动画（Framer Motion stagger） | PostLayout lines 135-191 | 🟡 中 |
| RecentArticles sidebar (3列) | PostLayout line 233 | 🟡 中 |
| CommentDrawer 移动端 | PostLayout 移动端 | 🟡 中 |
| showTOC prop 完整支持 | PostLayout 有 | 🟡 中 |

### 10.3 重复代码

PostLayout 和 PostLayoutMonograph **重复 ~40 行**：
- `resolvePostLayoutContent` 提取
- Date parsing
- JSON-LD BlogPosting schema

### 10.4 执行步骤

| Phase | 操作 | 风险 |
|-------|------|------|
| 1 | PostLayoutMonograph 添加 breadcrumbSchema JSON-LD | 中 |
| 2 | PostLayoutMonograph 添加 Mobile TOC FAB | 中 |
| 3 | PostLayoutMonograph 添加 ArticleAnalytics | 低 |
| 4 | PostLayoutMonograph 添加 Framer Motion stagger | 低 |
| 5 | PostLayoutMonograph 添加 PostNavigation（第五阶段产物） | 低 |
| 6 | PostLayoutMonograph 添加 CommentDrawer（移动端） | 中 |
| 7 | DynamicPostPage 清理未使用的 import（PostSimple, PostBanner, PostLayout） | 低 |
| 8 | **删除** PostSimple.tsx、PostBanner.tsx、PostLayout.tsx | 中 |
| 9 | 更新 CLAUDE.md 中 DynamicPostPage 的说明 | 低 |

---

## 执行顺序

```
Phase 1  →  Phase 7  →  Phase 8  →  Phase 2  →  Phase 3
(死代码)     (Comments)   (Dark)    (Progress)   (TOC)
     ↓
Phase 4  →  Phase 5  →  Phase 6
(Tag)       (Nav)       (ListLayout)
     ↓
Phase 9 (CSS)  →  Phase 10 (Layout)
（高风险，   （高风险，
  放后期）     放最后）
```

**每阶段完成后在 http://192.168.0.161:3001 验证，再进行下一阶段。**

---

## 完整删除清单

```
frontend/src/components/
├── FloatingTOC.tsx
├── Comments.tsx
├── ClientPostReader.tsx
├── CachedPostContent.tsx
├── MatterAnimation.example.tsx
├── ThemeSwitch.tsx
├── CommentNotificationButton.tsx
├── ScrollTopAndComment.tsx
├── RecommendedPosts.tsx
├── home/HeroSection.tsx
├── post/CommentForm.tsx
├── post/CommentListSimple.tsx
├── layouts/
│   ├── PostSimple.tsx
│   ├── PostBanner.tsx
│   ├── PostLayout.tsx
│   └── MonographTOC.tsx   # (Phase 3 后)
└── StickyTOC.tsx

frontend/src/components/hooks/
├── useReadingProgress.ts        # (Phase 2 后)
└── blog/ReadingProgressTracker.tsx  # (Phase 2 后)

frontend/src/components/ReadingProgress.tsx   # (Phase 2 后)
frontend/src/components/ScrollProgress.tsx   # (Phase 2 后)
```

**合计：约 17 个文件删除**

---

## 验收标准

- [ ] ~17 个死代码文件已删除
- [ ] Reading Progress 收敛到 2 个文件（ReadingProgressBar + useReadingProgressWithApi）
- [ ] TOC 收敛到 TableOfContents（增强版）
- [ ] TagList 统一组件创建，所有 article 布局使用
- [ ] PostNavigation 统一组件，PostLayoutMonograph 补全
- [ ] ListLayoutWithTags 合并到 ListLayout
- [ ] Comment 组件收敛到 4 个（Comments/BackendComments/CommentDrawer/CommentModeration）
- [ ] Dark Mode 只有 DarkModeToggle
- [ ] CSS 变量收敛到 4 层（geist → tailwind → article → admin）
- [ ] PostLayoutMonograph 成为唯一 Post 布局
- [ ] 所有页面在 http://192.168.0.161:3001 验证正常
