'use client'

import { useMemo } from 'react'
import { ContentItem, CardSize } from './MasonryGrid'
import BookCard from './BookCard'
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
 * - article → ArticleInline (内联渲染)
 * - chapter → ChapterCard
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
        return (
          <div
            onClick={() => onClick?.(content)}
            className={`cursor-pointer rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-raised)] ${className}`}
          >
            {content.image && (
              <div className="mb-3 overflow-hidden rounded-lg">
                <img
                  src={content.image}
                  alt={content.title}
                  className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            )}
            <h3 className="mb-2 text-base font-bold text-[var(--text-primary)] line-clamp-2">
              {content.title}
            </h3>
            {content.summary && (
              <p className="text-sm text-[var(--text-soft)] line-clamp-2">
                {content.summary}
              </p>
            )}
            {content.tags && content.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {content.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-xs text-[var(--text-soft)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )

      case 'chapter':
        return (
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
        )

      default:
        return (
          <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-8 text-center shadow-[var(--shadow-soft)]">
            <p className="text-sm text-[var(--text-soft)]">
              未知内容类型: {content.type}
            </p>
          </div>
        )
    }
  }

  return <>{renderCard()}</>
}
