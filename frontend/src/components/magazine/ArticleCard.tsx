'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { DEFAULT_COVER_IMAGE } from '@/lib/utils/default-image'

/**
 * 文章数据结构
 */
interface Article {
  title: string
  summary?: string
  date: string
  readTime?: string
  tags?: string[]
  image?: string
  slug: string
}

/**
 * ArticleCard 组件属性
 */
interface ArticleCardProps {
  article: Article
  layout?: 'horizontal' | 'vertical'
  className?: string
}

/**
 * ArticleCard - 文章卡片组件
 *
 * 支持水平和垂直两种布局
 */
export default function ArticleCard({
  article,
  layout = 'horizontal',
  className = '',
}: ArticleCardProps) {
  const formattedDate = new Date(article.date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isHorizontal = layout === 'horizontal'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-base)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-medium)]',
        isHorizontal && 'md:flex',
        className
      )}
    >
      <Link href={article.slug} className="absolute inset-0 z-10">
        <span className="sr-only">Read {article.title}</span>
      </Link>

      <div className={cn(isHorizontal ? 'md:flex' : '')}>
        {/* 图片区域 */}
        <div
          className={cn(
            'relative overflow-hidden bg-[var(--surface-muted)]',
            isHorizontal ? 'md:w-2/5' : 'aspect-[16/9]'
          )}
        >
          <Image
            src={article.image || DEFAULT_COVER_IMAGE}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* 内容区域 */}
        <div className={cn('flex flex-col p-5', isHorizontal && 'md:w-3/5')}>
          {/* 标签 */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--brand-color)_10%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand-color)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <h3 className="mb-2 text-xl font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] transition-colors duration-[var(--motion-fast)] group-hover:text-[var(--brand-color)]">
            {article.title}
          </h3>

          {/* 摘要 */}
          {article.summary && (
            <p className="mb-4 line-clamp-2 flex-1 text-sm text-[var(--text-soft)]">
              {article.summary}
            </p>
          )}

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium tracking-[0.06em] text-[var(--text-soft)]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time>{formattedDate}</time>
            </div>
            {article.readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{article.readTime}</span>
              </div>
            )}
          </div>

          {/* 阅读更多 */}
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--brand-color)]">
            <span className="relative">
              阅读更多
              <span className="absolute bottom-0 left-0 h-px w-0 bg-current transition-all duration-[var(--motion-fast)] group-hover:w-full" />
            </span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
