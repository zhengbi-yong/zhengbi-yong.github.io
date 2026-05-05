'use client'

/**
 * Theme Preview Card
 *
 * Renders a miniature live preview of the blog with the given theme applied.
 * Uses the blog's actual CSS variables by wrapping content in [data-theme].
 */

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { ThemeDefinition } from '@/lib/store/theme-store'

interface ThemePreviewProps {
  theme: ThemeDefinition
  /** Whether this theme is currently active */
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export const ThemePreview = memo(function ThemePreview({
  theme,
  isActive = false,
  onClick,
  className,
}: ThemePreviewProps) {
  return (
    <button
      onClick={onClick}
      data-theme={theme.id}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-300',
        isActive
          ? 'border-[var(--theme-accent)] shadow-[var(--theme-shadow-accent)] ring-2 ring-[var(--theme-accent)] ring-offset-2'
          : 'border-[var(--theme-border)] hover:shadow-[var(--theme-shadow-md)] hover:scale-[1.02]',
        className
      )}
    >
      {/* Mini blog mockup */}
      <div className="flex flex-col gap-2 p-4">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div
            className="h-2.5 w-20 rounded-full"
            style={{ backgroundColor: 'var(--theme-fg)' }}
          />
          <div className="flex items-center gap-1.5">
            <div
              className="h-1.5 w-6 rounded-full"
              style={{ backgroundColor: 'var(--theme-fg-tertiary)' }}
            />
            <div
              className="h-1.5 w-6 rounded-full"
              style={{ backgroundColor: 'var(--theme-fg-tertiary)' }}
            />
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--theme-accent)' }}
            />
          </div>
        </div>

        {/* Hero section */}
        <div
          className="mt-1 rounded-xl px-3 py-4"
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        >
          <div
            className="mb-1.5 h-3 w-3/4 rounded-full"
            style={{ backgroundColor: 'var(--theme-fg)' }}
          />
          <div
            className="mb-2 h-2 w-1/2 rounded-full"
            style={{ backgroundColor: 'var(--theme-fg-secondary)' }}
          />
          <div
            className="inline-flex h-6 items-center rounded-lg px-2.5 text-[9px] font-medium"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: 'var(--theme-accent-foreground)',
            }}
          >
            阅读更多
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg p-2"
              style={{ backgroundColor: 'var(--theme-card-bg)' }}
            >
              <div
                className="mb-1 h-7 w-full rounded-md"
                style={{ backgroundColor: 'var(--theme-surface-hover)' }}
              />
              <div
                className="mb-1 h-1.5 w-3/4 rounded-full"
                style={{ backgroundColor: 'var(--theme-fg)' }}
              />
              <div
                className="h-1 w-1/2 rounded-full"
                style={{ backgroundColor: 'var(--theme-fg-tertiary)' }}
              />
            </div>
          ))}
        </div>

        {/* Tag chips */}
        <div className="flex gap-1">
          {['React', 'Rust', 'ML'].map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[8px] font-medium"
              style={{
                backgroundColor: 'var(--theme-tag-bg)',
                color: 'var(--theme-tag-fg)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-1 flex items-center justify-center rounded-lg py-1.5"
          style={{ backgroundColor: 'var(--theme-footer-bg)' }}
        >
          <div
            className="h-1 w-16 rounded-full"
            style={{ backgroundColor: 'var(--theme-fg-tertiary)' }}
          />
        </div>
      </div>

      {/* Theme name label */}
      <div
        className="absolute bottom-2 right-2 rounded-md px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
        style={{
          backgroundColor: 'var(--theme-surface-overlay)',
          color: 'var(--theme-fg)',
        }}
      >
        {theme.name}
      </div>

      {/* Active badge */}
      {isActive && (
        <div
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
          style={{
            backgroundColor: 'var(--theme-accent)',
            color: 'var(--theme-accent-foreground)',
          }}
        >
          ✓
        </div>
      )}
    </button>
  )
})
