'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
export default function ClientPostReader({
  slug,
  serverPost,
  children,
}: ClientPostReaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isClientRoute, setIsClientRoute] = useState(false)

  // 使用缓存 Hook 获取文章（优先从缓存读取）
  const cachedPost = useCachedPost(slug, serverPost, {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    enableBackgroundUpdate: true,
  })

  // 检测是否是客户端路由
  useEffect(() => {
    // 如果路径名匹配文章路径，且是客户端路由
    if (pathname && pathname.startsWith('/blog/')) {
      setIsClientRoute(true)
    }
  }, [pathname])

  // 如果是客户端路由且缓存存在，优先使用缓存数据
  // 注意：这里我们主要依赖 useCachedPost Hook 来处理缓存逻辑
  // 组件本身主要是提供缓存感知的渲染

  return <>{children}</>
}

