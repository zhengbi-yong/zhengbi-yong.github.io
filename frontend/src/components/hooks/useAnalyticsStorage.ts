'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllAnalytics } from './useArticleAnalytics'

export interface AnalyticsExport {
  exportDate: string
  version: string
  data: Record<string, unknown>
}

const STORAGE_KEY = 'article_analytics'
const EXPORT_VERSION = '1.0.0'

/**
 * In-memory store for analytics data.
 * Replaces localStorage to comply with GOLDEN_RULES 2.2 (no localStorage for user data).
 *
 * This is a module-level singleton so all component instances share the same data.
 */
const analyticsMemoryStore = new Map<string, unknown>()

export function useAnalyticsStorage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get all analytics data from memory store
  const getAllData = useCallback(() => {
    if (!isClient) return {}
    const result: Record<string, unknown> = {}
    analyticsMemoryStore.forEach((value, key) => {
      result[key] = value
    })
    return result
  }, [isClient])

  // Export data as JSON file (file download - no localStorage)
  const exportData = useCallback(() => {
    if (!isClient) return

    const allData = getAllAnalytics()
    const exportPayload: AnalyticsExport = {
      exportDate: new Date().toISOString(),
      version: EXPORT_VERSION,
      data: allData,
    }

    const dataStr = JSON.stringify(exportPayload, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `blog-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [isClient, getAllData])

  // Import data from JSON file (file read - no localStorage)
  const importData = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isClient) {
        reject(new Error('Not running on client'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedData: AnalyticsExport = JSON.parse(content)

          // Validate data format
          if (!importedData.version || !importedData.data) {
            throw new Error('Invalid data format')
          }

          // Merge data into memory store
          const existingData = getAllAnalytics()
          const mergedData = { ...existingData, ...importedData.data }

          // Clear and repopulate memory store
          analyticsMemoryStore.clear()
          Object.entries(mergedData).forEach(([key, value]) => {
            analyticsMemoryStore.set(key, value)
          })

          resolve()
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [isClient, getAllData])

  // Clear all analytics data from memory
  const clearAllData = useCallback(() => {
    if (!isClient) return
    analyticsMemoryStore.clear()
  }, [isClient])

  // Clear specific article's data from memory
  const clearArticleData = useCallback((articleId: string) => {
    if (!isClient) return
    analyticsMemoryStore.delete(`${STORAGE_KEY}_${articleId}`)
  }, [isClient])

  // Get storage statistics
  const getDataStats = useCallback(() => {
    if (!isClient) {
      return {
        totalArticles: 0,
        totalViews: 0,
        avgEngagement: 0,
        storageSize: 0,
      }
    }

    const allData = getAllAnalytics()
    const articles = Object.entries(allData)

    const totalArticles = articles.length
    const totalViews = articles.reduce((sum, [, data]) => sum + ((data as { viewCount?: number }).viewCount || 0), 0)
    const avgEngagement =
      totalArticles > 0
        ? articles.reduce((sum, [, data]) => sum + ((data as { engagementScore?: number }).engagementScore || 0), 0) / totalArticles
        : 0

    // Calculate in-memory store size
    let storageSize = 0
    const serialized = JSON.stringify(Object.fromEntries(analyticsMemoryStore))
    storageSize = serialized.length

    return {
      totalArticles,
      totalViews,
      avgEngagement: Math.round(avgEngagement),
      storageSize: Math.round(storageSize / 1024), // KB
    }
  }, [isClient])

  return {
    getAllData,
    exportData,
    importData,
    clearAllData,
    clearArticleData,
    getDataStats,
    isClient,
  }
}
