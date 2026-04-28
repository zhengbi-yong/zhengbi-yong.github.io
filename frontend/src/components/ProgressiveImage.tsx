'use client'

import { useState, useEffect, useRef } from 'react'
import OptimizedImage from './OptimizedImage'
import { useImagePreload } from './hooks/useImagePreload'

interface ProgressiveImageProps {
  src: string
  alt: string
  previewSrc?: string
  fallbackSrc?: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
}

export default function ProgressiveImage({
  src,
  alt,
  previewSrc,
  fallbackSrc,
  width = 400,
  height = 300,
  priority = false,
  className = '',
}: ProgressiveImageProps) {
  const [imageState, setImageState] = useState<'preview' | 'loading' | 'loaded' | 'error'>(
    'preview'
  )
  const { preloadImage, isLoaded, hasError } = useImagePreload()
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用 Intersection Observer 触发加载
  useEffect(() => {
    if (priority) {
      setImageState('loading')
      preloadImage(src)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imageState === 'preview') {
            setImageState('loading')
            preloadImage(src)
          }
        })
      },
      {
        rootMargin: '100px',
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [src, imageState, priority, preloadImage])

  // 监听图片加载状态
  useEffect(() => {
    if (imageState === 'loading' && isLoaded) {
      setImageState('loaded')
    }
    if (imageState === 'loading' && hasError) {
      setImageState('error')
    }
  }, [imageState, isLoaded, hasError])

  // 生成低质量占位符
  const generatePlaceholder = (src: string) => {
    // 如果是本地图片，返回模糊的小版本
    if (!src.startsWith('http')) {
      return src
    }

    // 外部图片返回低质量版本
    return `${src}?w=50&blur=10&q=30`
  }

  const currentSrc = imageState === 'preview' && previewSrc ? previewSrc : src

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <OptimizedImage
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        fallbackSrc={fallbackSrc}
        blurDataURL={generatePlaceholder(currentSrc)}
        priority={priority}
        className={`transition-all duration-500 ease-out ${imageState === 'preview' ? 'scale-105 blur-sm' : 'blur-0 scale-100'} ${imageState === 'loading' ? 'opacity-75' : 'opacity-100'} `}
      />

      {/* 加载指示器 */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-subtle)]/50">
          <div className="border-primary-600 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}
    </div>
  )
}
