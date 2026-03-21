'use client'

import { memo, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiAnimationProps {
  className?: string
  autoPlay?: boolean
  interval?: number
}

/**
 * ConfettiAnimation - 彩带动画组件
 * 使用 canvas-confetti 库实现高性能彩带效果
 */
const ConfettiAnimation = memo(function ConfettiAnimation({
  className = '',
  autoPlay = true,
  interval = 2000,
}: ConfettiAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    if (!autoPlay || !canvasRef.current) return undefined

    const canvas = canvasRef.current

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resize()
    window.addEventListener('resize', resize)

    // 初始化页面可见性状态
    isVisibleRef.current = !document.hidden

    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      const wasVisible = isVisibleRef.current
      isVisibleRef.current = !document.hidden

      if (!isVisibleRef.current) {
        // 页面不可见时暂停定时器
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (wasVisible !== isVisibleRef.current && autoPlay) {
        // 页面重新可见时恢复定时器
        intervalRef.current = setInterval(triggerConfetti, interval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

  const triggerConfetti = () => {
      if (!canvas || !isVisibleRef.current) return undefined

      const rect = canvas.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      confetti({
        particleCount: 50,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
        useWorker: false, // 禁用 Worker 以避免 CSP 问题
      })
    }

    // 立即触发一次
    triggerConfetti()

    // 设置定时器
    intervalRef.current = setInterval(triggerConfetti, interval)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoPlay, interval])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  )
})

ConfettiAnimation.displayName = 'ConfettiAnimation'

export default ConfettiAnimation
