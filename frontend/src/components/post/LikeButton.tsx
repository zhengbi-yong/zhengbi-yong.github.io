'use client'

import { useEffect, useState } from 'react'
import { usePostStore, useAuthStore } from '@/lib/store'
import { Button } from '@/components/shadcn/ui/button'
import { ThumbsUp } from 'lucide-react'
import { cn } from '@/components/lib/utils'

interface LikeButtonProps {
  slug: string
  showCount?: boolean
  className?: string
}

export function LikeButton({ slug, showCount = true, className }: LikeButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const { fetchStats, toggleLike, isLiked, getStats } = usePostStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const stats = getStats(slug)
  const liked = isLiked(slug)

  // Fetch stats on mount
  useEffect(() => {
    if (!isInitialized && slug) {
      fetchStats(slug)
      setIsInitialized(true)
    }
  }, [slug, fetchStats, isInitialized])

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      await toggleLike(slug)
    } catch (error) {
      // Error is handled by the store
    }
  }

  const likeCount = stats?.like_count || 0

  return (
    <>
      <Button
        variant={liked ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggleLike}
        className={cn(
          'gap-2 transition-all',
          liked && 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500',
          className
        )}
      >
        <ThumbsUp className={cn('h-4 w-4', liked && 'fill-current')} />
        {showCount && (
          <span className="font-medium">
            {likeCount > 0 ? likeCount : '赞'}
          </span>
        )}
      </Button>

      {/* Reuse AuthModal if needed */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <p className="text-center mb-4">请先登录以点赞文章</p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAuthModalOpen(false)}
              >
                取消
              </Button>
              <Button onClick={() => (window.location.href = '/?auth=login')}>
                去登录
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
