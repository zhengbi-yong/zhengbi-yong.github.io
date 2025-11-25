'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

interface ExplosionAnimationProps {
  className?: string
  autoPlay?: boolean
  interval?: number
}

/**
 * ExplosionAnimation - 爆炸动画组件
 * 使用 Canvas API 实现高性能爆炸粒子效果
 */
export default function ExplosionAnimation({
  className = '',
  autoPlay = true,
  interval = 2000,
}: ExplosionAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const colors = useMemo(
    () => ['#FF6B6B', '#FF8E53', '#FF6B9D', '#C44569', '#F8B500', '#FFD93D'],
    []
  )

  const createExplosion = useCallback(
    (x: number, y: number) => {
      const particleCount = 50
      const newParticles: Particle[] = []

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
        const speed = 2 + Math.random() * 4
        const life = 30 + Math.random() * 40

        newParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }

      particlesRef.current.push(...newParticles)
    },
    [colors]
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 更新和绘制粒子
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.2 // 重力
      particle.vx *= 0.98 // 阻力
      particle.vy *= 0.98
      particle.life--

      if (particle.life <= 0) return false

      const alpha = particle.life / particle.maxLife
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      return true
    })

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [])

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

    if (autoPlay) {
      const triggerExplosion = () => {
        const rect = canvas.getBoundingClientRect()
        const x = rect.width * (0.3 + Math.random() * 0.4)
        const y = rect.height * (0.3 + Math.random() * 0.4)
        createExplosion(x, y)
      }

      // 立即触发一次
      triggerExplosion()

      // 设置定时器
      intervalRef.current = setInterval(triggerExplosion, interval)

      // 开始动画循环
      animate()
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate, autoPlay, createExplosion, interval])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  )
}
