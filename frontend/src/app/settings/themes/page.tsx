'use client'

/**
 * Theme Gallery Page — /settings/themes
 *
 * Full browsing experience for all 32 color themes.
 * Shows live preview cards organized by category.
 * Includes toggle between grid and list view.
 */

import { useState, useMemo } from 'react'
import { Grid3X3, Palette, ArrowLeft } from 'lucide-react'
import Link from '@/components/Link'
import { ThemePreview } from '@/components/theme/ThemePreview'
import { useThemeStore, AVAILABLE_THEMES, THEME_CATEGORIES } from '@/lib/store/theme-store'
import { cn } from '@/lib/utils'

export default function ThemeGalleryPage() {
  const { themeId, setTheme } = useThemeStore()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'preview'>('preview')

  const grouped = useMemo(() => {
    const cats = new Map<string, typeof AVAILABLE_THEMES>()
    cats.set('all', AVAILABLE_THEMES)
    for (const theme of AVAILABLE_THEMES) {
      const existing = cats.get(theme.category) || []
      existing.push(theme)
      cats.set(theme.category, existing)
    }
    return cats
  }, [])

  const shownThemes = grouped.get(activeCategory) || AVAILABLE_THEMES
  const activeThemeId = themeId || 'midnight-indigo'

  const categoryKeys = ['all', ...Object.keys(THEME_CATEGORIES)]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--theme-border)] text-[var(--theme-fg-secondary)] transition-colors hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">配色主题</h1>
            <p className="mt-1 text-sm text-[var(--theme-fg-secondary)]">
              32 套精心设计的配色方案 · 点击即可实时预览
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-[var(--theme-border)] p-0.5">
          <button
            onClick={() => setViewMode('preview')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'preview'
                ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]'
                : 'text-[var(--theme-fg-secondary)] hover:text-[var(--theme-fg)]'
            )}
          >
            <Palette className="mr-1 inline-block h-3.5 w-3.5" />
            预览
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'grid'
                ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)]'
                : 'text-[var(--theme-fg-secondary)] hover:text-[var(--theme-fg)]'
            )}
          >
            <Grid3X3 className="mr-1 inline-block h-3.5 w-3.5" />
            色块
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {categoryKeys.map((cat) => {
          const catInfo = cat === 'all'
            ? { label: '全部', icon: '🎨' }
            : THEME_CATEGORIES[cat as keyof typeof THEME_CATEGORIES]
          const count = grouped.get(cat)?.length || 0
          const isActive = activeCategory === cat

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-foreground)] shadow-sm'
                  : 'bg-[var(--theme-bg-secondary)] text-[var(--theme-fg-secondary)] hover:bg-[var(--theme-surface-hover)]'
              )}
            >
              <span>{catInfo.icon}</span>
              <span>{catInfo.label}</span>
              <span className={cn(
                'rounded-full px-1.5 py-px text-xs',
                isActive ? 'bg-white/20' : 'bg-[var(--theme-bg-tertiary)]'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active theme indicator */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)] p-3">
        <div className="flex h-3 w-3 items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--theme-accent)]" />
        </div>
        <p className="text-sm text-[var(--theme-fg-secondary)]">
          当前主题：
          <span className="ml-1 font-semibold text-[var(--theme-fg)]">
            {AVAILABLE_THEMES.find((t) => t.id === activeThemeId)?.name || '午夜靛蓝'}
          </span>
        </p>
      </div>

      {/* Theme gallery */}
      {viewMode === 'preview' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shownThemes.map((theme) => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              isActive={activeThemeId === theme.id}
              onClick={() => setTheme(theme.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
          {shownThemes.map((theme) => {
            const isActive = activeThemeId === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                title={`${theme.name} — ${theme.description}`}
                className={cn(
                  'group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-200',
                  'hover:scale-110 hover:shadow-lg',
                  isActive && 'ring-2 ring-[var(--theme-accent)] ring-offset-2'
                )}
              >
                <div className="flex h-8 w-full overflow-hidden rounded-lg">
                  {theme.colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 transition-transform group-hover:scale-y-125"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-[var(--theme-fg-secondary)]">
                  {theme.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
