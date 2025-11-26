'use client'

import { useEffect } from 'react'
import type { Blog } from 'contentlayer/generated'
import { preloadPost } from '@/lib/utils/post-cache-client'
import imagePreloader from '@/lib/utils/image-preloader'

interface CachedPostContentProps {
  slug: string
  post: Blog
}

/**
 * CachedPostContent - 文章内容缓存组件
 * 在文章加载后自动缓存文章内容和图片，后续访问瞬间打开
 */
export default function CachedPostContent({ slug, post }: CachedPostContentProps) {
  useEffect(() => {
    // 文章加载后自动缓存
    if (slug && post) {
      // 缓存文章内容
      preloadPost(slug, post).catch((error) => {
        console.error('[CachedPostContent] Failed to cache post:', error)
      })

      // 预加载文章中的图片（低优先级，不阻塞主线程）
      if (typeof window !== 'undefined') {
        const preloadImages = () => {
          imagePreloader.preloadPostImages(post, 'low')
          imagePreloader.processQueueIdle()
        }

        // 使用 requestIdleCallback 延迟预加载图片
        if ('requestIdleCallback' in window) {
          requestIdleCallback(preloadImages, { timeout: 3000 })
        } else {
          setTimeout(preloadImages, 1000)
        }
      }
    }
  }, [slug, post])

  // 此组件不渲染任何内容，仅用于缓存
  return null
}

