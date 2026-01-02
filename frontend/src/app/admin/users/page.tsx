// @ts-nocheck
/**
 * Enhanced User Management - 增强的用户管理页面
 * 使用 Refine hooks 进行数据管理，支持批量操作和高级筛选
 */

'use client'

import { useState } from 'react'
import { useList, useUpdate, useDelete } from '@refinedev/core'
import type { UserListItem } from '@/lib/types/backend'
import { Loader2, Search, Filter, Trash2, UserCog } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

export default function UserManagementPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // 使用 Refine hooks (Refine v5 返回 { query, result } 结构)
  const queryResult = useList({
    resource: 'admin/users',
    pagination: {
      current: page,
      pageSize,
    },
    filters: roleFilter !== 'all' ? [{ field: 'role', operator: 'eq', value: roleFilter }] : [],
  })

  const query = queryResult.query
  const result = queryResult.result
  const data = result?.data
  const total = result?.total || 0
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  const updateMutation = useUpdate()
  const deleteMutation = useDelete()

  const users = data || []
  const totalPages = Math.ceil(total / pageSize)

  // 筛选用户
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateMutation.mutateAsync({
        resource: 'admin/users',
        id: userId,
        values: { role: newRole },
      })
    } catch (err) {
      logger.error('Failed to update user role:', err)
      alert('更新用户角色失败')
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可撤销。`)) {
      return
    }

    try {
      await deleteMutation.mutateAsync({
        resource: 'admin/users',
        id: userId,
      })
    } catch (err) {
      logger.error('Failed to delete user:', err)
      alert('删除用户失败')
    }
  }

  const handleBatchRoleUpdate = async (role: string) => {
    if (selectedUsers.size === 0) return
    if (!confirm(`确定要将选中的 ${selectedUsers.size} 个用户的角色改为 "${role}" 吗？`)) {
      return
    }

    try {
      // 使用 Promise.all 并行更新所有用户角色
      await Promise.all(
        Array.from(selectedUsers).map((userId) =>
          updateMutation.mutateAsync({
            resource: 'admin/users',
            id: userId,
            values: { role },
          })
        )
      )
      setSelectedUsers(new Set())
    } catch (err) {
      logger.error('Failed to batch update roles:', err)
      alert('批量更新角色失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedUsers.size === 0) return
    if (
      !confirm(`确定要删除选中的 ${selectedUsers.size} 个用户吗？此操作不可撤销。`)
    ) {
      return
    }

    try {
      // 使用 Promise.all 并行删除所有用户
      await Promise.all(
        Array.from(selectedUsers).map((userId) =>
          deleteMutation.mutateAsync({
            resource: 'admin/users',
            id: userId,
          })
        )
      )
      setSelectedUsers(new Set())
    } catch (err) {
      logger.error('Failed to batch delete users:', err)
      alert('批量删除失败')
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)))
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
        <p className="text-red-600 dark:text-red-400">加载用户列表失败</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">用户管理</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            共 {total} 位用户
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
              placeholder="搜索用户（邮箱或用户名）..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有角色</option>
              <option value="user">普通用户</option>
              <option value="moderator">版主</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedUsers.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              已选择 {selectedUsers.size} 个用户
            </span>
            <div className="flex space-x-2 ml-auto">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchRoleUpdate(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">批量修改角色</option>
                <option value="user">普通用户</option>
                <option value="moderator">版主</option>
                <option value="admin">管理员</option>
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

      {/* User Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    暂无用户
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
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
                        disabled={updateMutation.isPending}
                        className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="user">普通用户</option>
                        <option value="moderator">版主</option>
                        <option value="admin">管理员</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_verified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {user.email_verified ? '已验证' : '未验证'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? '删除中...' : '删除'}
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

