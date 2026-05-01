'use client'

/**
 * Color Theme Selector
 *
 * A grid of color swatches that lets users pick from curated themes.
 * Each swatch shows 5 preview colors. Click to apply instantly.
 */

import { memo } from 'react'
import { Check } from 'lucide-react'
import { useThemeStore, AVAILABLE_THEMES } from '@/lib/store/theme-store'
import { cn } from '@/lib/utils'

interface ThemeSelectorProps {
  className?: string
  /** Maximum number of themes to show (for compact mode) */
  compact?: boolean
}

export const ThemeSelector = memo(function ThemeSelector({
  className,
  compact = false,
}: ThemeSelectorProps) {
  const { themeId, setTheme } = useThemeStore()
  const themes = compact ? AVAILABLE_THEMES.slice(0, 6) : AVAILABLE_THEMES

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'grid gap-2',
          compact
            ? 'grid-cols-3 sm:grid-cols-6'
            : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
        )}
      >
        {themes.map((theme) => {
          const isActive = themeId === theme.id || (!themeId && theme.id === 'midnight-indigo')

          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              title={theme.description}
              className={cn(
                'group relative flex flex-col items-center gap-1.5 rounded-xl p-2',
                'transition-all duration-200',
                'hover:scale-105 hover:shadow-lg',
                isActive
                  ? 'ring-2 ring-[var(--theme-accent)] ring-offset-2 ring-offset-background'
                  : 'hover:bg-muted/50'
              )}
              aria-label={`Switch to ${theme.name} theme`}
              aria-pressed={isActive}
            >
              {/* Color swatches */}
              <div className="flex h-10 w-full overflow-hidden rounded-lg">
                {theme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 transition-transform duration-200 group-hover:scale-y-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Theme name */}
              <span
                className={cn(
                  'text-[11px] font-medium leading-tight text-center line-clamp-1',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {theme.name}
              </span>

              {/* Active checkmark */}
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[10px] text-white shadow-sm">
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
