/**
 * Prometheus Metrics Page
 * Prometheus指标监控页面 - 显示系统性能指标
 */

'use client'

import { useState } from 'react'
import { RefreshCw, Activity, Database, Zap } from 'lucide-react'
import { parsePrometheusMetrics, getRequestDurationStats, getDatabaseStats, getRedisStats } from '@/lib/utils/prometheus-parser'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export default function MetricsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Health check endpoints are at root level, not under /v1
  const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')

  // 使用 useQuery 获取 Prometheus 指标
  const { data, isLoading, error, refetch } = useQuery<string>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch(`${backendBaseUrl}/metrics`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.text()
    },
    refetchInterval: autoRefresh ? 10000 : false, // 10秒自动刷新
  })

  // 解析Prometheus指标数据
  const metrics = data ? parsePrometheusMetrics(data) : null
  const durationStats = metrics ? getRequestDurationStats(metrics) : null
  const dbStats = metrics ? getDatabaseStats(metrics) : null
  const redisStats = metrics ? getRedisStats(metrics) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Prometheus 指标监控
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            实时监控系统性能指标
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {autoRefresh ? '自动刷新：开' : '自动刷新：关'}
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="手动刷新"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">
                无法获取指标数据
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error instanceof Error ? error.message : '请检查Prometheus服务是否运行'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* HTTP请求统计 */}
          <MetricCard
            title="HTTP请求"
            icon={<Activity className="w-6 h-6" />}
            value={metrics.http_requests_total?.length || 0}
            label="总请求数"
          />

          {/* 请求持续时间 */}
          {durationStats && (
            <MetricCard
              title="请求延迟"
              icon={<Activity className="w-6 h-6" />}
              value={`${durationStats.p95}ms`}
              label="P95延迟"
            />
          )}

          {/* 数据库连接 */}
          {dbStats && (
            <MetricCard
              title="数据库连接"
              icon={<Database className="w-6 h-6" />}
              value={dbStats.active}
              label="活跃连接数"
            />
          )}

          {/* Redis连接 */}
          {redisStats && (
            <MetricCard
              title="Redis连接"
              icon={<Zap className="w-6 h-6" />}
              value={redisStats.active}
              label="活跃连接数"
            />
          )}

          {/* 活跃会话 */}
          {metrics.active_sessions && (
            <MetricCard
              title="活跃会话"
              icon={<Activity className="w-6 h-6" />}
              value={metrics.active_sessions.value}
              label="当前在线"
            />
          )}

          {/* 请求速率 */}
          {durationStats && (
            <MetricCard
              title="请求速率"
              icon={<Activity className="w-6 h-6" />}
              value={durationStats.count}
              label="总请求数"
            />
          )}
        </div>
      )}

      {/* 详细统计 */}
      {metrics && durationStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 请求延迟详情 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              HTTP请求延迟统计
            </h3>
            <div className="space-y-3">
              <StatRow label="总请求数" value={durationStats.count} />
              <StatRow label="总耗时" value={`${durationStats.sum.toFixed(2)}s`} />
              <StatRow label="平均延迟" value={`${durationStats.avg}ms`} />
              <StatRow label="P50延迟" value={`${durationStats.p50}ms`} />
              <StatRow label="P95延迟" value={`${durationStats.p95}ms`} />
              <StatRow label="P99延迟" value={`${durationStats.p99}ms`} />
            </div>
          </div>

          {/* 数据库详情 */}
          {dbStats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                数据库连接池
              </h3>
              <div className="space-y-3">
                <StatRow label="活跃连接" value={dbStats.active} />
                <StatRow label="空闲连接" value={dbStats.idle} />
                <StatRow label="最大连接数" value={dbStats.max} />
                <StatRow
                  label="连接池使用率"
                  value={`${((dbStats.active / dbStats.max) * 100).toFixed(1)}%`}
                />
              </div>
            </div>
          )}

          {/* Redis详情 */}
          {redisStats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Redis缓存
              </h3>
              <div className="space-y-3">
                <StatRow label="活跃连接" value={redisStats.active} />
                <StatRow label="总连接数" value={redisStats.total} />
              </div>
            </div>
          )}

          {/* 活跃会话 */}
          {metrics.active_sessions && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                会话统计
              </h3>
              <div className="space-y-3">
                <StatRow label="当前活跃" value={metrics.active_sessions.value} />
                {metrics.active_sessions.labels && (
                  <>
                    {Object.entries(metrics.active_sessions.labels).map(([key, value]) => (
                      <StatRow key={key} label={key} value={String(value)} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  icon: React.ReactNode
  value: number | string
  label: string
}

function MetricCard({ title, icon, value, label }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {label}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatRowProps {
  label: string
  value: string | number
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  )
}
