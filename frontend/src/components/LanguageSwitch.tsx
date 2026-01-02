'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shadcn/ui/button'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
]

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isOpenRef = useRef(isOpen)

  // 确保只在客户端 hydration 完成后才显示语言相关的内容
  useEffect(() => {
    setMounted(true)
  }, [])

  // 同步 ref 和 state，以便在事件处理函数中访问最新值
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // 安全获取当前语言，处理 i18n 未初始化的情况
  const currentLanguage = languages.find((lang) => lang.code === (i18n?.language || 'en'))

  const changeLanguage = (languageCode: string) => {
    if (i18n?.changeLanguage) {
      i18n.changeLanguage(languageCode)
    }
    setIsOpen(false)
  }

  // 关闭下拉菜单 - 使用 ref 访问最新的 isOpen 值，避免频繁重新注册监听器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpenRef.current && !(event.target as Element).closest('.language-switch')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // 在 hydration 完成前显示占位内容，避免服务器和客户端不匹配
  if (!mounted) {
    return (
      <div className="language-switch relative">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-3"
          aria-label="Change Language"
        >
          <span>🌐</span>
          <span className="hidden sm:inline">Language</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="language-switch relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3"
        aria-label={t?.('nav.changeLanguage') || 'Change Language'}
      >
        <span>{currentLanguage?.flag}</span>
        <span className="hidden sm:inline">{currentLanguage?.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full px-4 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${(i18n?.language || 'en') === language.code ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : ''} `}
            >
              <span className="mr-2">{language.flag}</span>
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
