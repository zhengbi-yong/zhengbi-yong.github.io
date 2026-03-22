'use client'

/**
 * useDebounce - 防抖Hook
 *
 * 功能：
 * - 延迟执行函数
 * - 取消未执行的调用
 * - 支持异步函数
 */

import { useEffect, useRef } from 'react'

export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export default useDebounce
