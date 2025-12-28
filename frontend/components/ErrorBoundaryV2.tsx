'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/ButtonSimple'
import { AppError, ErrorType, ErrorSeverity } from '@/lib/error-handler'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void; reset: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
  isolate?: boolean // 是否隔离错误，防止冒泡
}

export class ErrorBoundaryV2 extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 更新状态
    this.setState({
      error,
      errorInfo,
    })

    // 记录错误
    logger.error('Error Boundary caught an error:', error, errorInfo)

    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 发送错误到错误处理服务
    const appError = new AppError(error.message, ErrorType.CLIENT, ErrorSeverity.HIGH, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount,
    })

    // 使用我们的错误处理器
    const { errorHandler } = require('@/lib/error-handler')
    errorHandler.handle(appError)
  }

  componentWillUnmount() {
    // 清理重试超时
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private retry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      logger.warn('Max retries reached')
      return
    }

    // 清除之前的超时
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    // 延迟重试，避免立即重新渲染导致相同的错误
    this.retryTimeoutId = setTimeout(
      () => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: retryCount + 1,
        })
      },
      1000 * Math.min(Math.pow(2, retryCount), 10)
    ) // 指数退避，最大 10 秒
  }

  private reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    })
  }

  private getErrorType(error: Error): ErrorType {
    if (error.name === 'ChunkLoadError') {
      return ErrorType.NETWORK
    }
    if (error.message.includes('Network error')) {
      return ErrorType.NETWORK
    }
    if (error.message.includes('Authentication')) {
      return ErrorType.AUTHENTICATION
    }
    if (error.message.includes('Permission')) {
      return ErrorType.AUTHORIZATION
    }
    if (error.message.includes('404') || error.message.includes('not found')) {
      return ErrorType.NOT_FOUND
    }
    return ErrorType.CLIENT
  }

  private canRetry(error: Error): boolean {
    const errorType = this.getErrorType(error)
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    // 网络错误和认证错误可以重试
    if (errorType === ErrorType.NETWORK || errorType === ErrorType.AUTHENTICATION) {
      return retryCount < maxRetries
    }

    // 其他错误类型只重试一次
    return retryCount === 0
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state
    const { children, fallback, isolate = false } = this.props

    if (hasError && error) {
      // 如果有自定义 fallback，使用它
      if (fallback) {
        const FallbackComponent = fallback
        return <FallbackComponent error={error} retry={this.retry} reset={this.reset} />
      }

      // 默认错误 UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
            {/* 错误图标 */}
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* 错误标题 */}
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Oops! Something went wrong
            </h2>

            {/* 错误消息 */}
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {isolate
                ? 'This component encountered an error, but the rest of the page is working normally.'
                : 'An unexpected error occurred while rendering this page.'}
            </p>

            {/* 开发环境显示详细信息 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4 text-left">
                <summary className="mb-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-3 font-mono text-xs dark:bg-gray-700">
                  <p className="mb-1 text-red-600 dark:text-red-400">
                    {error.name}: {error.message}
                  </p>
                  {errorInfo?.componentStack && (
                    <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* 重试计数 */}
            {retryCount > 0 && (
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Retry attempt: {retryCount}
              </p>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              {this.canRetry(error) && (
                <Button onClick={this.retry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}

              <Button variant="outline" onClick={this.reset} className="flex items-center gap-2">
                Reset
              </Button>

              <Link href="/" passHref>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* 错误类型提示 */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Error ID: {Date.now().toString(36)}
              {isolate && ' • Isolated Error'}
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

// 函数式组件包装器（用于 hooks）
export function ErrorBoundaryWrapper({
  children,
  ...props
}: Omit<ErrorBoundaryProps, 'children'> & { children: React.ReactNode }) {
  return <ErrorBoundaryV2 {...props}>{children}</ErrorBoundaryV2>
}

// 高阶组件
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryV2 {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundaryV2>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    setError(errorObj)

    // 发送到错误处理服务
    const { errorHandler } = require('@/lib/error-handler')
    errorHandler.handle(errorObj)
  }, [])

  // 抛出错误让 ErrorBoundary 捕获
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}
