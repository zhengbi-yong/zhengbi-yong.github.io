'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shadcn/ui/button'

export default function EditPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[EditPost] Editor error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-400">
          编辑器加载失败
        </h3>
        <p className="mb-1 text-sm font-mono text-red-600 dark:text-red-400">
          {error?.message || '未知错误'}
        </p>
        {error?.digest && (
          <p className="mb-4 text-xs text-red-500 dark:text-red-500/70">
            Error ID: {error.digest}
          </p>
        )}
        <Button onClick={reset} variant="outline" size="sm">
          重试
        </Button>
      </div>
    </div>
  )
}
