'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface AnimatedTextProps {
  content: string
  delay?: number
  duration?: number
  stagger?: number
  className?: string
}

/**
 * AnimatedText - 逐字显示动画组件
 * 参考 Astro 项目的 AnimatedText 组件
 * 使用 inView 检测，支持 blur 和 translateY 动画
 */
export default function AnimatedText({
  content,
  delay = 0,
  duration = 0.6,
  stagger = 0.1,
  className = '',
}: AnimatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const words = content.split(' ')

  // 容器动画变体
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  // 单词动画变体
  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 10,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration,
        ease: 'easeOut' as const,
      },
    },
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block will-change-transform"
          style={{ display: 'inline-block' }}
        >
          {word}
          {index < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.span>
  )
}

