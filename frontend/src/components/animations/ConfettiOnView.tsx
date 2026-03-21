'use client'

import { memo, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiOnViewProps {
  className?: string
  particleCount?: number
  spread?: number
  colors?: string[]
  once?: boolean
  delay?: number
}

/**
 * ConfettiOnView - 进入视口时触发彩带效果
 * 当元素进入视口时，触发一次性的彩带庆祝效果
 */
const ConfettiOnView = memo(function ConfettiOnView({
  className = '',
  particleCount = 100,
  spread = 70,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#FFD93D'],
  once = true,
  delay = 500,
}: ConfettiOnViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const hasTriggeredRef = useRef(false)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    // 使用 Intersection Observer 检测元素是否进入视口
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            if (once) {
              observer.disconnect()
            }
          } else if (!once) {
            setIsInView(false)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px', // 提前50px触发
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [once])

  useEffect(() => {
    if (!isInView || (once && hasTriggeredRef.current)) return undefined

    hasTriggeredRef.current = true

    // 延迟触发，让用户看到元素后再触发彩带
    const timer = setTimeout(() => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      // 从元素位置触发多个彩带效果
      const triggerConfetti = (angle: number, confettiDelay: number = 0) => {
        setTimeout(() => {
          confetti({
            particleCount: particleCount,
            angle: angle,
            spread: spread,
            origin: {
              x: x / window.innerWidth,
              y: y / window.innerHeight,
            },
            colors: colors,
            gravity: 0.8,
            ticks: 200,
            useWorker: false,
          })
        }, confettiDelay)
      }

      // 从中心触发（向上）
      triggerConfetti(90, 0)
      // 从左侧触发
      triggerConfetti(60, 100)
      // 从右侧触发
      triggerConfetti(120, 100)
      // 从上方触发（多个角度）
      triggerConfetti(45, 200)
      triggerConfetti(135, 200)
      // 额外的大爆炸效果
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight,
          },
          colors: colors,
          gravity: 0.6,
          ticks: 300,
          useWorker: false,
        })
      }, 400)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [isInView, once, particleCount, spread, colors, delay])

  // 返回一个最小高度的 div，确保能够被检测到
  return <div ref={ref} className={`${className} min-h-[1px] w-full`} />
})

ConfettiOnView.displayName = 'ConfettiOnView'

export default ConfettiOnView
