'use client'

/**
 * useGestures - 手势识别Hook
 *
 * 功能：
 * - 滑动手势（上下左右）
 * - 捏合手势（放大缩小）
 * - 长按手势
 * - 双击手势
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinch?: (scale: number) => void
  onLongPress?: () => void
  onDoubleTap?: () => void
}

export interface GestureOptions {
  swipeThreshold?: number // 滑动阈值（像素）
  longPressDelay?: number // 长按延迟（毫秒）
  doubleTapDelay?: number // 双击延迟（毫秒）
  enablePinch?: boolean // 是否启用捏合手势
}

export function useGestures(handlers: GestureHandlers, options: GestureOptions = {}) {
  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300,
    enablePinch = false,
  } = options

  const [isLongPressing, setIsLongPressing] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTapRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout>()
  const initialDistanceRef = useRef<number>(0)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      // 检测双击
      const now = Date.now()
      if (now - lastTapRef.current < doubleTapDelay) {
        handlers.onDoubleTap?.()
        lastTapRef.current = 0
        return
      }
      lastTapRef.current = now

      // 启动长按计时器
      if (handlers.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          setIsLongPressing(true)
          handlers.onLongPress()
        }, longPressDelay)
      }
    },
    [handlers, longPressDelay, doubleTapDelay]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      // 如果正在长按，取消长按
      if (isLongPressing) {
        setIsLongPressing(false)
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
        }
        return
      }

      // 检测捏合手势
      if (enablePinch && e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )

        if (initialDistanceRef.current > 0) {
          const scale = distance / initialDistanceRef.current
          handlers.onPinch?.(scale)
        } else {
          initialDistanceRef.current = distance
        }

        e.preventDefault()
      }
    },
    [enablePinch, handlers, isLongPressing]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      // 清除长按计时器
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
      setIsLongPressing(false)

      // 重置捏合距离
      if (e.touches.length < 2) {
        initialDistanceRef.current = 0
      }

      // 如果不是单指触摸，不处理滑动手势
      if (e.changedTouches.length !== 1 || !touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      // 检测滑动手势
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > swipeThreshold) {
          if (deltaX > 0) {
            handlers.onSwipeRight?.()
          } else {
            handlers.onSwipeLeft?.()
          }
        }
      } else {
        // 垂直滑动
        if (Math.abs(deltaY) > swipeThreshold) {
          if (deltaY > 0) {
            handlers.onSwipeDown?.()
          } else {
            handlers.onSwipeUp?.()
          }
        }
      }

      touchStartRef.current = null
    },
    [handlers, swipeThreshold]
  )

  return {
    gestureHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isLongPressing,
  }
}

/**
 * 滑动手势自定义Hook
 */
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) {
  return useGestures({ onSwipeLeft, onSwipeRight }, { swipeThreshold: threshold })
}

/**
 * 捏合缩放手势自定义Hook
 */
export function usePinchGesture(onPinch: (scale: number) => void) {
  return useGestures({ onPinch }, { enablePinch: true })
}

/**
 * 下拉刷新Hook
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, threshold: number = 100) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const touchStartY = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing) return

    const currentY = e.touches[0].clientY
    const distance = currentY - touchStartY.current

    if (distance > 0) {
      setPulling(true)
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }

    setPulling(false)
    setPullDistance(0)
  }

  return {
    pullDistance,
    pulling,
    refreshing,
    pullToRefreshHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

/**
 * 侧滑返回Hook
 */
export function useSwipeBack(onSwipeBack: () => void) {
  const [swipeProgress, setSwipeProgress] = useState(0)
  const touchStartX = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const deltaX = currentX - touchStartX.current

    // 只处理从左边缘开始的滑动
    if (touchStartX.current < 50 && deltaX > 0) {
      setSwipeProgress(Math.min(deltaX / window.innerWidth, 1))
    }
  }

  const handleTouchEnd = () => {
    if (swipeProgress > 0.3) {
      onSwipeBack()
    }
    setSwipeProgress(0)
  }

  return {
    swipeProgress,
    swipeBackHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

export default useGestures
