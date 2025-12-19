'use client'

import Skeleton from './Skeleton'
import { cn } from '@/components/lib/utils'

interface ArticleSkeletonProps {
  className?: string
  showImage?: boolean
  showTags?: boolean
}

/**
 * ArticleSkeleton - 文章骨架屏组件
 * 用于文章内容加载时的占位符
 */
export default function ArticleSkeleton({
  className,
  showImage = true,
  showTags = true,
}: ArticleSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 标题骨架 */}
      <div className="space-y-2">
        <Skeleton height={32} width="80%" />
        <Skeleton height={24} width="60%" />
      </div>

      {/* 可选的图片骨架 */}
      {showImage && <Skeleton height={200} className="w-full" />}

      {/* 元信息骨架 */}
      <div className="flex items-center gap-4">
        <Skeleton height={20} width={120} />
        <Skeleton height={20} width={100} />
      </div>

      {/* 内容骨架 */}
      <div className="space-y-3">
        <Skeleton height={16} width="100%" />
        <Skeleton height={16} width="100%" />
        <Skeleton height={16} width="95%" />
        <Skeleton height={16} width="100%" />
        <Skeleton height={16} width="90%" />
      </div>

      {/* 可选的标签骨架 */}
      {showTags && (
        <div className="flex flex-wrap gap-2">
          <Skeleton height={24} width={60} rounded />
          <Skeleton height={24} width={80} rounded />
          <Skeleton height={24} width={70} rounded />
        </div>
      )}
    </div>
  )
}
