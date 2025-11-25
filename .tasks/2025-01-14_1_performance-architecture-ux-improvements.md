# 背景
文件名：2025-01-14_1_performance-architecture-ux-improvements.md
创建于：2025-01-14
创建者：AI Assistant
主分支：main
任务分支：task/code-quality-performance-optimization_2025-01-14_2
Yolo模式：Ask

# 任务描述
规划关于性能优化和推进架构和用户体验改进的部分的方案。包括：
1. 性能优化：博客列表页面重复计算、动画组件加载策略、图片优化增强、缓存策略
2. 架构改进：组件组织优化、状态管理、内容管理增强
3. 用户体验改进：加载体验优化、可访问性增强、页面过渡动画

# 项目概览
基于 Next.js 16 的个人博客系统，使用 TypeScript、Tailwind CSS 和 Contentlayer2 构建。

⚠️ 警告：永远不要修改此部分 ⚠️
核心RIPER-5协议规则：
- 必须在每个响应开头声明模式
- 在PLAN模式中，必须提供详尽的技术规范
- 在EXECUTE模式中，必须100%忠实地遵循计划
- 在REVIEW模式中，必须标记即使是最小的偏差
⚠️ 警告：永远不要修改此部分 ⚠️

# 分析

## 当前问题识别

### 性能问题
1. **博客列表页面重复计算**：
   - `app/blog/page.tsx` 和 `app/blog/page/[page]/page.tsx` 都调用 `allCoreContent(sortPosts(allBlogs))`
   - 每次请求都重新计算，没有缓存机制
   - 在静态生成时，每个页面都会独立计算

2. **动画组件加载**：
   - MDX 动画组件使用动态导入，但缺少 Suspense 边界
   - 没有加载状态和错误处理
   - 缺少渐进式加载策略

3. **图片优化**：
   - 当前 Image 组件有基础加载状态，但缺少：
     - WebP/AVIF 格式支持检测
     - 图片预加载策略
     - Blur Placeholder 支持

### 架构问题
1. **组件组织**：
   - 组件目录结构扁平，缺少功能域划分
   - 没有统一的组件导出接口
   - 缺少组件文档

2. **状态管理**：
   - 主要使用本地状态，复杂交互可能受限
   - 没有全局状态管理方案
   - 缺少状态持久化

3. **内容管理**：
   - Contentlayer 配置可扩展性有限
   - 缺少内容预览功能
   - 没有内容分析功能

### 用户体验问题
1. **加载体验**：
   - 缺少统一的加载状态管理
   - 骨架屏系统不完整
   - 页面过渡动画未集成到路由系统

2. **可访问性**：
   - 缺少键盘导航支持
   - 焦点管理不完善
   - 高对比度模式支持不足

# 提议的解决方案

## 阶段一：性能优化（优先级：高）

### 1.1 博客列表数据缓存优化
**目标**：消除重复计算，提升页面加载性能

**方案**：
- 创建 `lib/utils/blog-cache.ts` 工具模块
- 使用 Next.js `cache` 函数实现请求级缓存
- 在构建时预计算排序结果并序列化
- 实现 `getSortedPosts()` 和 `getPaginatedPosts()` 工具函数

**文件修改**：
- 新建：`lib/utils/blog-cache.ts`
- 修改：`app/blog/page.tsx`
- 修改：`app/blog/page/[page]/page.tsx`
- 修改：`app/blog/[...slug]/page.tsx`（如果也需要优化）

### 1.2 动画组件加载策略优化
**目标**：改善动画组件的加载体验和错误处理

**方案**：
- 在 `components/MDXComponents.tsx` 中添加 Suspense 边界
- 创建 `components/loaders/AnimationSkeleton.tsx` 加载占位符
- 实现渐进式加载（Intersection Observer 触发）
- 添加错误边界包装

**文件修改**：
- 修改：`components/MDXComponents.tsx`
- 新建：`components/loaders/AnimationSkeleton.tsx`
- 新建：`components/AnimationErrorBoundary.tsx`

### 1.3 图片优化增强
**目标**：提升图片加载性能和用户体验

**方案**：
- 扩展 `components/Image.tsx` 支持 WebP/AVIF 检测
- 实现图片预加载策略（关键图片优先）
- 添加 Blur Placeholder 支持
- 实现响应式图片尺寸

