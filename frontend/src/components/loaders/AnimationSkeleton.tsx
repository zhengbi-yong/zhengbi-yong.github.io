'use client'

import { memo } from 'react'
import Skeleton from './Skeleton'

interface AnimationSkeletonProps {
  className?: string
  height?: string | number
}

export const AnimationSkeleton = memo(function AnimationSkeleton({
  className,
  height,
}: AnimationSkeletonProps) {
  return <Skeleton className={className} height={height} role="status" aria-label="Loading" />
})

AnimationSkeleton.displayName = 'AnimationSkeleton'
