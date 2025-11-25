'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { isMobileDevice } from '@/lib/utils/device'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

/**
 * AnimatedSection - 滚动触发动画组件
 * 使用 Intersection Observer API 检测元素进入视口，触发淡入和滑动动画
 */
const AnimatedSection = memo(function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // 检测是否为移动设备（只检测一次）
    const isMobile = isMobileDevice()

    // 如果是移动设备，直接显示内容，不应用动画
    if (isMobile) {
      element.style.opacity = '1'
      element.style.transform = 'translateY(0) translateX(0)'
      return
    }

    // 根据方向设置初始 translate 值（使用内联样式，避免 Tailwind 动态类名问题）
    const translateDistance = isMobile ? 4 : 8 // 移动设备：4px，桌面：8px
    const duration = isMobile ? 300 : 500 // 移动设备：300ms，桌面：500ms

    const getInitialTransform = () => {
      switch (direction) {
        case 'up':
          return `translateY(${translateDistance}px)`
        case 'down':
          return `translateY(-${translateDistance}px)`
        case 'left':
          return `translateX(${translateDistance}px)`
        case 'right':
          return `translateX(-${translateDistance}px)`
        default:
          return `translateY(${translateDistance}px)`
      }
    }

    const initialTransform = getInitialTransform()

    let observer: IntersectionObserver | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let rafId: number | null = null

    // 使用 requestAnimationFrame 确保 DOM 已渲染
    rafId = requestAnimationFrame(() => {
      if (!element) return

      // 始终设置初始状态（使用内联样式）
      element.style.opacity = '0'
      element.style.transform = initialTransform
      element.style.transition = `all ${duration}ms ease-out`
      element.style.willChange = 'transform, opacity'

      // 检查元素是否已经在视口中
      const rect = element.getBoundingClientRect()
      const isInViewport =
        rect.top < window.innerHeight + 100 &&
        rect.bottom > -100 &&
        rect.left < window.innerWidth &&
        rect.right > 0

      // 触发动画的函数
      const triggerAnimation = () => {
        if (!element) return
        setIsVisible(true)
        element.style.opacity = '1'
        element.style.transform = 'translateY(0) translateX(0)'
        // 动画完成后移除 will-change 以释放 GPU 资源
        const removeWillChange = () => {
          if (element) {
            element.style.willChange = 'auto'
            element.removeEventListener('transitionend', removeWillChange)
          }
        }
        element.addEventListener('transitionend', removeWillChange, { once: true })
      }

      if (isInViewport) {
        // 如果已经在视口中，使用较短的延迟触发动画
        timeoutId = setTimeout(() => {
          triggerAnimation()
        }, delay + 50) // 添加小延迟确保初始状态已应用
        return
      }

      // 根据动画方向动态设置 rootMargin，提前触发动画
      const rootMarginMap = {
        up: '0px 0px -50px 0px', // 从下方提前 50px 触发
        down: '-50px 0px 0px 0px', // 从上方提前 50px 触发
        left: '0px 0px 0px -50px', // 从右侧提前 50px 触发
        right: '0px -50px 0px 0px', // 从左侧提前 50px 触发
      }

      // 创建 Intersection Observer
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 使用 setTimeout 实现延迟
              timeoutId = setTimeout(() => {
                triggerAnimation()
              }, delay)
              // 只触发一次后断开观察
              if (observer) {
                observer.unobserve(element)
              }
            }
          })
        },
        {
          threshold: 0.1,
          rootMargin: rootMarginMap[direction], // 根据方向动态设置
        }
      )

      observer.observe(element)
    })

    // 清理函数
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (observer) {
        observer.disconnect()
      }
    }
  }, [delay, direction])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
})

AnimatedSection.displayName = 'AnimatedSection'

export default AnimatedSection
