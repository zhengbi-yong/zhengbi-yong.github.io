'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useCategories, usePosts } from '@/lib/hooks/useBlogData'
import { Search, BookOpen, Terminal, Calculator, Bot, Atom, Book, ChevronLeft, ChevronRight } from 'lucide-react'
import siteMetadata from '@/data/siteMetadata'

const POSTS_PER_PAGE = 9

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'computer-science': <Terminal className="w-4 h-4" />,
  'mathematics': <Calculator className="w-4 h-4" />,
  'robotics': <Bot className="w-4 h-4" />,
  'physics': <Atom className="w-4 h-4" />,
  'philosophy': <Book className="w-4 h-4" />,
  default: <BookOpen className="w-4 h-4" />,
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

  const postsByCategory = useMemo(() => {
    if (!postsData?.posts) {
      return {}
    }

    const grouped: Record<string, typeof postsData.posts> = {
      all: postsData.posts,
    }

    postsData.posts.forEach((post) => {
      const categorySlug = post.category_slug || 'uncategorized'
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = []
      }
      grouped[categorySlug].push(post)
    })

    return grouped
  }, [postsData?.posts])

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

  // Reset page when category or search changes
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, searchQuery])

  // Calculate posts for current page
  const paginatedPosts = useMemo(() => {
    const startIndex = 0
    const endIndex = POSTS_PER_PAGE
    return displayPosts.slice(startIndex, endIndex)
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
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-[#05080F]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="mt-6 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (postsError || !postsData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background dark:bg-[#05080F]">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-red-600 dark:text-red-400">加载失败</h2>
          <p className="text-muted-foreground">
            {postsError instanceof Error ? postsError.message : '无法加载文章列表，请稍后重试。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#05080F]">
      <div className="flex">
        {/* Sidebar - Category Navigation */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-80px)] w-64 bg-background dark:bg-[#05080F] sticky top-20 py-8 px-6 shrink-0 border-r border-border dark:border-[#31353d]/20">
          <div className="mb-8">
            <h2 className="font-newsreader italic text-xl text-foreground dark:text-slate-100">分类</h2>
          </div>

          <nav className="flex-1 space-y-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-3 w-full text-left font-inter text-xs uppercase tracking-[0.15rem] transition-all duration-300 ${
                selectedCategory === null
                  ? 'text-foreground dark:text-slate-100 pl-2 opacity-100'
                  : 'text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-300 hover:pl-2 opacity-80 hover:opacity-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              全部文章
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`flex items-center gap-3 w-full text-left font-inter text-xs uppercase tracking-[0.15rem] transition-all duration-300 ${
                selectedCategory === category.slug
                  ? 'text-foreground dark:text-slate-100 pl-2 opacity-100'
                  : 'text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-300 hover:pl-2 opacity-80 hover:opacity-100'
                }`}
              >
                {getCategoryIcon(category.slug)}
                {category.name}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-border dark:border-[#31353d]/20">
            <div className="font-inter text-[10px] uppercase tracking-[0.15rem] text-muted-foreground">
              共 {displayPosts.length} 篇文章
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 md:px-12 py-8 bg-background dark:bg-[#10131b]">
          {/* Search Bar */}
          <div className="mb-8 max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="w-full bg-muted/50 dark:bg-[#181c23] border border-border dark:border-[#31353d]/50 rounded-lg px-4 py-3 pl-10 text-sm text-foreground dark:text-[#e0e2ed] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Search Results Count */}
          {searchQuery && (
            <div className="mb-6 font-inter text-xs uppercase tracking-[0.15rem] text-muted-foreground">
              找到 <span className="text-primary">{filteredPosts.length}</span> 篇关于 "{searchQuery}" 的文章
            </div>
          )}

          {/* Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((post, index) => {
              const categoryColor = post.category_slug?.includes('robotics') || post.category_slug?.includes('robot')
                ? 'border-t-primary'
                : post.category_slug?.includes('math')
                ? 'border-t-[#c8c6c5]'
                : 'border-t-[#c6c7c6]'

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`group relative bg-muted/30 dark:bg-[#181c23] p-6 transition-all duration-500 hover:bg-muted/50 dark:hover:bg-[#262a32] hover:-translate-y-1 ${categoryColor} border-t-2`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Category Tag */}
                  {post.category_name && (
                    <div className="mb-3">
                      <span className="font-inter text-[10px] uppercase tracking-[0.15rem] text-muted-foreground">
                        {post.category_name}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="font-newsreader text-xl text-foreground dark:text-slate-100 leading-tight mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  {/* Summary */}
                  {post.summary && (
                    <p className="font-inter text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {post.summary}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="mt-5 flex items-center justify-between font-inter text-[10px] uppercase tracking-[0.1rem] text-muted-foreground/60">
                    <div className="flex items-center gap-4">
                      <span>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '未发布'}
                      </span>
                      <span>{post.reading_time || 1} 分钟阅读</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                      →
                    </div>
                  </div>

                  {/* Hover Accent Line */}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-500 group-hover:w-full" />
                </Link>
              )
            })}
          </section>

          {/* Empty State */}
          {displayPosts.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-newsreader text-2xl italic text-muted-foreground">
                {searchQuery ? `没有找到关于 "${searchQuery}" 的文章` : '该分类下暂无文章'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {displayPosts.length > 0 && (
            <div className="mt-12 flex items-center justify-center gap-8">
              <button
                onClick={goToPrevPage}
                disabled={!hasPrevPage}
                className={`flex items-center gap-2 font-inter text-xs uppercase tracking-[0.2rem] transition-all border px-6 py-3 ${
                  hasPrevPage
                    ? 'text-muted-foreground border-border hover:text-foreground hover:border-primary'
                    : 'text-muted-foreground/50 border-border/50 cursor-not-allowed opacity-50'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>

              <div className="font-inter text-xs uppercase tracking-[0.2rem] text-muted-foreground">
                <span className="text-foreground">{page}</span>
                <span className="mx-2">/</span>
                <span>{totalPages}</span>
              </div>

              <button
                onClick={goToNextPage}
                disabled={!hasNextPage}
                className={`flex items-center gap-2 font-inter text-xs uppercase tracking-[0.2rem] transition-all border px-6 py-3 ${
                  hasNextPage
                    ? 'text-muted-foreground border-border hover:text-foreground hover:border-primary'
                    : 'text-muted-foreground/50 border-border/50 cursor-not-allowed opacity-50'
                }`}
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t border-border dark:border-[#31353d]/20">
            <p className="font-inter text-[10px] uppercase tracking-[0.15rem] text-muted-foreground">
              {siteMetadata.author} · {siteMetadata.description}
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
