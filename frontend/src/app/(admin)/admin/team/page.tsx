'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminService } from '@/lib/api/backend'
import type { TeamMemberListItem, TeamRole } from '@/lib/types/backend'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'
import { MoreHorizontal, Plus, Search } from 'lucide-react'

const TEAM_ROLE_COLORS: Record<TeamRole, string> = {
  advisor: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  lead: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  member: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
}

const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  advisor: '导师',
  lead: '负责人',
  member: '成员',
}

function TeamRoleBadge({ role }: { role: TeamRole }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${TEAM_ROLE_COLORS[role]}`}>
      {TEAM_ROLE_LABELS[role]}
    </span>
  )
}

export default function TeamManagementPage() {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMemberListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [roleFilter, setRoleFilter] = useState<TeamRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<Set<string>>(new Set())

  const totalPages = Math.ceil(total / pageSize)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params: {
        page: number
        page_size: number
        is_active?: boolean
        team_role?: string
        search?: string
      } = {
        page,
        page_size: pageSize,
        is_active: true,
      }
      if (roleFilter !== 'all') params.team_role = roleFilter
      if (searchQuery) params.search = searchQuery

      const data = await adminService.getTeamMembers(params)
      setMembers(data.data)
      setTotal(data.total)
    } catch (e) {
      console.error('Failed to load team members:', e)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, roleFilter, searchQuery])

  useEffect(() => { loadMembers() }, [loadMembers])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除成员 "${name}" 吗？`)) return
    setDeleting(prev => new Set(prev).add(id))
    try {
      await adminService.deleteTeamMember(id)
      loadMembers()
    } catch (_e) {
      alert('删除失败')
    } finally {
      setDeleting(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">团队管理</h1>
          <p className="text-muted-foreground">管理团队成员信息</p>
        </div>
        <Button onClick={() => router.push('/admin/team/new')}>
          <Plus className="w-4 h-4 mr-2" />
          添加成员
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as TeamRole | 'all')}
          className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[150px]"
        >
          <option value="all">全部角色</option>
          <option value="advisor">导师</option>
          <option value="lead">负责人</option>
          <option value="member">成员</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-[300px] px-4 py-3 text-left text-sm font-medium">姓名</th>
              <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium">职位/头衔</th>
              <th className="px-4 py-3 text-left text-sm font-medium">机构</th>
              <th className="w-[100px] px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  加载中...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-medium dark:bg-amber-900/30 dark:text-amber-400">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        {member.name_en && (
                          <div className="text-sm text-muted-foreground">{member.name_en}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><TeamRoleBadge role={member.team_role} /></td>
                  <td className="px-4 py-3">{member.title || '-'}</td>
                  <td className="px-4 py-3">{member.affiliation || '-'}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/admin/team/${member.id}/edit`)}>
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(member.id, member.name)}
                          disabled={deleting.has(member.id)}
                        >
                          {deleting.has(member.id) ? '删除中...' : '删除'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              上一页
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
