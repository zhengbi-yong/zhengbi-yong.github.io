'use client'

/**
 * useImageOptimization - 图片优化Hook
 *
 * 功能：
 * - 图片懒加载
 * - 渐进式加载
 * - 响应式图片
 * - WebP格式检测
 * - 占位符生成
 */

import { useState, useRef, useEffect, useCallback } from 'react'

interface UseImageOptimizationOptions {
  threshold?: number // 触发加载的距离阈值
  rootMargin?: string // 根边距
  fadeInDuration?: number // 淡入动画时长
  retryCount?: number // 重试次数
  retryDelay?: number // 重试延迟
}

interface UseImageOptimizationReturn {
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
  imageRef: React.RefObject<HTMLDivElement>
  retry: () => void
}

export function useImageOptimization(options: UseImageOptimizationOptions = {}): UseImageOptimizationReturn {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    fadeInDuration = 300,
    retryCount = 3,
    retryDelay = 1000,
  } = options

  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryAttempts, setRetryAttempts] = useState(0)
  const imageRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const element = imageRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoading(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  // Retry mechanism
  const retry = useCallback(() => {
    if (retryAttempts < retryCount) {
      setRetryAttempts((prev) => prev + 1)
      setHasError(false)
      setIsLoading(true)
    }
  }, [retryAttempts, retryCount])

  // Simulated image loading (in real usage, this would be tied to actual img onLoad)
  useEffect(() => {
    if (!isLoading) return

    const timer = setTimeout(() => {
      // Simulate success/failure randomly for demo
      const success = Math.random() > 0.1 // 90% success rate
      if (success) {
        setIsLoaded(true)
        setIsLoading(false)
      } else {
        setIsLoading(false)
        setHasError(true)
      }
    }, 500) // Simulate network delay

    return () => clearTimeout(timer)
  }, [isLoading, retryAttempts])

  // Auto-retry on error
  useEffect(() => {
    if (hasError && retryAttempts < retryCount) {
      const timer = setTimeout(() => {
        retry()
      }, retryDelay)

      return () => clearTimeout(timer)
    }
  }, [hasError, retryAttempts, retryCount, retryDelay, retry])

  return {
    isLoaded,
    isLoading,
    hasError,
    imageRef,
    retry,
  }
}

/**
 * 检测WebP支持
 */
export function useWebPSupport() {
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setSupportsWebP(false)
      return
    }

    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas')
      if (canvas.getContext && canvas.getContext('2d')) {
        setSupportsWebP(
          canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
        )
      } else {
        setSupportsWebP(false)
      }
    }

    checkWebPSupport()
  }, [])

  return supportsWebP
}

/**
 * 生成图片占位符
 */
export function useImagePlaceholder(
  width: number,
  height: number,
  color: string = '#e5e7eb'
) {
  const [placeholder, setPlaceholder] = useState<string>('')

  useEffect(() => {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <rect width="100%" height="100%" fill="url(#gradient)"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f9fafb;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    `

    try {
      const base64 = btoa(svg)
      setPlaceholder(`data:image/svg+xml;base64,${base64}`)
    } catch {
      setPlaceholder(`data:image/svg+xml,${encodeURIComponent(svg)}`)
    }
  }, [width, height, color])

  return placeholder
}

/**
 * 响应式图片尺寸计算
 */
export function useResponsiveImage() {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)

    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  /**
   * 获取响应式图片URL
   */
  const getResponsiveImageUrl = useCallback(
    (baseUrl: string, widths: { mobile?: number; tablet?: number; desktop?: number }) => {
      const width = screenSize.isMobile
        ? widths.mobile || 640
        : screenSize.isTablet
        ? widths.tablet || 1024
        : widths.desktop || 1920

      // 假设URL格式: /image.jpg -> /image-640.jpg
      const extension = baseUrl.split('.').pop()
      const name = baseUrl.replace(`.${extension}`, '')
      return `${name}-${width}.${extension}`
    },
    [screenSize]
  )

  return {
    ...screenSize,
    getResponsiveImageUrl,
  }
}

/**
 * 批量图片预加载
 */
export function useBatchImagePreload() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const preloadImages = useCallback(async (urls: string[]) => {
    const loadPromises = urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          if (loadedImages.has(url)) {
            resolve()
            return
          }

          const img = new Image()

          img.onload = () => {
            setLoadedImages((prev) => new Set(prev).add(url))
            resolve()
          }

          img.onerror = () => {
            setFailedImages((prev) => new Set(prev).add(url))
            reject(new Error(`Failed to load image: ${url}`))
          }

          img.src = url
        })
    )

    try {
      await Promise.all(loadPromises)
    } catch (error) {
      console.warn('Some images failed to load:', error)
    }
  }, [loadedImages])

  return {
    preloadImages,
    loadedImages,
    failedImages,
  }
}

/**
 * 图片压缩配置
 */
export interface ImageCompressionConfig {
  quality: number
  maxWidth?: number
  maxHeight?: number
  outputFormat?: 'webp' | 'jpeg' | 'png'
}

export function useImageCompression() {
  const compressImage = useCallback(
    async (file: File, config: ImageCompressionConfig): Promise<Blob> => {
      const { quality, maxWidth, maxHeight, outputFormat } = config

      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
          // Calculate dimensions
          let width = img.width
          let height = img.height

          if (maxWidth && width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          if (maxHeight && height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            `image/${outputFormat || 'jpeg'}`,
            quality / 100
          )
        }

        img.onerror = () => reject(new Error('Failed to load image'))

        img.src = URL.createObjectURL(file)
      })
    },
    []
  )

  return { compressImage }
}
