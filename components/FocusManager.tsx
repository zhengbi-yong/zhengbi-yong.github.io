'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * FocusManager - 焦点管理组件
 * 在页面切换时管理焦点，提升可访问性
 */
export function FocusManager() {
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // 页面切换时重置焦点到主要内容区域
    if (mainRef.current) {
      const firstFocusable = mainRef.current.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      // 延迟执行，确保页面内容已渲染
      setTimeout(() => {
        firstFocusable?.focus()
      }, 100)
    }
  }, [pathname])

  return null
}
