'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
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
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const isDark = mounted && resolvedTheme === 'dark'

  // 获取性能优化的动画参数
  const { delay, duration } = getOptimizedAnimationParams(0.5, index * 0.1)
  const colorScheme = getCategoryColorScheme(book.name)
  const bookIcon = getBookIcon(book.name)
  const categoryUrl = `/blog/category/${encodeURIComponent(book.name)}`

  return (
    <motion.div
      className="relative h-full"
      initial={{ opacity: 0, y: disableComplexAnimations ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: disableComplexAnimations ? 0 : delay, duration }}
      style={{ willChange: 'opacity, transform' }}
    >
      {/* 书籍容器 */}
      <Link href={categoryUrl} className="block h-full">
        <motion.div
          className="group relative cursor-pointer h-full"
          whileHover={disableComplexAnimations ? {} : { scale: 1.02 }}
          whileTap={disableComplexAnimations ? {} : { scale: 0.98, y: 2 }}
        >
          {/* 书籍3D效果 */}
          <motion.div
            className="relative h-full"
            style={{
              perspective: !isMobile ? '1000px' : 'none',
              transformStyle: !isMobile ? 'preserve-3d' : 'flat',
            }}
          >
            {/* 书籍主体 */}
            <div className="relative h-full">
              {/* 书籍封面 - 添加边缘发光和按下效果 */}
              <motion.div
                className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-2 border-gray-200 bg-card p-4 shadow-lg transition-all duration-300 dark:border-gray-700"
                whileHover={
                  disableComplexAnimations
                    ? {}
                    : {
                        boxShadow: isDark
                          ? '0 0 20px rgba(192, 192, 192, 0.6), 0 0 40px rgba(192, 192, 192, 0.4)' // 黑夜：银色
                          : '0 0 20px rgba(124, 24, 35, 0.5), 0 0 40px rgba(124, 24, 35, 0.3)', // 白天：暗红色
                        borderColor: isDark
                          ? 'rgba(192, 192, 192, 0.7)' // 黑夜：银色
                          : 'rgba(124, 24, 35, 0.6)', // 白天：暗红色
                      }
                }
                whileTap={{
                  boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.2)',
                  y: 2,
                }}
              >
                {/* 书籍内容 */}
                <div className="relative z-10 flex h-full flex-col">
                  {/* 图标和标题区域 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="mb-2 text-lg font-bold capitalize sm:text-xl">
                        {book.name}
                      </h2>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {book.totalArticles} 篇文章
                        </p>
                        {book.chapters.length > 0 && (
                          <p className="text-xs text-muted-foreground">{book.chapters.length} 个章节</p>
                        )}
                      </div>
                    </div>
                    {/* 分类图标 */}
                    <div className="flex-shrink-0 text-primary opacity-90 text-2xl">
                      {bookIcon}
                    </div>
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

        </motion.div>
      </Link>
    </motion.div>
  )
}
