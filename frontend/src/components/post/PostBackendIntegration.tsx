'use client'

import { useEffect } from 'react'
import { usePostStore } from '@/lib/store/post-store'
import { PostStats } from '@/components/post/PostStats'
import { LikeButton } from '@/components/post/LikeButton'

interface PostBackendIntegrationProps {
  slug: string
  children: React.ReactNode
}

const recordedPostViews = new Set<string>()
const VIEW_SESSION_KEY_PREFIX = 'post-view-recorded:'

function hasRecordedView(slug: string) {
  if (recordedPostViews.has(slug)) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  try {
    const wasRecorded = window.sessionStorage.getItem(`${VIEW_SESSION_KEY_PREFIX}${slug}`) === '1'
    if (wasRecorded) {
      recordedPostViews.add(slug)
    }
    return wasRecorded
  } catch {
    return false
  }
}

function markViewRecorded(slug: string) {
  recordedPostViews.add(slug)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(`${VIEW_SESSION_KEY_PREFIX}${slug}`, '1')
  } catch {
    // Ignore storage failures; the in-memory set still prevents duplicates in this tab.
  }
}

export function PostBackendIntegration({ slug, children }: PostBackendIntegrationProps) {
  const { recordView, fetchStats } = usePostStore()
  void fetchStats

  useEffect(() => {
    if (!slug || hasRecordedView(slug)) {
      return
    }

    markViewRecorded(slug)
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
