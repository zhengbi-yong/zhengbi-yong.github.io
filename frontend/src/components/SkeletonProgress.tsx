'use client'

import { useEffect, useRef, useState } from 'react'
import { Progress } from '@/components/shadcn/ui/progress'
import { Skeleton } from '@/components/loaders'

interface SkeletonProgressProps {
  label?: string
  duration?: number
  className?: string
}

export default function SkeletonProgress({
  label = '模块加载中...',
  duration = 2000,
  className = '',
}: SkeletonProgressProps) {
  const [value, setValue] = useState(10)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(((now - start) / duration) * 100, 96)
      setValue(progress)
      if (progress < 96) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [duration])

  return (
    <div
      className={`w-full rounded-2xl border border-gray-200 p-4 dark:border-gray-800 ${className}`}
    >
      <p className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </div>
      <Progress value={value} className="h-2" />
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">请稍候，精彩内容正在准备</p>
    </div>
  )
}
