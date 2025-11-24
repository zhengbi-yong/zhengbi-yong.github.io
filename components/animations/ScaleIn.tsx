'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

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
  const animationProps = {
    initial: { opacity: 0, scale },
    animate: { opacity: 1, scale: 1 },
    transition: { delay, duration, ease: 'easeOut' as const },
  }

  if (whileInView) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, scale }}
        whileInView={{ opacity: 1, scale: 1 }}
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
