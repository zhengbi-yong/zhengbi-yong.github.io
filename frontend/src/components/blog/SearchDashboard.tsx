'use client'

/**
 * SearchDashboard Component
 *
 * Provides search functionality with on-demand Meilisearch loading.
 * Falls back to PostgreSQL FTS (default) when Meilisearch is not available.
 *
 * Architecture:
 * - Default: PG FTS (zero extra dependencies, works immediately)
 * - On-demand: Meilisearch (loaded when user explicitly requests it)
 *
 * Usage:
 * ```tsx
 * import { SearchDashboard } from '@/components/blog/SearchDashboard'
 *
 * // Basic usage
 * <SearchDashboard />
 *
 * // With custom placeholder
 * <SearchDashboard placeholder="Search articles..." />
 *
 * // Controlled mode
 * <SearchDashboard
 *   defaultQuery="rust"
 *   defaultUseMeili={true}
 *   onSearch={(query, useMeili) => ...}
 * />
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/apiClient'
import { Search, Sparkles, Database, Loader2, X, Filter, Calendar, Tag } from 'lucide-react'

interface SearchResult {
  slug: string
  title: string
  summary: string | null
  title_highlight?: string
  summary_highlight?: string
  rank?: number
  category?: string
  tags?: string[]
  published_at?: string
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  took_ms?: number
}

interface TrendingKeyword {
  keyword: string
  count: number
  lastSearchedAt?: string
}

interface SearchDashboardProps {
  /** Initial search query */
  defaultQuery?: string
  /** Whether to use Meilisearch by default (default: false = PG FTS) */
  defaultUseMeili?: boolean
  /** Custom placeholder text */
  placeholder?: string
  /** Show trending keywords */
  showTrending?: boolean
  /** Callback when search is performed */
  onSearch?: (query: string, useMeili: boolean, results: SearchResult[]) => void
  /** Callback when search mode changes */
  onModeChange?: (useMeili: boolean) => void
}

/**
 * SearchDashboard - Dual-mode search with PG FTS and Meilisearch
 *
 * @param defaultQuery - Initial search query
 * @param defaultUseMeili - Whether to use Meilisearch by default
 * @param placeholder - Placeholder text for search input
 * @param showTrending - Whether to show trending keywords
 * @param onSearch - Callback when search is performed
 * @param onModeChange - Callback when search mode changes
 */
