'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * 博客列表页错误边界
 * 捕获博客列表页面的错误
 */
export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到错误报告服务
    console.error('Blog page error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 dark:bg-background">
      <div className="w-full max-w-2xl rounded-lg border border-destructive/20 bg-background p-8 shadow-lg dark:border-destructive/20 dark:bg-card">
        {/* 错误图标 */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
            <svg
              className="h-10 w-10 text-destructive dark:text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* 错误标题和描述 */}
        <div className="mb-6 text-center">
          <h1 className="mb-3 text-2xl font-bold text-foreground dark:text-foreground">
            博客加载失败
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            我们无法加载博客列表。这可能是由于网络问题或服务器错误导致的。
          </p>
        </div>

        {/* 开发模式显示错误详情 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-md bg-destructive/5 p-4 dark:bg-destructive/15">
            <p className="mb-2 text-sm font-semibold text-destructive dark:text-destructive">
              错误详情：
            </p>
            <p className="font-mono text-xs text-destructive dark:text-destructive">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-destructive dark:text-destructive">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none dark:bg-primary dark:hover:bg-primary"
          >
            重试
          </button>
          <Link
            href="/"
            className="rounded-md border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
          >
            返回首页
          </Link>
        </div>

        {/* 建议操作 */}
        <div className="mt-6 rounded-md bg-[var(--theme-info-muted)] p-4 dark:bg-[var(--theme-info-muted)]">
          <p className="text-sm text-[var(--theme-fg)] dark:text-[var(--theme-fg)]">
            <strong>提示：</strong> 如果问题持续存在，请尝试刷新页面或稍后再试。
            您也可以通过网站底部的联系方式向我们报告此问题。
          </p>
        </div>
      </div>
    </div>
  )
}
