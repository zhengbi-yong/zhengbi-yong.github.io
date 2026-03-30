/**
 * 动态文章页面组件
 *
 * 用于渲染从API动态获取的文章内容
 * 当文章不在静态生成中时使用此组件
 */

'use client'

import { useEffect } from 'react'
import { usePost } from '@/lib/hooks/useBlogData'
import { DynamicPostRenderer } from '@/components/DynamicPostRenderer'
import { notFound } from 'next/navigation'
import PostSimple from '@/components/layouts/PostSimple'
import PostLayoutMonograph from '@/components/layouts/PostLayoutMonograph'
import PostLayout from '@/components/layouts/PostLayout'
import PostBanner from '@/components/layouts/PostBanner'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors, Blog } from 'contentlayer/generated'
import type { ReactNode } from 'react'
import type { TOC } from '@/lib/types/toc'
import type { PostDetail } from '@/lib/types/backend'
import { RDKitLoader } from '@/components/RDKitLoader'
import { extractTocFromContent } from '@/lib/utils/extract-toc'

interface LayoutProps {
  content: CoreContent<Blog> | PostDetail // Accept both static and dynamic post types
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
  toc?: TOC
  showTOC?: boolean
}

const layouts = {
  PostSimple,
  PostLayoutMonograph,
  PostLayout,
  PostBanner,
} as unknown as Record<string, React.ComponentType<LayoutProps>>

interface DynamicPostPageProps {
  slug: string
}

  export function DynamicPostPage({ slug }: DynamicPostPageProps) {
  const { data: post, isLoading, error } = usePost(slug)

  useEffect(() => {
    // 注释掉view记录功能 - 后端缺少此端点
    // if (post) {
    //   fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/v1/posts/${slug}/view`, {
    //     method: 'POST',
    //   }).catch((err) => console.error('Failed to record view:', err))
    // }
  }, [post, slug])

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

  // 确定使用的布局 - 强制使用 PostLayoutMonograph
  const layoutKey = 'PostLayoutMonograph'
  const Layout = layouts[layoutKey]

  const showTOC = post.show_toc === true

  // 从内容中提取 TOC
  const toc: TOC = extractTocFromContent(post.content || '')

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

      {/* 布局组件 */}
      <Layout
        content={post}
        authorDetails={[]}
        toc={toc}
        showTOC={showTOC}
      >
        <DynamicPostRenderer content={post.content} slug={slug} />
      </Layout>
    </>
  )
}
