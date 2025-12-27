'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * 文章详情页错误边界
 * 捕获文章详情页面的错误
 */
export default function PostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到错误报告服务
    console.error('Post page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-2xl rounded-lg border border-red-200 bg-white p-8 shadow-lg dark:border-red-800 dark:bg-gray-800">
        {/* 错误图标 */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-10 w-10 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>

        {/* 错误标题和描述 */}
        <div className="mb-6 text-center">
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            文章加载失败
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            抱歉，我们无法加载此文章。文章可能已被删除或暂时不可用。
          </p>
        </div>

        {/* 开发模式显示错误详情 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="mb-2 text-sm font-semibold text-red-800 dark:text-red-200">
              错误详情：
            </p>
            <p className="font-mono text-xs text-red-700 dark:text-red-300">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-red-600 dark:text-red-400">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            重新加载
          </button>
          <Link
            href="/blog"
            className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            浏览其他文章
          </Link>
        </div>

        {/* 建议操作 */}
        <div className="mt-6 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>建议：</strong> 您可以尝试重新加载文章或浏览博客列表查找其他有趣的内容。
          </p>
        </div>
      </div>
    </div>
  )
}
