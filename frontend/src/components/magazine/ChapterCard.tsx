'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, FileText } from 'lucide-react'

/**
 * 章节数据结构
 */
export interface ChapterData {
  id: string
  title: string
  summary?: string
  date?: string
  readTime?: string
  slug: string
  chapterNumber: number
}

/**
 * ChapterCard 组件属性
 */
interface ChapterCardProps {
  chapter: ChapterData
  compact?: boolean
  className?: string
}

/**
 * ChapterCard - 章节卡片组件
 *
 * 用于显示单个章节，适合高卡片布局
 */
export default function ChapterCard({
  chapter,
  compact = false,
  className = '',
}: ChapterCardProps) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Link
        href={chapter.slug}
        className="block rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600"
      >
        <div className="flex items-start gap-4">
          {/* 章节编号 */}
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              <span className="text-sm font-bold">{chapter.chapterNumber}</span>
            </div>
          </div>

          {/* 章节内容 */}
          <div className="flex-1 min-w-0">
            {/* 标题 */}
            <h3 className="font-bold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 line-clamp-2">
              {chapter.title}
            </h3>

            {/* 摘要 */}
            {!compact && chapter.summary && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                {chapter.summary}
              </p>
            )}

            {/* 元信息 */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {chapter.date && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <time>{new Date(chapter.date).toLocaleDateString('zh-CN')}</time>
                </div>
              )}
              {chapter.readTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{chapter.readTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
