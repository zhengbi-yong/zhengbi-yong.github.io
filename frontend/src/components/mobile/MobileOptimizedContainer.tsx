'use client'

/**
 * MobileOptimizedContainer - 移动端优化容器
 *
 * 功能：
 * - 安全区域适配（iPhone刘海屏）
 * - 触觉反馈
 * - 响应式字体大小
 * - 防止缩放
 * - 优化触摸目标
 */

import { useCallback, useEffect, useState } from 'react'
import { useGestures, usePullToRefresh } from '@/lib/hooks/useGestures'

interface MobileOptimizedContainerProps {
  children: React.ReactNode
  enableSwipeGestures?: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

export function MobileOptimizedContainer({
  children,
  enableSwipeGestures = false,
  onSwipeLeft,
  onSwipeRight,
  className = '',
}: MobileOptimizedContainerProps) {
  const gestureHandlers = useGestures(
    {
      onSwipeLeft,
      onSwipeRight,
    },
    { swipeThreshold: 50 }
  )

  return (
    <div
      className={className}
      style={{
        // 安全区域适配
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      {...(enableSwipeGestures ? gestureHandlers.gestureHandlers : undefined)}
    >
      {children}
    </div>
  )
}

/**
 * 触觉反馈Hook
 */
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return

    const duration = {
      light: 10,
      medium: 20,
      heavy: 30,
    }

    navigator.vibrate(duration[type])
  }, [])

  const triggerSuccess = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return

    // 成功反馈：双短振动
    navigator.vibrate([10, 50, 10])
  }, [])

  const triggerError = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return

    // 错误反馈：长振动
    navigator.vibrate([50, 50, 50])
  }, [])

  return {
    triggerHaptic,
    triggerSuccess,
    triggerError,
  }
}

/**
 * 移动端触摸目标优化
 */
export function useTouchTarget() {
  const getOptimalTouchSize = () => {
    if (typeof window === 'undefined') return 44

    // iOS和Android推荐的最小触摸目标尺寸
    return Math.max(44, window.innerWidth * 0.1)
  }

  return { getOptimalTouchSize }
}

/**
 * 移动端视口高度优化（解决移动浏览器地址栏问题）
 */
export function useMobileViewport() {
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight)
    }

    updateHeight()

    // 监听visual viewport变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight)
      return () => window.visualViewport?.removeEventListener('resize', updateHeight)
    } else {
      window.addEventListener('resize', updateHeight)
      return () => window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return { viewportHeight }
}

/**
 * 移动端优化的按钮组件
 */
export function MobileButton({
  children,
  onClick,
  className = '',
  haptic = true,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { haptic?: boolean }) {
  const { triggerHaptic } = useHapticFeedback()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic) {
      triggerHaptic('light')
    }
    onClick?.(e)
  }

  return (
    <button
      onClick={handleClick}
      className={className}
      style={{
        // 确保触摸目标足够大
        minHeight: 44,
        minWidth: 44,
        // 防止双击缩放
        touchAction: 'manipulation',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * 下拉刷新组件
 */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}) {
  const { pullDistance, pulling, refreshing, pullToRefreshHandlers } = usePullToRefresh(onRefresh)

  return (
    <div {...pullToRefreshHandlers} style={{ position: 'relative' }}>
      {pulling && (
        <div
          className="fixed left-0 right-0 z-50 flex items-center justify-center bg-blue-500 text-white transition-all"
          style={{
            top: 0,
            height: `${Math.min(pullDistance, 100)}px`,
            opacity: Math.min(pullDistance / 100, 1),
          }}
        >
          {refreshing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="text-sm">刷新中...</span>
            </>
          ) : (
            <span className="text-sm">
              {pullDistance < 100 ? '下拉刷新' : '释放刷新'}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

export default MobileOptimizedContainer
