'use client'

import { memo } from 'react'

/**
 * 博客书架骨架屏
 * 在博客页面加载时显示加载状态
 */
export default function BlogSkeleton() {
  return (
    <div className="min-h-screen">
      {/* 标题骨架 */}
      <div className="mb-6 text-center pt-6 pb-4">
        <div className="mx-auto mb-3 h-10 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 sm:h-12 md:h-14" />
        <div className="mx-auto h-4 w-80 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* 三列布局骨架 */}
      <div className="flex h-[calc(100vh-200px)] items-stretch gap-4 overflow-y-auto overflow-x-hidden px-4 pb-4">
        {/* 左侧窄列骨架 - 最新文章 */}
        <div className="hidden xl:flex flex-shrink-0 w-64 flex-col">
          <div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>

        {/* 中间宽列骨架 - 书籍网格 */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-0">
            {[...Array(12)].map((_, i) => (
              <BookSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* 右侧窄列骨架 - 热门文章 */}
        <div className="hidden xl:flex flex-shrink-0 w-64 flex-col">
          <div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 单本书籍骨架组件
 */
const BookSkeleton = memo(function BookSkeleton() {
  return (
    <div className="p-2">
      <div className="h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {/* 书籍封面骨架 */}
        <div className="mb-3 h-32 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

        {/* 书籍标题骨架 */}
        <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

        {/* 文章数量骨架 */}
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
})
