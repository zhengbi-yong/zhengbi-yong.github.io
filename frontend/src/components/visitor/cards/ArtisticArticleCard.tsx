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
        'group bg-white dark:bg-gray-800',
        'rounded-visitor-lg overflow-hidden',
        'shadow-visitor-soft hover:shadow-visitor-medium',
        'transition-all duration-500 ease-visitor',
        'border border-gray-100 dark:border-gray-700',
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
          className="relative w-full h-64 bg-gray-200 dark:bg-gray-700"
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
      <div className="p-6 space-y-4">
        {/* 标题 - 衬线字体 */}
        <Link href={`/blog/${article.slug}`}>
          <h3 className="font-visitor-serif text-2xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>
        </Link>

        {/* 摘要 */}
        <p className="text-visitor-base text-gray-600 dark:text-gray-400 line-clamp-3">
          {article.summary}
        </p>

        {/* 元信息 - 极简 */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500 pt-2">
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
        'bg-white dark:bg-gray-800',
        'rounded-visitor-md',
        'shadow-visitor-soft hover:shadow-visitor-medium',
        'transition-all duration-300 ease-visitor',
        'border border-gray-100 dark:border-gray-700',
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
        className="flex-shrink-0 w-32 h-24 rounded-visitor-md overflow-hidden"
      >
        <motion.div
          className="relative w-full h-full bg-gray-200 dark:bg-gray-700"
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
            <h3 className="font-visitor-serif text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* 摘要 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
            {article.summary}
          </p>
        </div>

        {/* 元信息 */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mt-2">
          <time>{new Date(article.date).toLocaleDateString('zh-CN')}</time>
          <span>·</span>
          <span>{article.readTime} min read</span>
        </div>
      </div>
    </motion.article>
  )
}
