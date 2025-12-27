/**
 * System Monitoring Overview Page
 * 系统监控概览页面 - 监控模块的入口页面
 */

'use client'

import Link from 'next/link'
import { Activity, Heart, BarChart3, Server, Zap, Database } from 'lucide-react'

export default function MonitoringOverviewPage() {
  const monitoringModules = [
    {
      title: '健康检查',
      description: '查看各服务的健康状态和运行情况',
      icon: <Heart className="w-8 h-8" />,
      href: '/admin/monitoring/health',
      color: 'green',
    },
    {
      title: '指标监控',
      description: '查看Prometheus性能指标和统计数据',
      icon: <BarChart3 className="w-8 h-8" />,
      href: '/admin/monitoring/metrics',
      color: 'blue',
    },
  ]

  const quickStats = [
    {
      label: '系统状态',
      value: '运行中',
      icon: <Server className="w-5 h-5 text-green-600" />,
    },
    {
      label: '响应时间',
      value: '正常',
      icon: <Activity className="w-5 h-5 text-blue-600" />,
    },
    {
      label: '数据库',
      value: '连接正常',
      icon: <Database className="w-5 h-5 text-green-600" />,
    },
    {
      label: '缓存',
      value: '运行中',
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          系统监控
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          全面监控系统的健康状态和性能指标
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          监控模块
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitoringModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
            >
              <div
                className={`p-3 rounded-lg inline-block mb-4 ${
                  module.color === 'green'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                }`}
              >
                {module.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-1">
              实时监控
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              所有监控页面支持自动刷新功能，数据每10秒更新一次。您可以随时切换自动刷新开关或手动刷新数据。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
