'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { allBlogs } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'
import {
  useArticleAnalytics,
  getPopularArticles,
} from './hooks/useArticleAnalytics'
import { Eye, Clock, BarChart3, TrendingUp, Award } from 'lucide-react'
import Link from './Link'
import { cn } from '@/lib/utils'

interface ArticleAnalyticsProps {
  articleId: string
  showDetails?: boolean
  compact?: boolean
}

type EngagementTier = 'strong' | 'subtle'

const engagementBadgeClasses: Record<EngagementTier, string> = {
  strong: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  subtle: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const engagementBarClasses: Record<EngagementTier, string> = {
  strong: 'bg-gradient-to-r from-gray-500 to-gray-600',
  subtle: 'bg-gradient-to-r from-gray-400 to-gray-500',
}

function getEngagementTier(score: number): EngagementTier {
  return score >= 60 ? 'strong' : 'subtle'
}

export default function ArticleAnalytics({
  articleId,
  showDetails = true,
  compact = false,
}: ArticleAnalyticsProps) {
  const { t } = useTranslation()
  const { analytics, getPopularityLabel, isPopular } = useArticleAnalytics({
    articleId,
  })
  const [isMounted, setIsMounted] = useState(false)

  // 确保只在客户端渲染动态内容，避免水合不匹配
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const formatTime = (seconds: number): string => {
    if (!isMounted) return '0秒'
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes} ${t('analytics.minute', { count: minutes })}`
    }
    return `${seconds} ${t('analytics.second', { count: seconds })}`
  }

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`
  }

  // 在客户端准备好之前，使用服务器端的默认值避免水合不匹配
  const displayAnalytics = isMounted
    ? analytics
    : { viewCount: 0, engagementScore: 0, averageReadingTime: 0, scrollDepth: 0 }
  const displayPopularityLabel = isMounted ? getPopularityLabel() : ''
  const displayIsPopular = isMounted ? isPopular : false

  // 延迟渲染翻译文本，避免服务器端和客户端不匹配
  const displayText = (key: string) => (isMounted ? t(key) : key)

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1" suppressHydrationWarning>
          <Eye size={14} />
          {displayAnalytics.viewCount}
        </span>
        <span suppressHydrationWarning>{displayPopularityLabel}</span>
        {displayIsPopular && <TrendingUp size={14} className="text-gray-400 dark:text-gray-500" />}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* 热度标签 */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
          suppressHydrationWarning
        >
          {displayText('analytics.popularity')}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold text-gray-600 dark:text-gray-300"
            suppressHydrationWarning
          >
            {displayPopularityLabel}
          </span>
          {displayIsPopular && <TrendingUp size={16} className="text-gray-400 dark:text-gray-500" />}
          {displayAnalytics.engagementScore >= 80 && <Award size={16} className="text-gray-400 dark:text-gray-500" />}
        </div>
      </div>

      {/* 参与度分数 */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
            {displayText('analytics.engagementScore')}
          </span>
          <span
            className="text-xs font-medium text-gray-700 dark:text-gray-300"
            suppressHydrationWarning
          >
            {displayAnalytics.engagementScore}/100
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-orange-500 transition-all duration-300"
            style={{ width: `${displayAnalytics.engagementScore}%` }}
            suppressHydrationWarning
          />
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* 浏览次数 */}
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
                {displayText('analytics.views')}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100" suppressHydrationWarning>
                {displayAnalytics.viewCount}
              </p>
            </div>
          </div>

          {/* 平均阅读时间 */}
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
                {displayText('analytics.avgReadingTime')}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100" suppressHydrationWarning>
                {isMounted ? formatTime(analytics.averageReadingTime) : '0秒'}
              </p>
            </div>
          </div>

          {/* 滚动深度 */}
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
                {displayText('analytics.scrollDepth')}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100" suppressHydrationWarning>
                {isMounted ? formatPercentage(analytics.scrollDepth) : '0%'}
              </p>
            </div>
          </div>

          {/* 最后访问时间 */}
          {isMounted && analytics.lastVisited && (
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
                  {displayText('analytics.lastVisited')}
                </p>
                <p
                  className="font-medium text-gray-900 dark:text-gray-100"
                  suppressHydrationWarning
                >
                  {new Date(analytics.lastVisited).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 根据 articleId 获取文章信息
function getArticleBySlug(articleId: string): CoreContent<(typeof allBlogs)[0]> | undefined {
  // 尝试直接匹配 slug
  let article = allBlogs.find((blog) => blog.slug === articleId)

  // 如果没找到，尝试匹配 path
  if (!article) {
    article = allBlogs.find((blog) => blog.path === articleId)
  }

  // 如果还没找到，尝试匹配 path 的最后一部分
  if (!article) {
    const pathParts = articleId.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    article = allBlogs.find((blog) => {
      const blogPathParts = blog.path.split('/')
      return blogPathParts[blogPathParts.length - 1] === lastPart
    })
  }

  // 如果还没找到，尝试匹配 slug 的最后一部分
  if (!article) {
    const pathParts = articleId.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    article = allBlogs.find((blog) => blog.slug === lastPart)
  }

  return article
}

// 热门文章列表组件
interface PopularArticlesProps {
  limit?: number
  excludeId?: string
}

export function PopularArticles({ limit = 5, excludeId }: PopularArticlesProps) {
  const { t } = useTranslation()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const popularArticles = getPopularArticles(limit).filter(
    (article) => article.articleId !== excludeId
  )

  const displayText = (key: string) => (isMounted ? t(key) : key)

  if (popularArticles.length === 0) {
    return null
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200/60 bg-[#F5F3F0] shadow-sm dark:border-gray-700 dark:bg-gray-900" style={{ height: '100%', maxHeight: '100%' }}>
      <div className="flex-shrink-0 border-b border-gray-200/40 px-4 py-3 dark:border-gray-700">
        <h3
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
          suppressHydrationWarning
        >
          <TrendingUp size={16} className="text-gray-400 dark:text-gray-500" />
          {displayText('analytics.popularArticles')}
        </h3>
      </div>

      <div className="flex-1 min-h-0 divide-y divide-gray-200/30 dark:divide-gray-800/50 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
        {popularArticles.map(({ articleId, analytics }, index) => {
          const article = getArticleBySlug(articleId)
          const title = article?.title || articleId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
          const path = article?.path

          return (
            <Link
              key={articleId}
              href={path ? `/${path}` : '#'}
              className="group block px-4 py-2.5 transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* 排名和标题 */}
                  <div className="flex items-start gap-2 mb-2">
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
                      {index + 1}
                    </span>
                    <h4 className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400 transition-colors">
                      {title}
                    </h4>
                  </div>
                  
                  {/* 统计数据 */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 ml-7">
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Eye size={12} className="opacity-60" />
                      {analytics.viewCount}
                    </span>
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock size={12} className="opacity-60" />
                      {isMounted ? Math.round(analytics.averageReadingTime / 60) : 0}min
                    </span>
                  </div>
                </div>

                {/* 参与度分数 */}
                <div className="flex-shrink-0">
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        engagementBadgeClasses[getEngagementTier(analytics.engagementScore)]
                      )}
                      suppressHydrationWarning
                    >
                      {analytics.engagementScore}
                    </span>
                    {/* 进度条 */}
                    <div className="w-12 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          engagementBarClasses[getEngagementTier(analytics.engagementScore)]
                        )}
                        style={{ width: `${analytics.engagementScore}%` }}
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
