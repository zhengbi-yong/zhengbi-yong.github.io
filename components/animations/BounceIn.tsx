'use client'

import { motion, useInView } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { getMobileOptimizedAnimationParams } from '@/lib/utils/device'

interface BounceInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  whileInView?: boolean
}

/**
 * BounceIn - 弹跳进入动画预设组件
 * 使用 Framer Motion 实现平滑的弹跳进入效果
 */
export default function BounceIn({
  children,
  delay = 0,
  duration = 0.6,
  className = '',
  whileInView = false,
}: BounceInProps) {
  // 移动设备优化：缩短动画时长
  const { duration: optimizedDuration } = getMobileOptimizedAnimationParams(0, duration)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // 使用 spring 动画类型实现弹跳效果
  const animationProps = {
    initial: { opacity: 0, scale: 0.3, y: -50 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: {
      delay,
      duration: optimizedDuration,
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
    },
  }

  if (whileInView) {
    // 使用 useInView hook 来检测元素是否在视口中
    // 如果已经在视口中，直接显示（不等待动画）
    const shouldAnimate = isInView

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, scale: 0.3, y: -50 }}
        animate={
          shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.3, y: -50 }
        }
        transition={{
          delay,
          duration: optimizedDuration,
          type: 'spring' as const,
          stiffness: 200,
          damping: 15,
        }}
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
