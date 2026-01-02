/**
 * 客户端博客缓存工具
 * 集成 IndexedDB 和 Zustand，实现客户端数据缓存
 */

'use client'

import { useEffect, useState } from 'react'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { logger } from './logger'
import blogDB from '@/lib/db/blog-db'
import { useBlogStore } from '@/lib/store/blog-store'

const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

/**
 * 使用缓存的博客列表 Hook
 * 优先从 IndexedDB 和 Zustand 读取，后台更新
 */
export function useCachedBlogs(serverPosts: CoreContent<Blog>[]): CoreContent<Blog>[] {
  const [cachedPosts, setCachedPosts] = useState<CoreContent<Blog>[] | null>(null)
  const { allPosts, setAllPosts, isCacheValid } = useBlogStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadCachedData() {
      try {
        // 1. 优先检查 Zustand 缓存
        if (isCacheValid() && allPosts.length > 0) {
          if (mounted) {
            setCachedPosts(allPosts)
            setIsLoading(false)
          }
          // 后台更新
          updateCacheInBackground(serverPosts)
          return
        }

        // 2. 检查 IndexedDB 缓存
        const dbPosts = await blogDB.getBlogs()
        if (dbPosts && dbPosts.length > 0) {
          if (mounted) {
            setCachedPosts(dbPosts)
            setAllPosts(dbPosts) // 同步到 Zustand
            setIsLoading(false)
          }
          // 后台更新
          updateCacheInBackground(serverPosts)
          return
        }

        // 3. 没有缓存，使用服务器数据
        if (mounted) {
          setCachedPosts(serverPosts)
          setAllPosts(serverPosts) // 保存到 Zustand
          // 保存到 IndexedDB（异步，不阻塞）
          blogDB.saveBlogs(serverPosts).catch(console.error)
          setIsLoading(false)
        }
      } catch (error) {
        logger.error('[Cache] Failed to load cached data:', error)
        if (mounted) {
          setCachedPosts(serverPosts)
          setIsLoading(false)
        }
      }
    }

    loadCachedData()

    return () => {
      mounted = false
    }
  }, [serverPosts, allPosts, isCacheValid, setAllPosts])

  // 后台更新缓存
  async function updateCacheInBackground(posts: CoreContent<Blog>[]) {
    try {
      // 更新 Zustand
      setAllPosts(posts)
      // 更新 IndexedDB
      await blogDB.saveBlogs(posts)
    } catch (error) {
      logger.error('[Cache] Failed to update cache:', error)
    }
  }

  // 如果正在加载，返回服务器数据（避免闪烁）
  if (isLoading) {
    return serverPosts
  }

  // 返回缓存数据或服务器数据
  return cachedPosts || serverPosts
}
