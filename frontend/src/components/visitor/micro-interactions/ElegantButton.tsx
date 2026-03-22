/**
 * 优雅的按钮组件
 * - 悬停时轻微放大（102%）
 * - 点击时涟漪效果
 * - 流畅的状态过渡
 */

'use client'

import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ElegantButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ElegantButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ElegantButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantStyles = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 shadow-visitor-soft hover:shadow-visitor-glow',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800',
  }

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center',
        'font-medium rounded-visitor-md',
        'transition-all duration-300 ease-visitor',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
