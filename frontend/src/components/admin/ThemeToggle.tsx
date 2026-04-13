/**
 * Theme Toggle Component
 * 主题切换组件 - 支持亮色/暗色/系统自动
 */

'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui-store'

export default function ThemeToggle() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme, mounted])

  if (!mounted) {
    return (
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius-panel)-8px)] border border-[var(--admin-border-subtle)] bg-[var(--surface-elevated)]/80 text-[var(--text-secondary)] transition-colors duration-[var(--motion-fast)]"
        disabled
      >
        <Monitor className="h-4 w-4" />
      </button>
    )
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />
      case 'dark':
        return <Moon className="w-5 h-5" />
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return '亮色模式'
      case 'dark':
        return '暗色模式'
      default:
        return '跟随系统'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius-panel)-8px)] border border-[var(--admin-border-subtle)] bg-[var(--surface-elevated)]/80 text-[var(--text-secondary)] backdrop-blur-sm transition-all duration-[var(--motion-fast)]',
        'hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-soft)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)]/40'
      )}
      aria-label={`切换主题：${getLabel()}`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}
