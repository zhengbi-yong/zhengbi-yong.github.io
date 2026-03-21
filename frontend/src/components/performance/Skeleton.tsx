'use client'

/**
 * Skeleton - 全局骨架屏系统
 *
 * 特性：
 * - 零CLS（Cumulative Layout Shift）
 * - 多种预设样式（文章、卡片、列表等）
 * - 流畅动画
 * - 支持深色模式
 * - 可自定义主题
 * - 性能优化（GPU加速）
 * - TypeScript完整类型
 *
 * 最佳实践：
 * - 使用真实内容的尺寸
 * - 避免布局偏移
 * - 渐进式加载
 * - 与ContentLoader配合
 */

import { clsx } from 'clsx'

// ==================== 基础骨架屏 ====================

export interface SkeletonProps {
  /**
   * 类名
   */
  className?: string

  /**
   * 是否在加载中
   */
  loading?: boolean

  /**
   * 子元素
   */
  children?: React.ReactNode
}

export function Skeleton({ className, loading = true, children }: SkeletonProps) {
  if (!loading) {
    return <>{children}</>
  }

  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
        'bg-[length:200%_100%] animate-shimmer',
        className
      )}
      style={{
        animation: 'shimmer 1.5s infinite',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

// ==================== 文章骨架屏 ====================

export interface ArticleSkeletonProps {
  /**
   * 是否显示图片
   */
  showImage?: boolean

  /**
   * 标题行数
   */
  titleLines?: number

  /**
   * 摘要行数
   */
  excerptLines?: number

  /**
   * 类名
   */
  className?: string
}

export function ArticleSkeleton({
  showImage = true,
  titleLines = 2,
  excerptLines = 3,
  className = '',
}: ArticleSkeletonProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      {/* 图片 */}
      {showImage && (
        <Skeleton className="h-48 w-full rounded-lg" />
      )}

      {/* 标题 */}
      <div className="space-y-2">
        {Array.from({ length: titleLines }).map((_, i) => (
          <Skeleton
            key={i}
            className={clsx('h-4', i === 0 ? 'w-3/4' : 'w-full')}
          />
        ))}
      </div>

      {/* 摘要 */}
      <div className="space-y-2">
        {Array.from({ length: excerptLines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>

      {/* 元信息 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

// ==================== 卡片骨架屏 ====================

export interface CardSkeletonProps {
  /**
   * 是否显示图片
   */
  showImage?: boolean

  /**
   * 是否显示描述
   */
  showDescription?: boolean

  /**
   * 类名
   */
  className?: string
}

export function CardSkeleton({
  showImage = true,
  showDescription = true,
  className = '',
}: CardSkeletonProps) {
  return (
    <div className={clsx('rounded-lg border p-4', className)}>
      {/* 图片 */}
      {showImage && <Skeleton className="mb-4 h-40 w-full rounded" />}

      {/* 标题 */}
      <Skeleton className="mb-2 h-5 w-3/4" />

      {/* 描述 */}
      {showDescription && (
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      )}

      {/* 底部 */}
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

// ==================== 列表骨架屏 ====================

export interface ListSkeletonProps {
  /**
   * 列表项数量
   */
  count?: number

  /**
   * 是否显示头像
   */
  showAvatar?: boolean

  /**
   * 类名
   */
  className?: string
}

export function ListSkeleton({
  count = 5,
  showAvatar = true,
  className = '',
}: ListSkeletonProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {/* 头像 */}
          {showAvatar && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}

          {/* 内容 */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== 表格骨架屏 ====================

export interface TableSkeletonProps {
  /**
   * 行数
   */
  rows?: number

  /**
   * 列数
   */
  cols?: number

  /**
   * 是否显示表头
   */
  showHeader?: boolean

  /**
   * 类名
   */
  className?: string
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  showHeader = true,
  className = '',
}: TableSkeletonProps) {
  return (
    <div className={clsx('w-full', className)}>
      <table className="w-full">
        {/* 表头 */}
        {showHeader && (
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-4 text-left">
                  <Skeleton className="h-4 w-24" />
                </th>
              ))}
            </tr>
          </thead>
        )}

        {/* 表体 */}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ==================== 博客网格骨架屏 ====================

export interface BlogGridSkeletonProps {
  /**
   * 卡片数量
   */
  count?: number

  /**
   * 类名
   */
  className?: string
}

export function BlogGridSkeleton({ count = 6, className = '' }: BlogGridSkeletonProps) {
  return (
    <div className={clsx('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// ==================== 代码块骨架屏 ====================

export function CodeBlockSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={clsx('rounded-lg bg-gray-100 p-4 dark:bg-gray-800', className)}>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ==================== 评论骨架屏 ====================

export function CommentSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={clsx('space-y-4 p-4', className)}>
      <div className="flex items-start gap-4">
        {/* 头像 */}
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

        {/* 内容 */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </div>
    </div>
  )
}

// ==================== 侧边栏骨架屏 ====================

export function SidebarSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={clsx('space-y-6', className)}>
      {/* 个人信息 */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* 统计 */}
      <div className="flex justify-around">
        <div className="text-center">
          <Skeleton className="mx-auto h-6 w-12" />
          <Skeleton className="mx-auto mt-1 h-3 w-16" />
        </div>
        <div className="text-center">
          <Skeleton className="mx-auto h-6 w-12" />
          <Skeleton className="mx-auto mt-1 h-3 w-16" />
        </div>
        <div className="text-center">
          <Skeleton className="mx-auto h-6 w-12" />
          <Skeleton className="mx-auto mt-1 h-3 w-16" />
        </div>
      </div>

      {/* 列表 */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

// ==================== 自定义形状骨架屏 ====================

export interface CircleSkeletonProps extends SkeletonProps {
  /**
   * 大小
   */
  size?: number | string
}

export function CircleSkeleton({ size = 40, className = '' }: CircleSkeletonProps) {
  return (
    <Skeleton
      className={clsx('rounded-full', className)}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
    />
  )
}

// ==================== 加载状态包装器 ====================

export interface WithSkeletonProps {
  /**
   * 是否加载中
   */
  loading: boolean

  /**
   * 骨架屏组件
   */
  skeleton: React.ReactNode

  /**
   * 子元素
   */
  children: React.ReactNode
}

export function WithSkeleton({ loading, skeleton, children }: WithSkeletonProps) {
  if (loading) {
    return <>{skeleton}</>
  }

  return <>{children}</>
}

// ==================== 延迟骨架屏 ====================

export interface DelayedSkeletonProps extends SkeletonProps {
  /**
   * 延迟时间（毫秒）
   */
  delay?: number

  /**
   * 最小显示时间（毫秒）
   */
  minDisplayTime?: number
}

export function DelayedSkeleton({
  loading = true,
  delay = 200,
  minDisplayTime = 500,
  children,
}: DelayedSkeletonProps) {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    let delayTimer: NodeJS.Timeout
    let minTimer: NodeJS.Timeout

    if (loading) {
      // 延迟显示骨架屏
      delayTimer = setTimeout(() => {
        setShowSkeleton(true)

        // 最小显示时间
        minTimer = setTimeout(() => {
          setMinTimeElapsed(true)
        }, minDisplayTime)
      }, delay)
    } else if (showSkeleton && minTimeElapsed) {
      // 加载完成且最小时间已过
      setShowSkeleton(false)
      setMinTimeElapsed(false)
    }

    return () => {
      clearTimeout(delayTimer)
      clearTimeout(minTimer)
    }
  }, [loading, delay, minDisplayTime, showSkeleton, minTimeElapsed])

  if (showSkeleton) {
    return <Skeleton loading={true} />
  }

  return <>{children}</>
}

// ==================== 全局样式注入 ====================

export function SkeletonStyles() {
  return (
    <style jsx global>{`
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .animate-shimmer {
        animation: shimmer 1.5s infinite linear;
      }
    `}</style>
  )
}

export default Skeleton
