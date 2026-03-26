'use client'

import { useMemo } from 'react'
import { Clock, FileText } from 'lucide-react'
import Link from './Link'
import { usePosts } from '@/lib/hooks/useBlogData'

interface RecentArticlesProps {
  limit?: number
  currentSlug?: string
}

export function RecentArticles({ limit = 5, currentSlug }: RecentArticlesProps) {
  const { data: postsData } = usePosts({
    status: 'Published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: Math.max(limit + 1, 6),
    page: 1,
  })

  const recentArticles = useMemo(() => {
    return (postsData?.posts || []).filter((post) => post.slug !== currentSlug).slice(0, limit)
  }, [currentSlug, limit, postsData?.posts])

  if (recentArticles.length === 0) {
    return null
  }

  const formatDate = (date: string) => {
    const parsedDate = new Date(date)
    return parsedDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200/60 bg-[#F5F3F0] shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex-shrink-0 border-b border-gray-200/40 px-4 py-3 dark:border-gray-700">
        <h3
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
          suppressHydrationWarning
        >
          <FileText size={16} className="text-gray-400 dark:text-gray-500" />
          相关文章
        </h3>
      </div>

      <div className="flex-1 min-h-0 divide-y divide-gray-200/30 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:divide-gray-800/50 dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
        {recentArticles.map((article, index) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group block px-4 py-2.5 transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-start gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <h4 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 transition-colors group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
                    {article.title}
                  </h4>
                </div>

                <div className="ml-7 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={12} className="opacity-60" />
                  <span suppressHydrationWarning>
                    {formatDate(article.published_at || article.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
