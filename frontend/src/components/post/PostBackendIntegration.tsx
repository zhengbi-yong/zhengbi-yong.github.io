'use client'

import { useEffect, useState } from 'react'
import { usePostStore } from '@/lib/store'
import { PostStats } from '@/components/post/PostStats'
import { LikeButton } from '@/components/post/LikeButton'
import { BackendComments } from '@/components/post/BackendComments'

interface PostBackendIntegrationProps {
  slug: string
  children: React.ReactNode
}

/**
 * 后端集成组件 - 为博客文章添加后端功能
 * - 记录浏览
 * - 显示统计（浏览、点赞、评论数）
 * - 点赞功能
 * - 评论功能
 */
export function PostBackendIntegration({ slug, children }: PostBackendIntegrationProps) {
  const { recordView, fetchStats } = usePostStore()
  const [viewRecorded, setViewRecorded] = useState(false)

  // Record view when component mounts
  useEffect(() => {
    if (!viewRecorded && slug) {
      recordView(slug)
      setViewRecorded(true)
    }
  }, [slug, viewRecorded, recordView])

  return (
    <>
      {/* Stats and Like Button - 可以放在文章标题下方 */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border">
        <PostStats slug={slug} />
        <LikeButton slug={slug} />
      </div>

      {/* Article Content */}
      {children}
    </>
  )
}
