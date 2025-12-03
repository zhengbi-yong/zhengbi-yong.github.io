'use client'

import { memo, useEffect, useState, useCallback } from 'react'
import { cn } from './lib/utils'
import styles from './BackToTop.module.css'

interface BackToTopProps {
  className?: string
  threshold?: number
}

/**
 * BackToTop - 返回顶部按钮组件
 * 基于提供的 Astro BackToTop 组件转换而来
 */
const BackToTop = memo(function BackToTop({
  className = '',
  threshold = 300,
}: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false)

  // 更新按钮可见性
  const updateVisibility = useCallback(() => {
    if (window.scrollY > threshold) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [threshold])

  // 平滑滚动到顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    // 初始检查
    updateVisibility()

    // 滚动事件监听
    window.addEventListener('scroll', updateVisibility, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateVisibility)
    }
  }, [updateVisibility])

  return (
    <button
      id="back-to-top"
      onClick={scrollToTop}
      className={cn(
        styles.backToTop,
        isVisible && styles.visible,
        'dark:bg-indigo-300 dark:text-gray-900 dark:hover:bg-indigo-300 dark:shadow-[0_4px_12px_rgba(196,181,253,0.3)] dark:hover:shadow-[0_8px_20px_rgba(196,181,253,0.4)]',
        className
      )}
      aria-label="Back to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  )
})

BackToTop.displayName = 'BackToTop'

export default BackToTop
