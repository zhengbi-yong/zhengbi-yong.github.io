/**
 * Prometheus Metrics Page
 * Prometheus指标监控页面 - 显示系统性能指标
 */

'use client'

import { useState } from 'react'
import { RefreshCw, Activity, Database, Zap, AlertCircle } from 'lucide-react'
import {
  parsePrometheusMetrics,
  getRequestDurationStats,
  getDatabaseStats,
  getRedisStats,
} from '@/lib/utils/prometheus-parser'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/apiClient'
import { resolveBackendBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

export default function MetricsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Health check endpoints are at root level, not under /v1
  const backendBaseUrl = resolveBackendBaseUrl()

  // 使用 useQuery 获取 Prometheus 指标
  // /metrics returns Prometheus text format (not JSON), so we use api.getText
  const { data, isLoading, error, refetch } = useQuery<string>({
    queryKey: ['metrics'],
    queryFn: async () => {
      return api.getText(`${backendBaseUrl}/metrics`)
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
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Prometheus 指标监控</h1>
          <p className="mt-2 text-muted-foreground dark:text-muted-foreground">实时监控系统性能指标</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-[var(--theme-info-muted)] text-primary dark:bg-[var(--theme-info-muted)] dark:text-primary'
                : 'bg-secondary text-foreground dark:bg-card dark:text-foreground'
            }`}
          >
            {autoRefresh ? '自动刷新：开' : '自动刷新：关'}
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-lg p-2 transition-colors hover:bg-secondary dark:hover:bg-secondary"
            title="手动刷新"
          >
            <RefreshCw className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-primary" />
            <p className="text-muted-foreground dark:text-muted-foreground">加载中...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 dark:border-destructive/20 dark:bg-destructive/15">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-destructive dark:text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-destructive">
                无法获取指标数据
              </h3>
              <p className="mt-1 text-sm text-destructive dark:text-destructive">
                {error instanceof Error ? error.message : '请检查Prometheus服务是否运行'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* HTTP请求统计 */}
          <MetricCard
            title="HTTP请求"
            icon={<Activity className="h-6 w-6" />}
            value={metrics.http_requests_total?.length || 0}
            label="总请求数"
          />

          {/* 请求持续时间 */}
          {durationStats && (
            <MetricCard
              title="请求延迟"
              icon={<Activity className="h-6 w-6" />}
              value={`${durationStats.p95}ms`}
              label="P95延迟"
            />
          )}

          {/* 数据库连接 */}
          {dbStats && (
            <MetricCard
              title="数据库连接"
              icon={<Database className="h-6 w-6" />}
              value={dbStats.active}
              label="活跃连接数"
            />
          )}

          {/* Redis连接 */}
          {redisStats && (
            <MetricCard
              title="Redis连接"
              icon={<Zap className="h-6 w-6" />}
              value={redisStats.active}
              label="活跃连接数"
            />
          )}

          {/* 活跃会话 */}
          {metrics.active_sessions && (
            <MetricCard
              title="活跃会话"
              icon={<Activity className="h-6 w-6" />}
              value={metrics.active_sessions.value}
              label="当前在线"
            />
          )}

          {/* 请求速率 */}
          {durationStats && (
            <MetricCard
              title="请求速率"
              icon={<Activity className="h-6 w-6" />}
              value={durationStats.count}
              label="总请求数"
            />
          )}
        </div>
      )}

      {/* 详细统计 */}
      {metrics && durationStats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 请求延迟详情 */}
          <div className="rounded-lg border border-border bg-background p-6 dark:border-border dark:bg-card">
            <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-white">
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
            <div className="rounded-lg border border-border bg-background p-6 dark:border-border dark:bg-card">
              <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-white">
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
            <div className="rounded-lg border border-border bg-background p-6 dark:border-border dark:bg-card">
              <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-white">
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
            <div className="rounded-lg border border-border bg-background p-6 dark:border-border dark:bg-card">
              <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-white">会话统计</h3>
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
    <div className="rounded-lg border border-border bg-background p-6 dark:border-border dark:bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-[var(--theme-info-muted)] p-2 dark:bg-[var(--theme-info-muted)]">{icon}</div>
          <div>
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold text-foreground dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">{label}</p>
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
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0 dark:border-border">
      <span className="text-sm text-muted-foreground dark:text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground dark:text-white">{value}</span>
    </div>
  )
}
