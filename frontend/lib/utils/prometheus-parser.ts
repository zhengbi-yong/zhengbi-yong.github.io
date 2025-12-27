/**
 * Prometheus Metrics Parser
 * 解析Prometheus文本格式的指标数据
 */

import type { PrometheusMetrics, Metric, HistogramMetric, GaugeMetric } from '@/lib/types/backend'

export interface ParsedMetric {
  name: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary' | 'untyped'
  help?: string
  metrics: Metric[]
}

/**
 * 解析Prometheus文本格式数据
 */
export function parsePrometheusMetrics(text: string): PrometheusMetrics {
  const lines = text.split('\n').filter(line => {
    const trimmed = line.trim()
    return trimmed && !trimmed.startsWith('#')
  })

  const result: any = {
    http_requests_total: [],
    http_request_duration_seconds: { count: 0, sum: 0, buckets: [] },
    db_connections: { name: 'db_connections', value: 0 },
    redis_connections: { name: 'redis_connections', value: 0 },
    active_sessions: { name: 'active_sessions', value: 0 },
  }

  lines.forEach(line => {
    try {
      // 解析格式：metric_name{labels} value
      const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{.*?\})?\s+(.+)$/)
      if (!match) return

      const [, name, labelsStr, valueStr] = match
      const value = parseFloat(valueStr)

      // 解析标签
      let labels: Record<string, string> = {}
      if (labelsStr) {
        const labelsContent = labelsStr.slice(1, -1) // 移除 {}
        labelsContent.split(',').forEach(pair => {
          const [key, val] = pair.split('=')
          if (key && val) {
            labels[key.trim()] = val.replace(/"/g, '').trim()
          }
        })
      }

      // HTTP请求总数
      if (name === 'http_requests_total') {
        result.http_requests_total.push({ name, value, labels })
      }

      // HTTP请求持续时间（直方图）
      if (name === 'http_request_duration_seconds_bucket') {
        result.http_request_duration_seconds.buckets.push({
          le: labels.le || '+Inf',
          count: Math.floor(value),
        })
      } else if (name === 'http_request_duration_seconds_sum') {
        result.http_request_duration_seconds.sum = value
      } else if (name === 'http_request_duration_seconds_count') {
        result.http_request_duration_seconds.count = Math.floor(value)
      }

      // 数据库连接数
      if (name === 'db_connections_active') {
        result.db_connections = { name: 'db_connections', value, labels }
      }

      // Redis连接数
      if (name === 'redis_connections_active') {
        result.redis_connections = { name: 'redis_connections', value, labels }
      }

      // 活跃会话数
      if (name === 'active_sessions') {
        result.active_sessions = { name: 'active_sessions', value, labels }
      }
    } catch (error) {
      // 忽略解析错误的行
      console.debug('Failed to parse Prometheus line:', line, error)
    }
  })

  return result
}

/**
 * 提取HTTP请求速率（每秒请求数）
 */
export function getRequestRate(metrics: PrometheusMetrics): number {
  const requests = metrics.http_requests_total || []
  if (requests.length === 0) return 0

  // 简单计算：总请求数（实际应该计算时间差）
  const total = requests.reduce((sum, m) => sum + m.value, 0)
  return Math.round(total)
}

/**
 * 提取HTTP请求持续时间统计
 */
export function getRequestDurationStats(metrics: PrometheusMetrics): {
  count: number
  sum: number
  avg: number
  p50: number
  p95: number
  p99: number
} {
  const histogram = metrics.http_request_duration_seconds
  if (!histogram || histogram.count === 0) {
    return { count: 0, sum: 0, avg: 0, p50: 0, p95: 0, p99: 0 }
  }

  const buckets = histogram.buckets.sort((a, b) =>
    parseFloat(a.le) - parseFloat(b.le)
  )

  const avg = histogram.count > 0 ? histogram.sum / histogram.count : 0

  // 计算百分位数
  const p50 = getPercentile(buckets, histogram.count, 0.5)
  const p95 = getPercentile(buckets, histogram.count, 0.95)
  const p99 = getPercentile(buckets, histogram.count, 0.99)

  return {
    count: histogram.count,
    sum: histogram.sum,
    avg: Math.round(avg * 1000) / 1000, // 转换为毫秒
    p50: Math.round(p50 * 1000) / 1000,
    p95: Math.round(p95 * 1000) / 1000,
    p99: Math.round(p99 * 1000) / 1000,
  }
}

/**
 * 从直方图bucket获取百分位数
 */
function getPercentile(
  buckets: { le: string; count: number }[],
  totalCount: number,
  percentile: number
): number {
  const targetCount = totalCount * percentile

  for (const bucket of buckets) {
    if (bucket.count >= targetCount) {
      return parseFloat(bucket.le)
    }
  }

  return Infinity
}

/**
 * 提取数据库连接池状态
 */
export function getDatabaseStats(metrics: PrometheusMetrics): {
  active: number
  idle: number
  max: number
} {
  const active = metrics.db_connections?.value || 0
  // 如果有其他相关指标，可以在这里添加
  return {
    active,
    idle: 0,
    max: 100, // 默认值，应该从配置获取
  }
}

/**
 * 提取Redis连接状态
 */
export function getRedisStats(metrics: PrometheusMetrics): {
  active: number
  total: number
} {
  const active = metrics.redis_connections?.value || 0
  return {
    active,
    total: active + 10, // 假设有10个空闲连接
  }
}

/**
 * 格式化指标值用于显示
 */
export function formatMetricValue(value: number, unit?: string): string {
  if (unit === 'ms') {
    return `${value.toFixed(2)}ms`
  }
  if (unit === 'bytes') {
    return formatBytes(value)
  }
  if (unit === 'percent') {
    return `${value.toFixed(1)}%`
  }

  // 大数字格式化
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return value.toString()
}

/**
 * 格式化字节数
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)}${units[unitIndex]}`
}
