'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SlideInProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  distance?: number
  className?: string
  whileInView?: boolean
}

/**
 * SlideIn - 滑入动画预设组件
 * 使用 Framer Motion 实现平滑的滑入效果
 */
export default function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 20,
  className = '',
  whileInView = false,
}: SlideInProps) {
  // 根据方向设置初始和最终位置
  const getDirectionValues = () => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 }
      case 'down':
        return { y: -distance, x: 0 }
      case 'left':
        return { x: distance, y: 0 }
      case 'right':
        return { x: -distance, y: 0 }
      default:
        return { y: distance, x: 0 }
    }
  }

  const { x: initialX, y: initialY } = getDirectionValues()

  const animationProps = {
    initial: { opacity: 0, x: initialX, y: initialY },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { delay, duration, ease: 'easeOut' as const },
  }

  if (whileInView) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, x: initialX, y: initialY }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ delay, duration, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div className={className} {...animationProps}>
      {children}
    </motion.div>
  )
}
