'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * 内容项数据结构
 */
export interface ContentItem {
  id: string
  type: 'book' | 'article' | 'chapter'
  title: string
  summary?: string
  date?: string
  tags?: string[]
  image?: string
  slug: string
  featured?: boolean
}

/**
 * 卡片尺寸类型
 */
export type CardSize = 'large' | 'tall' | 'wide' | 'small'

/**
 * MasonryCell 组件属性
 */
interface MasonryCellProps {
  item: ContentItem
  size: CardSize
  index: number
  onClick?: (item: ContentItem) => void
}

/**
 * MasonryGrid 组件属性
 */
interface MasonryGridProps {
  items: ContentItem[]
  columnCount?: number
  onItemClick?: (item: ContentItem) => void
}

/**
 * 获取卡片尺寸类名
 */
function getCardSizeClasses(size: CardSize): string {
  const sizeMap = {
    large: 'col-span-2 row-span-2', // 2x2
    tall: 'col-span-1 row-span-2', // 1x2
    wide: 'col-span-2 row-span-1', // 2x1
    small: 'col-span-1 row-span-1', // 1x1
  }
  return sizeMap[size]
}

/**
 * 智能计算卡片尺寸
 * 基于内容重要性：大20%、高30%、宽20%、小30%
 */
function calculateCardSize(item: ContentItem, index: number): CardSize {
  // 特色项目为大卡片
  if (item.featured) return 'large'

  // 基于索引的分布算法
  const pattern = ['large', 'tall', 'small', 'wide', 'tall', 'small', 'tall', 'small', 'wide', 'small']
  return pattern[index % pattern.length] as CardSize
}

/**
 * MasonryCell - 单个网格单元格
 */
function MasonryCell({ item, size, index, onClick }: MasonryCellProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = getCardSizeClasses(size)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`${sizeClasses} relative`}
      onClick={() => onClick?.(item)}
    >
      <div
        className={`
          group relative h-full w-full overflow-hidden rounded-2xl
          border-2 bg-white shadow-md transition-all duration-300
          hover:shadow-xl dark:border-gray-700 dark:bg-gray-800
          ${isHovered ? 'border-primary-400 dark:border-primary-600' : 'border-gray-200'}
          cursor-pointer
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 图片 */}
        {item.image && (
          <div
            className={`
            relative overflow-hidden bg-gray-100 dark:bg-gray-900
            ${size === 'tall' ? 'aspect-[3/8]' : size === 'large' ? 'aspect-square' : size === 'wide' ? 'aspect-[2/1]' : 'aspect-[3/4]'}
          `}
          >
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />

            {/* 悬停遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}

        {/* 内容覆盖层 */}
        <div
          className={`
          absolute inset-0 p-4 transition-all duration-300
          ${size === 'small' ? 'bottom-0' : 'bottom-0 left-0 right-0'}
          ${isHovered ? 'translate-y-0' : size === 'small' ? 'translate-y-2' : 'translate-y-4'}
        `}
        >
          {/* 标签 */}
          {item.tags && item.tags.length > 0 && size !== 'small' && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {item.tags.slice(0, size === 'large' ? 4 : 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-900 backdrop-blur-sm dark:bg-gray-800/90 dark:text-white sm:text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <h3
            className={`
            font-bold text-white drop-shadow-lg
            ${size === 'large' ? 'text-xl sm:text-2xl' : size === 'tall' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}
            line-clamp-${size === 'large' ? '3' : '2'}
          `}
          >
            {item.title}
          </h3>

          {/* 摘要（仅大卡片显示） */}
          {item.summary && size === 'large' && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-100 drop-shadow sm:text-sm">
              {item.summary}
            </p>
          )}

          {/* 日期（小卡片不显示） */}
          {item.date && size !== 'small' && (
            <div className="mt-2 text-[10px] text-gray-200 drop-shadow sm:text-xs">
              {new Date(item.date).toLocaleDateString('zh-CN')}
            </div>
          )}
        </div>

        {/* 类型指示器 */}
        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
          <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
            {item.type === 'book' ? '📚' : item.type === 'article' ? '📄' : '📖'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * MasonryGrid - 瀑布流网格组件
 *
 * 支持4种卡片尺寸（large/tall/wide/small）
 * 响应式列数：移动端1列，平板2列，桌面3列，大屏4列
 */
export default function MasonryGrid({
  items,
  columnCount = 3,
  onItemClick,
}: MasonryGridProps) {
  const [visibleItems, setVisibleItems] = useState<ContentItem[]>([])
  const [page, setPage] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 计算每个项目的尺寸
  const itemsWithSizes = items.map((item, index) => ({
    item,
    size: calculateCardSize(item, index),
  }))

  // 初始加载
  useEffect(() => {
    setVisibleItems(items.slice(0, 12))
  }, [items])

  // 无限滚动加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItems.length < items.length) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [visibleItems.length, items.length])

  // 加载更多
  useEffect(() => {
    if (page > 1) {
      const start = visibleItems.length
      const end = start + 6
      setVisibleItems((prev) => [...prev, ...items.slice(start, end)])
    }
  }, [page, items])

  return (
    <div className="w-full" data-testid="masonry-grid-container">
      {/* 网格容器 */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleItems.map((item, index) => (
          <MasonryCell
            key={item.id}
            item={item}
            size={calculateCardSize(item, index)}
            index={index}
            onClick={onItemClick}
          />
        ))}
      </div>

      {/* 加载更多指示器 */}
      {visibleItems.length < items.length && (
        <div ref={loadMoreRef} className="py-8 text-center" data-testid="masonry-load-more">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            <span>加载更多内容...</span>
          </div>
        </div>
      )}
    </div>
  )
}
