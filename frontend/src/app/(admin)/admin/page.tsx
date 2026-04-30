'use client'

import { useAuthStore } from '@/lib/store/auth-store'
import { useList } from '@refinedev/core'
import { Users, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs'
import { PageHeader } from '@/components/admin/page-header'
import { StatCard } from '@/components/admin/stat-card'
import { DataCard } from '@/components/admin/data-card'
import { LoadingState } from '@/components/admin/empty-state'
import { Overview } from './_components/overview'
import { RecentComments } from './_components/recent-comments'

export default function AdminDashboard() {
  const { user } = useAuthStore()

  const queryResult = useList({
    resource: 'admin/stats',
  })

  const query = queryResult.query
  const result = queryResult.result
  const data = result?.data
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  const stats = data?.[0]

  if (isLoading) {
    return <LoadingState message="加载仪表板数据..." />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-400">
          加载失败
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : '无法加载管理员数据，请检查您的权限'}
        </p>
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: '总用户数',
      value: stats.total_users,
      icon: Users,
      description: '注册用户总数',
    },
    {
      title: '总评论数',
      value: stats.total_comments,
      icon: MessageSquare,
      description: '所有评论总数',
    },
    {
      title: '待审核',
      value: stats.pending_comments,
      icon: Clock,
      description: '等待审核的评论',
    },
    {
      title: '已通过',
      value: stats.approved_comments,
      icon: CheckCircle,
      description: '已批准的评论',
    },
    {
      title: '已拒绝',
      value: stats.rejected_comments,
      icon: XCircle,
      description: '被拒绝的评论',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="仪表板"
        description={`欢迎回来，${user?.username || '管理员'}`}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            分析
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            报告
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value.toLocaleString()}
                description={card.description}
                icon={card.icon}
              />
            ))}
          </div>

          {/* Chart + Recent Comments */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <DataCard title="内容概览" description="过去 12 个月的内容数据趋势" className="col-span-1 lg:col-span-4" contentClassName="pl-2">
              <Overview />
            </DataCard>
            <DataCard title="最近评论" description="按状态分类的评论概览" className="col-span-1 lg:col-span-3">
              <RecentComments
                pending={stats.pending_comments}
                approved={stats.approved_comments}
                rejected={stats.rejected_comments}
                total={stats.total_comments}
              />
            </DataCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
