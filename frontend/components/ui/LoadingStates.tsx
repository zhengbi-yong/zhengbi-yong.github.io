'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// 骨架屏组件
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
      {...props}
    />
  )
}

// 文章卡片骨架屏
export function ArticleCardSkeleton() {
  return (
    <div className="group flex flex-col space-y-2">
      {/* 图片占位 */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* 内容区域 */}
      <div className="space-y-2">
        {/* 标题 */}
        <Skeleton className="h-6 w-3/4" />

        {/* 描述 */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        {/* 标签和日期 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

// 列表项骨架屏
export function ListItemSkeleton() {
  return (
    <div className="border-b border-gray-200 py-4 dark:border-gray-700">
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}

// 表格骨架屏
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="mb-3 border-b border-gray-200 pb-3 dark:border-gray-700">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-100 py-3 dark:border-gray-800">
          <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-16" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 页面加载器
export function PageLoader({
  size = 'default',
  text = 'Loading...',
  className,
}: {
  size?: 'sm' | 'default' | 'lg'
  text?: string
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
        {text && <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>}
      </div>
    </div>
  )
}

// 按钮加载器
export function ButtonLoader({
  text = 'Loading...',
  className,
}: {
  text?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  )
}

// 进度条
export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color = 'blue',
}: {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: 'blue' | 'green' | 'red' | 'yellow'
}) {
  const percentage = Math.min((value / max) * 100, 100)

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// 空状态组件
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('py-12 text-center', className)}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">{description}</p>
      {action}
    </div>
  )
}

// 错误状态组件
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again later or contact support if the problem persists.',
  action,
  className,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <EmptyState
      icon={
        <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      }
      title={title}
      description={description}
      action={action}
      className={className}
    />
  )
}
