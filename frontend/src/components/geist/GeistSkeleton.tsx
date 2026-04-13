'use client'

import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type GeistSkeletonProps = HTMLAttributes<HTMLDivElement>

function GeistSkeleton({ className, ...props }: GeistSkeletonProps) {
  return <div className={cn('geist-skeleton', className)} {...props} />
}

function GeistSkeletonText({ className, ...props }: GeistSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      <GeistSkeleton className="h-4 w-full" />
      <GeistSkeleton className="h-4 w-4/5" />
      <GeistSkeleton className="h-4 w-3/5" />
    </div>
  )
}

function GeistSkeletonCard({ className, ...props }: GeistSkeletonProps) {
  return (
    <div
      className={cn('space-y-3 rounded-lg border border-[var(--geist-border)] p-4', className)}
      {...props}
    >
      <GeistSkeleton className="h-32 w-full rounded-md" />
      <GeistSkeleton className="h-4 w-3/4" />
      <GeistSkeleton className="h-4 w-1/2" />
    </div>
  )
}

export { GeistSkeleton, GeistSkeletonText, GeistSkeletonCard }
