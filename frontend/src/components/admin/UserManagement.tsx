'use client'

import { useEffect, useState } from 'react'
import { adminService } from '@/lib/api/backend'
import type { UserListItem } from '@/lib/types/backend'

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
      const response = await adminService.getUsers(pageNum, pageSize)
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          共 {total} 位用户
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
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    邮箱验证
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    注册时间
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading === user.id}
                          className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="user">普通用户</option>
                          <option value="moderator">版主</option>
                          <option value="admin">管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_verified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.email_verified ? '已验证' : '未验证'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={actionLoading === user.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
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
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => loadUsers(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => loadUsers(page + 1)}
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
                        onClick={() => loadUsers(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        上一页
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => loadUsers(pageNum)}
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
                        onClick={() => loadUsers(page + 1)}
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
