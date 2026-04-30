'use client'

/**
 * Admin Posts Management Page - 文章管理页面
 *
 * 功能:
 * - 列出所有文章(分页)
 * - 搜索和筛选
 * - 批量操作
 * - 快速编辑状态
 * - 删除文章
 */

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/api/backend'
import type { PostListItem } from '@/lib/types/backend'
import Link from 'next/link'
import { Eye, Heart, MessageSquare, Plus, Trash2 } from 'lucide-react'

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

type PostStatus = 'all' | 'Published' | 'Draft' | 'Archived'

function getStatusVariant(status: string) {
  switch (status) {
    case 'Published':
      return 'success' as const
    case 'Draft':
      return 'warning' as const
    case 'Archived':
      return 'muted' as const
    default:
      return 'info' as const
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'Published':
      return '已发布'
    case 'Draft':
      return '草稿'
    case 'Archived':
      return '已归档'
    default:
      return status
  }
}

export default function AdminPostsManagePage() {
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<PostStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<Set<string>>(new Set())

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await adminService.listAdminPosts({
        page,
        page_size: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      })
      // Handle both public and admin response shapes
      const postsList = (data as any).posts || (data as any).data || []
      const totalCount = (data as any).total || (data as any).meta?.total || 0
      setPosts(postsList)
      setTotal(totalCount)
    } catch (e) {
      console.error('Failed to load posts:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [page, statusFilter, searchQuery])

  const handleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(posts.map((p) => p.id)))
    }
  }

  const handleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  const handleDelete = async (postId: string, title: string) => {
    if (!confirm(`确定要删除文章 "${title}" 吗?此操作不可撤销.`)) {
      return
    }

    setDeleting((prev) => new Set(prev).add(postId))
    try {
      await adminService.deletePost(postId)
      loadPosts()
    } catch (_e) {
      alert('删除失败')
      setDeleting((prev) => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedPosts.size === 0) return

    if (
      !confirm(
        `确定要删除选中的 ${selectedPosts.size} 篇文章吗?此操作不可撤销.`
      )
    ) {
      return
    }

    try {
      for (const postId of selectedPosts) {
        const post = posts.find((p) => p.id === postId)
        if (post) {
          await adminService.deletePost(post.id)
        }
      }
      setSelectedPosts(new Set())
      loadPosts()
    } catch (_e) {
      alert('批量删除失败')
    }
  }

  const handleToggleStatus = async (postId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published'
    try {
      await adminService.updatePost(postId, { status: newStatus })
      loadPosts()
    } catch (_e) {
      alert('更新状态失败')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <PageHeader title="文章管理" description={`共 ${total} 篇文章`}>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="mr-1.5 h-4 w-4" />
            创建文章
          </Link>
        </Button>
      </PageHeader>

      {/* 筛选和搜索 */}
      <DataCard>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">状态:</span>
            <Select
              value={statusFilter}
              onValueChange={(value: string) => {
                setStatusFilter(value as PostStatus)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="Published">已发布</SelectItem>
                <SelectItem value="Draft">草稿</SelectItem>
                <SelectItem value="Archived">已归档</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
      </DataCard>

      {/* 批量操作栏 */}
      {selectedPosts.size > 0 && (
        <div className="rounded-lg bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              已选择 {selectedPosts.size} 篇文章
            </span>
            <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              批量删除
            </Button>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {loading ? (
        <LoadingState message="加载文章..." />
      ) : (
        <DataCard title="文章列表" noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedPosts.size === posts.length && posts.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-input"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    标题
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    分类
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    统计
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => handleSelectPost(post.id)}
                        className="rounded border-input"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="max-w-md truncate text-sm font-medium text-primary hover:underline"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge variant={getStatusVariant(post.status)} dot>
                        {getStatusLabel(post.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {post.category_name || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1"
                          title="浏览"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {post.view_count}
                        </span>
                        <span
                          className="inline-flex items-center gap-1"
                          title="点赞"
                        >
                          <Heart className="h-3.5 w-3.5" />
                          {post.like_count}
                        </span>
                        <span
                          className="inline-flex items-center gap-1"
                          title="评论"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {post.comment_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/admin/posts/edit/${encodeURIComponent(post.slug)}`}
                          >
                            编辑
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(post.id, post.status)
                          }
                        >
                          {post.status === 'Published' ? '下线' : '发布'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deleting.has(post.id)}
                        >
                          {deleting.has(post.id) ? '删除中...' : '删除'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {posts.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                没有找到文章
              </div>
            )}
          </div>
        </DataCard>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
