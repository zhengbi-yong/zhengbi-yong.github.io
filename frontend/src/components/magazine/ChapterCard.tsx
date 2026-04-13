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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Link
        href={chapter.slug}
        className="group block rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-base)] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-medium)]"
      >
        <div className="flex items-start gap-4">
          {/* 章节编号 */}
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius-panel)-6px)] bg-[color-mix(in_srgb,var(--brand-color)_14%,transparent)] text-[var(--brand-color)]">
              <span className="text-sm font-semibold tracking-[-0.02em]">{chapter.chapterNumber}</span>
            </div>
          </div>

          {/* 章节内容 */}
          <div className="min-w-0 flex-1">
            {/* 标题 */}
            <h3 className="line-clamp-2 font-semibold tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-[var(--motion-fast)] group-hover:text-[var(--brand-color)]">
              {chapter.title}
            </h3>

            {/* 摘要 */}
            {!compact && chapter.summary && (
              <p className="mt-2 line-clamp-2 text-sm text-[var(--text-soft)]">
                {chapter.summary}
              </p>
            )}

            {/* 元信息 */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium tracking-[0.06em] text-[var(--text-soft)]">
              {chapter.date && (
                <div className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <time>{new Date(chapter.date).toLocaleDateString('zh-CN')}</time>
                </div>
              )}
              {chapter.readTime && (
                <div className="inline-flex items-center gap-1.5">
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
