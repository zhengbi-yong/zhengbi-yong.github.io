/**
 * Post Detail Page
 * 文章详情页面 - 显示文章统计数据和评论列表
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useList } from '@refinedev/core'
import { ArrowLeft, Eye, Heart, MessageSquare, TrendingUp } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { postService, commentService } from '@/lib/api/backend'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // 获取文章统计
  const { data: statsData, isLoading: statsLoading, error: statsError } = useList({
    resource: `posts/${encodeURIComponent(slug)}/stats`,
    queryOptions: {
      enabled: !!slug,
    },
  })

  // 获取文章评论
  const { data: commentsData, isLoading: commentsLoading } = useList({
    resource: `posts/${encodeURIComponent(slug)}/comments`,
    pagination: { current: 1, pageSize: 20 },
    queryOptions: {
      enabled: !!slug,
    },
  })

  const stats = statsData?.data as any
  const comments = commentsData?.data?.comments || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            文章详情
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Slug: {slug}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {statsLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {statsError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-800 dark:text-red-400">
            无法加载文章统计数据。请检查slug是否正确。
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="浏览量"
            value={stats.view_count}
            icon={<Eye className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="点赞数"
            value={stats.like_count}
            icon={<Heart className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title="评论数"
            value={stats.comment_count}
            icon={<MessageSquare className="w-6 h-6" />}
            color="green"
          />
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            评论列表
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            共 {comments.length} 条评论
          </p>
        </div>

        {commentsLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center text-gray-600 dark:text-gray-400">
            暂无评论
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {comments.map((comment: any) => (
              <div key={comment.id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.user?.username || '匿名用户'}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                    {comment.like_count > 0 && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Heart className="w-3 h-3" />
                        <span>{comment.like_count} 点赞</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <a
          href={`/posts/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          查看文章
        </a>
        <button
          onClick={() => router.push('/admin/posts')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          返回列表
        </button>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value?.toLocaleString() || 0}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
