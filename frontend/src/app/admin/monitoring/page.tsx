/**
 * System Monitoring Overview Page
 * 系统监控概览页面 - 监控模块的入口页面
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, Heart, BarChart3, Server, Zap, Database, Loader2 } from 'lucide-react'
import type { DetailedHealthStatus } from '@/lib/types/backend'
import { useQuery } from '@tanstack/react-query'
import { resolveBackendBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

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
      const response = await fetch(`${backendBaseUrl}/health/detailed`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json() as Promise<DetailedHealthStatus>
    },
    refetchInterval: 10000, // 10秒自动刷新
    enabled: mounted,
  })

  const monitoringModules = [
    {
      title: '健康检查',
      description: '查看各服务的健康状态和运行情况',
      icon: <Heart className="h-8 w-8" />,
      href: '/admin/monitoring/health',
      color: 'green',
    },
    {
      title: '指标监控',
      description: '查看Prometheus性能指标和统计数据',
      icon: <BarChart3 className="h-8 w-8" />,
      href: '/admin/monitoring/metrics',
      color: 'blue',
    },
  ]

  // 根据健康检查数据生成快速统计
  const quickStats = [
    {
      label: '系统状态',
      value: healthData?.status === 'healthy' ? '健康' : '异常',
      icon:
        healthData?.status === 'healthy' ? (
          <Server className="h-5 w-5 text-green-600" />
        ) : (
          <Server className="h-5 w-5 text-red-600" />
        ),
    },
    {
      label: '响应时间',
      value: healthData?.services?.database?.response_time_ms
        ? `${healthData.services.database.response_time_ms}ms`
        : '检测中...',
      icon: <Activity className="h-5 w-5 text-blue-600" />,
    },
    {
      label: '数据库',
      value: healthData?.services?.database?.status === 'healthy' ? '连接正常' : '连接异常',
      icon:
        healthData?.services?.database?.status === 'healthy' ? (
          <Database className="h-5 w-5 text-green-600" />
        ) : (
          <Database className="h-5 w-5 text-red-600" />
        ),
    },
    {
      label: '缓存',
      value: healthData?.services?.redis?.status === 'healthy' ? '运行中' : '异常',
      icon:
        healthData?.services?.redis?.status === 'healthy' ? (
          <Zap className="h-5 w-5 text-yellow-600" />
        ) : (
          <Zap className="h-5 w-5 text-red-600" />
        ),
    },
  ]

  if (healthLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">加载监控数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">系统监控</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">全面监控系统的健康状态和性能指标</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Monitoring Modules */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">监控模块</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {monitoringModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
            >
              <div
                className={`mb-4 inline-block rounded-lg p-3 ${
                  module.color === 'green'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                }`}
              >
                {module.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start space-x-3">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-400">
              实时监控
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              所有监控页面支持自动刷新功能，数据每10秒更新一次。您可以随时切换自动刷新开关或手动刷新数据。
              {healthData?.timestamp && (
                <span className="ml-2">
                  最后更新：{new Date(healthData.timestamp).toLocaleTimeString('zh-CN')}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
