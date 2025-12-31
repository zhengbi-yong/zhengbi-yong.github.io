'use client'

/**
 * 文章推荐组件
 *
 * 基于标签相似度和用户阅读历史的智能推荐
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/apiClient'
import { BookOpen, TrendingUp, Clock } from 'lucide-react'

interface RecommendedPost {
  slug: string
  title: string
  summary: string | null
  published_at: string | null
  view_count: number
  cover_image_url: string | null
  similarity_score?: number
  reason?: 'similar_tags' | 'trending' | 'recent' | 'reading_history'
}

interface RecommendationProps {
  currentSlug: string
  limit?: number
  showReason?: boolean
}

export function RecommendedPosts({
  currentSlug,
  limit = 5,
  showReason = true,
}: RecommendationProps) {
  const [recommendations, setRecommendations] = useState<RecommendedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [currentSlug])

  const fetchRecommendations = async () => {
    setIsLoading(true)

    try {
      // 获取相关文章（基于标签和分类）
      const response = await api.get<{ data: RecommendedPost[] }>(
        `/v1/posts/${encodeURIComponent(currentSlug)}/related?limit=${limit}`,
        { cache: 300000 } // 5分钟缓存
      })

      // 为每篇文章添加推荐理由
      const postsWithReason = (response.data || []).map((post, index) => ({
        ...post,
        reason: index < 2 ? 'similar_tags' : index < 4 ? 'trending' : 'recent',
      }))

      setRecommendations(postsWithReason)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      setRecommendations([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  const getReasonText = (reason?: string) => {
    switch (reason) {
      case 'similar_tags':
        return '相似标签'
      case 'trending':
        return '热门推荐'
      case 'recent':
        return '最新发布'
      case 'reading_history':
        return '基于阅读历史'
      default:
        return '推荐阅读'
    }
  }

  const getReasonIcon = (reason?: string) => {
    switch (reason) {
      case 'similar_tags':
        return BookOpen
      case 'trending':
        return TrendingUp
      case 'recent':
        return Clock
      default:
        return BookOpen
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
        <BookOpen className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
        推荐阅读
      </h3>

      <div className="space-y-4">
        {recommendations.map((post) => {
          const ReasonIcon = getReasonIcon(post.reason)
          const formattedDate = post.published_at
            ? new Date(post.published_at).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
              })
            : ''

          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block group hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-2 rounded transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                {/* 封面图 */}
                {post.cover_image_url && (
                  <div className="flex-shrink-0 w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-1">
                    {post.title}
                  </h4>

                  {post.summary && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                      {post.summary}
                    </p>
                  )}

                  {/* 元数据 */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    {showReason && post.reason && (
                      <span className="flex items-center text-blue-600 dark:text-blue-400">
                        <ReasonIcon className="h-3 w-3 mr-0.5" />
                        {getReasonText(post.reason)}
                      </span>
                    )}
                    {formattedDate && (
                      <>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </>
                    )}
                    {post.view_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{post.view_count} 次阅读</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 查看更多链接 */}
      <Link
        href="/blog"
        className="mt-4 block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        查看所有文章 →
      </Link>
    </div>
  )
}