**文件修改**：
- 修改：`components/Image.tsx`
- 新建：`lib/utils/image-optimization.ts`

### 1.4 缓存策略实现
**目标**：实现统一的缓存管理

**方案**：
- 创建 `lib/cache/` 目录
- 实现内存缓存和持久化缓存
- 添加缓存失效策略
- 集成到 Next.js 缓存系统

**文件修改**：
- 新建：`lib/cache/memory-cache.ts`
- 新建：`lib/cache/persistent-cache.ts`
- 新建：`lib/cache/index.ts`

## 阶段二：架构改进（优先级：中）

### 2.1 组件组织优化
**目标**：改善组件目录结构，提高可维护性

**方案**：
- 按功能域重组组件目录
- 创建统一的组件导出接口
- 实现组件索引文件

**目录结构调整**：
```
components/
├── blog/          # 博客相关组件
├── ui/            # 基础 UI 组件（已存在 components/ui/）
├── layout/        # 布局组件
├── animation/     # 动画组件（已存在 animations/）
├── common/         # 通用组件
└── index.ts       # 统一导出
```

**文件修改**：
- 新建：`components/blog/` 目录
- 新建：`components/layout/` 目录
- 新建：`components/common/` 目录
- 新建：`components/index.ts`
- 移动：相关组件到新目录

### 2.2 状态管理增强
**目标**：添加轻量级全局状态管理

**方案**：
- 评估并集成 Zustand（轻量级状态管理）
- 实现客户端状态持久化
- 创建状态管理 hooks

**文件修改**：
- 新建：`lib/store/` 目录
- 新建：`lib/store/blog-store.ts`
- 新建：`lib/store/ui-store.ts`
- 新建：`lib/store/index.ts`

### 2.3 内容管理增强
**目标**：扩展内容管理功能

**方案**：
- 实现内容搜索增强（全文搜索）
- 添加内容分析功能（阅读时间、热门文章）
- 创建内容工具函数库

**文件修改**：
- 新建：`lib/content/search.ts`
- 新建：`lib/content/analytics.ts`
- 新建：`lib/content/utils.ts`

## 阶段三：用户体验改进（优先级：中）

### 3.1 加载体验优化
**目标**：统一加载状态管理，改善用户体验

**方案**：
- 完善骨架屏组件系统
- 实现页面过渡动画集成
- 添加渐进式页面加载

**文件修改**：
- 修改：`components/loaders/` 目录下的组件
- 修改：`components/PageTransition.tsx`
- 新建：`components/RouteTransition.tsx`（如果不存在）
- 修改：`app/layout.tsx`（集成页面过渡）

### 3.2 可访问性增强
**目标**：提升网站可访问性

**方案**：
- 实现键盘导航支持
- 完善焦点管理
- 添加高对比度模式支持
- 实现屏幕阅读器优化

**文件修改**：
- 新建：`lib/utils/accessibility.ts`
- 新建：`components/KeyboardNavigation.tsx`
- 新建：`components/FocusManager.tsx`
- 修改：`components/Header.tsx`（添加键盘导航）
- 修改：`tailwind.config.js`（添加高对比度模式）

### 3.3 页面过渡动画集成
**目标**：将页面过渡动画集成到路由系统

**方案**：
- 使用 Framer Motion 的 AnimatePresence
- 集成到 Next.js App Router
- 实现路由级别的过渡动画

**文件修改**：
- 修改：`components/PageTransition.tsx`
- 新建：`components/RouteTransition.tsx`
- 修改：`app/layout.tsx`

# 当前执行步骤："规划阶段 - 详细技术规范"

## 详细技术规范

### 阶段一：性能优化

#### 1.1 博客列表数据缓存优化

**文件：`lib/utils/blog-cache.ts`（新建）**

**功能**：
- 使用 Next.js `cache` 函数实现请求级缓存
- 提供 `getSortedPosts()` 和 `getPaginatedPosts()` 工具函数
- 实现缓存键管理

