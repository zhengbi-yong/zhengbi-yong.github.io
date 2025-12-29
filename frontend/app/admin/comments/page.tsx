/**
 * Enhanced Comment Management - 增强的评论管理页面
 * 使用 Refine hooks 进行数据管理，支持批量操作和高级筛选
 */

'use client'

import { useState } from 'react'
import { useList, useUpdate, useDelete, useInvalidate } from '@refinedev/core'
import type { CommentAdminItem } from '@/lib/types/backend'
import { Loader2, Search, Filter, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'all'

export default function CommentManagementPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<CommentStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 使用 Refine hooks (Refine v5 返回 { query, result } 结构)
  const queryResult = useList({
    resource: 'admin/comments',
    pagination: {
      current: page,
      pageSize,
    } as any,
    filters: statusFilter !== 'all' ? [{ field: 'status', operator: 'eq', value: statusFilter }] : [],
  })

  const query = queryResult.query
  const result = queryResult.result
  const data = result?.data
  const total = result?.total || 0
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  const updateMutation = useUpdate()
  const deleteMutation = useDelete()
  const invalidate = useInvalidate()

  const comments = data || []
  const totalPages = Math.ceil(total / pageSize)

  // 筛选评论
  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      searchQuery === '' ||
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.slug.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    spam: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }

  const statusLabels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    spam: '垃圾评论',
  }

  const handleStatusChange = async (commentId: string, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        resource: 'admin/comments',
        id: commentId,
        values: { status: newStatus },
      })
      // 显示成功提示
      alert(`评论状态已成功更新为"${statusLabels[newStatus] || newStatus}"`)
      // Refine 会自动刷新列表
    } catch (err) {
      logger.error('Failed to update comment status:', err)
      alert('更新评论状态失败')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
      return
    }

    try {
      await deleteMutation.mutateAsync({
        resource: 'admin/comments',
        id: commentId,
      })
      // 显示成功提示
      alert('评论已成功删除')
      // Refine 会自动刷新列表
    } catch (err) {
      logger.error('Failed to delete comment:', err)
      alert('删除评论失败')
    }
  }

  const handleBatchStatusUpdate = async (status: string) => {
    if (selectedComments.size === 0) return
    if (!confirm(`确定要将选中的 ${selectedComments.size} 条评论的状态改为 "${statusLabels[status] || status}" 吗？`)) {
      return
    }

    try {
      // 使用 Promise.all 并行更新所有评论状态
      // 禁用自动刷新以提高性能
      await Promise.all(
        Array.from(selectedComments).map((commentId) =>
          updateMutation.mutateAsync({
            resource: 'admin/comments',
            id: commentId,
            values: { status },
            meta: {
              invalidates: [], // 禁用自动刷新
            },
          })
        )
      )
      // 显示成功提示
      alert(`成功将 ${selectedComments.size} 条评论的状态更新为"${statusLabels[status] || status}"`)
      setSelectedComments(new Set())
      // 统一刷新一次列表
      invalidate({
        resource: 'admin/comments',
        invalidates: ['list'],
      })
    } catch (err) {
      logger.error('Failed to batch update status:', err)
      alert('批量更新状态失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedComments.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedComments.size} 条评论吗？此操作不可撤销。`)) {
      return
    }

    try {
      // 使用 Promise.all 并行删除所有评论
      // 禁用自动刷新以提高性能
      await Promise.all(
        Array.from(selectedComments).map((commentId) =>
          deleteMutation.mutateAsync({
            resource: 'admin/comments',
            id: commentId,
            meta: {
              invalidates: [], // 禁用自动刷新
            },
          })
        )
      )
      // 显示成功提示
      alert(`成功删除 ${selectedComments.size} 条评论`)
      setSelectedComments(new Set())
      // 统一刷新一次列表
      invalidate({
        resource: 'admin/comments',
        invalidates: ['list'],
      })
    } catch (err) {
      logger.error('Failed to batch delete comments:', err)
      alert('批量删除失败')
    }
  }

  const toggleCommentSelection = (commentId: string) => {
    const newSelected = new Set(selectedComments)
    if (newSelected.has(commentId)) {
      newSelected.delete(commentId)
    } else {
      newSelected.add(commentId)
    }
    setSelectedComments(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedComments.size === filteredComments.length) {
      setSelectedComments(new Set())
    } else {
      setSelectedComments(new Set(filteredComments.map((c) => String(c.id))))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">加载评论列表失败</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">评论审核</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            共 {total} 条评论
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索评论内容、用户名或文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CommentStatus)
                setPage(1) // Reset to first page when filter changes
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="spam">垃圾评论</option>
            </select>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedComments.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              已选择 {selectedComments.size} 条评论
            </span>
            <div className="flex space-x-2 ml-auto">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchStatusUpdate(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">批量修改状态</option>
                <option value="approved">通过</option>
                <option value="rejected">拒绝</option>
                <option value="spam">标记为垃圾</option>
              </select>
              <button
                onClick={handleBatchDelete}
                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>批量删除</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comment Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  评论内容
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  文章
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  发布时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    暂无评论
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => (
                  <tr
                    key={comment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedComments.has(String(comment.id))}
                        onChange={() => toggleCommentSelection(String(comment.id))}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-md">
                        <p className="line-clamp-2">{comment.content}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {comment.username || '匿名用户'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {comment.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[comment.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[comment.status] || comment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <select
                          value={comment.status}
                          onChange={(e) => handleStatusChange(String(comment.id), e.target.value)}
                          disabled={(updateMutation as any).isLoading}
                          className="text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="pending">待审核</option>
                          <option value="approved">通过</option>
                          <option value="rejected">拒绝</option>
                          <option value="spam">垃圾</option>
                        </select>
                        <button
                          onClick={() => handleDeleteComment(String(comment.id))}
                          disabled={(deleteMutation as any).isLoading}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    显示第 <span className="font-medium">{(page - 1) * pageSize + 1}</span> 到{' '}
                    <span className="font-medium">{Math.min(page * pageSize, total)}</span> 条，共{' '}
                    <span className="font-medium">{total}</span> 条
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      上一页
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-200'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

