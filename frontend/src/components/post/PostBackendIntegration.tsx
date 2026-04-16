'use client'

import { useEffect } from 'react'
import { usePostStore } from '@/lib/store/post-store'
import { PostStats } from '@/components/post/PostStats'
import { LikeButton } from '@/components/post/LikeButton'

interface PostBackendIntegrationProps {
  slug: string
  children: React.ReactNode
}

// In-memory set to prevent double-counting views within the same tab session.
// No localStorage/sessionStorage needed — this is the same pattern used by
// useArticleAnalytics and useAnalyticsStorage (GOLDEN_RULES 2.2 compliant).
const recordedPostViews = new Set<string>()

export function PostBackendIntegration({ slug, children }: PostBackendIntegrationProps) {
  const { recordView, fetchStats } = usePostStore()
  void fetchStats

  useEffect(() => {
    if (!slug || recordedPostViews.has(slug)) {
      return
    }

    recordedPostViews.add(slug)
    void recordView(slug)
  }, [slug, recordView])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
        <PostStats slug={slug} />
        <LikeButton slug={slug} />
      </div>

      {children}
    </>
  )
}
