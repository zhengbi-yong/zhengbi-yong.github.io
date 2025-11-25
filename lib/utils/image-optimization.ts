/**
 * 图片优化工具函数
 * 提供图片格式检测、响应式尺寸生成和预加载功能
 */

/**
 * 检测浏览器支持的图片格式
 * @returns 支持的图片格式：'avif' | 'webp' | 'jpeg'
 */
export function getSupportedImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'jpeg'

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif'
  }
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp'
  }
  return 'jpeg'
}

/**
 * 生成响应式图片尺寸
 * @param baseWidth 基础宽度
 * @param aspectRatio 宽高比，默认 16/9
 * @returns 响应式尺寸数组（从小到大排序）
 */
export function generateResponsiveSizes(
  baseWidth: number,
  aspectRatio: number = 16 / 9
): number[] {
  const sizes = [baseWidth]
  let current = baseWidth

  while (current > 640) {
    current = Math.floor(current / 1.5)
    sizes.push(current)
  }

  return sizes.sort((a, b) => a - b)
}

/**
 * 预加载图片
 * @param src 图片源地址
 * @returns Promise，加载成功时 resolve，失败时 reject
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

