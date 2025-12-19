'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface LazyComponentProps {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  once?: boolean
}

/**
 * LazyComponent - 基于 Intersection Observer 的延迟加载组件
 * 当组件进入视口时才开始加载，减少首屏 JavaScript 执行时间
 */
export default function LazyComponent({
  children,
  fallback = null,
  threshold = 0.1,
  rootMargin = '50px',
  once = true,
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || hasLoaded) {
      return
    }

    // 检查浏览器是否支持 Intersection Observer
    if (!('IntersectionObserver' in window)) {
      // 不支持时立即加载
      setIsVisible(true)
      setHasLoaded(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            setHasLoaded(true)
            if (once) {
              observer.disconnect()
            }
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, once, hasLoaded])

  return <div ref={elementRef}>{isVisible ? children : fallback}</div>
}
