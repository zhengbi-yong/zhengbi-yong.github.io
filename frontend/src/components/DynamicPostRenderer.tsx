/**
 * 动态文章渲染器组件
 *
 * 用于渲染从API动态获取的文章内容
 * 当文章不在静态生成中时使用此组件
 * 支持所有MDX功能：数学公式、化学公式、代码高亮等
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { MDXRuntime } from '@/lib/mdx-runtime'

interface DynamicPostRendererProps {
  content: string
  slug?: string
}

/**
 * 动态文章渲染器
 *
 * 在客户端渲染从API获取的MDX内容
 *
 * @param props - 包含content（MDX源代码）和可选的slug
 */
export function DynamicPostRenderer({ content }: DynamicPostRendererProps) {
  return (
    <Suspense fallback={<PostContentSkeleton />}>
      <MDXContent content={content} />
    </Suspense>
  )
}

/**
 * MDX内容组件（内部使用）
 */
function MDXContent({ content }: { content: string }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <PostContentSkeleton />
  }

  return (
    <>
      <MDXRuntime content={content} />
    </>
  )
}

/**
 * 文章内容骨架屏
 */
function PostContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>

      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>

      <div className="mt-6 h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>

      <div className="space-y-3 mt-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

/**
 * 导出便捷类型
 */
export type { DynamicPostRendererProps }
