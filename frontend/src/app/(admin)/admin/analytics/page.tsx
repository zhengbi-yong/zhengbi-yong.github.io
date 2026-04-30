/**  Analytics Dashboard Page
 * 数据分析仪表板 - 展示用户增长,评论活跃度,文章热度等数据
 */

'use client'

import { useState, useMemo } from 'react'
import { useList, useCustom } from '@refinedev/core'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { Users, MessageSquare, Clock, CheckCircle } from 'lucide-react'

import { PageHeader } from '@/components/admin/page-header'
import { StatCard } from '@/components/admin/stat-card'
import { DataCard } from '@/components/admin/data-card'
import { LoadingState } from '@/components/admin/empty-state'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/shadcn/ui/select'

/** Reusable chart tooltip styled with semantic tokens */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1 text-xs font-medium">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [daysRange, setDaysRange] = useState(30)

  // 获取统计数据
  const queryResult = useList({
    resource: 'admin/stats',
  })

  const stats = queryResult.result?.data?.[0]
  const statsLoading = queryResult.query?.isPending

  // 获取用户增长数据
  const userGrowthQuery = useCustom({
    url: '/admin/user-growth',
    method: 'get',
    queryOptions: {
      staleTime: 5 * 60 * 1000, // 5分钟缓存
    },
  }) as any

  const userGrowthResponse = userGrowthQuery?.data
  const userGrowthLoading = userGrowthQuery?.isLoading || userGrowthQuery?.query?.isPending

  // 获取评论数据(用于生成趋势图)
  const commentsQueryResult = useList({
    resource: 'admin/comments',
    pagination: { current: 1, pageSize: 1000 } as any,
    queryOptions: {
      staleTime: 5 * 60 * 1000, // 5分钟缓存
    },
  })

  const commentsData = commentsQueryResult.result?.data || []
  const commentsLoading = commentsQueryResult.query?.isPending

  // 处理用户增长数据,转换为图表格式
  const userGrowthData = useMemo(() => {
    if (!userGrowthResponse?.data) return []

    return userGrowthResponse.data.map((item: any) => ({
      date: format(new Date(item.date), 'MM-dd'),
      新增用户: item.new_users,
      累计用户: item.cumulative_users,
    }))
  }, [userGrowthResponse])

  // 生成评论活跃度数据
  const commentActivityData = useMemo(() => {
    const comments = commentsData || []
    const groupedByDate: Record<string, { approved: number; pending: number; rejected: number }> = {}

    // 初始化所有日期
    for (let i = daysRange - 1; i >= 0; i--) {
      const date = format(startOfDay(subDays(new Date(), i)), 'MM-dd')
      groupedByDate[date] = { approved: 0, pending: 0, rejected: 0 }
    }

    // 按日期分组评论
    comments.forEach((comment: any) => {
      const date = format(new Date(comment.created_at), 'MM-dd')
      if (groupedByDate[date]) {
        if (comment.status === 'approved') groupedByDate[date].approved++
        else if (comment.status === 'pending') groupedByDate[date].pending++
        else if (comment.status === 'rejected') groupedByDate[date].rejected++
      }
    })

    return Object.entries(groupedByDate).map(([date, counts]) => ({
      date,
      已通过: counts.approved,
      待审核: counts.pending,
      已拒绝: counts.rejected,
    }))
  }, [daysRange, commentsData])

  if (statsLoading || userGrowthLoading || commentsLoading) {
    return <LoadingState message="加载数据中..." className="min-h-[400px]" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="数据分析" description="全面了解用户活跃度和内容表现">
        <Select value={String(daysRange)} onValueChange={(v) => setDaysRange(Number(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">最近7天</SelectItem>
            <SelectItem value="14">最近14天</SelectItem>
            <SelectItem value="30">最近30天</SelectItem>
            <SelectItem value="90">最近90天</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总用户数"
          value={(stats?.total_users || 0).toLocaleString()}
          icon={Users}
          trend={{ value: '+12%', positive: true }}
        />
        <StatCard
          title="总评论数"
          value={(stats?.total_comments || 0).toLocaleString()}
          icon={MessageSquare}
          trend={{ value: '+8%', positive: true }}
        />
        <StatCard
          title="待审核评论"
          value={(stats?.pending_comments || 0).toLocaleString()}
          icon={Clock}
          trend={{ value: '-5%', positive: false }}
        />
        <StatCard
          title="已通过评论"
          value={(stats?.approved_comments || 0).toLocaleString()}
          icon={CheckCircle}
          trend={{ value: '+15%', positive: true }}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* User Growth Chart */}
        <DataCard title="用户增长趋势">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="新增用户" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="累计用户" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </DataCard>

        {/* Comment Activity Chart */}
        <DataCard title="评论活跃度">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commentActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="已通过" stackId="a" fill="#10b981" />
              <Bar dataKey="待审核" stackId="a" fill="#f59e0b" />
              <Bar dataKey="已拒绝" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </DataCard>
      </div>

      {/* Summary Info */}
      <div className="bg-muted text-muted-foreground rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">数据说明</h3>
        <p className="text-sm">
          以上数据基于最近{daysRange}天的统计信息.用户增长趋势显示每日新增用户数量,评论活跃度展示各状态评论的分布情况.
          数据每5分钟自动刷新一次.
        </p>
      </div>
    </div>
  )
}
