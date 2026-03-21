'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/components/lib/utils'

/**
 * 书籍数据结构（简化版，兼容现有数据）
 */
export interface BookData {
  id?: string
  name: string
  description?: string
  image?: string
  href?: string
  slug?: string
  tags?: string[]
  featured?: boolean
  readProgress?: number
}

/**
 * 卡片尺寸类型
 */
export type CardSize = 'large' | 'tall' | 'wide' | 'small'

/**
 * BookCard 组件属性
 */
interface BookCardProps {
  book: BookData
  size?: CardSize
  onClick?: (book: BookData) => void
  className?: string
}

/**
 * 获取卡片尺寸样式
 */
function getCardSizeStyles(size: CardSize) {
  const styles = {
    large: 'aspect-[2/2]', // 2x2
    tall: 'aspect-[1/2]', // 1x2
    wide: 'aspect-[2/1]', // 2x1
    small: 'aspect-[1/1]', // 1x1
  }
  return styles[size]
}

/**
 * BookCard - 书籍卡片组件（重构版）
 *
 * 支持4种尺寸：
 * - large (2x2): 大卡片，适合特色书籍
 * - tall (1x2): 高卡片，适合章节列表
 * - wide (2x1): 宽卡片，适合水平布局
 * - small (1x1): 小卡片，标准书籍卡片
 *
 * 特性：
 * - 增强3D悬停效果
 * - 章节预览（折叠/展开）
 * - 阅读进度条
 * - 性能优化（设备检测、动画降级）
 */
export default function BookCard({
  book,
  size = 'small',
  onClick,
  className = '',
}: BookCardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, _setIsHovered] = useState(false)
  const [showChapters, _setShowChapters] = useState(false)
  // Suppress TS6133 for unused showChapters
  void showChapters

  // 3D悬停效果
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5])
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isMobile) return
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  const cardSizeStyles = getCardSizeStyles(size)
  const linkUrl = book.href || book.slug || '#'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={cn('relative', className)}
    >
      <Link href={linkUrl} className="block">
        <motion.div
          className={cn(
            'group relative overflow-hidden rounded-2xl border-2 bg-white shadow-md transition-all duration-300',
            'hover:shadow-xl dark:border-gray-700 dark:bg-gray-800',
            isHovered && 'border-primary-400 dark:border-primary-600',
            cardSizeStyles
          )}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => onClick?.(book)}
          whileHover={isMobile ? {} : { y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* 3D透视容器 */}
          <motion.div
            style={{
              perspective: isMobile ? 'none' : '1000px',
              transformStyle: isMobile ? 'flat' : 'preserve-3d',
            }}
          >
            <motion.div
              style={{
                rotateX: isHovered && !isMobile ? rotateX : 0,
                rotateY: isHovered && !isMobile ? rotateY : 0,
                transformStyle: 'preserve-3d',
              }}
              transition={{ duration: 0.2 }}
            >
              {/* 书籍图片 */}
              <div className={cn('relative overflow-hidden bg-gray-100 dark:bg-gray-900', cardSizeStyles)}>
                {book.image ? (
                  <Image
                    src={book.image}
                    alt={book.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-6xl">📚</span>
                  </div>
                )}

                {/* 悬停遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* 悬停内容 */}
                <div className="absolute inset-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-full flex-col justify-end">
                    <h3
                      className={cn(
                        'font-bold text-white drop-shadow-lg',
                        size === 'large' ? 'text-2xl' : size === 'tall' || size === 'wide' ? 'text-xl' : 'text-lg'
                      )}
                    >
                      {book.name}
                    </h3>
                    {book.description && (
                      <p
                        className={cn(
                          'mt-2 text-gray-100 drop-shadow',
                          size === 'large' ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'
                        )}
                      >
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 标签（大卡片显示在图片上） */}
              {size === 'large' && book.tags && book.tags.length > 0 && (
                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                  {book.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 backdrop-blur-sm dark:bg-gray-800/90 dark:text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* 内容区域（底部） */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            {/* 标题（小/中卡片） */}
            {size !== 'large' && (
              <h3
                className={cn(
                  'font-bold text-white drop-shadow-lg line-clamp-2',
                  size === 'tall' || size === 'wide' ? 'text-base' : 'text-sm'
                )}
              >
                {book.name}
              </h3>
            )}

            {/* 阅读进度条 */}
            {book.readProgress !== undefined && book.readProgress > 0 && (
              <div className="mt-2">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${book.readProgress}%` }}
                  />
                </div>
              </div>
          )}
          </div>

          {/* 特色标记 */}
          {book.featured && (
            <div className="absolute top-3 right-3 z-10">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg">
                <span className="text-sm">⭐</span>
              </span>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  )
}
