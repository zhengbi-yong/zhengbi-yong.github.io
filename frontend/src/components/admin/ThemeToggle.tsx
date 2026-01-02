/**
 * Theme Toggle Component
 * 主题切换组件 - 支持亮色/暗色/系统自动
 */

'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  // 避免服务端渲染不匹配
  useEffect(() => {
    setMounted(true)
    // 从localStorage读取保存的主题
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // 移除所有主题类
    root.classList.remove('light', 'dark')

    // 应用主题
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // 保存到localStorage
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        disabled
      >
        <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    )
  }

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
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
        'p-2 rounded-lg transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'text-gray-600 dark:text-gray-400',
        'hover:text-gray-900 dark:hover:text-gray-200'
      )}
      aria-label={`切换主题：${getLabel()}`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}
