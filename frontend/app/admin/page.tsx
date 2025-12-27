/**
 * Admin Dashboard - 增强的管理仪表板
 * 使用 Refine hooks 进行数据管理，提供实时更新和更好的用户体验
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { useList } from '@refinedev/core'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import { Loader2 } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  
  // 使用 Refine hooks 获取统计数据
  const { data, isLoading, error } = useList({
    resource: 'admin/stats',
    pagination: { current: 1, pageSize: 1 },
  })
  
  const stats = data?.data?.[0] // 从数组中取出第一个元素

  useEffect(() => {
    // Check if user is authenticated and is admin
    const checkAdminAccess = async () => {
      try {
        const isAuth = await checkAuth()
        if (!isAuth) {
          router.push('/')
          return
        }
      } catch (err) {
        console.error('Failed to check auth:', err)
        router.push('/')
      }
    }

    checkAdminAccess()
  }, [checkAuth, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
          加载失败
        </h3>
        <p className="text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : '无法加载管理员数据，请检查您的权限'}
        </p>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">仪表板</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          欢迎回来，{user?.username || '管理员'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="总用户数"
          value={stats.total_users}
          icon="👥"
          color="blue"
        />
        <AdminStatsCard
          title="总评论数"
          value={stats.total_comments}
          icon="💬"
          color="green"
        />
        <AdminStatsCard
          title="待审核评论"
          value={stats.pending_comments}
          icon="⏳"
          color="yellow"
        />
        <AdminStatsCard
          title="已通过评论"
          value={stats.approved_comments}
          icon="✅"
          color="emerald"
        />
      </div>

      {/* 可以在这里添加更多内容，如图表、最近活动等 */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            快速操作
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">用户管理</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                查看和管理所有用户
              </p>
            </a>
            <a
              href="/admin/comments"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">评论审核</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                审核和管理评论
              </p>
            </a>
            <a
              href="/admin/posts"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">文章管理</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                查看文章统计和详情
              </p>
            </a>
            <a
              href="/admin/analytics"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">数据分析</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                查看用户增长和趋势
              </p>
            </a>
            <a
              href="/admin/monitoring"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">系统监控</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                健康检查和性能指标
              </p>
            </a>
            <a
              href="/admin/settings"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">系统设置</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                配置系统参数
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
