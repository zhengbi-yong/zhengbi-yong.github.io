'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/utils/logger'

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
    logger.error('Post page error:', error)
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>

        {/* 错误标题和描述 */}
        <div className="mb-6 text-center">
          <h1 className="mb-3 text-2xl font-bold text-foreground dark:text-foreground">
            文章加载失败
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            抱歉，我们无法加载此文章。文章可能已被删除或暂时不可用。
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
            重新加载
          </button>
          <Link
            href="/blog"
            className="rounded-md border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none dark:border-border dark:bg-secondary dark:text-foreground dark:hover:bg-secondary"
          >
            浏览其他文章
          </Link>
        </div>

        {/* 建议操作 */}
        <div className="mt-6 rounded-md bg-[var(--theme-info-muted)] p-4 dark:bg-[var(--theme-info-muted)]">
          <p className="text-sm text-[var(--theme-fg)] dark:text-[var(--theme-fg)]">
            <strong>建议：</strong> 您可以尝试重新加载文章或浏览博客列表查找其他有趣的内容。
          </p>
        </div>
      </div>
    </div>
  )
}
