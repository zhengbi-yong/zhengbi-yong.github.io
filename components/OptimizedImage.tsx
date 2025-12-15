'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import type { ImageProps } from 'next/image'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string
  alt: string
  fallbackSrc?: string
  blurDataURL?: string
  lazy?: boolean
  priority?: boolean
  className?: string
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/static/images/placeholder.png',
  blurDataURL,
  lazy = true,
  priority = false,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLDivElement>(null)

  // 生成默认的模糊占位符
  const defaultBlurDataURL = blurDataURL || `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${props.width || 400}" height="${props.height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect width="100%" height="100%" fill="url(#gradient)"/>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f9fafb;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>`
  ).toString('base64')}`

  // 处理图片加载错误
  const handleError = () => {
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true)
      setCurrentSrc(fallbackSrc)
    }
  }

  // 使用 Intersection Observer 实现懒加载
  useEffect(() => {
    if (!lazy || priority) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoading(false)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px',
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority])

  // 生成响应式 srcSet
  const generateSrcSet = (baseSrc: string) => {
    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    return widths
      .map((width) => {
        // 如果是外部 URL，使用图片参数
        if (baseSrc.startsWith('http')) {
          return `${baseSrc}?w=${width} ${width}w`
        }
        // 本地图片由 Next.js 处理
        return null
      })
      .filter(Boolean)
      .join(', ')
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* 加载占位符 */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}

      {/* 主图片 */}
      <Image
        src={currentSrc}
        alt={alt}
        className={`
          transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${hasError ? 'grayscale' : ''}
        `}
        placeholder="blur"
        blurDataURL={defaultBlurDataURL}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        {...props}
      />

      {/* 错误状态提示 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">图片加载失败</span>
        </div>
      )}
    </div>
  )
}