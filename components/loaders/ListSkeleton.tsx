'use client'

import Skeleton from './Skeleton'
import { cn } from '@/components/lib/utils'

interface ListSkeletonProps {
  className?: string
  itemCount?: number
}

/**
 * ListSkeleton - 列表骨架屏组件
 * 用于列表内容加载时的占位符
 */
export default function ListSkeleton({
  className,
  itemCount = 5,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700">
          {/* 标题骨架 */}
          <Skeleton height={20} width="60%" />

          {/* 描述骨架 */}
          <Skeleton height={16} width="80%" />

          {/* 元信息骨架 */}
          <div className="flex items-center gap-4">
            <Skeleton height={14} width={100} />
            <Skeleton height={14} width={80} />
          </div>
        </div>
      ))}
    </div>
  )
}

