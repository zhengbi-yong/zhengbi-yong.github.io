'use client'

/**
 * 优化后的搜索组件
 *
 * 功能：
 * - 实时搜索建议
 * - 搜索结果高亮显示
 * - 键盘导航
 * - 搜索历史记录
 * - 热门搜索关键词
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/apiClient'
import { Search, X, Clock, TrendingUp } from 'lucide-react'

interface SearchSuggestion {
  title: string
  category: string
  score: number
}

interface SearchResult {
  slug: string
  title: string
  summary: string | null
  title_highlight: string
  summary_highlight: string
  content_preview: string
  rank: number
  category: string
  tags: string[]
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  took_ms: number
}

interface TrendingKeyword {
  keyword: string
  count: number
  lastSearchedAt: string
}

interface SearchBoxProps {
  placeholder?: string
  autoFocus?: boolean
  showTrending?: boolean
}

export function SearchBoxOptimized({
  placeholder = '搜索文章...',
  autoFocus = false,
  showTrending = true,
}: SearchBoxProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [trending, setTrending] = useState<TrendingKeyword[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const searchBoxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 获取搜索建议（防抖）
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await api.get<SearchSuggestion[]>(`/v1/search/suggest?q=${encodeURIComponent(searchQuery)}&limit=5`, {
        cache: true,
      })
      setSuggestions(response.data || [])
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
    }
  }, [])

  // 获取热门搜索关键词
  useEffect(() => {
    const fetchTrending = async () => {
      if (!showTrending) return

      try {
        const response = await api.get<TrendingKeyword[]>('/v1/search/trending', {
          cache: 600000, // 10分钟缓存
        })
        setTrending(response.data || [])
      } catch (error) {
        console.error('Failed to fetch trending keywords:', error)
      }
    }

    fetchTrending()
  }, [showTrending])

  // 防抖搜索建议
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  // 执行搜索
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setShowDropdown(true)

    try {
      const response = await api.get<SearchResponse>(
        `/v1/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
        { cache: false }
      )
      setResults(response.data?.results || [])
      console.log(`Search took ${response.data?.took_ms}ms`)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)

    if (value.length >= 2) {
      performSearch(value)
    } else {
      setResults([])
    }
  }

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = [...suggestions, ...results]
    if (items.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          const item = items[selectedIndex]
          if ('slug' in item) {
            // 搜索结果
            router.push(`/blog/${item.slug}`)
            clearSearch()
          } else {
            // 搜索建议
            setQuery(item.title)
            performSearch(item.title)
          }
        } else {
          performSearch(query)
        }
        break
      case 'Escape':
        clearSearch()
        break
    }
  }

  // 清空搜索
  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setResults([])
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 渲染高亮的HTML
  const renderHighlight = (text: string) => {
    return { __html: text }
  }

  return (
    <div ref={searchBoxRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* 搜索下拉框 */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              搜索中...
            </div>
          ) : (
            <>
              {/* 搜索建议 */}
              {suggestions.length > 0 && results.length === 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    搜索建议
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion.title)
                        performSearch(suggestion.title)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                        index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {suggestion.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 搜索结果 */}
              {results.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    搜索结果 ({results.length})
                  </div>
                  {results.map((result, index) => (
                    <button
                      key={result.slug}
                      onClick={() => {
                        router.push(`/blog/${result.slug}`)
                        clearSearch()
                      }}
                      className={`w-full text-left px-3 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* 高亮的标题 */}
                          <div
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1"
                            dangerouslySetInnerHTML={renderHighlight(result.title_highlight)}
                          />
                          {/* 高亮的摘要 */}
                          {result.summary_highlight && (
                            <div
                              className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
                              dangerouslySetInnerHTML={renderHighlight(result.summary_highlight)}
                            />
                          )}
                          {/* 标签 */}
                          {result.tags && result.tags.length > 0 && (
                            <div className="mt-2 flex gap-1 flex-wrap">
                              {result.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {result.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 热门搜索 */}
              {query.length === 0 && trending.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    热门搜索
                  </div>
                  {trending.slice(0, 5).map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(keyword.keyword)
                        performSearch(keyword.keyword)
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {keyword.keyword}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {keyword.count} 次搜索
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 无结果 */}
              {query.length >= 2 && suggestions.length === 0 && results.length === 0 && !isLoading && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  没有找到相关结果
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
