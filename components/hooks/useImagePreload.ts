import { useEffect, useState } from 'react'

interface UseImagePreloadReturn {
  isLoaded: boolean
  hasError: boolean
  preloadImage: (src: string) => void
}

export function useImagePreload(): UseImagePreloadReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const preloadImage = (src: string) => {
    setIsLoaded(false)
    setHasError(false)

    const img = new Image()
    img.src = src

    img.onload = () => {
      setIsLoaded(true)
    }

    img.onerror = () => {
      setHasError(true)
    }
  }

  return {
    isLoaded,
    hasError,
    preloadImage,
  }
}

// 批量预加载图片
export function useBatchImagePreload(srcs: string[]): { allLoaded: boolean; hasErrors: boolean } {
  const [allLoaded, setAllLoaded] = useState(false)
  const [hasErrors, setHasErrors] = useState(false)

  useEffect(() => {
    if (srcs.length === 0) {
      setAllLoaded(true)
      return
    }

    let loadedCount = 0
    let errorCount = 0
    const total = srcs.length

    const updateStatus = () => {
      setAllLoaded(loadedCount === total - errorCount && errorCount === 0)
      setHasErrors(errorCount > 0)
    }

    srcs.forEach((src) => {
      const img = new Image()
      img.src = src

      img.onload = () => {
        loadedCount++
        updateStatus()
      }

      img.onerror = () => {
        errorCount++
        updateStatus()
      }
    })
  }, [srcs])

  return { allLoaded, hasErrors }
}