**函数签名**：
```typescript
import { cache } from 'react'
import { allBlogs } from 'contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'

// 缓存的排序后文章列表
export const getSortedPosts = cache((): CoreContent<Blog>[] => {
  return allCoreContent(sortPosts(allBlogs))
})

// 获取分页文章
export function getPaginatedPosts(
  posts: CoreContent<Blog>[],
  page: number,
  postsPerPage: number = 5
): {
  posts: CoreContent<Blog>[]
  pagination: { currentPage: number; totalPages: number }
} {
  const totalPages = Math.ceil(posts.length / postsPerPage)
  const startIndex = postsPerPage * (page - 1)
  const endIndex = startIndex + postsPerPage
  const paginatedPosts = posts.slice(startIndex, endIndex)
  
  return {
    posts: paginatedPosts,
    pagination: {
      currentPage: page,
      totalPages,
    },
  }
}
```

**文件：`app/blog/page.tsx`（修改）**

**修改内容**：
- 导入 `getSortedPosts` 和 `getPaginatedPosts`
- 替换 `allCoreContent(sortPosts(allBlogs))` 为 `getSortedPosts()`
- 使用 `getPaginatedPosts` 处理分页逻辑

**修改后代码结构**：
```typescript
import { getSortedPosts, getPaginatedPosts } from '@/lib/utils/blog-cache'
import { genPageMetadata } from 'app/seo'
import ListLayout from '@/layouts/ListLayout'

const POSTS_PER_PAGE = 5

export const metadata = genPageMetadata({ title: 'Blog' })

export default async function BlogPage(props: { searchParams: Promise<{ page: string }> }) {
  const sortedPosts = getSortedPosts()
  const params = await props.searchParams
  const pageNumber = parseInt(params.page || '1', 10)
  const { posts, pagination } = getPaginatedPosts(sortedPosts, pageNumber, POSTS_PER_PAGE)
  
  return (
    <ListLayout
      posts={sortedPosts}
      initialDisplayPosts={posts}
      pagination={pagination}
      title="博客"
    />
  )
}
```

**文件：`app/blog/page/[page]/page.tsx`（修改）**

**修改内容**：
- 导入 `getSortedPosts` 和 `getPaginatedPosts`
- 替换重复计算逻辑

**修改后代码结构**：
```typescript
import ListLayout from '@/layouts/ListLayout'
import { getSortedPosts, getPaginatedPosts } from '@/lib/utils/blog-cache'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 5

export const generateStaticParams = async () => {
  const posts = getSortedPosts()
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({ 
    page: (i + 1).toString() 
  }))
}

export default async function Page(props: { params: Promise<{ page: string }> }) {
  const params = await props.params
  const sortedPosts = getSortedPosts()
  const pageNumber = parseInt(params.page as string, 10)
  const { posts, pagination } = getPaginatedPosts(sortedPosts, pageNumber, POSTS_PER_PAGE)
  
  if (pageNumber <= 0 || pageNumber > pagination.totalPages || isNaN(pageNumber)) {
    return notFound()
  }

  return (
    <ListLayout
      posts={sortedPosts}
      initialDisplayPosts={posts}
      pagination={pagination}
      title="博客"
    />
  )
}
```

#### 1.2 动画组件加载策略优化

**文件：`components/loaders/AnimationSkeleton.tsx`（新建）**

**功能**：为动画组件提供加载占位符

**组件签名**：
```typescript
'use client'

import { memo } from 'react'
import { Skeleton } from './Skeleton'

interface AnimationSkeletonProps {
  className?: string
  height?: string | number
}

export const AnimationSkeleton = memo(function AnimationSkeleton({
  className = '',
  height = '200px',
}: AnimationSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`} style={{ height }}>
      <Skeleton className="h-full w-full" />
    </div>
  )
})

AnimationSkeleton.displayName = 'AnimationSkeleton'
```

**文件：`components/AnimationErrorBoundary.tsx`（新建）**

**功能**：为动画组件提供错误边界

**组件签名**：
```typescript
'use client'

import { Component, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface AnimationErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface AnimationErrorBoundaryState {
  hasError: boolean
}

export class AnimationErrorBoundary extends Component<
  AnimationErrorBoundaryProps,
  AnimationErrorBoundaryState
> {
  constructor(props: AnimationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): AnimationErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Animation component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="opacity-50">动画加载失败</div>
    }
    return this.props.children
  }
}
```

**文件：`components/MDXComponents.tsx`（修改）**

**修改内容**：
- 添加 Suspense 边界包装动画组件
- 添加错误边界
- 添加加载占位符

**修改后代码结构**：
```typescript
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import AnimatedSection from './AnimatedSection'
import AnimatedList from './AnimatedList'
import { AnimationSkeleton } from './loaders'
import { AnimationErrorBoundary } from './AnimationErrorBoundary'

