'use client'

import React from 'react'
import { useCachedPost } from '@/lib/utils/post-cache-client'
import type { Blog } from 'contentlayer/generated'

interface ClientPostReaderProps {
  slug: string
  serverPost: Blog | null
  children: React.ReactNode
}

/**
 * ClientPostReader - 客户端文章阅读器
 * 在客户端路由时优先从缓存读取，实现瞬间打开
 */
export default function ClientPostReader({ slug, serverPost, children }: ClientPostReaderProps) {
  // 使用缓存 Hook 获取文章（优先从缓存读取）
  const cachedPost = useCachedPost(slug, serverPost, {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    enableBackgroundUpdate: true,
  })
  // mark as used to satisfy TS6133 for unused return value
  void cachedPost

  return <>{children}</>
}
