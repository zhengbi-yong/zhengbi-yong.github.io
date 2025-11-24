'use client'

import { motion, useInView } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { getMobileOptimizedAnimationParams } from '@/lib/utils/device'

interface ScaleInProps {
  children: ReactNode
  delay?: number
  duration?: number
  scale?: number
  className?: string
  whileInView?: boolean
}

/**
 * ScaleIn - 缩放进入动画预设组件
 * 使用 Framer Motion 实现平滑的缩放进入效果
 */
export default function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  scale = 0.8,
  className = '',
  whileInView = false,
}: ScaleInProps) {
  // 移动设备优化：缩短动画时长
  const { duration: optimizedDuration } = getMobileOptimizedAnimationParams(0, duration)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const animationProps = {
    initial: { opacity: 0, scale },
    animate: { opacity: 1, scale: 1 },
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
        initial={{ opacity: 0, scale }}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale }}
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
