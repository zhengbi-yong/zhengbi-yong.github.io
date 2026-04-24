'use client'

/**
 * Reading History Page - 阅读历史页面
 *
 * 显示用户的所有阅读进度记录
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { readingProgressService } from '@/lib/api/backend'
import type { ReadingProgress } from '@/lib/types/backend'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'

export default function ReadingHistoryPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [history, setHistory] = useState<ReadingProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const loadHistory = async (page: number) => {
    if (!user) return

    setLoading(true)
    try {
      const response = await readingProgressService.getHistory(page, 20)
      setHistory(response.history)
      setTotalPages(response.total_pages)
      setTotalCount(response.total)
    } catch (err) {
      console.error('Failed to load reading history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 添加一个小延迟确保 store 已初始化
    const timer = setTimeout(() => {
      if (user) {
        loadHistory(currentPage)
      } else {
        setLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [user, currentPage])

  // 重置进度
  const handleResetProgress = async (slug: string, postTitle: string) => {
    if (!confirm(`${t('blog.confirmResetProgress') || '确定要重置'} "${postTitle}" ${t('blog.readingProgress') || '的阅读进度'}？`)) {
      return
    }

    try {
      await readingProgressService.resetProgress(slug)
      // 重新加载当前页
      loadHistory(currentPage)
    } catch (_) {
      alert(t('blog.resetFailed') || '重置失败')
    }
  }

  // 未登录显示
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('blog.loginRequired') || '请先登录'}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {t('blog.loginToViewHistory') || '登录后即可查看您的阅读历史'}
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          >
            {t('auth.login') || '登录'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t('blog.readingHistory') || '阅读历史'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('blog.readingHistoryDesc') || '查看您的阅读进度和历史记录'} ({totalCount})
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">📖</div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {t('blog.noReadingHistory') || '暂无阅读历史'}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {t('blog.startReading') || '开始阅读文章，您的进度将自动保存'}
          </p>
          <Link
            href="/blog"
            className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          >
            {t('nav.blog') || '浏览文章'}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={`${item.post_id}-${item.user_id}`}
                className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/blog/${item.post_slug}`}
                      className="mb-2 text-xl font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {item.post_title}
                    </Link>

                    <div className="mb-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {t('blog.lastRead') || '最后阅读'}:{' '}
                        {new Date(item.last_read_at).toLocaleString('zh-CN')}
                      </span>
                      {item.completed_at && (
                        <span className="flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓ {t('blog.completed') || '已完成'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {t('blog.progress') || '进度'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">{item.progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full transition-all ${
                              item.progress === 100
                                ? 'bg-green-500'
                                : item.progress >= 50
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Link
                      href={`/blog/${item.post_slug}`}
                      className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                    >
                      {item.progress > 0 ? (t('blog.continueReading') || '继续阅读') : (t('blog.startReading') || '开始阅读')}
                    </Link>
                    <button
                      onClick={() => handleResetProgress(item.post_slug, item.post_title)}
                      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {t('blog.reset') || '重置'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('previous') || '上一页'}
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('page') || '第'} {currentPage} / {totalPages} {t('page') || '页'}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('next') || '下一页'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
