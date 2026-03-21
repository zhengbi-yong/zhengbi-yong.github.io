'use client'

/**
 * Admin Posts Management Page - 文章管理页面（完善版）
 *
 * 功能：
 * - 列出所有文章（分页）
 * - 搜索和筛选
 * - 批量操作
 * - 快速编辑状态
 * - 删除文章
 */

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/api/backend'
import type { PostListItem } from '@/lib/types/backend'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'

type PostStatus = 'all' | 'Published' | 'Draft' | 'Archived'

export default function AdminPostsManagePage() {
  const { t } = useTranslation()
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
      const response = await fetch(
        `/api/v1/posts?page=${page}&page_size=${pageSize}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`
      )
      const data = await response.json()
      setPosts(data.data || [])
      setTotal(data.meta?.total || 0)
    } catch (error) {
      console.error('Failed to load posts:', error)
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
      setSelectedPosts(new Set(posts.map(p => p.id)))
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

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`确定要删除文章 "${title}" 吗？此操作不可撤销。`)) {
      return
    }

    setDeleting(prev => new Set(prev).add(slug))
    try {
      await adminService.deletePost(slug)
      // 重新加载列表
      loadPosts()
    } catch (error) {
      alert('删除失败')
      setDeleting(prev => {
        const newSet = new Set(prev)
        newSet.delete(slug)
        return newSet
      })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedPosts.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedPosts.size} 篇文章吗？此操作不可撤销。`)) {
      return
    }

    try {
      for (const postId of selectedPosts) {
        const post = posts.find(p => p.id === postId)
        if (post) {
          await adminService.deletePost(post.slug)
        }
      }
      setSelectedPosts(new Set())
      loadPosts()
    } catch (error) {
      alert('批量删除失败')
    }
  }

  const handleToggleStatus = async (slug: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published'
    try {
      // 这里需要调用更新状态的API
      await fetch(`/api/v1/admin/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      loadPosts()
    } catch (error) {
      alert('更新状态失败')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('admin.posts') || '文章管理'}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              共 {total} 篇文章
            </p>
          </div>
          <Link
            href="/admin/posts/new"
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            + {t('create') || '创建文章'}
          </Link>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('blog.status') || '状态'}:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PostStatus)
                setPage(1)
              }}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">{t('all') || '全部'}</option>
              <option value="Published">{t('blog.published') || '已发布'}</option>
              <option value="Draft">{t('blog.draft') || '草稿'}</option>
              <option value="Archived">{t('blog.archived') || '已归档'}</option>
            </select>
          </div>

          {/* 搜索框 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('search') || '搜索文章...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedPosts.size > 0 && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              已选择 {selectedPosts.size} 篇文章
            </span>
            <button
              onClick={handleBatchDelete}
              className="rounded bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600"
            >
              {t('delete') || '批量删除'}
            </button>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPosts.size === posts.length && posts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('blog.title') || '标题'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('blog.status') || '状态'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('blog.category') || '分类'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('blog.stats') || '统计'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('blog.createdAt') || '创建时间'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('actions') || '操作'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post.id)}
                      onChange={() => handleSelectPost(post.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="max-w-md truncate text-sm font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {post.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${getStatusColor(post.status)}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {post.category_name || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex gap-3">
                      <span title={t('blog.views') || '浏览'}>👁 {post.view_count}</span>
                      <span title={t('blog.likes') || '点赞'}>❤️ {post.like_count}</span>
                      <span title={t('blog.comments') || '评论'}>💬 {post.comment_count}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/posts/${post.slug}/edit`}
                        className="rounded bg-blue-500 px-2 py-1 text-white text-xs transition-colors hover:bg-blue-600"
                      >
                        {t('edit') || '编辑'}
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(post.slug, post.status)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {post.status === 'Published' ? (t('blog.unpublish') || '下线') : (t('blog.publish') || '发布')}
                      </button>
                      <button
                        onClick={() => handleDelete(post.slug, post.title)}
                        disabled={deleting.has(post.slug)}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        {deleting.has(post.slug) ? (t('loading') || '删除中...') : (t('delete') || '删除')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {posts.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              {t('noPostsFound') || '没有找到文章'}
            </div>
          )}
        </div>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t('previous') || '上一页'}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('page') || '第'} {page} / {Math.ceil(total / pageSize)} {t('page') || '页'}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
            disabled={page >= Math.ceil(total / pageSize)}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t('next') || '下一页'}
          </button>
        </div>
      )}
    </div>
  )
}
