/**
 * 统一日志工具系统
 * 提供统一的日志接口，支持开发/生产环境差异化处理
 */

interface Logger {
  log: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, error?: Error | unknown, ...args: unknown[]) => void
}

const isDevelopment = process.env.NODE_ENV === 'development'

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
    // 生产环境可扩展为发送到监控服务（预留接口）
    // if (!isDevelopment && error) {
    //   // sendToMonitoringService(error)
    // }
  },
}

export { logger }
export type { Logger }
