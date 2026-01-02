import * as Sentry from '@sentry/nextjs'
import { logger } from './utils/logger'

// 错误类型定义
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 自定义错误类
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly context?: Record<string, any>
  public readonly statusCode?: number

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    statusCode?: number
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.context = context
    this.statusCode = statusCode

    // 确保错误堆栈正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

// 网络错误
export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number, context?: Record<string, any>) {
    super(message, ErrorType.NETWORK, ErrorSeverity.HIGH, context, statusCode)
    this.name = 'NetworkError'
  }
}

// 验证错误
export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, ErrorType.VALIDATION, ErrorSeverity.LOW, { ...context, field })
    this.name = 'ValidationError'
  }
}

// 认证错误
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH)
    this.name = 'AuthenticationError'
  }
}

// 权限错误
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorType.AUTHORIZATION, ErrorSeverity.MEDIUM)
    this.name = 'AuthorizationError'
  }
}

// 未找到错误
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ErrorType.NOT_FOUND, ErrorSeverity.LOW, undefined, 404)
    this.name = 'NotFoundError'
  }
}

// 错误处理配置
interface ErrorHandlerConfig {
  enableSentry: boolean
  enableConsole: boolean
  enableToast: boolean
  logLevel: ErrorSeverity
}

// 默认配置
const defaultConfig: ErrorHandlerConfig = {
  enableSentry: process.env.NODE_ENV === 'production',
  enableConsole: process.env.NODE_ENV === 'development',
  enableToast: true,
  logLevel: ErrorSeverity.MEDIUM,
}

class ErrorHandler {
  private config: ErrorHandlerConfig
  private toastQueue: Array<() => void> = []

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // 处理错误
  public handle(error: Error | AppError, context?: Record<string, any>): void {
    // 如果是我们的自定义错误，使用其属性
    if (error instanceof AppError) {
      this.processError(error, { ...error.context, ...context })
    } else {
      // 将原生错误包装为 AppError
      const appError = new AppError(error.message, ErrorType.UNKNOWN, ErrorSeverity.MEDIUM, context)
      this.processError(appError, context)
    }
  }

  // 处理错误的核心逻辑
  private processError(error: AppError, context?: Record<string, any>): void {
    const finalContext = { ...context, ...error.context }

    // 控制台输出（开发环境）
    if (this.config.enableConsole || error.severity === ErrorSeverity.CRITICAL) {
      this.logToConsole(error, finalContext)
    }

    // 发送到 Sentry（生产环境）
    if (this.config.enableSentry && this.shouldReportToSentry(error)) {
      this.reportToSentry(error, finalContext)
    }

    // 显示 Toast 通知
    if (this.config.enableToast && this.shouldShowToast(error)) {
      this.showErrorToast(error)
    }
  }

  // 控制台日志
  private logToConsole(error: AppError, context?: Record<string, any>): void {
    const logMethod = this.getConsoleMethod(error.severity)
    logMethod(`[${error.type}] ${error.message}`, {
      stack: error.stack,
      context,
      severity: error.severity,
    })
  }

  // 获取适当的控制台方法
  private getConsoleMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.debug
      case ErrorSeverity.MEDIUM:
        return console.info
      case ErrorSeverity.HIGH:
        return console.warn
      case ErrorSeverity.CRITICAL:
        return console.error
      default:
        return console.log
    }
  }

  // 判断是否应该发送到 Sentry
  private shouldReportToSentry(error: AppError): boolean {
    // 过滤掉一些不需要上报的错误
    if (error.type === ErrorType.VALIDATION && error.severity === ErrorSeverity.LOW) {
      return false
    }

    // 只报告超过配置级别的错误
    const severityLevels = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3,
    }

    return severityLevels[error.severity] >= severityLevels[this.config.logLevel]
  }

  // 发送到 Sentry
  private reportToSentry(error: AppError, context?: Record<string, any>): void {
    const extra: Record<string, any> = {
      errorType: error.type,
      severity: error.severity,
      ...context,
    }

    Sentry.captureException(error, {
      tags: {
        errorType: error.type,
        severity: error.severity,
      },
      extra,
      level: this.getSentryLevel(error.severity),
    })
  }

  // 获取 Sentry 错误级别
  private getSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'debug'
      case ErrorSeverity.MEDIUM:
        return 'info'
      case ErrorSeverity.HIGH:
        return 'warning'
      case ErrorSeverity.CRITICAL:
        return 'error'
      default:
        return 'error'
    }
  }

  // 判断是否应该显示 Toast
  private shouldShowToast(error: AppError): boolean {
    // 服务器错误和客户端错误通常不需要显示给用户
    if (error.type === ErrorType.SERVER || error.type === ErrorType.CLIENT) {
      return false
    }

    // 验证错误通常通过表单显示，不需要 Toast
    if (error.type === ErrorType.VALIDATION) {
      return false
    }

    return true
  }

  // 显示错误 Toast
  private showErrorToast(error: AppError): void {
    // 将 Toast 添加到队列，延迟执行以确保 React 已经挂载
    this.toastQueue.push(() => {
      // TODO: 实现实际的 Toast 通知
      // toast({
      //   title: this.getErrorTitle(error),
      //   description: error.message,
      //   status: this.getToastStatus(error.severity),
      //   duration: 5000,
      // })

      // 临时使用 alert
      logger.warn('Toast notification:', {
        title: this.getErrorTitle(error),
        message: error.message,
      })
    })

    // 尝试执行队列中的 Toast
    this.processToastQueue()
  }

  // 处理 Toast 队列
  private processToastQueue(): void {
    // 检查是否已经可以显示 Toast（例如 React 已经挂载）
    if (typeof window !== 'undefined' && this.toastQueue.length > 0) {
      // 延迟执行，确保 DOM 已经准备好
      setTimeout(() => {
        this.toastQueue.forEach((showToast) => showToast())
        this.toastQueue = []
      }, 0)
    }
  }

  // 获取错误标题
  private getErrorTitle(error: AppError): string {
    const titles = {
      [ErrorType.NETWORK]: 'Network Error',
      [ErrorType.AUTHENTICATION]: 'Authentication Error',
      [ErrorType.AUTHORIZATION]: 'Permission Denied',
      [ErrorType.NOT_FOUND]: 'Not Found',
      [ErrorType.SERVER]: 'Server Error',
      [ErrorType.CLIENT]: 'Client Error',
      [ErrorType.VALIDATION]: 'Validation Error',
      [ErrorType.UNKNOWN]: 'Error',
    }

    return titles[error.type] || 'Error'
  }

  // 获取 Toast 状态
  private getToastStatus(severity: ErrorSeverity): 'success' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info'
      case ErrorSeverity.MEDIUM:
        return 'warning'
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error'
      default:
        return 'error'
    }
  }

  // 异步错误处理
  public async handleAsync<T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await asyncFn()
    } catch (error) {
      this.handle(error as Error, context)
      return null
    }
  }

  // 包装异步函数
  public wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: Record<string, any>
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.handle(error as Error, { ...context, args })
        throw error
      }
    }) as T
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler()

// 导出便捷函数
export const handleError = (error: Error | AppError, context?: Record<string, any>) =>
  errorHandler.handle(error, context)

export const handleAsync = <T>(fn: () => Promise<T>, context?: Record<string, any>) =>
  errorHandler.handleAsync(fn, context)

export const wrapAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
) => errorHandler.wrapAsync(fn, context)

// 全局错误监听器
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    handleError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    handleError(new Error(`Unhandled promise rejection: ${event.reason}`), {
      reason: event.reason,
    })
  })
}
