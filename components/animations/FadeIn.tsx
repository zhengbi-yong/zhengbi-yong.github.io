'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  whileInView?: boolean
}

/**
 * FadeIn - 淡入动画预设组件
 * 使用 Framer Motion 实现平滑的淡入效果
 */
export default function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
  whileInView = false,
}: FadeInProps) {
  const animationProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay, duration, ease: 'easeOut' as const },
  }

  if (whileInView) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ delay, duration, ease: 'easeOut' as const }}
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
