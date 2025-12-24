'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { BookCategory } from '@/lib/utils/book-categorizer'
import { getCategoryColorScheme } from '@/lib/utils/book-categorizer'
import { getBookIcon } from './BookIcons'
import {
  getOptimizedAnimationParams,
  shouldDisableComplexAnimations,
} from '@/lib/utils/performance-optimized'

interface BookProps {
  book: BookCategory
  index: number
}

export default function Book({ book, index }: BookProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [disableComplexAnimations, setDisableComplexAnimations] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setDisableComplexAnimations(shouldDisableComplexAnimations())
  }, [])

  // 获取性能优化的动画参数
  const { delay, duration } = getOptimizedAnimationParams(0.5, index * 0.1)
  const colorScheme = getCategoryColorScheme(book.name)
  const bookIcon = getBookIcon(book.name)
  const categoryUrl = `/blog/category/${encodeURIComponent(book.name)}`

  return (
    <motion.div
      className="relative mb-8"
      initial={{ opacity: 0, y: disableComplexAnimations ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: disableComplexAnimations ? 0 : delay, duration }}
      style={{ willChange: 'opacity, transform' }}
    >
      {/* 书籍容器 */}
      <Link href={categoryUrl} className="block">
        <motion.div
          className="group relative cursor-pointer"
          whileHover={disableComplexAnimations ? {} : { scale: 1.03, y: -5 }}
          whileTap={disableComplexAnimations ? {} : { scale: 0.97 }}
        >
          {/* 书籍3D效果 */}
          <motion.div
            className="relative"
            style={{
              perspective: !isMobile ? '1000px' : 'none',
              transformStyle: !isMobile ? 'preserve-3d' : 'flat',
            }}
          >
            {/* 书籍主体 */}
            <div className="relative">
              {/* 书籍封面 */}
              <motion.div
                className="group-hover:shadow-3xl relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 shadow-lg transition-all duration-300 sm:min-h-[240px] sm:p-8"
              >
                {/* 书籍内容 */}
                <div className="relative z-10 flex h-full flex-col">
                  {/* 图标和标题区域 */}
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="mb-3 text-xl font-bold capitalize drop-shadow-lg sm:text-2xl">
                        {book.name}
                      </h2>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-foreground sm:text-sm">
                          {book.totalArticles} 篇文章
                        </p>
                        {book.chapters.length > 0 && (
                          <p className="text-xs text-muted-foreground">{book.chapters.length} 个章节</p>
                        )}
                      </div>
                    </div>
                    {/* 分类图标 */}
                    <div className="flex-shrink-0 text-primary opacity-90">
                      {bookIcon}
                    </div>
                  </div>

                  {/* 底部装饰条 */}
                  <div className="mt-auto pt-4">
                    <div className="h-1 rounded-full bg-border"></div>
                  </div>
                </div>

                {/* 书籍厚度效果（右侧书脊） - 简化，移除渐变和模糊 */}
                <div
                  className="absolute top-2 -right-2 bottom-2 hidden w-3 rounded-r-xl bg-border opacity-50 sm:-right-3 sm:block sm:w-4"
                />

                {/* 底部厚度阴影 - 简化，移除渐变和模糊 */}
                <div
                  className="absolute right-2 -bottom-2 left-2 hidden h-2 rounded-b-xl bg-border opacity-30 sm:block"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* 点击提示 */}
          {!disableComplexAnimations && (
            <motion.div
              className="absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 text-gray-400 dark:text-gray-500"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm dark:bg-gray-900/80">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  )
}
