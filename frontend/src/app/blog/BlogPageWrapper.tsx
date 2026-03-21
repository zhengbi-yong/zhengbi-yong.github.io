'use client'

/**
 * Blog Page Wrapper
 * Client component that chooses between API and static content
 */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import BookShelfLayout from '@/components/layouts/BookShelfLayout'
import NewsletterSignup from '@/components/NewsletterSignup'
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
  const [useApi, setUseApi] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // 客户端挂载后，检测是否应该使用API
    setUseApi(process.env.NEXT_PUBLIC_USE_API === 'true')
  }, [])

  // 在客户端挂载前，始终显示静态内容（避免hydration不匹配）
  if (!isClient) {
    return (
      <div className="relative min-h-screen">
        <BookShelfLayout posts={fallbackPosts} title="博客书架" />
        {/* 邮件订阅部分 */}
        <div className="mx-auto mt-8 max-w-4xl px-4 pb-8">
          <NewsletterSignup compact={true} />
        </div>
      </div>
    )
  }

  if (useApi) {
    return <ApiBlogPage />
  }

  // 使用静态生成的内容
  return (
    <div className="relative min-h-screen">
      <BookShelfLayout posts={fallbackPosts} title="博客书架" />
      {/* 邮件订阅部分 */}
      <div className="mx-auto mt-8 max-w-4xl px-4 pb-8">
        <NewsletterSignup compact={true} />
      </div>
    </div>
  )
}
