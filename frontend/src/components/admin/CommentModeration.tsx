'use client'

import { useEffect, useState } from 'react'
import { adminService } from '@/lib/api/backend'
import type { CommentAdminItem } from '@/lib/types/backend'

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'all'

export default function CommentModeration() {
  const [comments, setComments] = useState<CommentAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<CommentStatus>('all')

  const loadComments = async (pageNum = 1, status: CommentStatus = 'all') => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminService.getComments(
        pageNum,
        pageSize,
        status === 'all' ? undefined : status
      )
      setComments(response.comments)
      setTotal(response.total)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to load comments:', err)
      setError('加载评论列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments(1, statusFilter)
  }, [statusFilter])

  const handleStatusChange = async (commentId: string, newStatus: string) => {
    try {
      setActionLoading(commentId)
      await adminService.updateCommentStatus(commentId, {
        status: newStatus,
      })
      await loadComments(page, statusFilter)
    } catch (err) {
      console.error('Failed to update comment status:', err)
      alert('更新评论状态失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
      return
    }

    try {
      setActionLoading(commentId)
      await adminService.deleteComment(commentId)
      await loadComments(page, statusFilter)
    } catch (err) {
      console.error('Failed to delete comment:', err)
      alert('删除评论失败')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">评论审核</h2>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-500 dark:text-gray-400">状态筛选：</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CommentStatus)}
            className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
            <option value="spam">垃圾评论</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : comments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      暂无评论
                    </td>
                  </tr>
                ) : (
                  comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                          {comment.content}
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[comment.status] || 'bg-gray-100 text-gray-800'
                        }`}>
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
                            onChange={(e) => handleStatusChange(comment.id, e.target.value)}
                            disabled={actionLoading === comment.id}
                            className="text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="pending">待审核</option>
                            <option value="approved">通过</option>
                            <option value="rejected">拒绝</option>
                            <option value="spam">垃圾</option>
                          </select>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={actionLoading === comment.id}
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
                    onClick={() => loadComments(page - 1, statusFilter)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => loadComments(page + 1, statusFilter)}
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
                      <span className="font-medium">{Math.min(page * pageSize, total)}</span> 条，
                      共 <span className="font-medium">{total}</span> 条
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => loadComments(page - 1, statusFilter)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        上一页
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => loadComments(pageNum, statusFilter)}
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
                        onClick={() => loadComments(page + 1, statusFilter)}
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
      )}
    </div>
  )
}
