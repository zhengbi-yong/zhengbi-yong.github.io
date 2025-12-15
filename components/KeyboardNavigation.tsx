'use client'

import { useEffect } from 'react'

/**
 * KeyboardNavigation - 键盘导航组件
 * 提供全局键盘快捷键支持
 */
export function KeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / 触发搜索
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[aria-label*="搜索"], input[placeholder*="搜索"]'
        )
        searchInput?.focus()
      }

      // Escape 键关闭模态框或清除焦点
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.blur) {
          activeElement.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}
