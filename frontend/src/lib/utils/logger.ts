/**
 * 统一日志工具系统
 * 提供统一的日志接口，支持开发/生产环境差异化处理
 *
 * 使用示例：
 * ```ts
 * import { logger } from '@/lib/utils/logger'
 *
 * logger.log('User logged in:', user)
 * logger.error('Failed to fetch data', error)
 * logger.warn('Deprecated API used')
 * logger.debug('Debug info:', data)
 * logger.info('Info message')
 * ```
 */

/* eslint-disable no-console */

import * as Sentry from '@sentry/nextjs'

interface Logger {
  log: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, error?: Error | unknown, ...args: unknown[]) => void
  debug: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  group: (label: string) => void
  groupEnd: () => void
  /** 审计日志：记录关键操作 */
  audit: (action: string, details: Record<string, unknown>) => void
  /** 性能日志：记录性能指标 */
  performance: (metric: string, duration: number) => void
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isSentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)

const logger: Logger = {
  log: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(message, ...args)
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(message, ...args)
    }
  },

  error: (message: string, error?: Error | unknown, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(message, error, ...args)
    }
    // 生产环境发送到 Sentry
    if (!isDevelopment && isSentryEnabled) {
      Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
        extra: {
          message,
          context: args,
        },
      })
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(message, ...args)
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(message, ...args)
    }
  },

  group: (label: string) => {
    if (isDevelopment) {
      console.group(label)
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd()
    }
  },

  audit: (action: string, details: Record<string, unknown>) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action,
      ...details,
    }

    if (isDevelopment) {
      console.log('[AUDIT]', auditLog)
    }
    // 生产环境可发送到 Sentry 作为 breadcrumbs 或审计服务
    if (!isDevelopment && isSentryEnabled) {
      Sentry.addBreadcrumb({
        category: 'audit',
        message: action,
        data: details,
        level: 'info',
      })
    }
  },

  performance: (metric: string, duration: number) => {
    const perfLog = {
      metric,
      duration,
      timestamp: Date.now(),
    }

    if (isDevelopment) {
      console.log(`[PERF] ${metric}: ${duration}ms`, perfLog)
    }
    // 生产环境可发送到 Sentry 作为 transaction span 或性能监控服务
    if (!isDevelopment && isSentryEnabled) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric}: ${duration}ms`,
        data: { duration, metric },
        level: 'info',
      })
    }
  },
}

export { logger }
export type { Logger }

