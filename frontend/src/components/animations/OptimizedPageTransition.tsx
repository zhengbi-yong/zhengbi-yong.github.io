'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * OptimizedPageTransition - 优化的页面过渡动画组件
 * 针对书架到分类页面的导航进行了性能优化
 */
export default function OptimizedPageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  const prevPathnameRef = useRef(pathname)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
    prevPathnameRef.current = pathname
  }, [pathname])

  // 检测是否是从书架到分类页面的导航
  const isFromBookshelf = prevPathnameRef.current === '/' && pathname.includes('/blog/category/')

  // 首次渲染或不相关页面切换时直接渲染，避免不必要的动画
  if (isFirstRender.current || (!isFromBookshelf && !pathname.includes('/blog/category/'))) {
    return <div className={className}>{children}</div>
  }

  // 为书架到分类的导航使用优化的快速过渡
  return (
    <motion.div
      key={pathname}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.15, // 减少动画时长
        ease: 'easeOut' as const,
      }}
      style={{
        willChange: 'opacity', // 只优化 opacity 属性
      }}
    >
      {children}
    </motion.div>
  )
}
