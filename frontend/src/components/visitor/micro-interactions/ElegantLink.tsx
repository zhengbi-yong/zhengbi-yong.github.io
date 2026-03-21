/**
 * 优雅的链接组件
 * - 悬停时下划线从左到右展开
 * - 颜色渐变
 * - 流畅的动画过渡
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ElegantLinkProps {
  href: string
  children: ReactNode
  className?: string
  external?: boolean
}

export function ElegantLink({
  href,
  children,
  className = '',
  external = false,
}: ElegantLinkProps) {
  const linkContent = (
    <>
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
        initial={{ width: 0 }}
        whileHover={{ width: '100%' }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </>
  )

  const classes = cn(
    'relative inline-block',
    'text-gray-900 dark:text-gray-100',
    'hover:text-indigo-600 dark:hover:text-indigo-400',
    'transition-colors duration-200',
    className
  )

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {linkContent}
      </a>
    )
  }

  return <Link href={href} className={classes}>{linkContent}</Link>
}

/**
 * 带图标的链接
 */
interface IconLinkProps {
  href: string
  icon: ReactNode
  children: ReactNode
  className?: string
  external?: boolean
}

export function IconLink({
  href,
  icon,
  children,
  className = '',
  external = false,
}: IconLinkProps) {
  return (
    <ElegantLink href={href} className={cn('inline-flex items-center gap-2', className)} external={external}>
      {icon}
      <span>{children}</span>
    </ElegantLink>
  )
}
