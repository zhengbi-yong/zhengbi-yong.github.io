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
import PostLayout from '@/components/layouts/PostLayout'
import PostBanner from '@/components/layouts/PostBanner'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors, Blog } from 'contentlayer/generated'
import type { ReactNode } from 'react'
import type { TOC } from '@/lib/types/toc'
import Script from 'next/script'

interface LayoutProps {
  content: CoreContent<Blog> | any // Accept both static and dynamic post types
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
  toc?: TOC
  showTOC?: boolean
}

const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
} satisfies Record<string, React.ComponentType<LayoutProps>>

const defaultLayout: keyof typeof layouts = 'PostLayout'

function isLayoutKey(key: string): key is keyof typeof layouts {
  return key in layouts
}

interface DynamicPostPageProps {
  slug: string
}

export function DynamicPostPage({ slug }: DynamicPostPageProps) {
  const { data: post, isLoading, error } = usePost(slug)

  useEffect(() => {
    // 记录文章浏览
    if (post) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/v1/posts/${slug}/view`, {
        method: 'POST',
      }).catch((err) => console.error('Failed to record view:', err))
    }
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

  // 确定使用的布局
  const layoutKey = post.layout && isLayoutKey(post.layout) ? post.layout : defaultLayout
  const Layout = layouts[layoutKey]

  // 确定是否显示TOC
  const showTOC = post.show_toc !== undefined ? post.show_toc : true

  return (
    <>
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
            url: `${window.location.origin}/blog/${post.slug}`,
          }),
        }}
      />

      {/* Load RDKit for chemistry visualization */}
      <Script
        src="/chemistry/rdkit/RDKit_minimal.js"
        strategy="beforeInteractive"
      />

      {/* 布局组件 */}
      <Layout
        content={post as any}
        authorDetails={[]}
        toc={(post as any).toc}
        showTOC={showTOC}
      >
        <DynamicPostRenderer content={post.content} slug={slug} />
      </Layout>
    </>
  )
}
