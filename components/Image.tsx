'use client'

import { memo, useState } from 'react'
import NextImage, { ImageProps } from 'next/image'
import { ImageSkeleton } from '@/components/loaders'

const basePath = process.env.BASE_PATH

const Image = memo(function Image({ src, ...rest }: ImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

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
          <ImageSkeleton
            className="h-full w-full"
            aspectRatio={rest.width && rest.height ? `${rest.width}/${rest.height}` : undefined}
            showSpinner={true}
          />
        </div>
      )}
      <NextImage
        src={`${basePath || ''}${src}`}
        {...rest}
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
