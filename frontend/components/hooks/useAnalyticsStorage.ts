'use client'

import { useState, useEffect } from 'react'
import { getAllAnalytics } from './useArticleAnalytics'

export interface AnalyticsExport {
  exportDate: string
  version: string
  data: Record<string, any>
}

const STORAGE_KEY = 'article_analytics'
const EXPORT_VERSION = '1.0.0'

export function useAnalyticsStorage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 获取所有分析数据
  const getAllData = () => {
    if (!isClient) return {}
    return getAllAnalytics()
  }

  // 导出数据为 JSON 文件
  const exportData = () => {
    if (!isClient) return

    const allData = getAllAnalytics()
    const exportData: AnalyticsExport = {
      exportDate: new Date().toISOString(),
      version: EXPORT_VERSION,
      data: allData,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `blog-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 导入数据
  const importData = (file: File): Promise<void> => {
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

          // 验证数据格式
          if (!importedData.version || !importedData.data) {
            throw new Error('Invalid data format')
          }

          // 合并数据
          const existingData = getAllAnalytics()
          const mergedData = { ...existingData, ...importedData.data }

          // 保存合并后的数据
          Object.entries(mergedData).forEach(([key, value]) => {
            localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value))
          })

          resolve()
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // 清除所有数据
  const clearAllData = () => {
    if (!isClient) return

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_KEY)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }

  // 清除特定文章的数据
  const clearArticleData = (articleId: string) => {
    if (!isClient) return
    localStorage.removeItem(`${STORAGE_KEY}_${articleId}`)
  }

  // 获取数据统计
  const getDataStats = () => {
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
    const totalViews = articles.reduce((sum, [, data]) => sum + (data.viewCount || 0), 0)
    const avgEngagement =
      totalArticles > 0
        ? articles.reduce((sum, [, data]) => sum + (data.engagementScore || 0), 0) / totalArticles
        : 0

    // 计算存储大小
    let storageSize = 0
    articles.forEach(([key]) => {
      const data = localStorage.getItem(`${STORAGE_KEY}_${key}`)
      if (data) {
        storageSize += data.length
      }
    })

    return {
      totalArticles,
      totalViews,
      avgEngagement: Math.round(avgEngagement),
      storageSize: Math.round(storageSize / 1024), // KB
    }
  }

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
