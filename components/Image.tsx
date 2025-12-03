'use client'

import { memo, useState, useEffect } from 'react'
import NextImage, { ImageProps } from 'next/image'
import { ImageSkeleton } from '@/components/loaders'
import { preloadImage } from '@/lib/utils/image-optimization'

interface EnhancedImageProps extends ImageProps {
  priority?: boolean
  blurDataURL?: string
}

const Image = memo(function Image({
  src,
  priority = false,
  blurDataURL,
  ...rest
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  // 将 src 转换为字符串用于预加载（如果需要）
  // Next.js 会自动处理 basePath，不需要手动添加
  // StaticImport 可能是 StaticImageData (有 src 属性) 或 StaticRequire (有 default 属性)
  const imageSrcString = typeof src === 'string' 
    ? src 
    : 'src' in src 
      ? src.src 
      : src.default?.src || ''

  // 预加载关键图片
  useEffect(() => {
    if (priority && typeof window !== 'undefined' && imageSrcString) {
      preloadImage(imageSrcString).catch(() => {
        // 预加载失败不影响正常显示
      })
    }
  }, [priority, imageSrcString])

  if (hasError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">图片加载失败</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0">
          {blurDataURL ? (
            <NextImage
              src={blurDataURL}
              alt=""
              fill
              className="blur-sm"
              aria-hidden="true"
            />
          ) : (
            <ImageSkeleton
              className="h-full w-full"
              aspectRatio={
                rest.width && rest.height ? `${rest.width}/${rest.height}` : undefined
              }
              showSpinner={true}
            />
          )}
        </div>
      )}
      <NextImage
        src={src}
        {...rest}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
      />
    </div>
  )
})

Image.displayName = 'Image'

export default Image
