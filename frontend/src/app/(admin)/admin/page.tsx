'use client'

import { useAuthStore } from '@/lib/store/auth-store'
import { useList } from '@refinedev/core'
import { Loader2, Users, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs'
// Badge is unused — kept for reference in case dashboard adds badge display
// import { Badge } from '@/components/shadcn/ui/badge'
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
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
      {/* Page Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">仪表板</h1>
          <p className="text-sm text-muted-foreground">
            欢迎回来，{user?.username || '管理员'}
          </p>
        </div>
      </div>

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
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {card.value.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Chart + Recent Comments */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>内容概览</CardTitle>
                <CardDescription>
                  过去 12 个月的内容数据趋势
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>最近评论</CardTitle>
                <CardDescription>
                  按状态分类的评论概览
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentComments
                  pending={stats.pending_comments}
                  approved={stats.approved_comments}
                  rejected={stats.rejected_comments}
                  total={stats.total_comments}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
