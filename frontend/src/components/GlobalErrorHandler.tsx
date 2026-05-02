'use client'

import React from 'react'
import { ErrorBoundaryV2 } from './ErrorBoundaryV2'
import ErrorReportButton from './ErrorReportButton'
import { logger } from '@/lib/utils/logger'

interface GlobalErrorHandlerProps {
  children: React.ReactNode
}

export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
  return (
    <ErrorBoundaryV2
      onError={(error, errorInfo) => {
        // 全局错误处理逻辑
        logger.error('Global error handler:', error, errorInfo)

        // 可以在这里添加其他全局错误处理逻辑
        // 例如：显示全局通知、发送到分析服务等
      }}
      fallback={({ error: _error, retry, reset }) => (
        <div className="min-h-screen bg-muted dark:bg-background">
          <div className="flex min-h-[400px] items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <ErrorBoundaryV2
                fallback={({ error: _error, retry }) => (
                  <div className="rounded-lg bg-background p-6 shadow-lg dark:bg-card">
                    <h1 className="mb-4 text-2xl font-bold text-destructive dark:text-destructive">
                      Application Error
                    </h1>
                    <p className="mb-6 text-muted-foreground dark:text-muted-foreground">
                      The application encountered a critical error. Please try refreshing the page.
                    </p>
                    <button
                      onClick={retry}
                      className="rounded bg-primary px-4 py-2 text-white transition-colors hover:bg-primary"
                    >
                      Refresh Page
                    </button>
                  </div>
                )}
              >
                <div className="rounded-lg bg-background p-6 shadow-lg dark:bg-card">
                  <div className="mb-6 text-center">
                    <h1 className="mb-2 text-2xl font-bold text-foreground dark:text-foreground">
                      Something went wrong
                    </h1>
                    <p className="text-muted-foreground dark:text-muted-foreground">
                      We're sorry, but something unexpected happened. Our team has been notified.
                    </p>
                  </div>

                  <div className="mb-6 flex justify-center gap-4">
                    <button
                      onClick={retry}
                      className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-white transition-colors hover:bg-primary"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 rounded bg-gray-200 px-4 py-2 text-foreground transition-colors hover:bg-gray-300 dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
                    >
                      Reset
                    </button>
                    <a
                      href="/"
                      className="flex items-center gap-2 rounded bg-gray-200 px-4 py-2 text-foreground transition-colors hover:bg-gray-300 dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
                    >
                      Go Home
                    </a>
                  </div>

                  <div className="border-t border-border pt-4 dark:border-border">
                    <p className="mb-2 text-center text-sm text-muted-foreground dark:text-muted-foreground">
                      Help us improve by reporting this issue
                    </p>
                    <div className="flex justify-center">
                      <ErrorReportButton eventId={Date.now().toString()} />
                    </div>
                  </div>
                </div>
              </ErrorBoundaryV2>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundaryV2>
  )
}
