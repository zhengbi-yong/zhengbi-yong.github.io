'use client'

import Skeleton from './Skeleton'
import Spinner from './Spinner'
import { cn } from '@/components/lib/utils'

interface ImageSkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  aspectRatio?: string
  showSpinner?: boolean
}

/**
 * ImageSkeleton - 图片骨架屏组件
 * 用于图片加载时的占位符
 */
export default function ImageSkeleton({
  className,
  width,
  height,
  aspectRatio,
  showSpinner = false,
}: ImageSkeletonProps) {
  const style: React.CSSProperties = {}
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }
  if (aspectRatio) {
    style.aspectRatio = aspectRatio
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={style}
      role="status"
      aria-label="图片加载中"
    >
      <Skeleton className="h-full w-full" />
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      )}
    </div>
  )
}

