'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/components/lib/utils'

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
        'group overflow-hidden rounded-xl border-2 bg-white shadow-md transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800',
        isHorizontal && 'md:flex',
        className
      )}
    >
      <Link href={article.slug} className="absolute inset-0 z-10">
        <span className="sr-only">Read {article.title}</span>
      </Link>

      <div className={cn(isHorizontal ? 'md:flex' : '')}>
        {/* 图片区域 */}
        {article.image && (
          <div
            className={cn(
              'relative overflow-hidden bg-gray-100 dark:bg-gray-900',
              isHorizontal ? 'md:w-2/5' : 'aspect-[16/9]'
            )}
          >
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* 内容区域 */}
        <div className={cn('flex flex-col p-5', isHorizontal && 'md:w-3/5')}>
          {/* 标签 */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <h3 className="mb-2 text-xl font-bold leading-tight text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {article.title}
          </h3>

          {/* 摘要 */}
          {article.summary && (
            <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-600 dark:text-gray-300">
              {article.summary}
            </p>
          )}

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
            <span>阅读更多</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
