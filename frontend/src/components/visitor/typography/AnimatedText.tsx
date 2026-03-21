/**
 * 优雅的文字渐显动画
 * - 逐字显示
 * - 错开动画
 * - 模糊淡入效果
 */

'use client'

import { motion } from 'framer-motion'

interface AnimatedTextProps {
  text: string
  delay?: number
  className?: string
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export function AnimatedText({
  text,
  delay = 0,
  className = '',
  tag = 'span',
}: AnimatedTextProps) {
  const letters = text.split('')

  // 默认动画变体
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay },
    }),
  }

  const child = {
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
    hidden: {
      opacity: 0,
      filter: 'blur(10px)',
      y: 20,
    },
  }

  const MotionTag = motion[tag]

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span variants={child} key={index}>
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </MotionTag>
  )
}

/**
 * 优雅的段落渐显动画
 */
interface AnimatedParagraphProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function AnimatedParagraph({
  children,
  delay = 0,
  className = '',
}: AnimatedParagraphProps) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.p>
  )
}

/**
 * 优雅的标题渐显动画
 */
interface AnimatedHeadingProps {
  children: React.ReactNode
  delay?: number
  className?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export function AnimatedHeading({
  children,
  delay = 0,
  className = '',
  level = 1,
}: AnimatedHeadingProps) {
  // 创建动态 motion 组件
  const MotionTag = motion[`h${level}` as keyof typeof motion]

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  )
}
