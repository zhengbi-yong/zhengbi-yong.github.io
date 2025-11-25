'use client'

import { useRef, ReactNode, useEffect } from 'react'
import { useGSAP } from '@/components/hooks/useGSAP'
import { getGSAPMobileOptimizedParams } from '@/lib/utils/gsap'
import { gsap } from 'gsap'

interface TimelineAnimationProps {
  children: ReactNode
  className?: string
  stagger?: number
  duration?: number
  onComplete?: () => void
  autoPlay?: boolean
}

export default function TimelineAnimation({
  children,
  className = '',
  stagger = 0.1,
  duration = 0.5,
  onComplete,
  autoPlay = true,
}: TimelineAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const { duration: optimizedDuration } = getGSAPMobileOptimizedParams(duration)

  useGSAP(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const children = container.children

    if (children.length === 0) return

    // 为每个子元素设置初始状态
    Array.from(children).forEach((child) => {
      gsap.set(child, { opacity: 0, y: 20 })
    })

    // 创建时间线
    // 明确设置 paused: false 当 autoPlay 为 true 时
    const tl = gsap.timeline({
      paused: !autoPlay, // 如果 autoPlay 为 true，paused 为 false，时间线会自动播放
      onComplete,
    })

    // 为每个子元素添加动画
    Array.from(children).forEach((child, index) => {
      tl.to(
        child,
        {
          opacity: 1,
          y: 0,
          duration: optimizedDuration,
          ease: 'power2.out',
        },
        index * stagger
      )
    })

    // 保存时间线引用
    timelineRef.current = tl

    // 如果 autoPlay 为 true，确保时间线播放
    if (autoPlay && tl) {
      // 立即播放
      tl.play()
    }

    return tl
  }, [stagger, duration, onComplete, autoPlay, optimizedDuration])

  // 使用额外的 useEffect 确保时间线在 DOM 完全渲染后播放
  useEffect(() => {
    if (!autoPlay || !timelineRef.current) return

    // 等待 DOM 完全渲染
    const timer = setTimeout(() => {
      if (timelineRef.current && timelineRef.current.paused()) {
        timelineRef.current.play()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [autoPlay, children])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
