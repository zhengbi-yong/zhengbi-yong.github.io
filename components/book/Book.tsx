'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { BookCategory } from '@/lib/utils/book-categorizer'
import { getCategoryColorScheme } from '@/lib/utils/book-categorizer'
import { getBookIcon } from './BookIcons'

interface BookProps {
  book: BookCategory
  index: number
}

export default function Book({ book, index }: BookProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const colorScheme = getCategoryColorScheme(book.name)
  const bookIcon = getBookIcon(book.name)
  const categoryUrl = `/blog/category/${encodeURIComponent(book.name)}`

  return (
    <motion.div
      className="relative mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      {/* 书籍容器 */}
      <Link href={categoryUrl} className="block">
        <motion.div
          className="group relative cursor-pointer"
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.97 }}
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
                className={`${colorScheme.gradient} dark:${colorScheme.gradientDark} group-hover:shadow-3xl relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-xl p-6 text-white shadow-2xl shadow-black/20 transition-all duration-300 group-hover:shadow-black/30 sm:min-h-[240px] sm:p-8 dark:shadow-black/40 dark:group-hover:shadow-black/50`}
              >
                {/* 纸张纹理效果 - 背景层 */}
                <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:20px_20px] opacity-10"></div>

                {/* 渐变遮罩增强深度 - 背景层 */}
                <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>

                {/* 书籍内容 - 前景层 */}
                <div className="relative z-10 flex h-full flex-col">
                  {/* 图标和标题区域 */}
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="mb-3 text-xl font-bold capitalize drop-shadow-lg sm:text-2xl">
                        {book.name}
                      </h2>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-white/90 sm:text-sm">
                          {book.totalArticles} 篇文章
                        </p>
                        {book.chapters.length > 0 && (
                          <p className="text-xs text-white/70">{book.chapters.length} 个章节</p>
                        )}
                      </div>
                    </div>
                    {/* 分类图标 */}
                    <div
                      className={`${colorScheme.iconColor} flex-shrink-0 opacity-90 drop-shadow-lg`}
                    >
                      {bookIcon}
                    </div>
                  </div>

                  {/* 底部装饰条 */}
                  <div className="mt-auto pt-4">
                    <div className="h-1 rounded-full bg-white/20"></div>
                  </div>
                </div>

                {/* 书籍厚度效果（右侧书脊） */}
                <div
                  className="absolute top-2 -right-2 bottom-2 hidden w-3 rounded-r-xl opacity-80 sm:-right-3 sm:block sm:w-4"
                  style={{
                    background: `linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.5))`,
                    transform: 'rotateY(-90deg)',
                    transformOrigin: 'right center',
                    filter: 'blur(1px)',
                  }}
                />

                {/* 底部厚度阴影 */}
                <div
                  className="absolute right-2 -bottom-2 left-2 hidden h-2 rounded-b-xl opacity-60 sm:block"
                  style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)`,
                    transform: 'rotateX(90deg)',
                    transformOrigin: 'bottom center',
                    filter: 'blur(2px)',
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* 点击提示 */}
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
        </motion.div>
      </Link>
    </motion.div>
  )
}
