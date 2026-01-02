'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Search, FileText } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import LanguageSwitch from '../LanguageSwitch'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { AuthButton } from '@/components/auth/AuthButton'

interface HeaderActionsProps {
  className?: string
  onSearchClick?: () => void
}

export function HeaderActions({ className, onSearchClick }: HeaderActionsProps) {
  const { t } = useTranslation('common')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 避免hydration不匹配
  useState(() => {
    setMounted(true)
  })

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const openResume = () => {
    // TODO: 替换为实际的 Resume PDF 文件路径
    // 例如: window.open('/resume.pdf', '_blank')
    // 临时禁用，等待简历文件准备就绪
    // window.open('/resume.pdf', '_blank')
  }

  if (!mounted) {
    return (
      <div className={cn('flex items-center space-x-4', className)}>
        <div className="h-9 w-9 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-9 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-9 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {/* 搜索按钮 */}
      <Button variant="ghost" size="sm" onClick={onSearchClick} aria-label={t('nav.search')}>
        <Search className="h-5 w-5" />
      </Button>

      {/* 主题切换 */}
      <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label={t('nav.toggleTheme')}>
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* 简历按钮 */}
      <Button variant="ghost" size="sm" onClick={openResume} aria-label={t('nav.resume')}>
        <FileText className="h-5 w-5" />
      </Button>

      {/* 语言切换 */}
      <LanguageSwitch />

      {/* 登录/注册按钮 */}
      <AuthButton />
    </div>
  )
}
