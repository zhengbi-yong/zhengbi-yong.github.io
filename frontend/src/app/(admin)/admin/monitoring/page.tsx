/**
 * System Monitoring Overview Page
 * 系统监控概览页面 - 监控模块的入口页面
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, Heart, BarChart3, Server, Zap, Database } from 'lucide-react'
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { PageHeader } from '@/components/admin/page-header'
import { StatCard } from '@/components/admin/stat-card'
import { DataCard } from '@/components/admin/data-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { LoadingState } from '@/components/admin/empty-state'
import type { DetailedHealthStatus } from '@/lib/types/backend'
import { useQuery } from '@tanstack/react-query'
import { resolveBackendBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'
import { api } from '@/lib/api/apiClient'

function getStatusVariant(status?: string): 'success' | 'warning' | 'danger' {
  if (status === 'healthy') return 'success'
  return 'danger'
}

export default function MonitoringOverviewPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Health check endpoints are at root level, not under /v1
  const backendBaseUrl = resolveBackendBaseUrl()

  // 使用 useQuery 获取健康检查数据
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health-check', 'overview'],
    queryFn: async () => {
      const response = await api.get<DetailedHealthStatus>(`${backendBaseUrl}/health/detailed`)
      return response.data
    },
    refetchInterval: 10000, // 10秒自动刷新
    enabled: mounted,
  })

  if (healthLoading) {
    return <LoadingState message="加载监控数据中..." />
  }

  const systemStatus = healthData?.status ?? 'unknown'
  const dbStatus = healthData?.services?.database?.status
  const redisStatus = healthData?.services?.redis?.status

  const monitoringModules = [
    {
      title: '健康检查',
      description: '查看各服务的健康状态和运行情况',
      icon: <Heart className="h-8 w-8" />,
      href: '/admin/monitoring/health',
      color: 'green' as const,
    },
    {
      title: '指标监控',
      description: '查看Prometheus性能指标和统计数据',
      icon: <BarChart3 className="h-8 w-8" />,
      href: '/admin/monitoring/metrics',
      color: 'blue' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统监控"
        description="全面监控系统的健康状态和性能指标"
      />

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="系统状态"
          value={systemStatus === 'healthy' ? '健康' : '异常'}
          icon={Server}
          description={
            systemStatus === 'healthy' ? '所有服务运行正常' : '部分服务异常'
          }
        />
        <StatCard
          title="响应时间"
          value={
            healthData?.services?.database?.response_time_ms
              ? `${healthData.services.database.response_time_ms}ms`
              : '检测中...'
          }
          icon={Activity}
          description="数据库响应延迟"
        />
        <StatCard
          title="数据库"
          value={dbStatus === 'healthy' ? '连接正常' : '连接异常'}
          icon={Database}
          description={dbStatus === 'healthy' ? '数据库服务正常' : '数据库服务异常'}
        />
        <StatCard
          title="缓存"
          value={redisStatus === 'healthy' ? '运行中' : '异常'}
          icon={Zap}
          description={redisStatus === 'healthy' ? 'Redis 缓存正常' : 'Redis 缓存异常'}
        />
      </div>

      {/* Monitoring Modules */}
      <DataCard title="监控模块" description="选择模块查看详细监控信息">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monitoringModules.map((module) => (
            <Link key={module.href} href={module.href} className="group">
              <Card className="h-full shadow-none transition-colors hover:bg-accent/50">
                <CardContent className="p-6">
                  <div
                    className={`mb-4 inline-block rounded-lg p-3 ${
                      module.color === 'green'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {module.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-primary">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </DataCard>

      {/* Status & Info Banner */}
      <DataCard title="实时监控" description="系统自动刷新状态">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent p-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge variant={getStatusVariant(systemStatus)} dot>
                {systemStatus === 'healthy' ? '系统健康' : '系统异常'}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              所有监控页面支持自动刷新功能,数据每10秒更新一次。您可以随时切换自动刷新开关或手动刷新数据。
              {healthData?.timestamp && (
                <span className="ml-2">
                  最后更新：{new Date(healthData.timestamp).toLocaleTimeString('zh-CN')}
                </span>
              )}
            </p>
          </div>
        </div>
      </DataCard>
    </div>
  )
}
