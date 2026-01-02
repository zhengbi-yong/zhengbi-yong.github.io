'use client'

import { useEffect, useState } from 'react'
import { usePostStore } from '@/lib/store'
import { Eye, ThumbsUp, MessageCircle } from 'lucide-react'
import { cn } from '@/components/lib/utils'

interface PostStatsProps {
  slug: string
  className?: string
}

export function PostStats({ slug, className }: PostStatsProps) {
  const { fetchStats, getStats } = usePostStore()
  const [isInitialized, setIsInitialized] = useState(false)

  const stats = getStats(slug)

  useEffect(() => {
    if (!isInitialized && slug) {
      fetchStats(slug)
      setIsInitialized(true)
    }
  }, [slug, fetchStats, isInitialized])

  if (!stats) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-4 text-sm text-muted-foreground', className)}>
      <div className="flex items-center gap-1.5" title="浏览次数">
        <Eye className="h-4 w-4" />
        <span>{stats.view_count.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-1.5" title="点赞数">
        <ThumbsUp className="h-4 w-4" />
        <span>{stats.like_count.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-1.5" title="评论数">
        <MessageCircle className="h-4 w-4" />
        <span>{stats.comment_count.toLocaleString()}</span>
      </div>
    </div>
  )
}
