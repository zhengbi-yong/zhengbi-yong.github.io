'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import {
  Search,
  BookOpen,
  Terminal,
  Calculator,
  Bot,
  Atom,
  Book,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useCategories, usePosts } from '@/lib/hooks/useBlogData'

const POSTS_PER_PAGE = 9

const categoryIcons: Record<string, React.ReactNode> = {
  'computer-science': <Terminal className="h-4 w-4" />,
  mathematics: <Calculator className="h-4 w-4" />,
  robotics: <Bot className="h-4 w-4" />,
  physics: <Atom className="h-4 w-4" />,
  philosophy: <Book className="h-4 w-4" />,
  default: <BookOpen className="h-4 w-4" />,
}

function getCategoryIcon(slug: string) {
  const lowerSlug = slug.toLowerCase()
  for (const key of Object.keys(categoryIcons)) {
    if (lowerSlug.includes(key)) {
      return categoryIcons[key]
    }
  }
  return categoryIcons.default
}

export default function ApiBlogPage() {
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts({
    status: 'Published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: POSTS_PER_PAGE,
    page,
  })

  const totalPages = Math.max(1, Math.ceil((postsData?.total || 0) / POSTS_PER_PAGE))

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const categories = Array.isArray(categoriesData) ? categoriesData : []
  const posts = postsData?.posts

  const postsByCategory = useMemo(() => {
    if (!posts) {
      return {}
    }

    const grouped: Record<string, typeof posts> = {
      all: posts,
    }

    posts.forEach((post) => {
      const categorySlug = post.category_slug || 'uncategorized'
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = []
      }
      grouped[categorySlug].push(post)
    })

    return grouped
  }, [posts])

  const filteredPosts = useMemo(() => {
    const posts = postsByCategory[selectedCategory || 'all'] || []

    if (!searchQuery.trim()) {
      return posts
    }

    const query = searchQuery.toLowerCase()
    return posts.filter((post) => {
      return post.title.toLowerCase().includes(query) || post.summary?.toLowerCase().includes(query)
    })
  }, [postsByCategory, searchQuery, selectedCategory])

  const displayPosts = filteredPosts

  useEffect(() => {
    setPage(1)
  }, [selectedCategory, searchQuery])

  const paginatedPosts = useMemo(() => {
    return displayPosts.slice(0, POSTS_PER_PAGE)
  }, [displayPosts])

  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const goToNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setPage(page - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (postsLoading || categoriesLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-amber-700 border-r-transparent dark:border-amber-500" />
          <p className="mt-6 text-sm text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-tertiary)]">加载中...</p>
        </div>
      </div>
    )
  }

  if (postsError || !postsData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-red-600 dark:text-red-400">加载失败</h2>
          <p className="text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-tertiary)]">
            {postsError instanceof Error ? postsError.message : '无法加载文章列表，请稍后重试。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
      <aside className="space-y-6 border border-[var(--theme-border)]/70 bg-[var(--theme-bg-secondary)]/80 p-5 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.28)] dark:border-zinc-800/80 /40 dark:shadow-[0_30px_80px_-60px_rgba(5,8,15,0.9)] lg:sticky lg:top-28 lg:self-start">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
              分类
            </h2>
          </div>

          <nav className="space-y-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex w-full items-center gap-3 text-left text-xs font-medium uppercase tracking-[0.15rem] transition-all ${
                selectedCategory === null
                  ? 'translate-x-1 text-[var(--theme-fg)] '
                  : 'text-[var(--theme-fg-secondary)] hover:translate-x-1 hover:text-[var(--theme-fg)] dark:text-[var(--theme-fg-tertiary)] dark:hover:text-zinc-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              全部文章
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`flex w-full items-center gap-3 text-left text-xs font-medium uppercase tracking-[0.15rem] transition-all ${
                  selectedCategory === category.slug
                    ? 'translate-x-1 text-[var(--theme-fg)] '
                    : 'text-[var(--theme-fg-secondary)] hover:translate-x-1 hover:text-[var(--theme-fg)] dark:text-[var(--theme-fg-tertiary)] dark:hover:text-zinc-200'
                }`}
              >
                {getCategoryIcon(category.slug)}
                {category.name}
              </button>
            ))}
          </nav>

          <div className="border-t border-[var(--theme-border)]/80 pt-5 dark:border-zinc-700/60">
            <div className="text-[10px] font-medium uppercase tracking-[0.15rem] text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-tertiary)]">
              共 {displayPosts.length} 篇文章
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          <div className="max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="w-full border border-[var(--theme-border)]/70 bg-[var(--theme-bg-secondary)]/90 px-4 py-3 pl-10 text-sm text-[var(--theme-fg)] shadow-[0_20px_60px_-52px_rgba(15,23,42,0.3)] transition-all placeholder:text-[var(--theme-fg-tertiary)] focus:border-amber-700/30 focus:bg-[var(--theme-bg)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-zinc-800/80 /60 dark:placeholder:text-[var(--theme-fg-secondary)] dark:focus:border-amber-500/20 dark:focus:bg-zinc-900"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-fg-tertiary)] dark:text-[var(--theme-fg-secondary)]" />
            </div>
          </div>

          {searchQuery && (
            <div className="text-xs font-medium uppercase tracking-[0.15rem] text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-tertiary)]">
              找到 <span className="text-amber-700 dark:text-amber-500">{filteredPosts.length}</span>{' '}
              篇关于 “{searchQuery}” 的文章
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginatedPosts.map((post) => {
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group relative block border border-[var(--theme-border)]/70 bg-[var(--theme-bg-secondary)]/90 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] transition-all duration-500 hover:-translate-y-1 hover:border-amber-700/30 hover:bg-[var(--theme-bg)] dark:border-zinc-800/80 /60 dark:shadow-[0_30px_80px_-60px_rgba(5,8,15,0.95)] dark:hover:border-amber-500/20 dark:hover:bg-zinc-900/90"
                >
                  {post.category_name && (
                    <div className="mb-3">
                      <span className="text-[10px] font-medium uppercase tracking-[0.15rem] text-amber-700 dark:text-amber-500">
                        {post.category_name}
                      </span>
                    </div>
                  )}

                  <h2
                    className="text-xl font-semibold leading-tight text-[var(--theme-fg)] transition-colors group-hover:text-amber-700 dark:group-hover:text-amber-400"
                    style={{ fontFamily: 'var(--font-newsreader)' }}
                  >
                    {post.title}
                  </h2>

                  {post.summary && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-tertiary)]">
                      {post.summary}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.1rem] text-[var(--theme-fg-tertiary)] dark:text-[var(--theme-fg-secondary)]">
                    <div className="flex items-center gap-4">
                      <span>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '未发布'}
                      </span>
                      <span>{post.reading_time || 1} 分钟阅读</span>
                    </div>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
                  </div>
                </Link>
              )
            })}
          </section>

          {displayPosts.length === 0 && (
            <div className="py-24 text-center">
              <p
                className="text-2xl italic text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-tertiary)]"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                {searchQuery ? `没有找到关于 “${searchQuery}” 的文章` : '该分类下暂无文章'}
              </p>
            </div>
          )}

          {displayPosts.length > 0 && (
            <div className="flex items-center justify-center gap-8 pt-4">
              <button
                onClick={goToPrevPage}
                disabled={!hasPrevPage}
                className={`flex items-center gap-2 border px-6 py-3 text-xs font-medium uppercase tracking-[0.2rem] transition-all ${
                  hasPrevPage
                    ? 'border-zinc-300 bg-[var(--theme-bg-secondary)]/80 text-[var(--theme-fg-secondary)] hover:border-amber-700 hover:bg-white hover:text-[var(--theme-fg)] dark:border-zinc-700 /50 dark:text-[var(--theme-fg-tertiary)] dark:hover:border-amber-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                    : 'cursor-not-allowed border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)]/70 text-zinc-300 opacity-50 dark:border-zinc-800 /40 dark:text-[var(--theme-fg-secondary)]'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </button>

              <div className="text-xs font-medium uppercase tracking-[0.2rem] text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-tertiary)]">
                <span className="text-[var(--theme-fg)] ">{page}</span>
                <span className="mx-2">/</span>
                <span>{totalPages}</span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={!hasNextPage}
                className={`flex items-center gap-2 border px-6 py-3 text-xs font-medium uppercase tracking-[0.2rem] transition-all ${
                  hasNextPage
                    ? 'border-zinc-300 bg-[var(--theme-bg-secondary)]/80 text-[var(--theme-fg-secondary)] hover:border-amber-700 hover:bg-white hover:text-[var(--theme-fg)] dark:border-zinc-700 /50 dark:text-[var(--theme-fg-tertiary)] dark:hover:border-amber-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                    : 'cursor-not-allowed border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)]/70 text-zinc-300 opacity-50 dark:border-zinc-800 /40 dark:text-[var(--theme-fg-secondary)]'
                }`}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
  )
}
