'use client'

/**
 * SmartSearchBar - 智能搜索栏
 *
 * 功能：
 * - 实时搜索建议
 * - 搜索历史
 * - 热门搜索
 * - 拼音搜索支持
 * - 模糊匹配
 * - 键盘快捷键
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { searchService } from '@/lib/api/backend'
import type { SearchResult } from '@/lib/types/backend'

interface SmartSearchBarProps {
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

interface SuggestionItem {
  type: 'post' | 'tag' | 'category' | 'history'
  title: string
  url: string
  subtitle?: string
}

export function SmartSearchBar({
  className = '',
  placeholder,
  autoFocus = false,
}: SmartSearchBarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 搜索历史现在完全由 React state 管理（内存存储）
  // 符合 GOLDEN_RULES 2.2: 禁止 localStorage 存储用户数据
  // 历史仅在当前会话有效，页面刷新后清除（这是预期行为）

  // 保存搜索历史
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return

    const newHistory = [searchQuery, ...searchHistory.filter((h) => h !== searchQuery)].slice(0, 10)
    setSearchHistory(newHistory)
  }, [searchHistory])

  // 防抖搜索
  const debouncedSearch = useDebounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await searchService.search(searchQuery, { limit: 5 })

      const searchSuggestions: SuggestionItem[] = response.results.map((item: SearchResult) => ({
        type: 'post',
        title: item.title,
        url: `/blog/${item.slug}`,
        subtitle: item.summary || undefined,
      }))

      setSuggestions(searchSuggestions)
    } catch (error) {
      console.error('Search failed:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, 300)

  // 处理搜索输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    setIsOpen(true)
    debouncedSearch(value)
  }

  // 执行搜索
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    saveToHistory(searchQuery)
    setIsOpen(false)
    router.push(`/blog?search=${encodeURIComponent(searchQuery)}`)
  }

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          const selected = suggestions[selectedIndex]
          router.push(selected.url)
          setIsOpen(false)
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 全局键盘快捷键 (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || (t('search.placeholder') || '搜索文章...')}
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-12 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />

        {/* 搜索图标 */}
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* 快捷键提示 */}
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-xs text-gray-400 sm:block">
          <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 搜索建议下拉框 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-lg bg-white shadow-lg dark:bg-gray-800">
          {loading && (
            <div className="flex items-center justify-center p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}

          {!loading && (
            <>
              {/* 搜索建议 */}
              {suggestions.length > 0 && (
                <div className="max-h-96 overflow-y-auto py-2">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.type}-${index}`}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        router.push(suggestion.url)
                        setIsOpen(false)
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {/* 类型图标 */}
                      {suggestion.type === 'post' && (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}

                      {/* 文本内容 */}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {suggestion.title}
                        </div>
                        {suggestion.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 搜索历史 */}
              {!loading && query.trim() === '' && searchHistory.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t('search.recentSearches') || '最近搜索'}
                  </div>
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <div
                      key={index}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSearch(historyItem)}
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{historyItem}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 热门搜索 */}
              {!loading && query.trim() === '' && (
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t('search.trending') || '热门搜索'}
                  </div>
                  {['React', 'Next.js', 'TypeScript', 'Rust', '机器学习'].slice(0, 5).map((trending, index) => (
                    <div
                      key={index}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSearch(trending)}
                    >
                      <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 11 7 9 7c-1.63 0-3.01.71-3.91 1.87C5.04 8.06 4.5 8.55 4.5 9c0 .5.31 1.08.61 1.5.89.62.42 1.25.74 1.89.95.47-.01.95-.38 1.66-1.19.61-.7 1.17-1.36 1.7-2.05.19-.25.38-.5.56-.72.26-.28.51-.57.77-.92C9.95 6.48 10.64 5 9 5c-1.32 0-2.31.61-2.85 1.64C6.17 6.54 5.65 7.38 5.35 8.26c-.06.18-.13.35-.2.53-.23-.61-.4-1.23-.54-1.87-.08-.36.05-.74.12-1.08.27-.26.13-.49.28-.69.46-.23.2-.43.43-.59.69-.19.31-.35.65-.48 1-.1.23-.15.49-.16.76v-.01c-.01-.26.04-.53.13-.78.17-.46.44-.88.77-1.25.03-.03.05-.07.07-.1.2-.17.42-.33.64-.47.95-.01.03-.01.06-.01.09.07-.28.17-.55.29-.82.08-.26.2-.5.36-.73.23-.32.5-.59.8-.98.27-.36.55-.7.84-1.02.03-.03.07-.06.1-.08.36-.18.69-.31 1-.39.35-.07.69-.12 1.01-.15.69.17 1.17.44 1.6.82.31.28.68.44 1.09.5.03-.09.07-.18.1-.28.07-.51.05-1.03-.04-1.51-.15-.31-.06-.61-.16-.89-.29-.32-.15-.6-.36-.84-.63-.26-.28-.48-.61-.65-.97-.17-.35-.3-.73-.38-1.12-.06-.3-.08-.61-.06-.92.06-.33.2-.63.43-.89.7-.37.2-.77.34-1.19.41-.31.06-.62.08-.93.07-.36-.02-.71-.11-1.04-.27-.32-.15-.6-.36-.84-.63-.26-.28-.48-.61-.65-.97-.17-.35-.3-.73-.38-1.12-.06-.3-.08-.61-.06-.92.06-.33.2-.63.43-.89.7-.37.2-.77.34-1.19.41-.31.06-.62.08-.93.07z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{trending}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 无结果 */}
              {!loading && suggestions.length === 0 && query.trim() !== '' && (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto mb-2 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">{t('search.noResults') || '未找到相关内容'}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SmartSearchBar
