/**
 * 艺术感文章卡片
 * - 悬停时图片轻微放大（105%）
 * - 标题使用衬线字体
 * - 极简的元信息展示
 * - 优雅的阴影过渡
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_COVER_IMAGE } from '@/lib/utils/default-image'

interface Article {
  slug: string
  title: string
  summary: string
  coverImage?: string
  date: string
  readTime: number
  tags?: string[]
}

interface ArtisticArticleCardProps {
  article: Article
  className?: string
}

export function ArtisticArticleCard({ article, className = '' }: ArtisticArticleCardProps) {
  return (
    <motion.article
      className={cn(
        'group rounded-[var(--radius-panel)] overflow-hidden',
        'bg-[var(--surface-elevated)]',
        'shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)]',
        'transition-all duration-[var(--motion-base)] ease-visitor',
        'border border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
        className
      )}
      whileHover={{ y: -8 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* 封面图 */}
      <Link href={`/blog/${article.slug}`} className="block overflow-hidden">
        <motion.div
          className="relative h-64 w-full bg-[var(--surface-muted)]"
          whileHover={{ scale: 1.05 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <Image
            src={article.coverImage || DEFAULT_COVER_IMAGE}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </motion.div>
      </Link>

      {/* 内容区域 */}
      <div className="space-y-4 p-6">
        {/* 标题 - 衬线字体 */}
        <Link href={`/blog/${article.slug}`}>
          <h3 className="font-visitor-serif line-clamp-2 text-2xl font-semibold text-[var(--text-primary)] transition-colors duration-[var(--motion-fast)] group-hover:text-[var(--brand-color)]">
            {article.title}
          </h3>
        </Link>

        {/* 摘要 */}
        <p className="text-visitor-base line-clamp-3 text-[var(--text-soft)]">
          {article.summary}
        </p>

        {/* 元信息 - 极简 */}
        <div className="flex items-center gap-4 pt-2 text-sm text-[var(--text-soft)]">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <time>{new Date(article.date).toLocaleDateString('zh-CN')}</time>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{article.readTime} min read</span>
          </span>
        </div>

        {/* 标签 */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="visitor-tag text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  )
}

/**
 * 紧凑型文章卡片（用于列表）
 */
export function CompactArticleCard({ article, className = '' }: ArtisticArticleCardProps) {
  return (
    <motion.article
      className={cn(
        'group flex gap-4 p-4',
        'rounded-[var(--radius-panel)]',
        'bg-[var(--surface-elevated)]',
        'shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)]',
        'transition-all duration-[var(--motion-base)] ease-visitor',
        'border border-[var(--border-subtle)] hover:border-[var(--border-strong)]',
        className
      )}
      whileHover={{ x: 4 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* 封面图缩略图 */}
      <Link
        href={`/blog/${article.slug}`}
        className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-[calc(var(--radius-panel)-8px)]"
      >
        <motion.div
          className="relative w-full h-full bg-[var(--surface-muted)]"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={article.coverImage || DEFAULT_COVER_IMAGE}
            alt={article.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        </motion.div>
      </Link>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* 标题 */}
          <Link href={`/blog/${article.slug}`}>
            <h3 className="font-visitor-serif line-clamp-2 text-lg font-semibold text-[var(--text-primary)] transition-colors duration-[var(--motion-fast)] group-hover:text-[var(--brand-color)]">
              {article.title}
            </h3>
          </Link>

          {/* 摘要 */}
          <p className="mt-1 line-clamp-2 text-sm text-[var(--text-soft)]">
            {article.summary}
          </p>
        </div>

        {/* 元信息 */}
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-soft)]">
          <time>{new Date(article.date).toLocaleDateString('zh-CN')}</time>
          <span>·</span>
          <span>{article.readTime} min read</span>
        </div>
      </div>
    </motion.article>
  )
}
