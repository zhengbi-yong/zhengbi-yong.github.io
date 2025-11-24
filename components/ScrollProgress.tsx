'use client'

import { useEffect, useState } from 'react'

interface ScrollProgressProps {
  className?: string
  height?: number
  color?: string
  position?: 'top' | 'bottom'
}

/**
 * ScrollProgress - 滚动进度指示器组件
 * 显示页面滚动进度（0-100%）
 */
export default function ScrollProgress({
  className = '',
  height = 2,
  color,
  position = 'top',
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // 节流函数，限制 scroll 事件处理频率
    let ticking = false

    const updateProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollableHeight = documentHeight - windowHeight

      if (scrollableHeight > 0) {
        const percentage = (scrollTop / scrollableHeight) * 100
        setProgress(Math.min(100, Math.max(0, percentage)))
      } else {
        setProgress(0)
      }

      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress)
        ticking = true
      }
    }

    // 初始计算
    updateProgress()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updateProgress, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  // 获取进度条颜色
  const getProgressColor = () => {
    if (color) return color

    // 根据主题自动选择颜色
    const isDarkMode = document.documentElement.classList.contains('dark')
    return isDarkMode ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)' // blue-500
  }

  const positionClass = position === 'top' ? 'top-0' : 'bottom-0'

  return (
    <div
      className={`fixed right-0 left-0 z-50 ${positionClass} ${className}`}
      style={{ height: `${height}px` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="页面滚动进度"
    >
      <div
        className="h-full transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: getProgressColor(),
        }}
      />
    </div>
  )
}
