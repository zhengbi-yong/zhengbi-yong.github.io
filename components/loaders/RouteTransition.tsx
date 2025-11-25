'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { getMobileOptimizedAnimationParams } from '@/lib/utils/device'
import { cn } from '@/components/lib/utils'

interface RouteTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * RouteTransition - 路由过渡组件
 * 使用 Framer Motion 实现页面切换过渡动画
 */
export default function RouteTransition({ children, className }: RouteTransitionProps) {
  const { distance } = getMobileOptimizedAnimationParams(20, 0.3)

  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -distance }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
