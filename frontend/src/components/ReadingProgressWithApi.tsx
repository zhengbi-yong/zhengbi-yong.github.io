'use client'

import { useReadingProgressWithApi } from './hooks/useReadingProgressWithApi'

interface ReadingProgressWithApiProps {
  postSlug: string
  root?: Element | null
  enabled?: boolean
  showPercentage?: boolean
  showPosition?: boolean
  position?: 'top' | 'bottom'
}

/**
 * 阅读进度组件 - 集成后端API
 *
 * 功能：
 * 1. 显示阅读进度条
 * 2. 显示阅读百分比
 * 3. 自动保存进度到后端
 * 4. 恢复上次阅读位置
 * 5. 显示保存状态
 */
export function ReadingProgressWithApi({
  postSlug,
  root,
  enabled = true,
  showPercentage = true,
  showPosition = true,
  position = 'bottom',
}: ReadingProgressWithApiProps) {
  const {
    progress,
    scrollPercentage,
    isLoading,
    isSaving,
    isAuthenticated,
    error,
  } = useReadingProgressWithApi({
    postSlug,
    root,
    enabled,
  })

  // 未登录时不显示组件
  if (!isAuthenticated) {
    return null
  }

  const percentage = Math.round(scrollPercentage * 100)

  return (
    <>
      {/* 顶部进度条 */}
      {position === 'top' && (
        <div className="fixed top-0 left-0 z-50 h-1 w-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* 底部进度指示器 */}
      {showPosition && position === 'bottom' && percentage > 0 && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white/90 px-4 py-2 shadow-lg dark:bg-gray-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* 进度百分比 */}
            {showPercentage && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                已阅读 {percentage}%
              </span>
            )}

            {/* 保存状态指示器 */}
            {isSaving && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">保存中</span>
              </div>
            )}

            {/* 刚保存完成 */}
            {!isSaving && !isLoading && percentage > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">已同步</span>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-2 text-xs text-red-500 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {/* 底部细线进度条 */}
      {position === 'bottom' && (
        <div className="fixed bottom-0 left-0 z-50 h-1 w-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </>
  )
}
