/**
 * 优雅的文字渐显动画
 * - 逐字显示
 * - 错开动画
 * - 模糊淡入效果
 */

'use client'

import { motion, type Variants } from 'framer-motion'

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
    visible: () => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay },
    }),
  }

  const child: Variants = {
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
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

  const content = letters.map((letter, index) => (
    <motion.span variants={child} key={`${letter}-${index}`}>
      {letter === ' ' ? '\u00A0' : letter}
    </motion.span>
  ))

  switch (tag) {
    case 'h1':
      return (
        <motion.h1 className={className} variants={container} initial="hidden" animate="visible">
          {content}
        </motion.h1>
      )
    case 'h2':
      return (
        <motion.h2 className={className} variants={container} initial="hidden" animate="visible">
          {content}
        </motion.h2>
      )
    case 'h3':
      return (
        <motion.h3 className={className} variants={container} initial="hidden" animate="visible">
          {content}
        </motion.h3>
      )
    case 'p':
      return (
        <motion.p className={className} variants={container} initial="hidden" animate="visible">
          {content}
        </motion.p>
      )
    default:
      return (
        <motion.span className={className} variants={container} initial="hidden" animate="visible">
          {content}
        </motion.span>
      )
  }
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
  const headingProps = {
    className,
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 1,
      delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }

  switch (level) {
    case 1:
      return <motion.h1 {...headingProps}>{children}</motion.h1>
    case 2:
      return <motion.h2 {...headingProps}>{children}</motion.h2>
    case 3:
      return <motion.h3 {...headingProps}>{children}</motion.h3>
    case 4:
      return <motion.h4 {...headingProps}>{children}</motion.h4>
    case 5:
      return <motion.h5 {...headingProps}>{children}</motion.h5>
    default:
      return <motion.h6 {...headingProps}>{children}</motion.h6>
  }
}
