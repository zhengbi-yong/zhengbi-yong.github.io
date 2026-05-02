/**
 * Health Check Page
 * 系统健康检查页面 - 显示各服务的健康状态
 */

'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import type { DetailedHealthStatus, ServiceHealth } from '@/lib/types/backend'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { resolveBackendBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'
import { api } from '@/lib/api/apiClient'

export default function HealthCheckPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Health check endpoints are at root level, not under /v1
  const backendBaseUrl = resolveBackendBaseUrl()

  // 使用 Refine 的 useQuery (来自 @tanstack/react-query)
  const {
    data: healthData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['health-check', 'detailed'],
    queryFn: async () => {
      const response = await api.get<DetailedHealthStatus>(`${backendBaseUrl}/health/detailed`)
      return response.data
    },
    refetchInterval: autoRefresh ? 10000 : false, // 10秒自动刷新
  })

  const overallStatus = healthData?.status || 'unhealthy'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">系统健康检查</h1>
          <p className="mt-2 text-muted-foreground dark:text-muted-foreground">实时监控各服务的运行状态</p>
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

      {/* Overall Status */}
      <div
        className={`rounded-lg border-2 p-6 ${
          overallStatus === 'healthy'
            ? 'border-[var(--theme-success)]/20 bg-green-50 dark:border-[var(--theme-success)]/20 dark:bg-[var(--theme-success)]/15/20'
            : 'border-destructive/20 bg-destructive/5 dark:border-destructive/20 dark:bg-destructive/15'
        }`}
      >
        <div className="flex items-center space-x-4">
          {overallStatus === 'healthy' ? (
            <CheckCircle2 className="h-12 w-12 text-[var(--theme-success)] dark:text-[var(--theme-success)]" />
          ) : (
            <XCircle className="h-12 w-12 text-destructive dark:text-destructive" />
          )}
          <div>
            <h2
              className={`text-2xl font-bold ${
                overallStatus === 'healthy'
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}
            >
              系统状态：{overallStatus === 'healthy' ? '健康' : '不健康'}
            </h2>
            <p
              className={`mt-1 ${
                overallStatus === 'healthy'
                  ? 'text-[var(--theme-success)] dark:text-green-300'
                  : 'text-destructive dark:text-destructive'
              }`}
            >
              {healthData?.timestamp
                ? `最后检查：${new Date(healthData.timestamp).toLocaleString('zh-CN')}`
                : '等待检查...'}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-primary" />
            <p className="text-muted-foreground dark:text-muted-foreground">检查中...</p>
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
                无法获取健康状态
              </h3>
              <p className="mt-1 text-sm text-destructive dark:text-destructive">
                {error instanceof Error ? error.message : '请检查后端服务是否运行'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status Cards */}
      {healthData?.services && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Database */}
          <ServiceStatusCard name="数据库" service={healthData.services.database} icon="💾" />

          {/* Redis */}
          <ServiceStatusCard name="Redis缓存" service={healthData.services.redis} icon="⚡" />

          {/* JWT */}
          <ServiceStatusCard name="JWT服务" service={healthData.services.jwt} icon="🔐" />

          {/* Email */}
          <ServiceStatusCard name="邮件服务" service={healthData.services.email} icon="📧" />
        </div>
      )}
    </div>
  )
}

interface ServiceStatusCardProps {
  name: string
  service: ServiceHealth
  icon: string
}

function ServiceStatusCard({ name, service, icon }: ServiceStatusCardProps) {
  const isHealthy = service.status === 'healthy'

  return (
    <div
      className={`rounded-lg border-2 bg-background p-6 dark:bg-card ${
        isHealthy ? 'border-[var(--theme-success)]/20 dark:border-[var(--theme-success)]/20' : 'border-destructive/20 dark:border-destructive/20'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-foreground dark:text-white">{name}</h3>
            <p
              className={`mt-1 text-sm ${
                isHealthy ? 'text-[var(--theme-success)] dark:text-[var(--theme-success)]' : 'text-destructive dark:text-destructive'
              }`}
            >
              {isHealthy ? '运行正常' : '服务异常'}
            </p>
          </div>
        </div>
        {isHealthy ? (
          <CheckCircle2 className="h-6 w-6 text-[var(--theme-success)] dark:text-[var(--theme-success)]" />
        ) : (
          <XCircle className="h-6 w-6 text-destructive dark:text-destructive" />
        )}
      </div>

      {service.message && (
        <p className="mt-3 text-sm text-muted-foreground dark:text-muted-foreground">{service.message}</p>
      )}

      <div className="mt-4 border-t border-border pt-4 dark:border-border">
        <h4 className="mb-2 text-sm font-medium text-foreground dark:text-foreground">详细信息</h4>
        <dl className="space-y-2">
          {service.response_time_ms && (
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground dark:text-muted-foreground">响应时间:</dt>
              <dd className="font-medium text-foreground dark:text-white">
                {service.response_time_ms}ms
              </dd>
            </div>
          )}
          {service.last_check && (
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground dark:text-muted-foreground">最后检查:</dt>
              <dd className="font-medium text-foreground dark:text-white">
                {new Date(service.last_check).toLocaleTimeString('zh-CN')}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
