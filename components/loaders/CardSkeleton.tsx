'use client'

import Skeleton from './Skeleton'
import { cn } from '@/components/lib/utils'

interface CardSkeletonProps {
  className?: string
  showImage?: boolean
}

/**
 * CardSkeleton - 卡片骨架屏组件
 * 用于卡片内容加载时的占位符
 */
export default function CardSkeleton({
  className,
  showImage = true,
}: CardSkeletonProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      {/* 可选的图片骨架 */}
      {showImage && <Skeleton height={200} className="w-full rounded-none" />}

      {/* 卡片内容 */}
      <div className="space-y-4 p-6">
        {/* 标题骨架 */}
        <Skeleton height={24} width="70%" />

        {/* 描述骨架 */}
        <div className="space-y-2">
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="95%" />
          <Skeleton height={16} width="90%" />
        </div>

        {/* 底部操作区骨架 */}
        <div className="flex items-center justify-between pt-4">
          <Skeleton height={40} width={100} />
          <Skeleton height={40} width={80} />
        </div>
      </div>
    </div>
  )
}

