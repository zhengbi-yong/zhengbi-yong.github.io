import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api/apiClient'
import { useAuthStore } from '@/lib/store/auth-store'
import { AppError } from '@/lib/error-handler'

interface ReadingProgressOptions {
  postSlug: string
  root?: Element | null
  threshold?: number[]
  debounceMs?: number
  autoSaveMs?: number
  enabled?: boolean
}

// ReadingProgressData type removed: not used outside this hook

interface BackendReadingProgress {
  id: string
  user_id: string
  post_slug: string
  progress: number
  scroll_percentage: number
  last_read_position: number
  word_count: number
  words_read: number
  is_completed: boolean
  last_read_at: string
  created_at: string
  updated_at: string
}

/**
 * 增强版阅读进度Hook - 集成后端API
 *
 * GOLDEN_RULES 1.1: 认证通过 HttpOnly Cookie 处理，不再检查 localStorage token
 *
 * 功能：
 * 1. 自动从后端加载上次阅读进度
 * 2. 自动保存阅读进度到后端（防抖）
 * 3. 恢复上次阅读位置
 * 4. 追踪阅读时间和完成状态
 */
export function useReadingProgressWithApi(options: ReadingProgressOptions) {
  const {
    postSlug,
    root = null,
    threshold = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    debounceMs = 100,
    autoSaveMs = 2000, // 每2秒自动保存一次
    enabled = true,
  } = options
  // Use threshold to silence TS6133 for unused option
  void threshold

  const [progress, setProgress] = useState(0)
  const [scrollPercentage, setScrollPercentage] = useState(0)
  const [isReading, setIsReading] = useState(false)
  const [readingTime, setReadingTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastReadPosition, setLastReadPosition] = useState(0)
  const [error, setError] = useState<string | undefined>()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 计时器引用
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 检查用户是否已登录 - 优先复用全局认证状态，仅在未初始化时兜底请求
  useEffect(() => {
    const { isInitialized, isAuthenticated: authFromStore } = useAuthStore.getState()

    if (isInitialized) {
      setIsAuthenticated(authFromStore)
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    // 兜底：在全局认证未初始化前，尝试调用一次 /auth/me
    // 401 表示未登录，属于正常情况
    api
      .get('/api/v1/auth/me', { cache: false })
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
  }, [])

  // 加载已保存的阅读进度
  useEffect(() => {
    if (!enabled || !isAuthenticated || !postSlug) {
      setIsLoading(false)
      return
    }

    const loadProgress = async () => {
      try {
        setIsLoading(true)
        const response = await api.get<BackendReadingProgress>(
          `/api/v1/posts/${encodeURIComponent(postSlug)}/reading-progress`,
          { cache: false }
        )

        if (response.data) {
          const savedProgress = response.data
          // 恢复滚动位置
          if (savedProgress.last_read_position > 0) {
            window.scrollTo({
              top: savedProgress.last_read_position,
              behavior: 'instant', // 立即跳转，不要动画
            })
            setLastReadPosition(savedProgress.last_read_position)
          }
          setProgress(savedProgress.progress / 100)
          setScrollPercentage(savedProgress.scroll_percentage)
        }
      } catch (err) {
        // 401错误表示未登录，这是正常的，不显示错误
        if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode !== 401) {
          setError('加载阅读进度失败')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [enabled, isAuthenticated, postSlug])

  // 保存阅读进度到后端
  const saveProgress = useCallback(
    async (currentProgress: number, currentScrollPercentage: number, currentPosition: number) => {
      if (!enabled || !isAuthenticated || !postSlug) return

      try {
        setIsSaving(true)
        setError(undefined)

        await api.post(
          `/api/v1/posts/${encodeURIComponent(postSlug)}/reading-progress`,
          {
            progress: Math.round(currentProgress * 100),
            scroll_percentage: currentScrollPercentage,
            last_read_position: currentPosition,
            words_read: Math.round(currentProgress * 1000), // 估算：假设文章1000字
          },
          { cache: false }
        )
      } catch (err) {
        // 静默失败：401（未登录）静默，网络错误（无 statusCode）静默，其他服务端错误打 warn
        if (err instanceof AppError && err.statusCode === 401) {
          return // 未登录，静默忽略
        }
        if (err instanceof AppError) {
          console.warn('Failed to save reading progress:', err.message)
        }
        // 网络错误（TypeError: Failed to fetch 等）静默，不打扰用户
      } finally {
        setIsSaving(false)
      }
    },
    [enabled, isAuthenticated, postSlug]
  )

  // 防抖函数
  const debounce = useCallback((func: (...args: unknown[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])

  // 计算阅读进度
  const calculateProgress = useCallback(() => {
    if (!root) return { progress: 0, scrollPercentage: 0, position: 0 }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = root.scrollHeight - root.clientHeight

    if (scrollHeight <= 0) return { progress: 0, scrollPercentage: 0, position: scrollTop }

    const calculatedProgress = Math.min(scrollTop / scrollHeight, 1)
    return {
      progress: calculatedProgress,
      scrollPercentage: calculatedProgress,
      position: scrollTop,
    }
  }, [root])

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    const {
      progress: newProgress,
      scrollPercentage: newScrollPercentage,
      position: newPosition,
    } = calculateProgress()

    setProgress(newProgress)
    setScrollPercentage(newScrollPercentage)

    // 检查是否滚动到底部
    if (newProgress >= 0.95 && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    } else if (newProgress < 0.95 && hasScrolledToBottom) {
      setHasScrolledToBottom(false)
    }

    return { newProgress, newScrollPercentage, newPosition }
  }, [calculateProgress, hasScrolledToBottom])

  // 监听滚动事件
  useEffect(() => {
    if (!enabled) return undefined

    const debouncedHandleScroll = debounce(handleScroll, debounceMs)

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll)
    }
  }, [handleScroll, debounceMs, enabled, debounce])

  // 自动保存进度
  useEffect(() => {
    if (!enabled || !isAuthenticated) return undefined

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    // 设置新的自动保存定时器
    autoSaveTimerRef.current = setInterval(() => {
      const { newProgress, newScrollPercentage, newPosition } = handleScroll()
      saveProgress(newProgress, newScrollPercentage, newPosition)
    }, autoSaveMs)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [enabled, isAuthenticated, autoSaveMs, handleScroll, saveProgress])

  // 页面卸载时保存进度
  useEffect(() => {
    const handleBeforeUnload = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentProgress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0

      // 使用 sendBeacon 确保在页面卸载时发送请求
      if (enabled && isAuthenticated && postSlug && currentProgress > 0) {
        const data = JSON.stringify({
          progress: Math.round(currentProgress * 100),
          scroll_percentage: currentProgress,
          last_read_position: scrollTop,
          words_read: Math.round(currentProgress * 1000),
        })

        navigator.sendBeacon(
          `/api/v1/posts/${encodeURIComponent(postSlug)}/reading-progress`,
          new Blob([data], { type: 'application/json' })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, isAuthenticated, postSlug])

  // 检测用户是否在阅读
  useEffect(() => {
    const checkIfReading = () => {
      const isCurrentlyReading = progress > 0 && progress < 0.95

      if (isCurrentlyReading && !isReading) {
        // 开始阅读
        setIsReading(true)
        readingTimerRef.current = setInterval(() => {
          setReadingTime((prev) => prev + 1)
        }, 1000)
      } else if (!isCurrentlyReading && isReading) {
        // 停止阅读
        setIsReading(false)
        if (readingTimerRef.current) {
          clearInterval(readingTimerRef.current)
        }
      }
    }

    const interval = setInterval(checkIfReading, 500)

    return () => {
      clearInterval(interval)
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current)
      }
    }
  }, [progress, isReading])

  // 总时间计时
  useEffect(() => {
    totalTimerRef.current = setInterval(() => {
      setTotalTime((prev) => prev + 1)
    }, 1000)

    return () => {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current)
      }
    }
  }, [])

  return {
    progress,
    scrollPercentage,
    isReading,
    readingTime,
    totalTime,
    hasScrolledToBottom,
    isLoading,
    isSaving,
    lastReadPosition,
    error,
    isAuthenticated,
  }
}
