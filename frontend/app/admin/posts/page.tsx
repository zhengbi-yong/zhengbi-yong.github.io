/**
 * Posts List Page
 * 文章列表管理页面 - 使用真实后端API数据
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Eye, Heart, MessageSquare, FileText } from 'lucide-react'
import { useList, useInvalidate } from '@refinedev/core'
import { Loader2 } from 'lucide-react'

export default function PostsListPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')

  console.log('[PostsPage] Component rendering, page:', page)

  // 尝试使用 invalidate 来强制刷新
  const invalidate = useInvalidate()

  // 使用 Refine hooks 获取真实数据
  const queryResult = useList({
    resource: 'admin/posts',
    pagination: {
      current: page,
      pageSize,
    },
  })

  console.log('[PostsPage] useList returned:', {
    hasQueryResult: !!queryResult,
    keys: Object.keys(queryResult),
    allValues: queryResult,
    isLoading: queryResult.isLoading,
    hasData: !!queryResult.data,
    hasError: !!queryResult.error,
  })

  // Refine v5 useList 返回 { query, result } 结构
  const query = queryResult.query
  const result = queryResult.result

  const data = result?.data
  const total = result?.total || 0
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  // 调试日志 - 使用JSON.stringify确保能看到完整内容
  console.log('=== Posts Debug Start ===')
  console.log('isLoading:', isLoading)
  console.log('error:', error)
  console.log('data:', data)
  console.log('data type:', typeof data)
  console.log('data is null:', data === null)
  console.log('data is undefined:', data === undefined)
  if (data) {
    console.log('data keys:', Object.keys(data))
    console.log('data.data:', data.data)
    console.log('data.data type:', typeof data.data)
    console.log('data.data is array:', Array.isArray(data.data))
    console.log('data.data length:', Array.isArray(data.data) ? data.data.length : 'N/A')
    console.log('data.total:', data.total)
    console.log('First post:', Array.isArray(data.data) && data.data.length > 0 ? data.data[0] : 'No posts')
  }
  console.log('=== Posts Debug End ===')

  const posts = data || []

  // 在页面上显示调试信息
  const debugInfo = {
    isLoading,
    hasData: !!data,
    dataType: data ? typeof data : 'no data',
    dataKeys: data ? Object.keys(data) : [],
    postsCount: posts.length,
    total,
    firstPost: posts[0] || null,
  }

  // 筛选文章
  const filteredPosts = posts.filter((post) => {
    return searchQuery === '' || post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">加载文章列表失败</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">调试信息</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          文章管理
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          管理和监控所有文章内容（共 {total} 篇）
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文章 slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  文章 Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  统计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? '没有找到匹配的文章' : '暂无文章'}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                          <Eye className="w-4 h-4" />
                          <span>{post.view_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.like_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comment_count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(post.updated_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">总文章数</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">总浏览量</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">总互动数</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {posts.reduce((sum, p) => sum + (p.like_count || 0) + (p.comment_count || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
