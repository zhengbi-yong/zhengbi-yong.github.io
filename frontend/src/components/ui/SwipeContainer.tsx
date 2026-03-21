'use client'

import React, { useEffect, useRef, useState } from 'react'

interface SwipeContainerProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  className?: string
}

export function SwipeContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
}: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 })

  const minSwipeDistance = threshold

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      setTouchStart({ x: touch.clientX, y: touch.clientY })
      setTouchEnd({ x: touch.clientX, y: touch.clientY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      setTouchEnd({ x: touch.clientX, y: touch.clientY })
    }

    const handleTouchEnd = () => {
      if (!touchStart.x || !touchEnd.x) return

      const distanceX = touchStart.x - touchEnd.x
      const distanceY = touchStart.y - touchEnd.y

      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

      if (isHorizontalSwipe) {
        // 水平滑动
        if (distanceX > minSwipeDistance) {
          onSwipeRight?.()
        } else if (distanceX < -minSwipeDistance) {
          onSwipeLeft?.()
        }
      } else {
        // 垂直滑动
        if (distanceY > minSwipeDistance) {
          onSwipeUp?.()
        } else if (distanceY < -minSwipeDistance) {
          onSwipeDown?.()
        }
      }
    }

    // 添加事件监听器
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    // 清理函数
    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance])

  return (
    <div ref={containerRef} className={className} style={{ touchAction: 'pan-y' }}>
      {children}
    </div>
  )
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  onPrev?: () => void,
  onNext?: () => void,
  onHome?: () => void,
  onEnd?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'h':
          e.preventDefault()
          onPrev?.()
          break
        case 'ArrowRight':
        case 'l':
          e.preventDefault()
          onNext?.()
          break
        case 'Home':
        case 'g':
          if (e.shiftKey) {
            e.preventDefault()
            onEnd?.()
          } else {
            e.preventDefault()
            onHome?.()
          }
          break
        case 'End':
        case 'G':
          if (!e.shiftKey) {
            e.preventDefault()
            onEnd?.()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onPrev, onNext, onHome, onEnd])
}
