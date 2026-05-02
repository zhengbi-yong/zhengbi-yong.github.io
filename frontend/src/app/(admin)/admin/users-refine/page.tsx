/**  User Management with Refine
 * 使用 Refine hooks 的用户管理页面示例
 */

'use client'

import { useList, useDelete, useUpdate } from '@refinedev/core'
import { Loader2, Trash2, Search } from 'lucide-react'
import { useState } from 'react'
import { logger } from '@/lib/utils/logger'

export default function UsersRefinePage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [searchQuery, setSearchQuery] = useState('')

  // 使用 Refine 的 useList hook
  const queryResult = useList({
    resource: 'admin/users',
    pagination: {
      current: page,
      pageSize,
    } as any,
    filters: searchQuery
      ? [
          {
            field: 'search',
            operator: 'contains',
            value: searchQuery,
          },
        ]
      : [],
  })

  const query = queryResult.query
  const result = queryResult.result
  const data = result?.data
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  const deleteMutation = useDelete()
  const updateMutation = useUpdate()

  const users = data || []
  const total = result?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  const handleDelete = async (userId: string) => {
    if (confirm('确定要删除这个用户吗？')) {
      try {
        await deleteMutation.mutateAsync({
          resource: 'admin/users',
          id: userId,
        })
      } catch (error) {
        logger.error('Failed to delete user:', error)
        alert('删除失败')
      }
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateMutation.mutateAsync({
        resource: 'admin/users',
        id: userId,
        values: {
          role: newRole,
        },
      })
    } catch (error) {
      logger.error('Failed to update user role:', error)
      alert('更新角色失败')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-primary" />
          <p className="text-muted-foreground dark:text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/5 dark:bg-destructive/15 border border-destructive/20 dark:border-destructive/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-destructive dark:text-destructive mb-2">加载失败</h3>
        <p className="text-destructive dark:text-destructive">
          {error instanceof Error ? error.message : '无法加载用户数据'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">用户管理 (Refine)</h1>
        <p className="mt-2 text-muted-foreground dark:text-muted-foreground">
          使用 Refine hooks 管理的用户列表
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          placeholder="搜索用户..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-card text-foreground dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background dark:bg-card rounded-lg p-4 border border-border dark:border-border">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">总用户数</p>
          <p className="text-2xl font-bold text-foreground dark:text-white">{total}</p>
        </div>
        <div className="bg-background dark:bg-card rounded-lg p-4 border border-border dark:border-border">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">当前页</p>
          <p className="text-2xl font-bold text-foreground dark:text-white">
            {page} / {totalPages}
          </p>
        </div>
        <div className="bg-background dark:bg-card rounded-lg p-4 border border-border dark:border-border">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">每页显示</p>
          <p className="text-2xl font-bold text-foreground dark:text-white">{pageSize}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-background dark:bg-card rounded-lg border border-border dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted dark:bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-background dark:bg-card divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground dark:text-muted-foreground">
                    没有找到用户
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-muted dark:hover:bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-white">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground dark:text-white">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-sm border border-border dark:border-border rounded px-2 py-1 bg-background dark:bg-card text-foreground dark:text-white"
                        disabled={(updateMutation as any).isPending}
                      >
                        <option value="user">用户</option>
                        <option value="admin">管理员</option>
                        <option value="moderator">版主</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={(deleteMutation as any).isPending}
                        className="text-destructive hover:text-red-900 dark:text-destructive dark:hover:text-red-300 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-muted dark:bg-background px-6 py-3 flex items-center justify-between border-t border-border dark:border-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-foreground dark:text-foreground bg-background dark:bg-card border border-border dark:border-border rounded-md hover:bg-muted dark:hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-foreground dark:text-foreground">
              第 {page} 页，共 {totalPages} 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-foreground dark:text-foreground bg-background dark:bg-card border border-border dark:border-border rounded-md hover:bg-muted dark:hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

