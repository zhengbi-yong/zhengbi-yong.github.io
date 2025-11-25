'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * PageTransition - 页面过渡动画组件
 * 使用 AnimatePresence 实现路由级别的过渡动画
 * 优化：避免与页面内动画组件冲突，只在路由切换时触发
 */
export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // 首次渲染后，标记为 false
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
    prevPathnameRef.current = pathname
  }, [pathname])

  // 首次渲染时不显示动画，避免与页面内动画冲突
  if (isFirstRender.current) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' as const }}
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
