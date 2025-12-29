// @ts-nocheck
'use client'

import React from 'react'
import { ErrorBoundaryV2 } from './ErrorBoundaryV2'
import ErrorReportButton from './ErrorReportButton'

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
      fallback={({ error, retry, reset }) => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex min-h-[400px] items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <ErrorBoundaryV2
                fallback={({ error, retry }) => (
                  <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                    <h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
                      Application Error
                    </h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-400">
                      The application encountered a critical error. Please try refreshing the page.
                    </p>
                    <button
                      onClick={retry}
                      className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                    >
                      Refresh Page
                    </button>
                  </div>
                )}
              >
                <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                  <div className="mb-6 text-center">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Something went wrong
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      We're sorry, but something unexpected happened. Our team has been notified.
                    </p>
                  </div>

                  <div className="mb-6 flex justify-center gap-4">
                    <button
                      onClick={retry}
                      className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 rounded bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Reset
                    </button>
                    <a
                      href="/"
                      className="flex items-center gap-2 rounded bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Go Home
                    </a>
                  </div>

                  <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                    <p className="mb-2 text-center text-sm text-gray-500 dark:text-gray-400">
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
