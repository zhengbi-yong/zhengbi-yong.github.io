// @ts-nocheck
/**
 * Posts List Page - Simple Version
 * 直接使用 API 调用，不使用 Refine 的 useList
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Eye, Heart, MessageSquare, FileText, Loader2 } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { resolveBackendApiBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

export default function PostsListSimplePage() {
  const [posts, setPosts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const backendApiUrl = resolveBackendApiBaseUrl()

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })

      const response = await fetch(`${backendApiUrl}/admin/posts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      logger.log('[PostsSimple] Received data:', data)

      setPosts(data.posts || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      logger.error('[PostsSimple] Error:', err)
      setError(err.message || 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [page, backendApiUrl])

  // 筛选文章
  const filteredPosts = posts.filter((post) => {
    return searchQuery === '' || post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">加载失败: {error}</p>
        <button
          onClick={fetchPosts}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">文章管理</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          管理和监控所有文章内容（共 {total} 篇）
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="搜索文章 slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  文章 Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  统计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  更新时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchQuery ? '没有找到匹配的文章' : '暂无文章'}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.view_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.like_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.comment_count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {new Date(post.updated_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        target="_blank"
                      >
                        预览
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            显示第 {(page - 1) * pageSize + 1} 到 {Math.min(page * pageSize, total)} 条，共 {total}{' '}
            条
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">总文章数</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">总浏览量</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">总互动数</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {posts
              .reduce((sum, p) => sum + (p.like_count || 0) + (p.comment_count || 0), 0)
              .toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
