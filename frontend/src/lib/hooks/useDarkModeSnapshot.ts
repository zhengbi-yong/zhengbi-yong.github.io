'use client'

import { useEffect, useState } from 'react'

/**
 * Reads dark mode state from DOM and keeps in sync with theme changes.
 * Works by observing class changes on <html> element (set by next-themes).
 */
export function useDarkModeSnapshot(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    // Observe class changes on <html> element (set by next-themes)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return isDark
}
