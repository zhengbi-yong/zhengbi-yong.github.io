'use client'

import { useEffect } from 'react'
import type { Blog } from 'contentlayer/generated'
import { preloadPost } from '@/lib/utils/post-cache-client'

interface CachedPostContentProps {
  slug: string
  post: Blog
}

/**
 * CachedPostContent - 文章内容缓存组件
 * 在文章加载后自动缓存，后续访问瞬间打开
 */
export default function CachedPostContent({ slug, post }: CachedPostContentProps) {
  useEffect(() => {
    // 文章加载后自动缓存
    if (slug && post) {
      preloadPost(slug, post).catch((error) => {
        console.error('[CachedPostContent] Failed to cache post:', error)
      })
    }
  }, [slug, post])

  // 此组件不渲染任何内容，仅用于缓存
  return null
}

