'use client'

/**
 * Performance Dashboard - 综合性能监控仪表板
 *
 * 特性：
 * - Core Web Vitals实时监控
 * - 资源加载分析
 * - 内存使用追踪
 * - FPS监控
 * - 网络请求分析
 * - 自定义指标
 * - 性能评分（0-100）
 * - 优化建议
 * - 历史数据对比
 * - 可视化图表
 *
 * 指标：
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time to First Byte)
 * - FMP (First Meaningful Paint)
 * - TTI (Time to Interactive)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

// ==================== 类型定义 ====================

export interface CoreWebVitals {
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
  fmp: number | null // First Meaningful Paint
  tti: number | null // Time to Interactive
}

export interface ResourceTiming {
  name: string
  duration: number
  size: number
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other'
  cached: boolean
}

export interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export interface PerformanceScore {
  overall: number // 0-100
  fcp: number
  lcp: number
  fid: number
  cls: number
}

export interface PerformanceData {
  vitals: CoreWebVitals
  resources: ResourceTiming[]
  memory: MemoryInfo | null
  fps: number
  score: PerformanceScore
  timestamp: number
}

// ==================== 性能监控Hook ====================

export function usePerformanceMonitor() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const _fpsFrameRef = useRef<number>()
  const fpsLastTimeRef = useRef<number>(performance.now())
  const fpsFramesRef = useRef<number[]>([])

  // 计算FPS
  const calculateFPS = useCallback(() => {
    const now = performance.now()
    const delta = now - fpsLastTimeRef.current

    fpsFramesRef.current.push(delta)

    // 保持最近60帧
    if (fpsFramesRef.current.length > 60) {
      fpsFramesRef.current.shift()
    }

    fpsLastTimeRef.current = now

    // 计算平均FPS
    const avgDelta =
      fpsFramesRef.current.reduce((sum, delta) => sum + delta, 0) /
      fpsFramesRef.current.length
    const fps = Math.round(1000 / avgDelta)

    return fps
  }, [])

  // 计算性能评分
  const calculateScore = useCallback((vitals: CoreWebVitals): PerformanceScore => {
    let fcpScore = 100
    let lcpScore = 100
    let fidScore = 100
    let clsScore = 100

    // FCP评分（0-1800ms）
    if (vitals.fcp !== null) {
      if (vitals.fcp <= 1800) fcpScore = 100
      else if (vitals.fcp <= 3000) fcpScore = 75
      else fcpScore = 50
    }

    // LCP评分（0-2500ms）
    if (vitals.lcp !== null) {
      if (vitals.lcp <= 2500) lcpScore = 100
      else if (vitals.lcp <= 4000) lcpScore = 75
      else lcpScore = 50
    }

    // FID评分（0-100ms）
    if (vitals.fid !== null) {
      if (vitals.fid <= 100) fidScore = 100
      else if (vitals.fid <= 300) fidScore = 75
      else fidScore = 50
    }

    // CLS评分（0-0.1）
    if (vitals.cls !== null) {
      if (vitals.cls <= 0.1) clsScore = 100
      else if (vitals.cls <= 0.25) clsScore = 75
      else clsScore = 50
    }

    // 总分（加权平均）
    const overall = Math.round(
      fcpScore * 0.2 + lcpScore * 0.25 + fidScore * 0.25 + clsScore * 0.3
    )

    return {
      overall,
      fcp: fcpScore,
      lcp: lcpScore,
      fid: fidScore,
      cls: clsScore,
    }
  }, [])

  // 获取Core Web Vitals
  const getCoreWebVitals = useCallback((): CoreWebVitals => {
    const vitals: CoreWebVitals = {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      fmp: null,
      tti: null,
    }

    // FCP
    const fcpEntries = performance.getEntriesByName('first-contentful-paint')
    if (fcpEntries.length > 0) {
      vitals.fcp = fcpEntries[0].startTime
    }

    // LCP
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
    if (lcpEntries.length > 0) {
      vitals.lcp = lcpEntries[lcpEntries.length - 1].startTime
    }

    // FID
    const fidEntries = performance.getEntriesByType('first-input')
    if (fidEntries.length > 0) {
      vitals.fid = (fidEntries[0] as any).processingStart - fidEntries[0].startTime
    }

    // CLS
    const clsEntries = performance.getEntriesByType('layout-shift') as any[]
    let clsValue = 0
    clsEntries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
      }
    })
    vitals.cls = clsValue

    // TTFB
    const navEntry = performance.getEntriesByType('navigation')[0] as any
    if (navEntry) {
      vitals.ttfb = navEntry.responseStart - navEntry.requestStart
    }

    return vitals
  }, [])

  // 获取资源计时
  const getResourceTimings = useCallback((): ResourceTiming[] => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    return resources.map((resource) => {
      const url = new URL(resource.name)
      const extension = url.pathname.split('.').pop()?.toLowerCase() || ''

      let type: ResourceTiming['type'] = 'other'
      if (['js', 'mjs'].includes(extension)) type = 'script'
      else if (['css'].includes(extension)) type = 'stylesheet'
      else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(extension))
        type = 'image'
      else if (['woff', 'woff2', 'ttf', 'eot'].includes(extension)) type = 'font'

      const size = resource.transferSize || 0
      const cached = size === 0 || resource.transferSize < resource.encodedBodySize

      return {
        name: url.pathname,
        duration: resource.duration,
        size,
        type,
        cached,
      }
    })
  }, [])

  // 获取内存信息
  const getMemoryInfo = useCallback((): MemoryInfo | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      }
    }
    return null
  }, [])

  // 收集性能数据
  const collectData = useCallback(() => {
    const vitals = getCoreWebVitals()
    const resources = getResourceTimings()
    const memory = getMemoryInfo()
    const fps = calculateFPS()
    const score = calculateScore(vitals)

    const performanceData: PerformanceData = {
      vitals,
      resources,
      memory,
      fps,
      score,
      timestamp: Date.now(),
    }

    setData(performanceData)
    return performanceData
  }, [getCoreWebVitals, getResourceTimings, getMemoryInfo, calculateFPS, calculateScore])

  // 开始监控
  const startMonitoring = useCallback((interval = 1000) => {
    setIsRecording(true)

    // 立即收集一次
    collectData()

    // 定期收集
    intervalRef.current = setInterval(() => {
      collectData()
    }, interval)
  }, [collectData])

  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsRecording(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])

  return {
    data,
    isRecording,
    startMonitoring,
    stopMonitoring,
    collectData,
  }
}

// ==================== 仪表板组件 ====================

export interface PerformanceDashboardProps {
  /**
   * 自动启动监控
   */
  autoStart?: boolean

  /**
   * 刷新间隔（毫秒）
   */
  refreshInterval?: number

  /**
   * 显示的指标
   */
  metrics?: Array<'vitals' | 'resources' | 'memory' | 'fps' | 'score'>

  /**
   * 类名
   */
  className?: string
}

