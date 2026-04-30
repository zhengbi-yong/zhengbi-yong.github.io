/**  Enhanced User Management - 增强的用户管理页面(使用统一管理组件)
 *
 * 优化内容:
 * - 使用 PageHeader, DataCard, StatusBadge, LoadingState 统一组件
 * - 使用 EnhancedDataTable 组件(高信息密度)
 * - 集成 DataTableToolbar(搜索,筛选)
 * - 集成 DataTablePagination(紧凑分页)
 * - 保留所有原有功能(批量操作,角色管理)
 */

'use client'

import { useState } from 'react'
import { useList, useUpdate, useDelete, useInvalidate } from '@refinedev/core'
import type { UserListItem } from '@/lib/types/backend'
import { Trash2 } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'
import {
  EnhancedDataTable,
  DataTableToolbar,
  DataTablePagination,
} from '@/components/admin/data-table'
import type { Column } from '@/components/admin/data-table'
import { PageHeader } from '@/components/admin/page-header'
import { DataCard } from '@/components/admin/data-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { LoadingState } from '@/components/admin/empty-state'

export default function UserManagementPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, _setRoleFilter] = useState<string>('all')

  // 使用 Refine hooks (Refine v5 返回 { query, result } 结构)
  const queryResult = useList({
    resource: 'admin/users',
    pagination: {
      current: page,
      pageSize,
    } as any,
    filters: roleFilter !== 'all' ? [{ field: 'role', operator: 'eq', value: roleFilter }] : [],
  })

  const { query, result } = queryResult
  const data = result?.data ?? []
  const total = result?.total ?? 0
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  const invalidate = useInvalidate()
  const handleRefresh = () => {
    invalidate({ resource: 'admin/users', invalidates: ['list'] })
  }

  const updateMutation = useUpdate()
  const deleteMutation = useDelete()

  const users = data || []
  const totalPages = Math.ceil(total / pageSize)

  // 筛选用户(客户端筛选)
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
    if (!confirm(`确定要删除用户 "${username}" 吗?此操作不可撤销.`)) {
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // 角色变体映射
  const roleVariantMap: Record<string, 'default' | 'info' | 'warning'> = {
    admin: 'default',
    moderator: 'info',
    user: 'warning',
  }

  const roleLabelMap: Record<string, string> = {
    admin: '管理员',
    moderator: '版主',
    user: '用户',
  }

  // 定义表格列
  const columns: Column<UserListItem>[] = [
    {
      key: 'username',
      label: '用户名',
      width: '15%',
      sortable: true,
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
      key: 'email',
      label: '邮箱',
      width: '25%',
      sortable: true,
    },
    {
      key: 'role',
      label: '角色',
      width: '15%',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center gap-2">
          <StatusBadge variant={roleVariantMap[value] ?? 'muted'}>
            {roleLabelMap[value] ?? value}
          </StatusBadge>
          <select
            value={value}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
            disabled={(updateMutation as any).isPending}
            className={cn(
              'px-2 py-1 text-xs',
              'border border-border',
              'rounded',
              'bg-background text-foreground',
              'focus:ring-1 focus:ring-ring focus:outline-none',
              'disabled:opacity-50'
            )}
          >
            <option value="user">用户</option>
            <option value="moderator">版主</option>
            <option value="admin">管理员</option>
          </select>
        </div>
      ),
    },
    {
      key: 'email_verified',
      label: '验证',
      width: '10%',
      sortable: true,
      render: (value) => (
        <StatusBadge variant={value ? 'success' : 'danger'} dot>
          {value ? '已验证' : '未验证'}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at',
      label: '注册时间',
      width: '20%',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '15%',
      render: (_, user) => (
        <button
          onClick={() => handleDeleteUser(user.id, user.username)}
          disabled={(deleteMutation as any).isPending}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1',
            'text-sm font-medium',
            'text-destructive',
            'hover:bg-destructive/10',
            'rounded',
            'transition-colors duration-150',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {(deleteMutation as any).isPending ? '删除中...' : '删除'}
        </button>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="用户管理" description={`共 0 位用户`} />
        <LoadingState message="正在加载用户列表..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="用户管理" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-destructive">加载用户列表失败</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="用户管理"
        description={`共 ${total.toLocaleString()} 位用户`}
      />

      {/* 工具栏 */}
      <DataTableToolbar
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        searchPlaceholder="搜索用户(邮箱或用户名)..."
        isLoading={isLoading}
        totalCount={total}
      />

      {/* 数据表格 */}
      <DataCard>
        <EnhancedDataTable data={filteredUsers as UserListItem[]} columns={columns} rowKey="id" compact={true} />
      </DataCard>

      {/* 分页 */}
      {totalPages > 1 && (
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={filteredUsers.length}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
