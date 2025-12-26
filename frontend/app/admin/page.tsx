'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { adminService } from '@/lib/api/backend'
import type { AdminStats } from '@/lib/types/backend'
import AdminStatsCard from '@/components/admin/AdminStatsCard'
import UserManagement from '@/components/admin/UserManagement'
import CommentModeration from '@/components/admin/CommentModeration'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'comments'>('dashboard')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is authenticated and is admin
    const checkAdminAccess = async () => {
      try {
        const isAuth = await checkAuth()
        if (!isAuth) {
          router.push('/')
          return
        }

        // Try to load admin stats - if user is not admin, backend will return 403
        const adminStats = await adminService.getStats()
        setStats(adminStats)
        setLoading(false)
      } catch (err: any) {
        console.error('Failed to load admin data:', err)
        // Check if error is due to unauthorized access
        if (err?.statusCode === 403 || err?.type === 'AUTHORIZATION') {
          setError('您没有管理员权限')
        } else {
          setError('加载管理员数据失败')
        }
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [checkAuth, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理员控制台</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            欢迎回来，{user?.username}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              仪表板
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              用户管理
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              评论审核
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
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
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'comments' && <CommentModeration />}
      </div>
    </div>
  )
}
