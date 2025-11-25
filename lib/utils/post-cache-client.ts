/**
 * 文章内容缓存 Hook
 * 优先从 IndexedDB 读取，后台更新，实现瞬间打开
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Blog } from 'contentlayer/generated'
import blogDB from '@/lib/db/blog-db'

const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

interface UseCachedPostOptions {
  maxAge?: number
  enableBackgroundUpdate?: boolean
}

/**
 * 使用缓存的文章 Hook
 * @param slug 文章 slug
 * @param serverPost 服务器端文章数据（首次加载时传入）
 * @param options 配置选项
 * @returns 文章数据（优先从缓存读取）
 */
export function useCachedPost(
  slug: string,
  serverPost: Blog | null,
  options: UseCachedPostOptions = {}
): Blog | null {
  const { maxAge = CACHE_EXPIRY, enableBackgroundUpdate = true } = options
  const [cachedPost, setCachedPost] = useState<Blog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 从缓存加载文章
  const loadFromCache = useCallback(async () => {
    if (!slug) {
      setIsLoading(false)
      return null
    }

    try {
      // 检查缓存是否有效
      const isValid = await blogDB.isPostCacheValid(slug, maxAge)
      if (!isValid) {
        setIsLoading(false)
        return null
      }

      // 从 IndexedDB 读取
      const post = await blogDB.getPostFull(slug)
      if (post) {
        setCachedPost(post)
        setIsLoading(false)
        console.log(`[PostCache] Loaded from cache: ${slug}`)
        return post
      }
    } catch (error) {
      console.error('[PostCache] Failed to load from cache:', error)
    }

    setIsLoading(false)
    return null
  }, [slug, maxAge])

  // 保存到缓存
  const saveToCache = useCallback(async (post: Blog) => {
    if (!post || !slug) {
      return
    }

    try {
      await blogDB.savePostFull(slug, post)
      console.log(`[PostCache] Saved to cache: ${slug}`)
    } catch (error) {
      console.error('[PostCache] Failed to save to cache:', error)
    }
  }, [slug])

  // 后台更新缓存
  const updateCacheInBackground = useCallback(async (post: Blog) => {
    if (!enableBackgroundUpdate || !post) {
      return
    }

    try {
      // 检查是否需要更新（比较 lastModified）
      const cached = await blogDB.getPostFull(slug)
      if (cached) {
        const cachedTime = cached.lastmod
          ? new Date(cached.lastmod).getTime()
          : new Date(cached.date).getTime()
        const serverTime = post.lastmod
          ? new Date(post.lastmod).getTime()
          : new Date(post.date).getTime()

        // 如果服务器数据没有更新，跳过
        if (serverTime <= cachedTime) {
          return
        }
      }

      // 更新缓存
      await saveToCache(post)
    } catch (error) {
      console.error('[PostCache] Failed to update cache in background:', error)
    }
  }, [slug, enableBackgroundUpdate, saveToCache])

  useEffect(() => {
    let mounted = true

    async function init() {
      // 1. 尝试从缓存加载
      const cached = await loadFromCache()
      if (cached && mounted) {
        // 如果有缓存，立即显示，后台更新
        if (serverPost && enableBackgroundUpdate) {
          updateCacheInBackground(serverPost)
        }
        return
      }

      // 2. 没有缓存，使用服务器数据
      if (serverPost && mounted) {
        setCachedPost(serverPost)
        setIsLoading(false)
        // 保存到缓存（异步，不阻塞）
        saveToCache(serverPost).catch(console.error)
      } else if (mounted) {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [slug, serverPost, loadFromCache, saveToCache, updateCacheInBackground, enableBackgroundUpdate])

  // 如果正在加载且没有缓存，返回服务器数据（避免闪烁）
  if (isLoading && !cachedPost) {
    return serverPost
  }

  // 优先返回缓存数据
  return cachedPost || serverPost
}

/**
 * 预加载文章到缓存
 * @param slug 文章 slug
 * @param post 文章数据
 */
export async function preloadPost(slug: string, post: Blog): Promise<void> {
  try {
    await blogDB.savePostFull(slug, post)
    console.log(`[PostCache] Preloaded: ${slug}`)
  } catch (error) {
    console.error('[PostCache] Failed to preload post:', error)
  }
}

