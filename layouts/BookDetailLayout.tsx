'use client'

import { motion } from 'framer-motion'
import type { BookCategory } from '@/lib/utils/book-categorizer'
import { getCategoryColorScheme, getCategoryColorForCard } from '@/lib/utils/book-categorizer'
import { getBookIcon } from '@/components/book/BookIcons'
import Chapter from '@/components/book/Chapter'
import BackToShelfButton from '@/components/book/BackToShelfButton'

interface BookDetailLayoutProps {
  book: BookCategory
}

export default function BookDetailLayout({ book }: BookDetailLayoutProps) {
  const colorScheme = getCategoryColorScheme(book.name)
  const bookIcon = getBookIcon(book.name)
  const categoryColor = getCategoryColorForCard(book.name)

  return (
    <motion.div
      className="relative min-h-screen w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* 背景 */}
      <div className="fixed inset-0 -z-10">
        <div
          className={`${colorScheme.gradient} dark:${colorScheme.gradientDark} absolute inset-0 opacity-10`}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80 backdrop-blur-sm dark:from-gray-950/80 dark:via-gray-900/60 dark:to-gray-950/80"></div>
      </div>

      {/* 内容容器 */}
      <div className="relative z-10 min-h-screen">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-20 border-b border-gray-200/50 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/80">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <BackToShelfButton />
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          {/* 书籍封面区域 */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div
              className={`${colorScheme.gradient} dark:${colorScheme.gradientDark} relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl p-8 text-white shadow-2xl shadow-black/20 sm:min-h-[400px] sm:p-12 dark:shadow-black/40`}
            >
              {/* 纸张纹理效果 - 背景层 */}
              <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:20px_20px] opacity-10"></div>

              {/* 渐变遮罩 - 背景层 */}
              <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>

              {/* 书籍内容 - 前景层 */}
              <div className="relative z-10 w-full px-4 text-center">
                {/* 图标 */}
                <motion.div
                  className={`${colorScheme.iconColor} mb-6 flex justify-center`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <div className="h-20 w-20 sm:h-24 sm:w-24">{bookIcon}</div>
                </motion.div>

                {/* 标题 */}
                <h1 className="mb-4 text-4xl font-bold capitalize drop-shadow-lg sm:text-5xl md:text-6xl">
                  {book.name}
                </h1>

                {/* 统计信息 */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {book.chapters.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-gray-500 dark:text-gray-400">暂无章节</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200/50 bg-white/60 p-6 shadow-lg backdrop-blur-sm sm:p-8 dark:border-gray-700/50 dark:bg-gray-900/60">
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
