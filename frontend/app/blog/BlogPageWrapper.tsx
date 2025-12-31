'use client'

/**
 * Blog Page Wrapper
 * Client component that chooses between API and static content
 */

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import BookShelfLayout from '@/layouts/BookShelfLayout'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

interface BlogPageWrapperProps {
  fallbackPosts: CoreContent<Blog>[]
}

// 动态导入API版本的博客页面（禁用SSR）
const ApiBlogPage = dynamic(
  () => import('@/components/blog/ApiBlogPage').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    ),
  }
)

export default function BlogPageWrapper({ fallbackPosts }: BlogPageWrapperProps) {
  // 检测是否应该使用API（通过环境变量）
  const useApi = useMemo(() => {
    if (typeof window === 'undefined') return false
    return process.env.NEXT_PUBLIC_USE_API === 'true'
  }, [])

  if (useApi) {
    return <ApiBlogPage />
  }

  // 使用静态生成的内容
  return (
    <div className="relative min-h-screen">
      <BookShelfLayout posts={fallbackPosts} title="博客书架" />
    </div>
  )
}
