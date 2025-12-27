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

export default function HealthCheckPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Health check endpoints are at root level, not under /v1
  const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')

  // 使用 Refine 的 useQuery (来自 @tanstack/react-query)
  const { data: healthData, isLoading, error, refetch } = useQuery({
    queryKey: ['health-check', 'detailed'],
    queryFn: async () => {
      const response = await fetch(`${backendBaseUrl}/healthz/detailed`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json() as Promise<DetailedHealthStatus>
    },
    refetchInterval: autoRefresh ? 10000 : false, // 10秒自动刷新
  })

  const overallStatus = healthData?.status || 'unhealthy'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            系统健康检查
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            实时监控各服务的运行状态
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
            onClick={() => fetchHealthData()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="手动刷新"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div
        className={`p-6 rounded-lg border-2 ${
          overallStatus === 'healthy'
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }`}
      >
        <div className="flex items-center space-x-4">
          {overallStatus === 'healthy' ? (
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
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
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-gray-600 dark:text-gray-400">检查中...</p>
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
                无法获取健康状态
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error instanceof Error ? error.message : '请检查后端服务是否运行'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status Cards */}
      {healthData?.services && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database */}
          <ServiceStatusCard
            name="数据库"
            service={healthData.services.database}
            icon="💾"
          />

          {/* Redis */}
          <ServiceStatusCard
            name="Redis缓存"
            service={healthData.services.redis}
            icon="⚡"
          />

          {/* JWT */}
          <ServiceStatusCard
            name="JWT服务"
            service={healthData.services.jwt}
            icon="🔐"
          />

          {/* Email */}
          <ServiceStatusCard
            name="邮件服务"
            service={healthData.services.email}
            icon="📧"
          />
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
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 ${
        isHealthy
          ? 'border-green-200 dark:border-green-800'
          : 'border-red-200 dark:border-red-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </h3>
            <p
              className={`text-sm mt-1 ${
                isHealthy
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isHealthy ? '运行正常' : '服务异常'}
            </p>
          </div>
        </div>
        {isHealthy ? (
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        )}
      </div>

      {service.message && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {service.message}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          详细信息
        </h4>
        <dl className="space-y-2">
          {service.response_time_ms && (
            <div className="flex justify-between text-sm">
              <dt className="text-gray-600 dark:text-gray-400">响应时间:</dt>
              <dd className="text-gray-900 dark:text-white font-medium">
                {service.response_time_ms}ms
              </dd>
            </div>
          )}
          {service.last_check && (
            <div className="flex justify-between text-sm">
              <dt className="text-gray-600 dark:text-gray-400">最后检查:</dt>
              <dd className="text-gray-900 dark:text-white font-medium">
                {new Date(service.last_check).toLocaleTimeString('zh-CN')}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
