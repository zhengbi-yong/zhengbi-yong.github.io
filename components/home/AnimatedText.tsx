'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

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
 */
export default function AnimatedText({
  content,
  delay = 0.1,
  duration = 0.5,
  stagger = 0.08,
  className = '',
}: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 延迟显示，确保组件已挂载
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay])

  const words = content.split(' ')

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration,
            delay: delay + index * stagger,
            ease: 'easeOut',
          }}
          className="inline-block"
        >
          {word}
          {index < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </span>
  )
}

