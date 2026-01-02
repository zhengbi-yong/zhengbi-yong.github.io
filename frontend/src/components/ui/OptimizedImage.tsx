// @ts-nocheck
'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  alt: string // 强制要求 alt 属性
  fallbackSrc?: string
  wrapperClassName?: string
}

export function OptimizedImage({
  alt,
  fallbackSrc = '/images/placeholder.png',
  wrapperClassName,
  className,
  onError,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(props.src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
      setHasError(true)
    }
    // Not calling onError callback as we don't have a synthetic event
  }

  return (
    <div className={cn('relative overflow-hidden', wrapperClassName)}>
      {isLoading && <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />}

      <Image
        {...props}
        src={imgSrc}
        alt={alt} // 强制要求 alt 文本
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl grayscale' : 'blur-0 scale-100 grayscale-0',
          className
        )}
        onError={handleError}
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={85}
        priority={props.priority}
      />

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">Image not available</span>
        </div>
      )}
    </div>
  )
}

// 类型安全的图片组件，强制要求 alt 属性
export function AccessibleImage(props: OptimizedImageProps) {
  if (!props.alt) {
    logger.warn('AccessibleImage: alt prop is required for accessibility')
    return <OptimizedImage {...props} alt="Image" />
  }
  return <OptimizedImage {...props} />
}
