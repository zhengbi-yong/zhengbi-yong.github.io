'use client'

/**
 * Theme Initializer
 *
 * Runs once on mount to sync the stored theme preference to the DOM.
 * Must be placed in the root layout to run before any rendering.
 */

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/store/theme-store'

export function ThemeInitializer() {
  const themeId = useThemeStore((s) => s.themeId)

  useEffect(() => {
    if (themeId) {
      document.documentElement.setAttribute('data-theme', themeId)
    }
  }, [themeId])

  // This component renders nothing
  return null
}
