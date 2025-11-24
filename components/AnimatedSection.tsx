'use client'

import { useEffect, useRef, useState } from 'react'

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
export default function AnimatedSection({
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

    // 根据方向设置初始 translate 类
    const directionClasses = {
      up: 'translate-y-8',
      down: '-translate-y-8',
      left: 'translate-x-8',
      right: '-translate-x-8',
    }

    const initialTranslate = directionClasses[direction]

    let observer: IntersectionObserver | null = null
    let timeoutId: NodeJS.Timeout | null = null

    // 使用 requestAnimationFrame 确保 DOM 已渲染
    const rafId = requestAnimationFrame(() => {
      if (!element) return

      // 始终设置初始状态和过渡类
      element.classList.add('opacity-0', initialTranslate)
      element.classList.add('transition-all', 'duration-500', 'ease-out')

      // 检查元素是否已经在视口中
      const rect = element.getBoundingClientRect()
      const isInViewport =
        rect.top < window.innerHeight + 100 &&
        rect.bottom > -100 &&
        rect.left < window.innerWidth &&
        rect.right > 0

      if (isInViewport) {
        // 如果已经在视口中，使用较短的延迟触发动画
        timeoutId = setTimeout(() => {
          if (!element) return
          setIsVisible(true)
          element.classList.remove('opacity-0', initialTranslate)
          element.classList.add('opacity-100')
          if (direction === 'up' || direction === 'down') {
            element.classList.add('translate-y-0')
          } else {
            element.classList.add('translate-x-0')
          }
        }, delay + 50) // 添加小延迟确保初始状态已应用
        return
      }

      // 创建 Intersection Observer
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 使用 setTimeout 实现延迟
              timeoutId = setTimeout(() => {
                if (!element) return
                setIsVisible(true)
                element.classList.remove('opacity-0', initialTranslate)
                element.classList.add('opacity-100')
                // 根据方向移除对应的 translate 类
                if (direction === 'up' || direction === 'down') {
                  element.classList.add('translate-y-0')
                } else {
                  element.classList.add('translate-x-0')
                }
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
          rootMargin: '0px 0px -100px 0px',
        }
      )

      observer.observe(element)
    })

    // 清理函数
    return () => {
      cancelAnimationFrame(rafId)
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
}
