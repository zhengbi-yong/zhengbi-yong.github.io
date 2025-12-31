'use client'

/**
 * API-powered Search Bar Component
 * Uses React Query for search with debouncing and autocomplete
 */

import { useState, useCallback, useEffect } from 'react'
import { useSearch, useSearchSuggestions } from '@/lib/hooks/useBlogData'
import { useRouter } from 'next/navigation'

export function ApiSearchBar() {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const router = useRouter()

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Search results
  const { data: searchResults, isLoading: isSearching } = useSearch(
    debouncedQuery
  )

  // Search suggestions
  const { data: suggestions } = useSearchSuggestions(query, 5)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
  }

  const handleResultClick = (slug: string) => {
    router.push(`/blog/${slug}`)
    setShowSuggestions(false)
    setQuery('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // Navigate to search results page or trigger search
      setShowSuggestions(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder="搜索文章..."
          className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
        {isSearching && (
          <div className="absolute right-3 top-2.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
          </div>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {/* Search Suggestions */}
          {suggestions && suggestions.length > 0 && !debouncedQuery && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                建议
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSuggestionClick(suggestion)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {searchResults && searchResults.results.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                搜索结果 ({searchResults.total})
              </p>
              {searchResults.results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleResultClick(result.slug)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {result.title}
                  </div>
                  {result.summary && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {result.summary}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchResults && searchResults.results.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              未找到相关文章
            </div>
          )}
        </div>
      )}
    </div>
  )
}
