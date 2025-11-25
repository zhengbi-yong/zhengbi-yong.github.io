'use client'

import { memo } from 'react'
import Skeleton from './Skeleton'

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

