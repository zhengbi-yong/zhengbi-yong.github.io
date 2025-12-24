'use client'

import { motion } from 'framer-motion'
import type { BookCategory } from '@/lib/utils/book-categorizer'
import { getCategoryColorScheme, getCategoryColorForCard } from '@/lib/utils/book-categorizer'
import { getBookIcon } from '@/components/book/BookIcons'
import Chapter from '@/components/book/Chapter'
import BackToShelfButton from '@/components/book/BackToShelfButton'
import {
  getOptimizedAnimationParams,
  shouldDisableComplexAnimations,
} from '@/lib/utils/performance-optimized'

interface BookDetailLayoutProps {
  book: BookCategory
}

export default function BookDetailLayout({ book }: BookDetailLayoutProps) {
  const colorScheme = getCategoryColorScheme(book.name)
  const bookIcon = getBookIcon(book.name)
  const categoryColor = getCategoryColorForCard(book.name)

  // 获取性能优化的动画参数
  const { duration, useReducedMotion } = getOptimizedAnimationParams(0.3, 0.2)
  const disableComplexAnimations = shouldDisableComplexAnimations()

  return (
    <motion.div
      className="relative min-h-screen w-full"
      initial={{ opacity: 0, scale: useReducedMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: useReducedMotion ? 1 : 0.95 }}
      transition={{ duration }}
      style={{ willChange: 'opacity' }}
    >
      {/* 内容容器 */}
      <div className="relative z-10 min-h-screen">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-20 border-b border-gray-200/50 bg-white shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <BackToShelfButton />
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          {/* 书籍封面区域 */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: disableComplexAnimations ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: disableComplexAnimations ? 0 : 0.1, duration }}
          >
            <div
              className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-lg sm:min-h-[400px] sm:p-12"
            >
              {/* 书籍内容 */}
              <div className="relative z-10 w-full px-4 text-center">
                {/* 图标 */}
                {!disableComplexAnimations ? (
                  <motion.div
                    className="mb-6 flex justify-center text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <div className="h-20 w-20 sm:h-24 sm:w-24">{bookIcon}</div>
                  </motion.div>
                ) : (
                  <div className="mb-6 flex justify-center text-primary">
                    <div className="h-20 w-20 sm:h-24 sm:w-24">{bookIcon}</div>
                  </div>
                )}

                {/* 标题 */}
                <h1 className="mb-4 text-4xl font-bold capitalize text-foreground sm:text-5xl md:text-6xl">
                  {book.name}
                </h1>

                {/* 统计信息 */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span className="text-lg font-medium">{book.totalArticles} 篇文章</span>
                  </div>
                  {book.chapters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                      <span className="text-lg font-medium">{book.chapters.length} 个章节</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 章节列表区域 */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: disableComplexAnimations ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: disableComplexAnimations ? 0 : 0.2, duration }}
          >
            {book.chapters.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-gray-500 dark:text-gray-400">暂无章节</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
                <div className="space-y-6">
                  {book.chapters.map((chapter, chapterIndex) => (
                    <Chapter
                      key={chapter.path}
                      chapter={chapter}
                      bookName={book.name}
                      isExpanded={chapterIndex === 0}
                      categoryColor={categoryColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
