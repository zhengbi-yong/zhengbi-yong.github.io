'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/components/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: string
}

/**
 * Spinner - 旋转加载器组件
 * 使用 lucide-react 的 Loader2 图标实现旋转动画
 */
export default function Spinner({ size = 'md', className, color }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const defaultColor = 'text-primary-500 dark:text-primary-400'

  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        color || defaultColor,
        className
      )}
      aria-label="加载中"
    />
  )
}

