'use client'

import { useRef, ReactNode } from 'react'
import { useGSAP } from '@/components/hooks/useGSAP'
import { getGSAPMobileOptimizedParams } from '@/lib/utils/gsap'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface ScrollRevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale'
  delay?: number
  duration?: number
  distance?: number
  className?: string
  trigger?: string | Element
  start?: string
  once?: boolean
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 1,
  distance = 50,
  className = '',
  trigger,
  start = 'top 80%',
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { duration: optimizedDuration } = getGSAPMobileOptimizedParams(duration)

  useGSAP(() => {
    if (!ref.current) return

    const element = ref.current
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const optimizedDistance = isMobile ? distance * 0.5 : distance

    // 根据方向设置初始状态
    const getInitialState = () => {
      switch (direction) {
        case 'up':
          return { y: optimizedDistance, opacity: 0 }
        case 'down':
          return { y: -optimizedDistance, opacity: 0 }
        case 'left':
          return { x: optimizedDistance, opacity: 0 }
        case 'right':
          return { x: -optimizedDistance, opacity: 0 }
        case 'fade':
          return { opacity: 0 }
        case 'scale':
          return { scale: 0.8, opacity: 0 }
        default:
          return { y: optimizedDistance, opacity: 0 }
      }
    }

    const initialState = getInitialState()

    // 设置初始状态
    gsap.set(element, initialState)

    // 创建动画
    const animation = gsap.to(element, {
      ...(direction === 'scale' ? { scale: 1 } : {}),
      ...(direction !== 'fade' && direction !== 'scale' ? { x: 0, y: 0 } : {}),
      opacity: 1,
      duration: optimizedDuration,
      delay,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: trigger || element,
        start: start || 'top 85%',
        end: 'bottom 20%',
        once,
        toggleActions: 'play none none none',
        markers: false, // 开发时可以设置为 true 来调试
      },
    })

    // 如果元素已经在视口中，立即触发动画
    // 延迟一点确保 ScrollTrigger 已初始化
    setTimeout(() => {
      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const triggerPoint = viewportHeight * 0.85
      const isInViewport = rect.top < triggerPoint && rect.bottom > viewportHeight * 0.2

      if (isInViewport && once) {
        // 直接播放动画到结束
        animation.progress(1)
      }
    }, 200)

    return animation
  }, [direction, delay, duration, distance, trigger, start, once])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
