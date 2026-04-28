'use client'

import { cn } from '@/components/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton - 基础骨架屏组件
 * 提供 shimmer 动画效果的占位符，用于内容加载时的显示
 */
export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  )
}
