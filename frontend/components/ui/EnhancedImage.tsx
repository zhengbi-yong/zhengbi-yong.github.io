'use client'

import Image from 'next/image'
import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/components/lib/utils'

interface EnhancedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fill?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
  fallback?: string // Fallback image for unsupported formats
  webpSrc?: string // WebP version of the image
  avifSrc?: string // AVIF version of the image
}

export function EnhancedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  fill,
  onLoad,
  onError,
  fallback,
  webpSrc,
  avifSrc,
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  // Generate blur data URL if not provided
  const generateBlurDataURL = useCallback(() => {
    if (blurDataURL) return blurDataURL

    // Generate a simple blur placeholder
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    canvas.width = width || 100
    canvas.height = height || 100

    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    return canvas.toDataURL()
  }, [blurDataURL, width, height])

  // Handle load success
  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  // Handle load error
  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      logger.error('Image loading error:', event)
      setHasError(true)
      setIsLoading(false)

      // Try fallback image if available
      if (fallback && currentSrc !== fallback) {
        setCurrentSrc(fallback)
        setHasError(false)
      } else {
        // Create a generic Error object for the onError callback
        const error = new Error('Image failed to load')
        onError?.(error)
      }
    },
    [onError, fallback, currentSrc]
  )

  // Generate srcSet for different formats
  const generateSrcSet = useCallback(() => {
    const srcSet: string[] = []

    // AVIF (best compression, but less support)
    if (avifSrc) {
      srcSet.push(`${avifSrc} 1w`)
      if (width && width > 400) {
        srcSet.push(`${avifSrc}?w=400 400w`)
      }
      if (width && width > 800) {
        srcSet.push(`${avifSrc}?w=800 800w`)
      }
    }

    // WebP (good compression, better support)
    if (webpSrc) {
      srcSet.push(`${webpSrc} 1w`)
      if (width && width > 400) {
        srcSet.push(`${webpSrc}?w=400 400w`)
      }
      if (width && width > 800) {
        srcSet.push(`${webpSrc}?w=800 800w`)
      }
    }

    // Original format
    srcSet.push(`${currentSrc} 1w`)
    if (width && width > 400) {
      srcSet.push(`${currentSrc}?w=400 400w`)
    }
    if (width && width > 800) {
      srcSet.push(`${currentSrc}?w=800 800w`)
    }

    return srcSet.join(', ')
  }, [avifSrc, webpSrc, currentSrc, width])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Error state */}
      {hasError ? (
        <div
          className="flex items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          style={{ width, height }}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      ) : (
        <picture>
          {/* AVIF source */}
          {avifSrc && <source srcSet={generateSrcSet()} type="image/avif" />}

          {/* WebP source */}
          {webpSrc && <source srcSet={generateSrcSet()} type="image/webp" />}

          {/* Fallback image */}
          <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={generateBlurDataURL()}
            fill={fill}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      )}

      {/* Loading placeholder */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-pulse">
            <div
              className="rounded bg-gray-300 dark:bg-gray-600"
              style={{ width: width || '100%', height: height || '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for responsive images
export function ResponsiveImage({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  ...props
}: Omit<EnhancedImageProps, 'width' | 'height'> & {
  aspectRatio?: 'auto' | 'square' | 'video' | '16/9' | '4/3' | '3/2' | '1/1'
}) {
  const aspectClasses = {
    auto: '',
    square: 'aspect-square',
    video: 'aspect-video',
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '1/1': 'aspect-square',
  }

  return (
    <div className={cn('w-full', aspectClasses[aspectRatio], className)}>
      <EnhancedImage
        src={src}
        alt={alt}
        width={undefined}
        height={undefined}
        fill
        className="object-cover"
        {...props}
      />
    </div>
  )
}

// Lazy load wrapper for images below the fold
export function LazyImage(props: EnhancedImageProps) {
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before it comes into view
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={props.className}>
      {isInView && <EnhancedImage {...props} />}
    </div>
  )
}

// Optimized hero image component
export function HeroImage({
  src,
  alt,
  priority = true,
  className = '',
}: Pick<EnhancedImageProps, 'src' | 'alt' | 'priority' | 'className'>) {
  return (
    <EnhancedImage
      src={src}
      alt={alt}
      priority={priority}
      quality={90}
      sizes="100vw"
      className={cn('h-full w-full object-cover', className)}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"
    />
  )
}
