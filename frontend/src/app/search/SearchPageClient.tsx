'use client'

import Link from '@/components/Link'
import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  slug: string
  title: string
  summary: string | null
  published_at: string | null
  rank: number
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

interface TrendingKeyword {
  keyword: string
  count: number
}

function buildSearchUrl(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(path, window.location.origin)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return `${url.pathname}${url.search}`
}

export default function SearchPageClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [trending, setTrending] = useState<TrendingKeyword[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deferredQuery = useDeferredValue(query.trim())

  useEffect(() => {
    const controller = new AbortController()

    async function loadTrending() {
      try {
        const response = await fetch('/api/v1/search/trending', {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data: TrendingKeyword[] = await response.json()
        setTrending(data)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Failed to load trending keywords:', fetchError)
        }
      }
    }

    loadTrending()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim()

    startTransition(() => {
      const nextUrl = normalizedQuery
        ? `/search?q=${encodeURIComponent(normalizedQuery)}`
        : '/search'
      router.replace(nextUrl, { scroll: false })
    })

    if (normalizedQuery.length < 2) {
      setResults([])
      setSuggestions([])
      setTotal(0)
      setIsLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [searchResponse, suggestResponse] = await Promise.all([
          fetch(
            buildSearchUrl('/api/v1/search', {
              q: normalizedQuery,
              limit: 12,
            }),
            { signal: controller.signal, cache: 'no-store' }
          ),
          fetch(
            buildSearchUrl('/api/v1/search/suggest', {
              q: normalizedQuery,
              limit: 6,
            }),
            { signal: controller.signal, cache: 'no-store' }
          ),
        ])

        if (!searchResponse.ok) {
          throw new Error(`Search request failed with ${searchResponse.status}`)
        }

        const searchData: SearchResponse = await searchResponse.json()
        const suggestionData: string[] = suggestResponse.ok ? await suggestResponse.json() : []

        setResults(searchData.results)
        setSuggestions(suggestionData)
        setTotal(searchData.total)
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return
        }

        console.error('Search request failed:', fetchError)
        setError('Search is temporarily unavailable.')
        setResults([])
        setSuggestions([])
        setTotal(0)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [deferredQuery, router])

  const emptyState = query.trim().length < 2

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 sm:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-[linear-gradient(135deg,#f7efe2_0%,#f5f7fb_45%,#edf4ef_100%)] p-8 shadow-[0_30px_80px_-45px_rgba(38,57,77,0.45)]">
        <p className="text-sm font-semibold tracking-[0.28em] text-slate-500 uppercase">Search</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Search published posts
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Powered by the live backend search index, with PostgreSQL fallback when the index is not
          configured.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
          <label htmlFor="site-search" className="sr-only">
            Search posts
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <input
              id="site-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="React, Rust, chemistry notes..."
              className="w-full border-0 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {emptyState ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Trending queries</h2>
              <p className="mt-2 text-sm text-slate-600">
                Popular search terms from recent reader activity.
              </p>
            </div>
            <p className="text-sm text-slate-500">Type at least 2 characters to search.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {trending.length > 0 ? (
              trending.slice(0, 10).map((item) => (
                <button
                  key={item.keyword}
                  type="button"
                  onClick={() => setQuery(item.keyword)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white"
                >
                  {item.keyword}
                  <span className="ml-2 text-xs opacity-70">{item.count}</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Trending keywords will appear after search traffic accumulates.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Results</h2>
              <p className="mt-1 text-sm text-slate-600">
                {isLoading ? 'Searching...' : `${total} matching posts for “${query.trim()}”.`}
              </p>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>

          <div className="mt-6 grid gap-4">
            {!isLoading && results.length === 0 && !error && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                No published posts matched this query.
              </div>
            )}

            {results.map((result) => (
              <Link
                key={result.id}
                href={`/blog/${result.slug}`}
                className="group block rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-0.5 hover:border-slate-900 hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">
                      {result.title}
                    </h3>
                    {result.summary && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {result.summary}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                    View
                  </span>
                </div>
                {result.published_at && (
                  <p className="mt-4 text-xs tracking-[0.18em] text-slate-400 uppercase">
                    {new Date(result.published_at).toLocaleDateString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
