'use client'

import type { ImageProps } from 'next/image'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

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
  fallbackSrc = '/images/default-cover.svg',
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

  // 生成默认的模糊占位符（使用浏览器兼容的 base64 编码）
  const generateDefaultBlurDataURL = () => {
    if (blurDataURL) return blurDataURL

    const svgString = `<svg width="${props.width || 400}" height="${props.height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect width="100%" height="100%" fill="url(#gradient)"/>
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f9fafb;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>`

    // 使用浏览器兼容的 base64 编码
    // SVG 字符串只包含 ASCII 字符，可以直接使用 btoa()
    try {
      const base64 = btoa(svgString)
      return `data:image/svg+xml;base64,${base64}`
    } catch (_error) {
      // 如果 base64 编码失败（理论上不应该发生），回退到 URL 编码的 data URL
      return `data:image/svg+xml,${encodeURIComponent(svgString)}`
    }
  }

  const defaultBlurDataURL = generateDefaultBlurDataURL()

  // 处理图片加载错误
  const handleError = () => {
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true)
      setCurrentSrc(fallbackSrc)
    }
  }

  // 使用 Intersection Observer 实现懒加载
  useEffect(() => {
  if (!lazy || priority) { return null; }

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

// generateSrcSet removed: unused helper

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* 加载占位符 */}
      {isLoading && <div className="absolute inset-0 animate-pulse bg-[var(--surface-subtle)]" />}

      {/* 主图片 */}
      <Image
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${hasError ? 'grayscale' : ''} `}
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
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-subtle)]">
          <span className="text-sm text-[var(--text-tertiary)]">图片加载失败</span>
        </div>
      )}
    </div>
  )
}
