'use client'

import { useEffect } from 'react'

/**
 * 访客追踪组件
 * 在页面加载时自动记录访客IP和地理位置
 * 可以放在根布局或需要追踪的页面中
 */
export default function VisitorTracker() {
  useEffect(() => {
    // 延迟执行，避免阻塞页面加载
    const timer = setTimeout(() => {
      fetch('/api/visitor', {
        method: 'POST',
      }).catch((error) => {
        // 静默失败，不影响用户体验
        console.debug('[VisitorTracker] Failed to record visitor:', error)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return null // 此组件不渲染任何内容
}
