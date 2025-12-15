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

// 模拟本地存储的 analytics 数据
const getStoredAnalytics = (articleId: string): ArticleAnalytics => {
  if (typeof window === 'undefined') {
    return {
      viewCount: 0,
      totalReadingTime: 0,
      averageReadingTime: 0,
      scrollDepth: 0,
      lastVisited: null,
      engagementScore: 0,
    }
  }

  const stored = localStorage.getItem(`article_analytics_${articleId}`)
  if (stored) {
    const data = JSON.parse(stored)
    return {
      ...data,
      lastVisited: new Date(data.lastVisited),
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

// 保存 analytics 数据到本地存储
const saveAnalytics = (articleId: string, analytics: ArticleAnalytics): void => {
  if (typeof window === 'undefined') return

  localStorage.setItem(
    `article_analytics_${articleId}`,
    JSON.stringify({
      ...analytics,
      lastVisited: analytics.lastVisited?.toISOString(),
    })
  )
}

// 计算参与度分数
const calculateEngagementScore = (
  viewCount: number,
  averageReadingTime: number,
  scrollDepth: number
): number => {
  // 基础分数来自浏览次数
  const viewScore = Math.min(viewCount * 10, 100)

  // 阅读时间分数（假设平均阅读时间为 3 分钟）
  const timeScore = Math.min((averageReadingTime / 180) * 100, 100)

  // 滚动深度分数
  const depthScore = scrollDepth * 100

  // 加权平均
  const engagementScore = (viewScore * 0.3 + timeScore * 0.4 + depthScore * 0.3)

  return Math.round(engagementScore)
}

export function useArticleAnalytics({
  articleId,
  trackView = true,
  trackReadingTime = true,
  trackScrollDepth = true,
}: AnalyticsOptions) {
  const [analytics, setAnalytics] = useState<ArticleAnalytics>(() =>
    getStoredAnalytics(articleId)
  )

  const [sessionStartTime] = useState<Date>(new Date())
  const [maxScrollDepth, setMaxScrollDepth] = useState(0)
  const [hasTrackedView, setHasTrackedView] = useState(false)

  // 更新 analytics 数据
  const updateAnalytics = useCallback((
    updates: Partial<ArticleAnalytics>
  ) => {
    setAnalytics((prev) => {
      const updated = {
        ...prev,
        ...updates,
      }

      // 重新计算参与度分数
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

      saveAnalytics(articleId, updated)
      return updated
    })
  }, [articleId])

  // 跟踪页面访问
  const trackPageView = useCallback(() => {
    if (!trackView || hasTrackedView) return

    updateAnalytics({
      viewCount: analytics.viewCount + 1,
      lastVisited: new Date(),
    })

    setHasTrackedView(true)
  }, [trackView, hasTrackedView, analytics.viewCount, updateAnalytics])

  // 跟踪阅读时间
  const trackReadingTimeCallback = useCallback(() => {
    if (!trackReadingTime || !hasTrackedView) return

    const currentTime = new Date()
    const sessionDuration = Math.floor(
      (currentTime.getTime() - sessionStartTime.getTime()) / 1000
    )

    // 更新总阅读时间和平均阅读时间
    const newTotalReadingTime = analytics.totalReadingTime + sessionDuration
    const newAverageReadingTime = Math.floor(
      newTotalReadingTime / analytics.viewCount
    )

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

  // 跟踪滚动深度
  const trackScrollDepthCallback = useCallback(() => {
    if (!trackScrollDepth || !hasTrackedView) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight

    if (scrollHeight <= 0) return

    const currentDepth = Math.min(scrollTop / scrollHeight, 1)

    // 只在滚动深度超过之前记录时更新
    if (currentDepth > maxScrollDepth) {
      const newMaxDepth = currentDepth
      setMaxScrollDepth(newMaxDepth)

      updateAnalytics({
        scrollDepth: newMaxDepth,
      })
    }
  }, [trackScrollDepth, hasTrackedView, maxScrollDepth, updateAnalytics])

  // 获取热门度标签
  const getPopularityLabel = useCallback((): string => {
    if (analytics.engagementScore >= 80) return '🔥 热门'
    if (analytics.engagementScore >= 60) return '📈 受欢迎'
    if (analytics.engagementScore >= 40) return '👀 关注'
    if (analytics.engagementScore >= 20) return '📝 普通'
    return '🆕 新作'
  }, [analytics.engagementScore])

  // 初始化时跟踪页面访问
  useEffect(() => {
    trackPageView()
  }, [trackPageView])

  // 监听滚动事件
  useEffect(() => {
    if (!trackScrollDepth) return

    const handleScroll = () => {
      trackScrollDepthCallback()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [trackScrollDepth, trackScrollDepthCallback])

  // 页面卸载时跟踪阅读时间
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackReadingTimeCallback()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // 组件卸载时也记录阅读时间
      trackReadingTimeCallback()
    }
  }, [trackReadingTimeCallback])

  // 定期保存数据
  useEffect(() => {
    const interval = setInterval(() => {
      trackReadingTimeCallback()
    }, 30000) // 每30秒更新一次

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

// 获取所有文章的 analytics 数据
export function getAllAnalytics(): Record<string, ArticleAnalytics> {
  if (typeof window === 'undefined') return {}

  const allAnalytics: Record<string, ArticleAnalytics> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('article_analytics_')) {
      const articleId = key.replace('article_analytics_', '')
      const data = localStorage.getItem(key)

      if (data) {
        try {
          const analytics = JSON.parse(data)
          allAnalytics[articleId] = {
            ...analytics,
            lastVisited: analytics.lastVisited ? new Date(analytics.lastVisited) : null,
          }
        } catch (error) {
          console.error(`Failed to parse analytics for ${articleId}:`, error)
        }
      }
    }
  }

  return allAnalytics
}

// 获取最受欢迎的文章
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