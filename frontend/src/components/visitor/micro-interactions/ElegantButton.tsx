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
      'bg-primary text-white hover:bg-primary shadow-visitor-soft hover:shadow-visitor-glow',
    secondary:
      'bg-secondary text-foreground hover:bg-gray-200 dark:bg-card dark:text-foreground dark:hover:bg-secondary',
    ghost: 'bg-transparent text-foreground hover:bg-secondary dark:text-foreground dark:hover:bg-gray-800',
  }

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center',
        'font-medium rounded-visitor-md',
        'transition-all duration-300 ease-visitor',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
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
