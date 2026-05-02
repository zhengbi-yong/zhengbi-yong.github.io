'use client'

/**
 * Theme Initializer
 *
 * Runs once on mount to sync the stored theme preference to the DOM.
 * Always applies a theme — defaults to 'midnight-indigo' if none stored.
 * Enables smooth transition animations after initial paint.
 */

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/store/theme-store'

export function ThemeInitializer() {
  const themeId = useThemeStore((s) => s.themeId)

  useEffect(() => {
    const activeTheme = themeId || 'midnight-indigo'
    document.documentElement.setAttribute('data-theme', activeTheme)

    // Enable transitions after paint to avoid flash on load
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-theme-transition-ready', '')
      })
    })
    return () => cancelAnimationFrame(timer)
  }, [themeId])

  return null
}
