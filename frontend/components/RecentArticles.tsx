'use client'

import { useState, useEffect } from 'react'
import { allBlogs } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'
import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { Clock, Calendar } from 'lucide-react'
import Link from './Link'
import { useTranslation } from 'react-i18next'

interface RecentArticlesProps {
  limit?: number
}

export function RecentArticles({ limit = 5 }: RecentArticlesProps) {
  const { t } = useTranslation()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 获取最新文章
  const recentArticles = allCoreContent(sortPosts(allBlogs))
    .filter((post) => !post.draft)
    .slice(0, limit)

  const displayText = (key: string) => (isMounted ? t(key) : key)

  if (recentArticles.length === 0) {
    return null
  }

  const formatDate = (date: string) => {
    if (!isMounted) return ''
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 dark:border-gray-700" style={{ minHeight: '48px' }}>
        <h3
          className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100"
          suppressHydrationWarning
        >
          <Calendar size={18} className="text-blue-500" />
          最新文章
        </h3>
      </div>

      <div className="flex-1 min-h-0 divide-y divide-gray-100 dark:divide-gray-800/50">
        {recentArticles.map((article, index) => (
          <Link
            key={article.slug}
            href={`/${article.path}`}
            className="group block px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* 排名和标题 */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
                    {index + 1}
                  </span>
                  <h4 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400 transition-colors">
                    {article.title}
                  </h4>
                </div>

                {/* 日期 */}
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
                  <Clock size={12} className="opacity-60" />
                  <span suppressHydrationWarning>{formatDate(article.date)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

