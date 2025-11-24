'use client'

import { motion, useInView } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { getMobileOptimizedAnimationParams } from '@/lib/utils/device'

interface RotateInProps {
  children: ReactNode
  delay?: number
  duration?: number
  angle?: number
  className?: string
  whileInView?: boolean
}

/**
 * RotateIn - 旋转进入动画预设组件
 * 使用 Framer Motion 实现平滑的旋转进入效果
 */
export default function RotateIn({
  children,
  delay = 0,
  duration = 0.5,
  angle = 180,
  className = '',
  whileInView = false,
}: RotateInProps) {
  // 移动设备优化：缩短动画时长
  const { duration: optimizedDuration } = getMobileOptimizedAnimationParams(0, duration)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const animationProps = {
    initial: { opacity: 0, rotate: -angle },
    animate: { opacity: 1, rotate: 0 },
    transition: { delay, duration: optimizedDuration, ease: 'easeOut' as const },
  }

  if (whileInView) {
    // 使用 useInView hook 来检测元素是否在视口中
    // 如果已经在视口中，直接显示（不等待动画）
    const shouldAnimate = isInView

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, rotate: -angle }}
        animate={shouldAnimate ? { opacity: 1, rotate: 0 } : { opacity: 0, rotate: -angle }}
        transition={{ delay, duration: optimizedDuration, ease: 'easeOut' as const }}
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
