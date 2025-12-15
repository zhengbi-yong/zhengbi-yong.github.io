'use client'

import { motion, useInView } from 'framer-motion'
import { ReactNode, useRef, useState, useEffect } from 'react'
import { getMobileOptimizedAnimationParams } from '@/lib/utils/device'

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
  // 使用 useState 确保服务器端和客户端初始值一致
  const [optimizedDistance, setOptimizedDistance] = useState(distance)
  const [optimizedDuration, setOptimizedDuration] = useState(duration)

  // 在客户端挂载后应用移动设备优化，避免 hydration mismatch
  useEffect(() => {
    const { distance: optDistance, duration: optDuration } = getMobileOptimizedAnimationParams(
      distance,
      duration
    )
    setOptimizedDistance(optDistance)
    setOptimizedDuration(optDuration)
  }, [distance, duration])

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // 根据方向设置初始和最终位置（使用优化后的距离）
  const getDirectionValues = () => {
    switch (direction) {
      case 'up':
        return { y: optimizedDistance, x: 0 }
      case 'down':
        return { y: -optimizedDistance, x: 0 }
      case 'left':
        return { x: optimizedDistance, y: 0 }
      case 'right':
        return { x: -optimizedDistance, y: 0 }
      default:
        return { y: optimizedDistance, x: 0 }
    }
  }

  const { x: initialX, y: initialY } = getDirectionValues()

  const animationProps = {
    initial: { opacity: 0, x: initialX, y: initialY },
    animate: { opacity: 1, x: 0, y: 0 },
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
        initial={{ opacity: 0, x: initialX, y: initialY }}
        animate={
          shouldAnimate ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: initialX, y: initialY }
        }
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