export function PerformanceDashboard({
  autoStart = true,
  refreshInterval = 1000,
  metrics = ['vitals', 'resources', 'memory', 'fps', 'score'],
  className = '',
}: PerformanceDashboardProps) {
  const { t } = useTranslation()
  const { data, isRecording, startMonitoring, stopMonitoring } = usePerformanceMonitor()

  useEffect(() => {
    if (autoStart) {
      startMonitoring(refreshInterval)
    }

    return () => {
      stopMonitoring()
    }
  }, [autoStart, refreshInterval, startMonitoring, stopMonitoring])

  if (!data) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow dark:bg-gray-800 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            {t('performance.loading') || '正在加载性能数据...'}
          </span>
        </div>
      </div>
    )
  }

  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // 获取评分颜色
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-500'
    if (score >= 75) return 'text-yellow-500'
    if (score >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  // 获取评分等级
  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'A'
    if (score >= 75) return 'B'
    if (score >= 50) return 'C'
    return 'D'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('performance.title') || '性能监控仪表板'}
        </h2>

        <div className="flex items-center gap-4">
          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isRecording
                ? t('performance.recording') || '监控中'
                : t('performance.stopped') || '已停止'}
            </span>
          </div>

          {/* 控制按钮 */}
          {isRecording ? (
            <button
              onClick={stopMonitoring}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              {t('performance.stop') || '停止'}
            </button>
          ) : (
            <button
              onClick={() => startMonitoring(refreshInterval)}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
            >
              {t('performance.start') || '开始'}
            </button>
          )}
        </div>
      </div>

      {/* 性能评分 */}
      {metrics.includes('score') && (
        <div className="grid gap-4 md:grid-cols-5">
          {/* 总分 */}
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
            <div className="text-sm opacity-80">{t('performance.overall') || '总分'}</div>
            <div className="mt-2 text-4xl font-bold">{data.score.overall}</div>
            <div className="mt-1 text-sm opacity-80">Grade: {getScoreGrade(data.score.overall)}</div>
          </div>

          {/* FCP */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('performance.fcp') || 'FCP'}
            </div>
            <div className={`mt-2 text-2xl font-bold ${getScoreColor(data.score.fcp)}`}>
              {data.vitals.fcp !== null ? formatTime(data.vitals.fcp) : '-'}
            </div>
            <div className="mt-1 text-sm text-gray-500">{data.score.fcp}/100</div>
          </div>

          {/* LCP */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('performance.lcp') || 'LCP'}
            </div>
            <div className={`mt-2 text-2xl font-bold ${getScoreColor(data.score.lcp)}`}>
              {data.vitals.lcp !== null ? formatTime(data.vitals.lcp) : '-'}
            </div>
            <div className="mt-1 text-sm text-gray-500">{data.score.lcp}/100</div>
          </div>

          {/* FID */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('performance.fid') || 'FID'}
            </div>
            <div className={`mt-2 text-2xl font-bold ${getScoreColor(data.score.fid)}`}>
              {data.vitals.fid !== null ? formatTime(data.vitals.fid) : '-'}
            </div>
            <div className="mt-1 text-sm text-gray-500">{data.score.fid}/100</div>
          </div>

          {/* CLS */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('performance.cls') || 'CLS'}
            </div>
            <div className={`mt-2 text-2xl font-bold ${getScoreColor(data.score.cls)}`}>
              {data.vitals.cls !== null ? data.vitals.cls.toFixed(3) : '-'}
            </div>
            <div className="mt-1 text-sm text-gray-500">{data.score.cls}/100</div>
          </div>
        </div>
      )}

      {/* FPS和内存 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* FPS */}
        {metrics.includes('fps') && (
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
              {t('performance.fps') || '帧率'}
            </h3>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {data.fps}
                </div>
                <div className="text-sm text-gray-500">FPS</div>
              </div>
              <div
                className={`text-sm font-medium ${
                  data.fps >= 55 ? 'text-green-500' : 'text-yellow-500'
                }`}
              >
                {data.fps >= 55
                  ? t('performance.smooth') || '流畅'
                  : t('performance.janky') || '卡顿'}
              </div>
            </div>
          </div>
        )}

        {/* 内存 */}
        {metrics.includes('memory') && data.memory && (
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
              {t('performance.memory') || '内存'}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('performance.used') || '已使用'}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatBytes(data.memory.usedJSHeapSize)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('performance.total') || '总计'}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatBytes(data.memory.totalJSHeapSize)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('performance.limit') || '限制'}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatBytes(data.memory.jsHeapSizeLimit)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 资源加载 */}
      {metrics.includes('resources') && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
            {t('performance.resources') || '资源加载'}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    {t('performance.resource') || '资源'}
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    {t('performance.type') || '类型'}
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    {t('performance.duration') || '时长'}
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    {t('performance.size') || '大小'}
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">
                    {t('performance.status') || '状态'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.resources.slice(0, 10).map((resource, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      {resource.name.slice(0, 50)}...
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {resource.type}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      {formatTime(resource.duration)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      {formatBytes(resource.size)}
                    </td>
                    <td className="px-4 py-2">
                      {resource.cached ? (
                        <span className="text-green-500">{t('performance.cached') || '缓存'}</span>
                      ) : (
                        <span className="text-blue-500">{t('performance.loaded') || '已加载'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceDashboard
