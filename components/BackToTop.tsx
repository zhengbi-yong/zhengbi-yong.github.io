'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/components/ui/button'

interface BackToTopProps {
  className?: string
  threshold?: number
  smooth?: boolean
  showAtBottom?: boolean
}

/**
 * BackToTop - 返回顶部按钮组件
 * 当页面滚动超过一定距离时显示按钮，点击按钮平滑滚动到页面顶部
 */
export default function BackToTop({
  className = '',
  threshold = 400,
  smooth = true,
  showAtBottom = false,
}: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tickingRef = useRef(false)

  // 使用useCallback缓存updateVisibility函数
  const updateVisibility = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const documentHeight = document.documentElement.scrollHeight
    const windowHeight = window.innerHeight

    // 检查是否超过阈值或是否在底部（如果启用 showAtBottom）
    const isOverThreshold = scrollTop > threshold
    const isAtBottom = showAtBottom && scrollTop + windowHeight >= documentHeight - 10

    setIsVisible(isOverThreshold || isAtBottom)
    tickingRef.current = false
  }, [threshold, showAtBottom])

  // 使用useCallback缓存handleScroll函数
  const handleScroll = useCallback(() => {
    if (!tickingRef.current) {
      window.requestAnimationFrame(updateVisibility)
      tickingRef.current = true
    }
  }, [updateVisibility])

  // 使用useCallback缓存scrollToTop函数
  const scrollToTop = useCallback(() => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } else {
      window.scrollTo(0, 0)
    }
  }, [smooth])

  useEffect(() => {
    // 初始检查
    updateVisibility()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateVisibility, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [handleScroll, updateVisibility])

  if (!isVisible) return null

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed right-8 bottom-8 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${className}`}
      aria-label="返回顶部"
      title="返回顶部"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
