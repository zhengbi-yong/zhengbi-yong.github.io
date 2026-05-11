/**
 * 动态文章页面组件
 *
 * 用于渲染从API动态获取的文章内容
 * 当文章不在静态生成中时使用此组件
 */

'use client'

import { useState } from 'react'
import { usePost } from '@/lib/hooks/useBlogData'
import { DynamicPostRenderer } from '@/components/DynamicPostRenderer'
import { notFound } from 'next/navigation'
import PostLayoutMonograph from '@/components/layouts/PostLayoutMonograph'
import { RDKitLoader } from '@/components/RDKitLoader'
import type { MDXCompileResult } from '@/lib/mdx-runtime'
import type { TOC } from '@/lib/types/toc'

interface DynamicPostPageProps {
  slug: string
}

export function DynamicPostPage({ slug }: DynamicPostPageProps) {
  const { data: post, isLoading, error } = usePost(slug)
  // Fumadocs 方式：TOC 来自 MDX 编译管线的 onCompiled 回调（保证与 heading ID 同源）
  const [toc, setToc] = useState<TOC>([])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 dark:bg-secondary rounded w-3/4 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-secondary rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-secondary rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-secondary rounded w-5/6 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return notFound()
  }

  const showTOC = post.show_toc === true
  const postContent = post.content_mdx || post.content_json || ''

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
        toc={toc}
        showTOC={showTOC}
      >
        <DynamicPostRenderer
          content={postContent}
          slug={slug}
          onCompiled={(result: MDXCompileResult) => {
            // Fumadocs 方式：TOC 与 heading ID 在同一编译管线中提取
            // 此时 MDX 内容已渲染到 DOM，AnchorProvider 可直接 observe 到 heading 元素
            setToc(result.toc.filter((item) => item.depth <= 2))
          }}
        />
      </PostLayoutMonograph>
    </>
  )
}
