'use client'

import { cn } from '@/components/lib/utils'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
}

/**
 * Skeleton - 骨架屏基础组件
 * 使用 Tailwind animate-pulse 实现脉冲动画效果
 */
export default function Skeleton({ className, width, height, rounded = true }: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div
      className={cn('animate-pulse bg-gray-200 dark:bg-gray-800', rounded && 'rounded', className)}
      style={style}
      aria-label="加载中"
      role="status"
    />
  )
}
