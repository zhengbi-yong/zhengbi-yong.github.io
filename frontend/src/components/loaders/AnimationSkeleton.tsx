'use client'

import { memo } from 'react'

interface AnimationSkeletonProps {
  className?: string
  height?: string | number
}

export const AnimationSkeleton = memo(function AnimationSkeleton({
  className = '',
  height = '200px',
}: AnimationSkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} style={{ height }} />
  )
})

AnimationSkeleton.displayName = 'AnimationSkeleton'
