'use client'

import { useMemo } from 'react'
import { ContentItem, CardSize } from './MasonryGrid'
import BookCard from './BookCard'
import ArticleCard from './ArticleCard'
import ChapterCard from './ChapterCard'

/**
 * SmartCard 组件属性
 */
interface SmartCardProps {
  content: ContentItem
  size?: CardSize
  index?: number
  onClick?: (item: ContentItem) => void
  className?: string
}

/**
 * SmartCard - 智能卡片组件
 *
 * 根据内容类型自动渲染对应的卡片组件
 * - book → BookCard
 * - article → ArticleCard
 * - chapter → ArticleCard (复用)
 */
export default function SmartCard({
  content,
  size = 'small',
  index = 0,
  onClick,
  className = '',
}: SmartCardProps) {
  // Consume index to avoid TS6133 when not strictly needed
  void index
  // 使用 useMemo 缓存卡片类型判断
  const cardType = useMemo(() => {
    if (content.type === 'book') return 'book'
    if (content.type === 'article') return 'article'
    if (content.type === 'chapter') return 'chapter'
    return 'unknown'
  }, [content.type])

  // 渲染对应的卡片组件
  const renderCard = () => {
    switch (cardType) {
      case 'book':
        return (
          <BookCard
            book={{
              id: content.id,
              name: content.title,
              description: content.summary,
              image: content.image || '',
              slug: content.slug,
              tags: content.tags || [],
              featured: content.featured,
            }}
            size={size}
            onClick={() => onClick?.(content)}
            className={className}
          />
        )

      case 'article':
      case 'chapter':
        return content.type === 'chapter' ? (
          <ChapterCard
            chapter={{
              id: content.id,
              title: content.title,
              summary: content.summary,
              date: content.date,
              slug: content.slug,
              chapterNumber: parseInt(content.id.split('-')[1] || '1'),
            }}
            compact={size === 'small'}
            className={className}
          />
        ) : (
          <ArticleCard
            article={{
              title: content.title,
              summary: content.summary,
              date: content.date || '',
              tags: content.tags,
              image: content.image,
              slug: content.slug,
            }}
            layout="vertical"
            className={className}
          />
        )

      default:
        return (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              未知内容类型: {content.type}
            </p>
          </div>
        )
    }
  }

  return <>{renderCard()}</>
}
