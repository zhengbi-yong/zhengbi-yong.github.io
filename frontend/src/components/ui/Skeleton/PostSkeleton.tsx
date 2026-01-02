'use client'

import { memo } from 'react'

/**
 * 文章详情页骨架屏
 * 在文章页面加载时显示加载状态
 */
export default function PostSkeleton() {
  return (
    <article>
      <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
        {/* 标题区域骨架 */}
        <header className="pt-6 xl:pb-8">
          <div className="space-y-4 text-center">
            {/* 日期骨架 */}
            <div className="mb-6 h-6 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mx-auto" />

            {/* 标题骨架 */}
            <div className="space-y-3">
              <div className="h-10 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto sm:h-12 md:h-14" />
            </div>

            {/* 标签骨架 */}
            <div className="flex flex-wrap justify-center gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        </header>

        {/* 内容区域骨架 */}
        <div className="divide-y divide-gray-200 pb-8 md:grid md:grid-cols-[3fr_1fr] xl:grid-cols-[1.5fr_3fr_1.5fr] md:gap-x-4 xl:gap-x-8 md:divide-y-0 dark:divide-gray-700">
          {/* 左侧：最新文章骨架 - 在 xl 以下屏幕隐藏 */}
          <div className="hidden xl:flex xl:col-span-1 flex-shrink-0 flex-col">
            <div className="sticky top-20 flex flex-col h-full w-full">
              <div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 中间：文章内容骨架 */}
          <div className="md:col-span-1 xl:col-span-1 xl:px-4">
            <div className="prose dark:prose-invert mx-auto w-full max-w-full min-w-0 pt-10 pb-8">
              <PostContentSkeleton />
            </div>
          </div>

          {/* 右侧：TOC 骨架 */}
          <div className="hidden md:sticky md:top-20 md:col-span-1 md:block md:flex md:flex-col md:self-start">
            <div className="flex flex-col h-full w-full">
              <div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                    style={{ width: `${80 - i * 10}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * 文章内容骨架
 * 模拟段落、标题、代码块等
 */
const PostContentSkeleton = memo(function PostContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* 段落骨架 1 */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            style={{ width: i === 2 ? '80%' : '100%' }}
          />
        ))}
      </div>

      {/* 二级标题骨架 */}
      <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

      {/* 段落骨架 2 */}
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            style={{ width: i === 3 ? '70%' : '100%' }}
          />
        ))}
      </div>

      {/* 代码块骨架 */}
      <div className="h-48 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />

      {/* 三级标题骨架 */}
      <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

      {/* 段落骨架 3 */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            style={{ width: i === 2 ? '90%' : '100%' }}
          />
        ))}
      </div>

      {/* 列表骨架 */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* 更多段落骨架 */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            style={{ width: i % 2 === 0 ? '100%' : '85%' }}
          />
        ))}
      </div>
    </div>
  )
})
