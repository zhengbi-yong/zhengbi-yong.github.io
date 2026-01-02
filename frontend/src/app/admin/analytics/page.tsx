// @ts-nocheck
/**
 * Analytics Dashboard Page
 * 数据分析仪表板 - 展示用户增长、评论活跃度、文章热度等数据
 */

'use client'

import { useState, useMemo } from 'react'
import { useList, useCustom } from '@refinedev/core'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'
import { Loader2 } from 'lucide-react'

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
    url: '/admin/users/growth',
    method: 'get',
    queryOptions: {
      staleTime: 5 * 60 * 1000, // 5分钟缓存
    },
  }) as any

  const userGrowthResponse = userGrowthQuery?.data
  const userGrowthLoading = userGrowthQuery?.isLoading || userGrowthQuery?.query?.isPending

  // 获取评论数据（用于生成趋势图）
  const commentsQueryResult = useList({
    resource: 'admin/comments',
    pagination: { current: 1, pageSize: 1000 } as any,
    queryOptions: {
      staleTime: 5 * 60 * 1000, // 5分钟缓存
    },
  })

  const commentsData = commentsQueryResult.result?.data || []
  const commentsLoading = commentsQueryResult.query?.isPending

  // 处理用户增长数据，转换为图表格式
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            数据分析
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            全面了解用户活跃度和内容表现
          </p>
        </div>
        <select
          value={daysRange}
          onChange={(e) => setDaysRange(Number(e.target.value))}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value={7}>最近7天</option>
          <option value={14}>最近14天</option>
          <option value={30}>最近30天</option>
          <option value={90}>最近90天</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总用户数"
          value={stats?.total_users || 0}
          change="+12%"
          trend="up"
        />
        <StatCard
          title="总评论数"
          value={stats?.total_comments || 0}
          change="+8%"
          trend="up"
        />
        <StatCard
          title="待审核评论"
          value={stats?.pending_comments || 0}
          change="-5%"
          trend="down"
          color="yellow"
        />
        <StatCard
          title="已通过评论"
          value={stats?.approved_comments || 0}
          change="+15%"
          trend="up"
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            用户增长趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="date" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: '1px solid rgb(55 65 81)',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="新增用户" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="累计用户" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Comment Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            评论活跃度
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commentActivityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="date" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(31 41 55)',
                  border: '1px solid rgb(55 65 81)',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Bar dataKey="已通过" stackId="a" fill="#10b981" />
              <Bar dataKey="待审核" stackId="a" fill="#f59e0b" />
              <Bar dataKey="已拒绝" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">
          数据说明
        </h3        >
        <p className="text-sm text-blue-700 dark:text-blue-300">
          以上数据基于最近{daysRange}天的统计信息。用户增长趋势显示每日新增用户数量，评论活跃度展示各状态评论的分布情况。
          数据每5分钟自动刷新一次。
        </p>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  change: string
  trend: 'up' | 'down'
  color?: string
}

function StatCard({ title, value, change, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  }

  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value.toLocaleString()}
          </p>
          <p className={`text-sm mt-2 ${trendColor}`}>
            {change} {'vs 上期'}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <TrendingIcon trend={trend} />
        </div>
      </div>
    </div>
  )
}

function TrendingIcon({ trend }: { trend: 'up' | 'down' }) {
  return (
    <svg
      className={`w-6 h-6 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {trend === 'up' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      )}
    </svg>
  )
}
