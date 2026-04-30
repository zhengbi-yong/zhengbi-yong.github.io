/**
 * Enhanced Comment Management - 增强的评论管理页面
 * 使用 Refine hooks 进行数据管理,支持批量操作和高级筛选
 */

'use client'

import { useState } from 'react'
import { useList, useUpdate, useDelete, useInvalidate } from '@refinedev/core'
import { Search, Filter, Trash2 } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

import { PageHeader } from '@/components/admin/page-header'
import { DataCard } from '@/components/admin/data-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { LoadingState } from '@/components/admin/empty-state'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/ui/select'

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'all'

const statusVariantMap: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  spam: 'info',
}

const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  spam: '垃圾评论',
}

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

  const handleStatusChange = async (commentId: string, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        resource: 'admin/comments',
        id: commentId,
        values: { status: newStatus },
      })
      // Refine 会自动刷新列表
    } catch (err) {
      logger.error('Failed to update comment status:', err)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('确定要删除这条评论吗?此操作不可撤销.')) {
      return
    }

    try {
      await deleteMutation.mutateAsync({
        resource: 'admin/comments',
        id: commentId,
      })
      // Refine 会自动刷新列表
    } catch (err) {
      logger.error('Failed to delete comment:', err)
    }
  }

  const handleBatchStatusUpdate = async (status: string) => {
    if (selectedComments.size === 0) return
    if (!window.confirm(`确定要将选中的 ${selectedComments.size} 条评论的状态改为 "${statusLabels[status] || status}" 吗?`)) {
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
      setSelectedComments(new Set())
      // 统一刷新一次列表
      invalidate({
        resource: 'admin/comments',
        invalidates: ['list'],
      })
    } catch (err) {
      logger.error('Failed to batch update status:', err)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedComments.size === 0) return
    if (!window.confirm(`确定要删除选中的 ${selectedComments.size} 条评论吗?此操作不可撤销.`)) {
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
      setSelectedComments(new Set())
      // 统一刷新一次列表
      invalidate({
        resource: 'admin/comments',
        invalidates: ['list'],
      })
    } catch (err) {
      logger.error('Failed to batch delete comments:', err)
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
      <div className="space-y-6">
        <PageHeader title="评论审核" description="管理和审核用户评论" />
        <LoadingState message="加载评论..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="评论审核" description="管理和审核用户评论" />
        <DataCard>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <p className="text-sm text-destructive">加载评论列表失败</p>
          </div>
        </DataCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="评论审核" description={`共 ${total} 条评论`} />

      {/* Filters and Actions */}
      <DataCard>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索评论内容、用户名或文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as CommentStatus)
                setPage(1) // Reset to first page when filter changes
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="spam">垃圾评论</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedComments.size > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedComments.size} 条评论
            </span>
            <div className="flex gap-2 ml-auto">
              <Select
                onValueChange={(value) => {
                  if (value) {
                    handleBatchStatusUpdate(value)
                  }
                }}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="批量修改状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">通过</SelectItem>
                  <SelectItem value="rejected">拒绝</SelectItem>
                  <SelectItem value="spam">标记为垃圾</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBatchDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                批量删除
              </Button>
            </div>
          </div>
        )}
      </DataCard>

      {/* Comment Table */}
      <DataCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  评论内容
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  用户
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  文章
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  发布时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    暂无评论
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => (
                  <tr
                    key={comment.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedComments.has(String(comment.id))}
                        onChange={() => toggleCommentSelection(String(comment.id))}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <p className="line-clamp-2">{comment.content}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {comment.username || '匿名用户'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-muted-foreground max-w-xs truncate block">
                        {comment.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge
                        variant={statusVariantMap[comment.status] || 'muted'}
                        dot
                      >
                        {statusLabels[comment.status] || comment.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Select
                          value={comment.status}
                          onValueChange={(value) => handleStatusChange(String(comment.id), value)}
                          disabled={(updateMutation as any).isLoading}
                        >
                          <SelectTrigger className="w-[90px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">待审核</SelectItem>
                            <SelectItem value="approved">通过</SelectItem>
                            <SelectItem value="rejected">拒绝</SelectItem>
                            <SelectItem value="spam">垃圾</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(String(comment.id))}
                          disabled={(deleteMutation as any).isLoading}
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          删除
                        </Button>
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
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                显示第 <span className="font-medium">{(page - 1) * pageSize + 1}</span> 到{' '}
                <span className="font-medium">{Math.min(page * pageSize, total)}</span> 条,共{' '}
                <span className="font-medium">{total}</span> 条
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </DataCard>
    </div>
  )
}
