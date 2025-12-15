'use client'

import { useTranslation } from 'react-i18next'
import { useArticleAnalytics, getAllAnalytics, getPopularArticles } from './hooks/useArticleAnalytics'
import { Eye, Clock, BarChart3, TrendingUp, Award } from 'lucide-react'

interface ArticleAnalyticsProps {
  articleId: string
  showDetails?: boolean
  compact?: boolean
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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes} ${t('analytics.minute', { count: minutes })}`
    }
    return `${seconds} ${t('analytics.second', { count: seconds })}`
  }

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Eye size={14} />
          {analytics.viewCount}
        </span>
        <span>{getPopularityLabel()}</span>
        {isPopular && <TrendingUp size={14} className="text-orange-500" />}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* 热度标签 */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('analytics.popularity')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
            {getPopularityLabel()}
          </span>
          {isPopular && <TrendingUp size={16} className="text-orange-500" />}
          {analytics.engagementScore >= 80 && (
            <Award size={16} className="text-red-500" />
          )}
        </div>
      </div>

      {/* 参与度分数 */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {t('analytics.engagementScore')}
          </span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {analytics.engagementScore}/100
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-orange-500 transition-all duration-300"
            style={{ width: `${analytics.engagementScore}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* 浏览次数 */}
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('analytics.views')}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {analytics.viewCount}
              </p>
            </div>
          </div>

          {/* 平均阅读时间 */}
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('analytics.avgReadingTime')}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatTime(analytics.averageReadingTime)}
              </p>
            </div>
          </div>

          {/* 滚动深度 */}
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('analytics.scrollDepth')}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatPercentage(analytics.scrollDepth)}
              </p>
            </div>
          </div>

          {/* 最后访问时间 */}
          {analytics.lastVisited && (
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('analytics.lastVisited')}
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
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

// 热门文章列表组件
interface PopularArticlesProps {
  limit?: number
  excludeId?: string
}

export function PopularArticles({ limit = 5, excludeId }: PopularArticlesProps) {
  const { t } = useTranslation()
  const popularArticles = getPopularArticles(limit).filter(
    article => article.articleId !== excludeId
  )

  if (popularArticles.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <TrendingUp size={20} className="text-orange-500" />
        {t('analytics.popularArticles')}
      </h3>

      <div className="space-y-3">
        {popularArticles.map(({ articleId, analytics }) => (
          <div
            key={articleId}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
          >
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                {articleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {analytics.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {Math.round(analytics.averageReadingTime / 60)}min
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  analytics.engagementScore >= 80
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : analytics.engagementScore >= 60
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                }`}
              >
                {analytics.engagementScore}/100
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}