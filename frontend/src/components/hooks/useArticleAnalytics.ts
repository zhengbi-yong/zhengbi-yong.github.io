'use client'

import { useState, useEffect, useCallback } from 'react'

interface ArticleAnalytics {
  viewCount: number
  totalReadingTime: number
  averageReadingTime: number
  scrollDepth: number
  lastVisited: Date | null
  engagementScore: number
}

interface AnalyticsOptions {
  articleId: string
  trackView?: boolean
  trackReadingTime?: boolean
  trackScrollDepth?: boolean
}

/**
 * Module-level in-memory store for article analytics.
 * Replaces localStorage to comply with GOLDEN_RULES 2.2 (no localStorage for user data).
 */
const analyticsMemoryStore = new Map<string, ArticleAnalytics>()

// In-memory analytics getter
const getStoredAnalytics = (articleId: string): ArticleAnalytics => {
  const stored = analyticsMemoryStore.get(articleId)
  if (stored) {
    return {
      ...stored,
      lastVisited: stored.lastVisited ? new Date(stored.lastVisited) : null,
    }
  }
  return {
    viewCount: 0,
    totalReadingTime: 0,
    averageReadingTime: 0,
    scrollDepth: 0,
    lastVisited: null,
    engagementScore: 0,
  }
}

// In-memory analytics setter
const saveAnalytics = (articleId: string, analytics: ArticleAnalytics): void => {
  // Clone to break reference, serialize Date to ISO string for storage
  analyticsMemoryStore.set(articleId, {
    ...analytics,
    lastVisited: analytics.lastVisited ? new Date(analytics.lastVisited) : null,
  })
}

// Calculate engagement score
const calculateEngagementScore = (
  viewCount: number,
  averageReadingTime: number,
  scrollDepth: number
): number => {
  const viewScore = Math.min(viewCount * 10, 100)
  const timeScore = Math.min((averageReadingTime / 180) * 100, 100)
  const depthScore = scrollDepth * 100
  const engagementScore = viewScore * 0.3 + timeScore * 0.4 + depthScore * 0.3
  return Math.round(engagementScore)
}

export function useArticleAnalytics({
  articleId,
  trackView = true,
  trackReadingTime = true,
  trackScrollDepth = true,
}: AnalyticsOptions) {
  const [analytics, setAnalytics] = useState<ArticleAnalytics>(() => getStoredAnalytics(articleId))
  const [sessionStartTime] = useState<Date>(new Date())
  const [maxScrollDepth, setMaxScrollDepth] = useState(0)
  const [hasTrackedView, setHasTrackedView] = useState(false)

  // Update analytics data
  const updateAnalytics = useCallback(
    (updates: Partial<ArticleAnalytics>) => {
      setAnalytics((prev) => {
        const updated = {
          ...prev,
          ...updates,
        }

        // Recalculate engagement score
        if (
          updates.viewCount !== undefined ||
          updates.averageReadingTime !== undefined ||
          updates.scrollDepth !== undefined
        ) {
          updated.engagementScore = calculateEngagementScore(
            updated.viewCount,
            updated.averageReadingTime,
            updated.scrollDepth
          )
        }

        // Save to in-memory store
        saveAnalytics(articleId, updated)
        return updated
      })
    },
    [articleId]
  )

  // Track page view
  const trackPageView = useCallback(() => {
    if (!trackView || hasTrackedView) return

    updateAnalytics({
      viewCount: analytics.viewCount + 1,
      lastVisited: new Date(),
    })

    setHasTrackedView(true)
  }, [trackView, hasTrackedView, analytics.viewCount, updateAnalytics])

  // Track reading time
  const trackReadingTimeCallback = useCallback(() => {
    if (!trackReadingTime || !hasTrackedView) return

    const currentTime = new Date()
    const sessionDuration = Math.floor((currentTime.getTime() - sessionStartTime.getTime()) / 1000)

    const newTotalReadingTime = analytics.totalReadingTime + sessionDuration
    const newAverageReadingTime = Math.floor(newTotalReadingTime / analytics.viewCount)

    updateAnalytics({
      totalReadingTime: newTotalReadingTime,
      averageReadingTime: newAverageReadingTime,
    })
  }, [
    trackReadingTime,
    hasTrackedView,
    sessionStartTime,
    analytics.totalReadingTime,
    analytics.viewCount,
    updateAnalytics,
  ])

  // Track scroll depth
  const trackScrollDepthCallback = useCallback(() => {
    if (!trackScrollDepth || !hasTrackedView) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight

    if (scrollHeight <= 0) return

    const currentDepth = Math.min(scrollTop / scrollHeight, 1)

    if (currentDepth > maxScrollDepth) {
      const newMaxDepth = currentDepth
      setMaxScrollDepth(newMaxDepth)

      updateAnalytics({
        scrollDepth: newMaxDepth,
      })
    }
  }, [trackScrollDepth, hasTrackedView, maxScrollDepth, updateAnalytics])

  // Get popularity label
  const getPopularityLabel = useCallback((): string => {
    if (analytics.engagementScore >= 80) return '热门'
    if (analytics.engagementScore >= 60) return '受欢迎'
    if (analytics.engagementScore >= 40) return '关注'
    if (analytics.engagementScore >= 20) return '普通'
    return '新作'
  }, [analytics.engagementScore])

  // Initialize: track page view
  useEffect(() => {
    trackPageView()
  }, [trackPageView])

  // Scroll event listener
  useEffect(() => {
    if (!trackScrollDepth) return undefined

    const handleScroll = () => {
      trackScrollDepthCallback()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [trackScrollDepth, trackScrollDepthCallback])

  // Track reading time on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackReadingTimeCallback()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      trackReadingTimeCallback()
    }
  }, [trackReadingTimeCallback])

  // Periodic save
  useEffect(() => {
    const interval = setInterval(() => {
      trackReadingTimeCallback()
    }, 30000) // Every 30s

    return () => clearInterval(interval)
  }, [trackReadingTimeCallback])

  return {
    analytics,
    trackPageView,
    trackReadingTime: trackReadingTimeCallback,
    trackScrollDepth: trackScrollDepthCallback,
    getPopularityLabel,
    isPopular: analytics.engagementScore >= 60,
  }
}

// Get all articles' analytics from in-memory store
export function getAllAnalytics(): Record<string, ArticleAnalytics> {
  const allAnalytics: Record<string, ArticleAnalytics> = {}

  analyticsMemoryStore.forEach((value, key) => {
    allAnalytics[key] = {
      ...value,
      lastVisited: value.lastVisited ? new Date(value.lastVisited) : null,
    }
  })

  return allAnalytics
}

// Get most popular articles
export function getPopularArticles(limit = 5): Array<{
  articleId: string
  analytics: ArticleAnalytics
}> {
  const allAnalytics = getAllAnalytics()

  return Object.entries(allAnalytics)
    .map(([articleId, analytics]) => ({ articleId, analytics }))
    .sort((a, b) => b.analytics.engagementScore - a.analytics.engagementScore)
    .slice(0, limit)
}