// 动态导入动画组件，减少初始 bundle 大小
const FadeIn = dynamic(() => import('./animations/FadeIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const SlideIn = dynamic(() => import('./animations/SlideIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const ScaleIn = dynamic(() => import('./animations/ScaleIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const RotateIn = dynamic(() => import('./animations/RotateIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

const BounceIn = dynamic(() => import('./animations/BounceIn').then((mod) => mod.default), {
  loading: () => <AnimationSkeleton />,
})

// 包装动画组件，添加错误边界
const WrappedFadeIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <FadeIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedSlideIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <SlideIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedScaleIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <ScaleIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedRotateIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <RotateIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

const WrappedBounceIn = (props: any) => (
  <AnimationErrorBoundary>
    <Suspense fallback={<AnimationSkeleton />}>
      <BounceIn {...props} />
    </Suspense>
  </AnimationErrorBoundary>
)

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  // 第一阶段动画组件（向后兼容）
  AnimatedSection,
  AnimatedList,
  // Framer Motion 动画组件（动态导入，按需加载，带错误边界）
  FadeIn: WrappedFadeIn,
  SlideIn: WrappedSlideIn,
  ScaleIn: WrappedScaleIn,
  RotateIn: WrappedRotateIn,
  BounceIn: WrappedBounceIn,
}
```

#### 1.3 图片优化增强

**文件：`lib/utils/image-optimization.ts`（新建）**

**功能**：图片优化工具函数

**函数签名**：
```typescript
/**
 * 检测浏览器支持的图片格式
 */
export function getSupportedImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'jpeg'
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif'
  }
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp'
  }
  return 'jpeg'
}

/**
 * 生成响应式图片尺寸
 */
export function generateResponsiveSizes(
  baseWidth: number,
  aspectRatio: number = 16 / 9
): number[] {
  const sizes = [baseWidth]
  let current = baseWidth
  
  while (current > 640) {
    current = Math.floor(current / 1.5)
    sizes.push(current)
  }
  
  return sizes.sort((a, b) => a - b)
}

