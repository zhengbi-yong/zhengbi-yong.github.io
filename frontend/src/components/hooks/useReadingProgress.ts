import { useState, useEffect, useCallback, useRef } from 'react'

interface ReadingProgressOptions {
  root?: Element | null
  threshold?: number[]
  debounceMs?: number
}

// ReadingProgressData type removed: not used outside this hook

export function useReadingProgress(options: ReadingProgressOptions = {}) {
  const {
    root = null,
    threshold: _threshold = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    debounceMs = 100,
  } = options
  // threshold is unused in logic; keep underscore-named alias
  void _threshold

  const [progress, setProgress] = useState(0)
  const [isReading, setIsReading] = useState(false)
  const [readingTime, setReadingTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  // 计时器引用
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 防抖函数
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])

  // 计算阅读进度
  const calculateProgress = useCallback(() => {
    if (!root) return 0

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = root.scrollHeight - root.clientHeight

    if (scrollHeight <= 0) return 0

    const calculatedProgress = Math.min(scrollTop / scrollHeight, 1)
    return calculatedProgress
  }, [root])

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    const newProgress = calculateProgress()

    setProgress(newProgress)

    // 检查是否滚动到底部
    if (newProgress >= 0.95 && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    } else if (newProgress < 0.95 && hasScrolledToBottom) {
      setHasScrolledToBottom(false)
    }
  }, [calculateProgress, hasScrolledToBottom])

  // 监听滚动事件
  useEffect(() => {
    const debouncedHandleScroll = debounce(handleScroll, debounceMs)

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll)
    }
  }, [handleScroll, debounceMs])

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
    isReading,
    readingTime,
    totalTime,
    hasScrolledToBottom,
  }
}
