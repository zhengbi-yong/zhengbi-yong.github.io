'use client'

import { useEffect, useState } from 'react'
import { adminService } from '@/lib/api/backend'
import type { UserListItem } from '@/lib/types/backend'
import { cn } from '@/lib/utils'

const emailVerificationClasses = {
  verified: 'bg-[var(--theme-success)]/10 text-[var(--theme-success)] dark:bg-[var(--theme-success)]/15 dark:text-[var(--theme-success)]',
  unverified: 'bg-destructive/10 text-destructive dark:bg-destructive/10 dark:text-destructive',
} as const

const paginationButtonClasses = {
  active: 'z-10 border-blue-500 bg-[var(--theme-info-muted)] text-primary dark:border-blue-500 dark:bg-blue-900 dark:text-[var(--theme-fg)]',
  inactive:
    'border-border bg-background text-muted-foreground hover:bg-muted dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary',
} as const

export default function UserManagement() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUsers = async (pageNum = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminService.getUsers({ page: pageNum, page_size: pageSize })
      setUsers(response.users)
      setTotal(response.total)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId)
      await adminService.updateUserRole(userId, { role: newRole })
      await loadUsers(page)
    } catch (err) {
      console.error('Failed to update user role:', err)
      alert('更新用户角色失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可撤销。`)) {
      return
    }

    try {
      setActionLoading(userId)
      await adminService.deleteUser(userId)
      await loadUsers(page)
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert('删除用户失败')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground dark:text-white">用户管理</h2>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">共 {total} 位用户</div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 dark:border-destructive/20 dark:bg-destructive/15">
          <p className="text-destructive dark:text-destructive">{error}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-background shadow dark:bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-muted dark:bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase dark:text-muted-foreground">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase dark:text-muted-foreground">
                    邮箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase dark:text-muted-foreground">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase dark:text-muted-foreground">
                    邮箱验证
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase dark:text-muted-foreground">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase dark:text-muted-foreground">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-background dark:divide-gray-700 dark:bg-card">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-muted-foreground dark:text-muted-foreground"
                    >
                      加载中...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-muted-foreground dark:text-muted-foreground"
                    >
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted dark:hover:bg-secondary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground dark:text-white">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground dark:text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading === user.id}
                          className="rounded-md border-border text-sm shadow-sm focus:border-blue-500 focus:ring-primary disabled:opacity-50 dark:border-border dark:bg-secondary dark:text-white"
                        >
                          <option value="user">普通用户</option>
                          <option value="moderator">版主</option>
                          <option value="admin">管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                            user.email_verified
                              ? emailVerificationClasses.verified
                              : emailVerificationClasses.unverified
                          )}
                        >
                          {user.email_verified ? '已验证' : '未验证'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground dark:text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={actionLoading === user.id}
                          className="text-destructive hover:text-red-900 disabled:opacity-50 dark:text-destructive dark:hover:text-red-300"
                        >
                          {actionLoading === user.id ? '删除中...' : '删除'}
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
            <div className="border-t border-border bg-background px-4 py-3 sm:px-6 dark:border-border dark:bg-card">
              <div className="flex items-center justify-between">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => loadUsers(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => loadUsers(page + 1)}
                    disabled={page === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-foreground dark:text-foreground">
                      显示第 <span className="font-medium">{(page - 1) * pageSize + 1}</span> 到{' '}
                      <span className="font-medium">{Math.min(page * pageSize, total)}</span> 条，
                      共 <span className="font-medium">{total}</span> 条
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                      <button
                        onClick={() => loadUsers(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-l-md border border-border bg-background px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
                      >
                        上一页
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => loadUsers(pageNum)}
                          className={cn(
                            'relative inline-flex items-center border px-4 py-2 text-sm font-medium',
                            page === pageNum
                              ? paginationButtonClasses.active
                              : paginationButtonClasses.inactive
                          )}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        onClick={() => loadUsers(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center rounded-r-md border border-border bg-background px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
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
