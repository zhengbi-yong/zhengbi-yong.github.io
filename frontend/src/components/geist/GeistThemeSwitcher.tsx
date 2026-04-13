'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'system' | 'light' | 'dark'

export interface GeistThemeSwitcherProps {
  className?: string
}

export function GeistThemeSwitcher({ className }: GeistThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Avoid hydration mismatch - GOLDEN_RULES.md: pure UI state
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    setOpen(false)
  }

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  ]

  if (!mounted) {
    return <div className={cn('h-10 w-10 rounded-lg', className)} />
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Theme switcher"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          'text-[var(--geist-fg-secondary)] hover:text-[var(--geist-fg)]',
          'transition-all duration-150 hover:bg-[var(--geist-muted)]'
        )}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-5 w-5" />
        ) : resolvedTheme === 'light' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5" />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div
            className={cn(
              'absolute top-full right-0 z-50 mt-2',
              'w-40 rounded-lg border border-[var(--geist-border)]',
              'bg-[var(--geist-bg)] shadow-lg',
              'py-1'
            )}
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-sm',
                  'font-geist-sans text-[var(--geist-fg)]',
                  'transition-colors hover:bg-[var(--geist-muted)]',
                  (theme === option.value || (option.value === 'system' && !theme)) &&
                    'bg-[var(--geist-accent)]'
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
