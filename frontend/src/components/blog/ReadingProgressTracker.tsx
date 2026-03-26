'use client'

/**
 * ReadingProgressTracker - 阅读进度追踪组件
 *
 * 功能：
 * - 自动追踪用户阅读进度
 * - 定期保存到后端
 * - 显示进度条
 * - 支持继续阅读
 */

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { readingProgressService } from '@/lib/api/backend'
import { useTranslation } from 'react-i18next'

interface ReadingProgressTrackerProps {
  slug: string
  postId?: string
}

export function ReadingProgressTracker({ slug }: ReadingProgressTrackerProps) {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [progress, setProgress] = useState(0)
  const [savedProgress, setSavedProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // 加载已保存的进度
  useEffect(() => {
    if (!user) {
      return undefined
    }

    const loadProgress = async () => {
      try {
        const data = await readingProgressService.getProgress(slug)
        setSavedProgress(data.progress)
        setProgress(data.progress)

        // 如果有进度且大于5%，显示"继续阅读"提示
        if (data.progress > 5) {
          setIsVisible(true)
          // 5秒后自动隐藏提示
          setTimeout(() => setIsVisible(false), 5000)
        }
      } catch (error) {
        // 可能是首次阅读，忽略错误
        console.debug('No saved progress found')
      }
    }

    loadProgress()
  }, [slug, user])

  // 计算并更新阅读进度
  const updateReadingProgress = useCallback(() => {
    if (!user) return

    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const currentProgress = Math.min(Math.round((scrollTop / docHeight) * 100), 100)

    // 只有进度变化超过5%时才更新
    if (Math.abs(currentProgress - savedProgress) >= 5) {
      setProgress(currentProgress)

      // 防抖保存（每2秒最多保存一次）
      if (window.progressTimeout) {
        clearTimeout(window.progressTimeout)
      }

      window.progressTimeout = setTimeout(async () => {
        try {
          await readingProgressService.updateProgress(slug, currentProgress, currentProgress === 100)
          setSavedProgress(currentProgress)
          console.debug(`Progress saved: ${currentProgress}%`)
        } catch (error) {
          console.error('Failed to save progress:', error)
        }
      }, 2000)
    }
  }, [slug, user, savedProgress])

  // 监听滚动事件
  useEffect(() => {
    if (!user) {
      return undefined
    }

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateReadingProgress()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (window.progressTimeout) {
        clearTimeout(window.progressTimeout)
      }
    }
  }, [user, updateReadingProgress])

  // 如果未登录，不显示任何内容
  if (!user) {
    return null
  }

  return (
    <>
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 继续阅读提示 */}
      {isVisible && savedProgress > 5 && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm animate-fade-in">
          <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('blog.continueReading') || '继续阅读'}
              </span>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${savedProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('blog.progress') || '进度'}: {savedProgress}%
            </p>
            <button
              onClick={() => {
                // 滚动到之前的位置
                const docHeight = document.documentElement.scrollHeight - window.innerHeight
                const scrollPosition = (savedProgress / 100) * docHeight
                window.scrollTo({ top: scrollPosition, behavior: 'smooth' })
                setIsVisible(false)
              }}
              className="mt-2 w-full rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              {t('blog.resumeReading') || '继续'}
            </button>
          </div>
        </div>
      )}

      {/* 底部进度百分比（可选） */}
      <div className="fixed bottom-4 right-4 z-50 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-lg dark:bg-gray-800 dark:text-gray-100">
        {progress}%
      </div>
    </>
  )
}

// 类型扩展
declare global {
  interface Window {
    progressTimeout?: NodeJS.Timeout
  }
}

export default ReadingProgressTracker