export function SearchDashboard({
  defaultQuery = '',
  defaultUseMeili = false,
  placeholder = 'Search articles...',
  showTrending = true,
  onSearch,
  onModeChange,
}: SearchDashboardProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [trending, setTrending] = useState<TrendingKeyword[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [useMeili, setUseMeili] = useState(defaultUseMeili)
  const [showFilters, setShowFilters] = useState(false)
  const [tookMs, setTookMs] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const searchBoxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      return undefined
    }

    const timer = setTimeout(() => {
      performSearch(query, useMeili)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, useMeili, categoryFilter, tagFilter])

  // Fetch trending keywords
  useEffect(() => {
    if (!showTrending) return

    const fetchTrending = async () => {
      try {
        const response = await api.get<TrendingKeyword[]>('/v1/search/trending', {
          cache: 600000, // 10 minute cache
        })
        setTrending(response.data || [])
      } catch (err) {
        console.error('Failed to fetch trending keywords:', err)
      }
    }

    fetchTrending()
  }, [showTrending])

  /**
   * Perform search using either PG FTS or Meilisearch
   */
  const performSearch = async (searchQuery: string, meili: boolean) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
      })

      if (categoryFilter) {
        params.set('category_slug', categoryFilter)
      }
      if (tagFilter) {
        params.set('tag_slug', tagFilter)
      }

      const response = await api.get<SearchResponse>(`/v1/search?${params.toString()}`, {
        cache: false,
      })

      const searchResults = response.data?.results || []
      setResults(searchResults)
      setTookMs(response.data?.took_ms || null)

      if (onSearch) {
        onSearch(searchQuery, meili, searchResults)
      }
    } catch (err: any) {
      console.error('Search failed:', err)
      setError(err.message || 'Search failed')
      setResults([])

      // If Meilisearch failed, try falling back to PG FTS
      if (meili && onSearch === undefined) {
        console.log('Meilisearch failed, falling back to PG FTS...')
        setUseMeili(false)
        if (onModeChange) {
          onModeChange(false)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Toggle between Meilisearch and PG FTS
   */
  const toggleSearchMode = useCallback(() => {
    const newMode = !useMeili
    setUseMeili(newMode)
    if (onModeChange) {
      onModeChange(newMode)
    }

    // Re-run search with new mode if we have a query
    if (query.trim()) {
      performSearch(query, newMode)
    }
  }, [useMeili, query, onModeChange])

  /**
   * Clear all filters and search
   */
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setCategoryFilter(null)
    setTagFilter(null)
    setError(null)
    setTookMs(null)
    inputRef.current?.focus()
  }, [])

  /**
   * Handle clicking a search result
   */
  const handleResultClick = (slug: string) => {
    router.push(`/blog/${slug}`)
  }

  /**
   * Handle clicking a trending keyword
   */
  const handleTrendingClick = (keyword: string) => {
    setQuery(keyword)
    performSearch(keyword, useMeili)
  }

  /**
   * Render highlighted text (from search engine)
   */
  const renderHighlight = (text: string | null | undefined) => {
    if (!text) return null
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  return (
    <div ref={searchBoxRef} className="mx-auto w-full max-w-4xl space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground">Search</h2>

          {/* Search Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">
              {useMeili ? 'Meilisearch' : 'PostgreSQL FTS'}
            </span>
            <button
              onClick={toggleSearchMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useMeili
                  ? 'bg-primary hover:bg-purple-700'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-secondary dark:hover:bg-secondary'
              }`}
              title={useMeili ? 'Switch to PostgreSQL FTS' : 'Switch to Meilisearch'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  useMeili ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="block w-full rounded-lg border border-border bg-background py-3 pr-24 pl-10 leading-5 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-primary focus:outline-none sm:text-sm dark:border-border dark:bg-card"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 text-muted-foreground hover:text-muted-foreground dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 text-sm ${
              showFilters || categoryFilter || tagFilter
                ? 'text-primary dark:text-primary'
                : 'text-muted-foreground dark:text-muted-foreground'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(categoryFilter || tagFilter) && (
              <span className="ml-1 rounded bg-[var(--theme-info-muted)] px-1.5 py-0.5 text-xs text-primary dark:bg-blue-900 dark:text-blue-300">
                {[categoryFilter, tagFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {tookMs !== null && (
            <span className="text-xs text-muted-foreground">
              {tookMs < 1000 ? `${tookMs}ms` : `${(tookMs / 1000).toFixed(1)}s`}
            </span>
          )}

          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="space-y-4 rounded-lg bg-muted p-4 dark:bg-card">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-foreground dark:text-foreground">
                  <Database className="mr-1 inline h-4 w-4" />
                  Category
                </label>
                <input
                  type="text"
                  value={categoryFilter || ''}
                  onChange={(e) => setCategoryFilter(e.target.value || null)}
                  placeholder="e.g., notes, robotics"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground dark:border-border dark:bg-secondary dark:text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-foreground dark:text-foreground">
                  <Tag className="mr-1 inline h-4 w-4" />
                  Tag
                </label>
                <input
                  type="text"
                  value={tagFilter || ''}
                  onChange={(e) => setTagFilter(e.target.value || null)}
                  placeholder="e.g., rust, axum"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground dark:border-border dark:bg-secondary dark:text-foreground"
                />
              </div>
            </div>
            {(categoryFilter || tagFilter) && (
              <button
                onClick={() => {
                  setCategoryFilter(null)
                  setTagFilter(null)
                }}
                className="text-sm text-primary hover:text-primary dark:text-primary"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Mode Info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground dark:text-muted-foreground">
        <div className="flex items-center gap-1">
          {useMeili ? (
            <>
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span>Using Meilisearch (sub-second latency)</span>
            </>
          ) : (
            <>
              <Database className="h-3 w-3 text-green-500" />
              <span>Using PostgreSQL FTS (default, zero dependencies)</span>
            </>
          )}
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground dark:text-foreground">
              Search Results ({results.length})
            </h3>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <button
                key={result.slug}
                onClick={() => handleResultClick(result.slug)}
                className="w-full rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-blue-300 dark:border-border dark:bg-card dark:hover:border-blue-600"
              >
                <div className="space-y-2">
                  {/* Title with highlight */}
                  <h4 className="text-base font-medium text-foreground dark:text-foreground">
                    {renderHighlight(result.title_highlight) || result.title}
                  </h4>

                  {/* Summary with highlight */}
                  {result.summary_highlight || result.summary ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground dark:text-muted-foreground">
                      {renderHighlight(result.summary_highlight) || result.summary}
                    </p>
                  ) : null}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground dark:text-muted-foreground">
                    {result.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(result.published_at).toLocaleDateString()}
                      </span>
                    )}
                    {result.category && (
                      <span className="rounded bg-secondary px-2 py-0.5 dark:bg-secondary">
                        {result.category}
                      </span>
                    )}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex gap-1">
                        {result.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[var(--theme-info-muted)] px-2 py-0.5 text-primary dark:bg-blue-900 dark:text-blue-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {result.rank !== undefined && (
                      <span className="ml-auto">rank: {result.rank.toFixed(3)}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Keywords */}
      {query.length === 0 && trending.length > 0 && showTrending && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-medium text-foreground dark:text-foreground">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Trending Searches
          </h3>

          <div className="flex flex-wrap gap-2">
            {trending.map((keyword, index) => (
              <button
                key={index}
                onClick={() => handleTrendingClick(keyword.keyword)}
                className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-gray-200 dark:bg-card dark:text-foreground dark:hover:bg-secondary"
              >
                {keyword.keyword}
                <span className="ml-1 text-xs text-muted-foreground">{keyword.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {query.length >= 2 && results.length === 0 && !isLoading && !error && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground dark:text-muted-foreground">
            No results found for &quot;{query}&quot;
          </p>
          <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  )
}