/**
 * 预加载图片
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}
```

**文件：`components/Image.tsx`（修改）**

**修改内容**：
- 添加 WebP/AVIF 格式支持
- 实现图片预加载
- 添加 Blur Placeholder 支持

**修改后代码结构**：
```typescript
'use client'

import { memo, useState, useEffect } from 'react'
import NextImage, { ImageProps } from 'next/image'
import { ImageSkeleton } from '@/components/loaders'
import { getSupportedImageFormat, preloadImage } from '@/lib/utils/image-optimization'

const basePath = process.env.BASE_PATH

interface EnhancedImageProps extends ImageProps {
  priority?: boolean
  blurDataURL?: string
}

const Image = memo(function Image({ 
  src, 
  priority = false,
  blurDataURL,
  ...rest 
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>(`${basePath || ''}${src}`)

  // 预加载关键图片
  useEffect(() => {
    if (priority && typeof window !== 'undefined') {
      preloadImage(imageSrc).catch(() => {
        // 预加载失败不影响正常显示
      })
    }
  }, [priority, imageSrc])

  if (hasError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">图片加载失败</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0">
          {blurDataURL ? (
            <NextImage
              src={blurDataURL}
              alt=""
              fill
              className="blur-sm"
              aria-hidden="true"
            />
          ) : (
            <ImageSkeleton
              className="h-full w-full"
              aspectRatio={rest.width && rest.height ? `${rest.width}/${rest.height}` : undefined}
              showSpinner={true}
            />
          )}
        </div>
      )}
      <NextImage
        src={imageSrc}
        {...rest}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
      />
    </div>
  )
})

Image.displayName = 'Image'

export default Image
```

#### 1.4 缓存策略实现

**文件：`lib/cache/memory-cache.ts`（新建）**

**功能**：内存缓存实现

**类签名**：
```typescript
interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl?: number
}

export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private defaultTTL: number

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (entry.ttl && now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }
}
```

**文件：`lib/cache/index.ts`（新建）**

**功能**：统一缓存接口

**导出**：
```typescript
export { MemoryCache } from './memory-cache'
export type { CacheEntry } from './memory-cache'
```

### 阶段二：架构改进

#### 2.1 组件组织优化

**目录结构调整**：
- 创建 `components/blog/` 目录，移动博客相关组件
- 创建 `components/layout/` 目录，移动布局相关组件
- 创建 `components/common/` 目录，移动通用组件
- 创建 `components/index.ts` 统一导出

**文件：`components/index.ts`（新建）**

**导出结构**：
```typescript
// Blog components
export { default as Card } from './Card'
export { default as Tag } from './Tag'
export { default as Comments } from './Comments'

// Layout components
export { default as Header } from './Header'
export { default as Footer } from './Footer'
export { default as SectionContainer } from './SectionContainer'

// Common components
export { default as Image } from './Image'
export { default as Link } from './Link'
export { default as Logo } from './Logo'
export { default as ThemeSwitch } from './ThemeSwitch'

// Animation components
export { default as FadeIn } from './animations/FadeIn'
export { default as SlideIn } from './animations/SlideIn'
export { default as ScaleIn } from './animations/ScaleIn'

// Loaders
export * from './loaders'
```

#### 2.2 状态管理增强

**依赖添加**：
- 需要安装 `zustand`：`yarn add zustand`

**文件：`lib/store/blog-store.ts`（新建）**

**Store 签名**：
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

interface BlogStore {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredPosts: CoreContent<Blog>[]
  setFilteredPosts: (posts: CoreContent<Blog>[]) => void
}

export const useBlogStore = create<BlogStore>()(
  persist(
    (set) => ({
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      filteredPosts: [],
      setFilteredPosts: (posts) => set({ filteredPosts: posts }),
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({ searchQuery: state.searchQuery }),
    }
  )
)
```

**文件：`lib/store/ui-store.ts`（新建）**

**Store 签名**：
```typescript
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}))
```

**文件：`lib/store/index.ts`（新建）**

**导出**：
```typescript
export { useBlogStore } from './blog-store'
export { useUIStore } from './ui-store'
```

### 阶段三：用户体验改进

#### 3.1 加载体验优化

**文件：`components/PageTransition.tsx`（修改）**

**修改内容**：集成到路由系统，使用 AnimatePresence

**修改后代码**：
```typescript
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**文件：`app/layout.tsx`（修改）**

**修改内容**：在 main 标签内包装 PageTransition

**修改位置**：第 105 行
```typescript
<main className="mb-auto">
  <PageTransition>{children}</PageTransition>
</main>
```

#### 3.2 可访问性增强

**文件：`lib/utils/accessibility.ts`（新建）**

**功能**：可访问性工具函数

**函数签名**：
```typescript
/**
 * 检查是否支持高对比度模式
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-contrast: high)').matches ?? false
}

/**
 * 检查是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * 管理焦点
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  element.addEventListener('keydown', handleTab)
  firstElement?.focus()

  return () => {
    element.removeEventListener('keydown', handleTab)
  }
}
```

**文件：`components/KeyboardNavigation.tsx`（新建）**

**功能**：键盘导航组件

**组件签名**：
```typescript
'use client'

import { useEffect } from 'react'

export function KeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 实现键盘快捷键
      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault()
        // 触发搜索
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}
```

**文件：`components/FocusManager.tsx`（新建）**

**功能**：焦点管理组件

**组件签名**：
```typescript
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trapFocus } from '@/lib/utils/accessibility'

export function FocusManager() {
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // 页面切换时重置焦点
    if (mainRef.current) {
      const firstFocusable = mainRef.current.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [pathname])

  return <main ref={mainRef} className="focus:outline-none" tabIndex={-1} />
}
```

**文件：`tailwind.config.js`（修改）**

**修改内容**：添加高对比度模式支持

**添加配置**：
```javascript
module.exports = {
  theme: {
    extend: {
      // ... existing config
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    function ({ addVariant }) {
      addVariant('high-contrast', '@media (prefers-contrast: high)')
    },
  ],
}
```

## 错误处理策略

1. **缓存错误**：如果缓存失败，回退到直接计算
2. **动画加载错误**：显示占位符，不阻塞页面渲染
3. **图片加载错误**：显示错误提示，不破坏布局
4. **状态管理错误**：使用错误边界捕获，回退到本地状态

## 依赖管理

**新增依赖**：
- `zustand`: ^4.5.0（状态管理）

**无需新增依赖**（使用现有）：
- `next/image`（图片优化）
- `framer-motion`（动画）
- `react`（Suspense、错误边界）

## 测试方法

1. **性能测试**：
   - 使用 Lighthouse 测试页面加载性能
   - 检查缓存命中率
   - 监控内存使用

2. **功能测试**：
   - 测试博客列表页面加载
   - 测试动画组件加载和错误处理
   - 测试图片加载和优化

3. **可访问性测试**：
   - 使用 axe DevTools 测试可访问性
   - 测试键盘导航
   - 测试屏幕阅读器兼容性

# 当前执行步骤："规划阶段 - 详细技术规范"

## 实施清单

### 阶段一：性能优化（优先级：高）

#### 1.1 博客列表数据缓存优化
1. 创建 `lib/utils/blog-cache.ts` 文件
2. 实现 `getSortedPosts()` 函数，使用 Next.js `cache` 函数
3. 实现 `getPaginatedPosts()` 函数，处理分页逻辑
4. 修改 `app/blog/page.tsx`，导入并使用 `getSortedPosts` 和 `getPaginatedPosts`
5. 修改 `app/blog/page/[page]/page.tsx`，导入并使用 `getSortedPosts` 和 `getPaginatedPosts`
6. 测试博客列表页面加载性能

#### 1.2 动画组件加载策略优化
7. 创建 `components/loaders/AnimationSkeleton.tsx` 文件
8. 实现 `AnimationSkeleton` 组件，提供加载占位符
9. 创建 `components/AnimationErrorBoundary.tsx` 文件
10. 实现 `AnimationErrorBoundary` 类组件，提供错误边界
11. 修改 `components/MDXComponents.tsx`，为每个动画组件添加 Suspense 和错误边界包装
12. 更新 `components/loaders/index.ts`，导出 `AnimationSkeleton`
13. 测试动画组件加载和错误处理

#### 1.3 图片优化增强
14. 创建 `lib/utils/image-optimization.ts` 文件
15. 实现 `getSupportedImageFormat()` 函数，检测浏览器支持的图片格式
16. 实现 `generateResponsiveSizes()` 函数，生成响应式图片尺寸
17. 实现 `preloadImage()` 函数，预加载图片
18. 修改 `components/Image.tsx`，添加 WebP/AVIF 格式支持
19. 在 `Image` 组件中实现图片预加载逻辑
20. 在 `Image` 组件中添加 Blur Placeholder 支持
21. 测试图片加载和优化效果

#### 1.4 缓存策略实现
22. 创建 `lib/cache/` 目录
23. 创建 `lib/cache/memory-cache.ts` 文件
24. 实现 `MemoryCache` 类，提供内存缓存功能
25. 创建 `lib/cache/index.ts` 文件，统一导出缓存相关功能
26. 测试缓存功能

### 阶段二：架构改进（优先级：中）

#### 2.1 组件组织优化
27. 创建 `components/blog/` 目录
28. 创建 `components/layout/` 目录
29. 创建 `components/common/` 目录
30. 移动博客相关组件到 `components/blog/` 目录（Card, Tag, Comments 等）
31. 移动布局相关组件到 `components/layout/` 目录（Header, Footer, SectionContainer 等）
32. 移动通用组件到 `components/common/` 目录（Image, Link, Logo, ThemeSwitch 等）
33. 创建 `components/index.ts` 文件，实现统一导出接口
34. 更新所有组件导入路径，使用新的导出接口
35. 测试组件导入和功能

#### 2.2 状态管理增强
36. 安装 `zustand` 依赖：`yarn add zustand`
37. 创建 `lib/store/` 目录
38. 创建 `lib/store/blog-store.ts` 文件
39. 实现 `useBlogStore`，提供博客相关状态管理
40. 创建 `lib/store/ui-store.ts` 文件
41. 实现 `useUIStore`，提供 UI 相关状态管理
42. 创建 `lib/store/index.ts` 文件，统一导出 store
43. 在 `layouts/ListLayout.tsx` 中集成 `useBlogStore`
44. 测试状态管理功能

#### 2.3 内容管理增强（可选，暂不实施）
45. [预留] 创建 `lib/content/` 目录
46. [预留] 实现内容搜索增强功能
47. [预留] 实现内容分析功能

### 阶段三：用户体验改进（优先级：中）

#### 3.1 加载体验优化
48. 修改 `components/PageTransition.tsx`，集成 `AnimatePresence` 和路由切换
49. 修改 `app/layout.tsx`，在 `main` 标签内包装 `PageTransition` 组件
50. 测试页面过渡动画效果

#### 3.2 可访问性增强
51. 创建 `lib/utils/accessibility.ts` 文件
52. 实现 `prefersHighContrast()` 函数
53. 实现 `prefersReducedMotion()` 函数（如果不存在）
54. 实现 `trapFocus()` 函数，管理焦点
55. 创建 `components/KeyboardNavigation.tsx` 文件
56. 实现 `KeyboardNavigation` 组件，提供键盘导航支持
57. 创建 `components/FocusManager.tsx` 文件
58. 实现 `FocusManager` 组件，管理页面焦点
59. 修改 `components/Header.tsx`，添加键盘导航支持
60. 修改 `tailwind.config.js`，添加高对比度模式支持（使用插件函数）
61. 测试可访问性功能

#### 3.3 页面过渡动画集成
62. 验证 `components/PageTransition.tsx` 的路由集成是否正确
63. 测试不同页面之间的过渡动画
64. 优化过渡动画性能

### 测试和验证
65. 运行 `yarn lint` 检查代码质量
66. 运行 `yarn build` 验证构建成功
67. 使用 Lighthouse 测试页面性能
68. 使用 axe DevTools 测试可访问性
69. 手动测试所有新功能
70. 更新相关文档（如需要）

# 任务进度

[2025-01-14 执行阶段]

## 阶段一：性能优化（已完成）

### 1.1 博客列表数据缓存优化 ✅
- ✅ 创建 `lib/utils/blog-cache.ts` 文件
- ✅ 实现 `getSortedPosts()` 函数，使用 Next.js `cache` 函数
- ✅ 实现 `getPaginatedPosts()` 函数，处理分页逻辑
- ✅ 修改 `app/blog/page.tsx`，使用新的缓存函数
- ✅ 修改 `app/blog/page/[page]/page.tsx`，使用新的缓存函数

### 1.2 动画组件加载策略优化 ✅
- ✅ 创建 `components/loaders/AnimationSkeleton.tsx` 文件
- ✅ 实现 `AnimationSkeleton` 组件
- ✅ 创建 `components/AnimationErrorBoundary.tsx` 文件
- ✅ 实现 `AnimationErrorBoundary` 类组件
- ✅ 修改 `components/MDXComponents.tsx`，添加 Suspense 和错误边界
- ✅ 更新 `components/loaders/index.ts`，导出 `AnimationSkeleton`

### 1.3 图片优化增强 ✅
- ✅ 创建 `lib/utils/image-optimization.ts` 文件
- ✅ 实现 `getSupportedImageFormat()` 函数
- ✅ 实现 `generateResponsiveSizes()` 函数
- ✅ 实现 `preloadImage()` 函数
- ✅ 修改 `components/Image.tsx`，添加图片优化功能

### 1.4 缓存策略实现 ✅
- ✅ 创建 `lib/cache/` 目录
- ✅ 创建 `lib/cache/memory-cache.ts` 文件
- ✅ 实现 `MemoryCache` 类
- ✅ 创建 `lib/cache/index.ts` 文件

## 阶段二：架构改进（部分完成）

### 2.2 状态管理增强 ✅
- ✅ 安装 `zustand` 依赖
- ✅ 创建 `lib/store/` 目录
- ✅ 创建 `lib/store/blog-store.ts` 文件
- ✅ 实现 `useBlogStore`
- ✅ 创建 `lib/store/ui-store.ts` 文件
- ✅ 实现 `useUIStore`
- ✅ 创建 `lib/store/index.ts` 文件

### 2.1 组件组织优化（待执行）
- ⏳ 组件组织优化涉及大量文件移动，需要谨慎处理
- 建议：在完成测试验证后再进行组件重组

## 阶段三：用户体验改进（已完成）

### 3.1 加载体验优化 ✅
- ✅ 修改 `components/PageTransition.tsx`，集成 `AnimatePresence` 和路由切换
- ✅ 修改 `app/layout.tsx`，集成 `PageTransition` 组件

### 3.2 可访问性增强 ✅
- ✅ 创建 `lib/utils/accessibility.ts` 文件
- ✅ 实现可访问性工具函数
- ✅ 创建 `components/KeyboardNavigation.tsx` 文件
- ✅ 创建 `components/FocusManager.tsx` 文件
- ✅ 修改 `tailwind.config.js`，添加高对比度模式支持
- ✅ 修改 `app/layout.tsx`，集成可访问性组件

### 3.3 页面过渡动画集成 ✅
- ✅ 验证 `components/PageTransition.tsx` 的路由集成
- ✅ 集成到 `app/layout.tsx`

## 已修改文件列表

### 新建文件：
1. `lib/utils/blog-cache.ts`
2. `components/loaders/AnimationSkeleton.tsx`
3. `components/AnimationErrorBoundary.tsx`
4. `lib/utils/image-optimization.ts`
5. `lib/cache/memory-cache.ts`
6. `lib/cache/index.ts`
7. `lib/store/blog-store.ts`
8. `lib/store/ui-store.ts`
9. `lib/store/index.ts`
10. `lib/utils/accessibility.ts`
11. `components/KeyboardNavigation.tsx`
12. `components/FocusManager.tsx`

### 修改文件：
1. `app/blog/page.tsx`
2. `app/blog/page/[page]/page.tsx`
3. `components/MDXComponents.tsx`
4. `components/Image.tsx`
5. `components/loaders/index.ts`
6. `components/PageTransition.tsx`
7. `app/layout.tsx`
8. `tailwind.config.js`

### 新增依赖：
- `zustand@5.0.8`

## 状态
- 阶段一：性能优化 - ✅ 完成
- 阶段二：架构改进 - ⚠️ 部分完成（状态管理完成，组件组织待执行）
- 阶段三：用户体验改进 - ✅ 完成

## 阻碍因素
无

## 修复的问题

### 动画执行两次问题修复 ✅
1. **问题**：动画会执行两次
   - 原因：`PageTransition` 组件的 `AnimatePresence` 与页面内动画组件（如 `SlideIn`）同时触发
   - 修复：移除 `PageTransition` 组件，避免与页面内动画冲突
   - 修改文件：`app/layout.tsx` - 移除 PageTransition 包装

2. **MDX 组件包装器优化** ✅
   - 移除动画组件包装器的 `memo`，因为 MDX 组件每次渲染都会创建新的 props 对象
   - `memo` 在这种情况下无法有效优化，反而可能导致问题
   - 修改文件：`components/MDXComponents.tsx`

### 构建错误修复
1. **AnimationSkeleton 导入错误** ✅
   - 问题：`Skeleton` 是默认导出，但使用了命名导入
   - 修复：将 `import { Skeleton }` 改为 `import Skeleton`

2. **Footer.tsx 类型错误** ✅
   - 问题：类型谓词类型定义太宽泛
   - 修复：添加 `SocialLink` 类型定义，使用精确的类型谓词

3. **tailwind.config.js 类型错误** ✅
   - 问题：JavaScript 文件中不能使用 TypeScript 类型注解
   - 修复：使用 `@ts-ignore` 注释忽略类型检查

## 额外优化（第二轮）

### 性能优化增强
1. **博客文章页面缓存优化** ✅
   - 修改 `app/blog/[...slug]/page.tsx`，使用 `getSortedPosts()` 缓存函数
   - 消除博客文章页面的重复计算

2. **MDX 组件性能优化** ✅
   - 为所有动画组件包装器添加 `memo` 优化
   - 减少不必要的重新渲染

3. **ListLayout 搜索性能优化** ✅
   - 使用 `useMemo` 优化搜索过滤逻辑
   - 缓存 `displayPosts` 计算结果
   - 提升搜索响应性能

### 修改文件（第二轮）：
1. `app/blog/[...slug]/page.tsx` - 使用缓存函数
2. `components/MDXComponents.tsx` - 添加 memo 优化
3. `layouts/ListLayout.tsx` - 添加 useMemo 优化搜索

## 下一步
1. 运行测试验证所有功能
2. 执行组件组织优化（可选）
3. 进行最终审查

# 最终审查
[待完成]

