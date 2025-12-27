# 骨架屏（Skeleton Screen）系统

## 概述

骨架屏是一种在内容加载时显示的占位符，提供更好的用户体验。相比传统的加载指示器（如旋转的圆圈），骨架屏能让用户感知到页面结构，减少感知加载时间。

## 文件结构

```
app/
├── blog/
│   ├── loading.tsx                 # 博客列表页加载状态
│   └── [...slug]/
│       └── loading.tsx             # 文章详情页加载状态

components/ui/Skeleton/
├── BlogSkeleton.tsx                # 博客书架骨架屏
├── PostSkeleton.tsx                # 文章详情骨架屏
└── README.md                       # 本文档
```

## 已实现页面

### 1. 博客列表页（`/blog`）

**文件**: `app/blog/loading.tsx`

**组件**: `BlogSkeleton`

**结构**:
- 标题区域骨架
- 左侧窄列：最新文章骨架（xl 屏幕以上显示）
- 中间宽列：书籍网格骨架（12 个书籍占位符）
- 右侧窄列：热门文章骨架（xl 屏幕以上显示）

### 2. 文章详情页（`/blog/[...slug]`）

**文件**: `app/blog/[...slug]/loading.tsx`

**组件**: `PostSkeleton`

**结构**:
- 标题、日期、标签骨架
- 左侧窄列：最新文章骨架（xl 屏幕以上显示）
- 中间区域：文章内容骨架
  - 段落骨架
  - 标题骨架（h2、h3）
  - 代码块骨架
  - 列表骨架
- 右侧：TOC 骨架（md 屏幕以上显示）

## 工作原理

Next.js 会自动使用 `loading.tsx` 文件作为加载状态：

1. **Server Component 加载**: 当页面组件是异步的（`async function`）时
2. **数据获取延迟**: 在 `generateMetadata` 或数据获取期间
3. **路由转换**: 在客户端导航到新页面时

### 示例流程

```tsx
// app/blog/page.tsx
export default async function BlogPage() {
  // 数据获取需要时间...
  const posts = await getSortedPosts()

  // 在此期间显示 loading.tsx
  return <BookShelfLayout posts={posts} />
}
```

```tsx
// app/blog/loading.tsx
export default function BlogLoading() {
  // 显示骨架屏
  return <BlogSkeleton />
}
```

## 样式定制

骨架屏使用 Tailwind CSS 的 `animate-pulse` 工具类实现动画效果：

```css
/* 默认脉冲动画 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
```

### 自定义颜色

可以通过修改骨架屏组件中的背景颜色来定制：

```tsx
// 浅色模式
<div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

// 使用设计令牌
<div className="h-4 w-full animate-pulse rounded" style={{ backgroundColor: 'var(--color-gray-200)' }} />
```

## 添加新的骨架屏

### 步骤 1: 创建骨架组件

```tsx
// components/ui/Skeleton/MyPageSkeleton.tsx
'use client'

import { memo } from 'react'

export default function MyPageSkeleton() {
  return (
    <div className="container mx-auto px-4">
      {/* 标题骨架 */}
      <div className="mb-8 h-12 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />

      {/* 内容骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-48 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 步骤 2: 创建 loading.tsx

```tsx
// app/my-page/loading.tsx
import MyPageSkeleton from '@/components/ui/Skeleton/MyPageSkeleton'

export default function MyPageLoading() {
  return <MyPageSkeleton />
}
```

### 步骤 3: 验证效果

1. 访问 `/my-page` 路由
2. 如果页面加载快，可以模拟慢速网络：
   - 打开 Chrome DevTools
   - 切换到 Network 面板
   - 选择 "Slow 3G" 节流
   - 刷新页面

## 最佳实践

### 1. 匹配实际布局

骨架屏应该尽可能接近实际页面的布局结构：

```tsx
// ✅ 好 - 匹配实际布局
<div className="grid grid-cols-3 gap-4">
  <BookSkeleton />
  <BookSkeleton />
  <BookSkeleton />
</div>

// ❌ 差 - 不匹配实际布局
<div className="space-y-4">
  <div className="h-20 w-full animate-pulse" />
  <div className="h-20 w-full animate-pulse" />
</div>
```

### 2. 合理的占位符数量

显示合适数量的占位符，不要过多或过少：

```tsx
// ✅ 好 - 显示 6-12 个项目
{[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}

// ❌ 差 - 显示太多项目
{[...Array(50)].map((_, i) => <CardSkeleton key={i} />)}

// ❌ 差 - 显示太少项目
{[...Array(1)].map((_, i) => <CardSkeleton key={i} />)}
```

### 3. 考虑响应式设计

骨架屏应该与实际页面有相同的响应式行为：

```tsx
// ✅ 好 - 响应式骨架屏
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
</div>

// ❌ 差 - 固定布局
<div className="flex gap-4">
  {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
</div>
```

### 4. 优化动画性能

使用 CSS 动画而不是 JavaScript 动画：

```tsx
// ✅ 好 - 使用 Tailwind animate-pulse
<div className="animate-pulse bg-gray-200" />

// ❌ 差 - 使用 JavaScript 动画
<div style={{ animation: 'customPulse 2s infinite' }} />
```

## 性能考虑

### Bundle 大小

骨架屏组件会被包含在初始 Bundle 中。为了优化：

1. **保持简单**: 骨架屏应该简单，避免复杂逻辑
2. **使用 memo**: 避免不必要的重新渲染
3. **客户端组件**: 使用 `'use client'` 指令

### 加载时间

骨架屏应该在数据准备好后立即消失：

```tsx
// ✅ 好 - Next.js 自动处理
export default async function Page() {
  const data = await fetchData() // 加载时显示 skeleton
  return <div>{data}</div> // 加载完成显示实际内容
}
```

## 故障排除

### 骨架屏不显示

**问题**: 创建了 `loading.tsx` 但看不到骨架屏

**可能原因**:
1. 页面加载太快（在开发模式下）
2. 使用了 `export const dynamic = 'force-static'`
3. 缓存导致数据立即返回

**解决方案**:
1. 使用 Chrome DevTools 模拟慢速网络
2. 在数据获取函数中添加 `await new Promise(resolve => setTimeout(resolve, 2000))`
3. 检查 Next.js 版本是否支持 `loading.tsx`

### 样式不匹配

**问题**: 骨架屏布局与实际页面不一致

**解决方案**:
1. 检查网格布局是否一致（`grid-cols-*`）
2. 验证间距是否匹配（`gap-*`, `p-*`）
3. 确保响应式断点一致

### 动画卡顿

**问题**: 骨架屏动画不流畅

**解决方案**:
1. 减少骨架屏元素数量
2. 使用 `will-change: opacity` 优化动画
3. 避免在骨架屏中使用复杂效果

## 相关资源

- [Next.js Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [骨架屏设计最佳实践](https://www.smashingmagazine.com/2020/10/web-performance-resource-hints-loading-skeletons/)

## 未来改进

- [ ] 添加页面过渡动画（Page Transition）
- [ ] 实现渐进式加载（Progressive Loading）
- [ ] 添加骨架屏预览工具（开发模式）
- [ ] 支持自定义动画效果
- [ ] 添加骨架屏生成器 CLI 工具
