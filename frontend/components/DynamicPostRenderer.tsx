/**
 * 动态文章渲染器组件
 *
 * 用于渲染从API获取的MDX内容
 * 支持所有MDX功能：数学公式、化学公式、代码高亮等
 */

'use client'

import { useEffect, useState, Suspense } from 'react'
import { MDXRuntime } from '@/lib/mdx-runtime'
import Script from 'next/script'

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
export function DynamicPostRenderer({ content, slug }: DynamicPostRendererProps) {
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

  // 确保只在客户端渲染（避免SSR/SSG问题）
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <PostContentSkeleton />
  }

  return (
    <>
      {/* RDKit加载（如果需要化学可视化） */}
      <Script
        id="rdkit-loader"
        src="/chemistry/rdkit/RDKit_minimal.js"
        strategy="beforeInteractive"
        onError={(e) => {
          console.warn('Failed to load RDKit:', e)
        }}
      />

      {/* MDX渲染 */}
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
      {/* 标题骨架 */}
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>

      {/* 段落骨架 */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>

      {/* 代码块骨架 */}
      <div className="mt-6 h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>

      {/* 更多段落 */}
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
