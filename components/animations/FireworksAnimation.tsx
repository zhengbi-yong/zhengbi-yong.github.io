'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface FireworksAnimationProps {
  className?: string
  autoPlay?: boolean
  interval?: number
}

/**
 * FireworksAnimation - 烟花动画组件
 * 使用 canvas-confetti 实现烟花爆炸效果
 */
export default function FireworksAnimation({
  className = '',
  autoPlay = true,
  interval = 3000,
}: FireworksAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!autoPlay || !canvasRef.current) return

    const canvas = canvasRef.current

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resize()
    window.addEventListener('resize', resize)

    const triggerFirework = () => {
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = rect.left + rect.width * (0.2 + Math.random() * 0.6)
      const y = rect.top + rect.height * (0.2 + Math.random() * 0.6)

      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#FFD93D']

      // 主爆炸
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: colors,
        gravity: 0.8,
        ticks: 200,
        useWorker: false, // 禁用 Worker 以避免 CSP 问题
      })

      // 延迟小爆炸
      setTimeout(() => {
        confetti({
          particleCount: 30,
          angle: 60,
          spread: 55,
          origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight,
          },
          colors: colors,
          useWorker: false, // 禁用 Worker 以避免 CSP 问题
        })
        confetti({
          particleCount: 30,
          angle: 120,
          spread: 55,
          origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight,
          },
          colors: colors,
          useWorker: false, // 禁用 Worker 以避免 CSP 问题
        })
      }, 200)
    }

    // 立即触发一次
    triggerFirework()

    // 设置定时器
    intervalRef.current = setInterval(triggerFirework, interval)

    return () => {
      window.removeEventListener('resize', resize)
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
}

