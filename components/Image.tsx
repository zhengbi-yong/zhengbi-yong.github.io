'use client'

import { memo, useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
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
  const imageSrcString =
    typeof src === 'string' ? src : 'src' in src ? src.src : src.default?.src || ''

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

  // 检查是否使用 fill 属性
  const isFill = rest.fill === true
  // 检查是否通过 CSS 修改了尺寸（有 width 或 height 但可能被 CSS 覆盖）
  const hasExplicitDimensions = rest.width && rest.height
  const className = rest.className || ''
  const hasWidthModifier = className.includes('w-full') || className.includes('w-')
  const hasHeightModifier = className.includes('h-full') || className.includes('h-')

  // 如果使用 fill，确保父容器有高度
  // 如果通过 CSS 修改尺寸，添加 width: "auto" 或 height: "auto" 来保持宽高比
  const imageStyle: CSSProperties = {}
  if (hasExplicitDimensions && !isFill) {
    // 如果同时修改了宽度和高度，设置 width 为 auto 来保持宽高比
    if (hasWidthModifier && hasHeightModifier) {
      imageStyle.width = 'auto'
    }
    // 如果只修改了宽度，设置 height 为 auto
    else if (hasWidthModifier) {
      imageStyle.height = 'auto'
    }
    // 如果只修改了高度，设置 width 为 auto
    else if (hasHeightModifier) {
      imageStyle.width = 'auto'
    }
  }

  return (
    <div className={isFill ? 'relative h-full w-full' : 'relative'}>
      {isLoading && (
        <div className="absolute inset-0">
          {blurDataURL ? (
            <NextImage src={blurDataURL} alt="" fill className="blur-sm" aria-hidden="true" />
          ) : (
            <ImageSkeleton
              className="h-full w-full"
              aspectRatio={rest.width && rest.height ? `${rest.width}/${rest.height}` : undefined}
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
        style={{ ...rest.style, ...imageStyle }}
      />
    </div>
  )
})

Image.displayName = 'Image'

export default Image
