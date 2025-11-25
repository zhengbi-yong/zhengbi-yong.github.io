'use client'

import { useEffect, useRef } from 'react'

interface Sparkle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface SparklesAnimationProps {
  className?: string
  particleCount?: number
}

/**
 * SparklesAnimation - 闪烁动画组件
 * 使用 Canvas API 实现高性能闪烁粒子效果
 */
export default function SparklesAnimation({
  className = '',
  particleCount = 30,
}: SparklesAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparklesRef = useRef<Sparkle[]>([])
  const animationFrameRef = useRef<number | null>(null)

  const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#98D8C8']

  const createSparkle = (): Sparkle => {
    const canvas = canvasRef.current
    if (!canvas) {
      return {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        size: 0,
        color: '#FFD700',
      }
    }

    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: 60 + Math.random() * 60,
      maxLife: 60 + Math.random() * 60,
      size: 1 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }
  }

  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 确保有足够的粒子
    while (sparklesRef.current.length < particleCount) {
      sparklesRef.current.push(createSparkle())
    }

    // 更新和绘制粒子
    sparklesRef.current = sparklesRef.current
      .map((sparkle) => {
        sparkle.x += sparkle.vx
        sparkle.y += sparkle.vy
        sparkle.life--

        if (sparkle.life <= 0) {
          return createSparkle()
        }

        const alpha = Math.sin((sparkle.life / sparkle.maxLife) * Math.PI)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = sparkle.color
        ctx.shadowBlur = 10
        ctx.shadowColor = sparkle.color
        ctx.beginPath()
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        return sparkle
      })
      .filter((sparkle) => sparkle.life > 0)

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resize()
    window.addEventListener('resize', resize)

    // 初始化粒子
    for (let i = 0; i < particleCount; i++) {
      sparklesRef.current.push(createSparkle())
    }

    // 开始动画循环
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [particleCount])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  )
}
