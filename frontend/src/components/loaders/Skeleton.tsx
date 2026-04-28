'use client'

import { cn } from '@/components/lib/utils'

interface SkeletonProps {
  className?: string
  height?: number | string
  width?: number | string
  rounded?: boolean
  role?: string
  'aria-label'?: string
}

/**
 * Skeleton - 基础骨架屏组件
 * 提供 shimmer 动画效果的占位符，用于内容加载时的显示
 */
export default function Skeleton({
  className,
  height,
  width,
  rounded,
  role,
  'aria-label': ariaLabel,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
      }}
      role={role}
      aria-label={ariaLabel}
    />
  )
}
