'use client'

/**
 * Color Theme Selector
 *
 * A tabbed grid of color swatches that lets users pick from curated themes.
 * Click to apply instantly. Compact mode shows all themes with scrolling.
 */

import { memo, useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { useThemeStore, AVAILABLE_THEMES, THEME_CATEGORIES } from '@/lib/store/theme-store'
import { cn } from '@/lib/utils'
import type { ThemeDefinition } from '@/lib/store/theme-store'

interface ThemeSelectorProps {
  className?: string
  compact?: boolean
}

export const ThemeSelector = memo(function ThemeSelector({
  className,
  compact = false,
}: ThemeSelectorProps) {
  const { themeId, setTheme } = useThemeStore()
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const cats = new Map<string, ThemeDefinition[]>()
    cats.set('all', AVAILABLE_THEMES)
    for (const theme of AVAILABLE_THEMES) {
      const existing = cats.get(theme.category) || []
      existing.push(theme)
      cats.set(theme.category, existing)
    }
    return cats
  }, [])

  const shownThemes = categories.get(activeCategory) || AVAILABLE_THEMES
  const categoryKeys = ['all', ...Object.keys(THEME_CATEGORIES)]

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: AVAILABLE_THEMES.length }
    for (const [cat, themes] of categories) counts[cat] = themes.length
    return counts
  }, [categories])

  return (
    <div className={cn('space-y-3', className)}>
      {!compact && (
        <div className="flex flex-wrap gap-1">
          {categoryKeys.map((cat) => {
            const catInfo = cat === 'all'
              ? { label: '全部', icon: '🎨' }
              : THEME_CATEGORIES[cat as keyof typeof THEME_CATEGORIES]
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]'
                    : 'bg-[var(--theme-bg-secondary)] text-[var(--theme-fg-secondary)] hover:bg-[var(--theme-bg-tertiary)]'
                )}
              >
                <span>{catInfo.icon}</span> <span>{catInfo.label}</span>
                <span className={cn('ml-0.5 rounded-full px-1.5 py-px text-[10px]', isActive ? 'bg-white/20' : 'bg-[var(--theme-bg-tertiary)]')}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className={cn(
        'grid gap-2',
        compact
          ? 'max-h-[360px] grid-cols-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
          : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
      )}>
        {shownThemes.map((theme) => {
          const isActive = themeId === theme.id || (!themeId && theme.id === 'midnight-indigo')
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              title={theme.description}
              className={cn(
                'group relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-200',
                'hover:scale-105 hover:shadow-lg',
                isActive ? 'ring-2 ring-[var(--theme-accent)] ring-offset-2' : 'hover:bg-muted/50'
              )}
            >
              <div className="flex h-10 w-full overflow-hidden rounded-lg">
                {theme.colors.map((color, i) => (
                  <div key={i} className="flex-1 transition-transform group-hover:scale-y-110" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className={cn('text-[11px] font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                {theme.name}
              </span>
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[10px] text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})
