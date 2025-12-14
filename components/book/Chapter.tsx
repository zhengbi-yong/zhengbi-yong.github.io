'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Chapter as ChapterType } from '@/lib/utils/book-categorizer'
import ArticleCard from './ArticleCard'

interface ChapterProps {
  chapter: ChapterType
  bookName: string
  isExpanded?: boolean
  categoryColor?: string // 分类颜色，传递给 ArticleCard
}

export default function Chapter({
  chapter,
  bookName,
  isExpanded = false,
  categoryColor,
}: ChapterProps) {
  const [isOpen, setIsOpen] = useState(isExpanded)

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative mb-6">
      {/* 时间线 */}
      {chapter.name && (
        <div className="from-primary-400/30 via-primary-500/50 dark:from-primary-500/30 dark:via-primary-400/50 absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b to-transparent"></div>
      )}

      {chapter.name && (
        <button
          onClick={toggleOpen}
          className="mb-4 ml-6 flex w-full items-center justify-between rounded-xl border border-gray-200/60 bg-gradient-to-r from-white/80 to-gray-50/80 px-6 py-4 text-left shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:from-white hover:to-gray-100 hover:shadow-lg dark:border-gray-700/60 dark:from-gray-800/80 dark:to-gray-900/80 dark:hover:from-gray-700 dark:hover:to-gray-800"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-4">
            {/* 章节指示点 */}
            <div
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                isOpen
                  ? 'bg-primary-500 shadow-primary-500/50 scale-125 shadow-lg'
                  : 'bg-gray-400 dark:bg-gray-500'
              }`}
            ></div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{chapter.name}</h3>
          </div>
          <span className="rounded-full bg-gray-100/80 px-4 py-1.5 text-sm font-semibold text-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
            {chapter.articles.length} 篇
          </span>
        </button>
      )}

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`grid gap-5 ${chapter.name ? 'border-primary-200/50 dark:border-primary-800/50 ml-6 border-l-2 pl-8' : ''} ${
            chapter.articles.length === 1
              ? 'grid-cols-1'
              : chapter.articles.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {chapter.articles.map((article, index) => (
            <ArticleCard
              key={article.path}
              article={article}
              index={index}
              categoryColor={categoryColor}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
