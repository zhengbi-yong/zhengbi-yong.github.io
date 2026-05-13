/**
 * 动态文章页面组件
 *
 * 用于渲染从API动态获取的文章内容
 * 当文章不在静态生成中时使用此组件
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePost } from '@/lib/hooks/useBlogData'
import { DynamicPostRenderer } from '@/components/DynamicPostRenderer'
import { notFound } from 'next/navigation'
import PostLayoutMonograph from '@/components/layouts/PostLayoutMonograph'
import { RDKitLoader } from '@/components/RDKitLoader'
import { extractTocFromContent } from '@/lib/utils/extract-toc'
import type { TOC } from '@/lib/types/toc'

interface DynamicPostPageProps {
  slug: string
}

export function DynamicPostPage({ slug }: DynamicPostPageProps) {
  const { data: post, isLoading, error } = usePost(slug)

  // TOC key: forces FumadocsTOC remount after MDX content renders,
  // ensuring IntersectionObserver can find heading elements in the DOM
  const [tocKey, setTocKey] = useState(0)

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

  // Extract TOC from MDX content using github-slugger (same as rehype-slug)
  // Works on both server and client, IDs guaranteed to match rendered headings
  const toc: TOC = useMemo(() => extractTocFromContent(postContent), [postContent])

  // Wait for MDXRemote to render headings into DOM, then remount FumadocsTOC
  // so AnchorProvider's IntersectionObserver can find them
  useEffect(() => {
    if (!postContent) return

    const observer = new MutationObserver(() => {
      const headings = document.querySelectorAll('h1[id], h2[id], h3[id]')
      if (headings.length > 0) {
        setTocKey((k) => k + 1)
        observer.disconnect()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [postContent])

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
        tocKey={tocKey}
      >
        <DynamicPostRenderer
          content={postContent}
          slug={slug}
        />
      </PostLayoutMonograph>
    </>
  )
}
