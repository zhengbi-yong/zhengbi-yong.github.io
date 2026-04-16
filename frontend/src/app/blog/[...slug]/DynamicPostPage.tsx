/**
 * 动态文章页面组件
 *
 * 用于渲染从API动态获取的文章内容
 * 当文章不在静态生成中时使用此组件
 */

'use client'

import { usePost } from '@/lib/hooks/useBlogData'
import { DynamicPostRenderer } from '@/components/DynamicPostRenderer'
import { notFound } from 'next/navigation'
import PostLayoutMonograph from '@/components/layouts/PostLayoutMonograph'
import { RDKitLoader } from '@/components/RDKitLoader'
import { extractTocFromContent } from '@/lib/utils/extract-toc'

interface DynamicPostPageProps {
  slug: string
}

export function DynamicPostPage({ slug }: DynamicPostPageProps) {
  const { data: post, isLoading, error } = usePost(slug)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return notFound()
  }

  const showTOC = post.show_toc === true

  return (
    <>
      {/* RDKit initialization script */}
      <RDKitLoader />

      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            description: post.summary || '',
            url: typeof window !== 'undefined' ? `${window.location.origin}/blog/${post.slug}` : '',
          }),
        }}
      />

      {/* 布局组件 - 强制使用 PostLayoutMonograph */}
      <PostLayoutMonograph
        content={post as any}
        authorDetails={[]}
        toc={extractTocFromContent(post.content || '')}
        showTOC={showTOC}
      >
        <DynamicPostRenderer content={post.content} slug={slug} />
      </PostLayoutMonograph>
    </>
  )
}
