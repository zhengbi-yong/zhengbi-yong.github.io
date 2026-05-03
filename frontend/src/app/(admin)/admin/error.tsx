'use client'

import { useEffect } from 'react'
import { Button } from '@/components/shadcn/ui/button'
import { LayoutDashboard } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin] Layout error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl border bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-red-800 dark:text-red-400">
            管理后台错误
          </h1>
          <p className="mt-4 text-sm font-mono text-red-600 dark:text-red-400">
            {error?.message || '未知错误'}
          </p>
          {error?.digest && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-500/70">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default" size="sm">
            重试
          </Button>
          <Button onClick={() => window.location.href = '/admin'} variant="outline" size="sm">
            返回仪表板
          </Button>
        </div>
      </div>
    </div>
  )
}
