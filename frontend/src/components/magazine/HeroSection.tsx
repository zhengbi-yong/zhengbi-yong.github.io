'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Clock } from 'lucide-react'

/**
 * 特色文章数据结构
 */
interface FeaturedArticle {
  title: string
  summary: string
  date: string
  readTime: string
  image: string
  slug: string
  tags: string[]
}

/**
 * 书籍数据结构（简化版）
 */
interface Book {
  name: string
  description?: string
  image: string
  href?: string
}

/**
 * HeroSection 组件属性
 */
interface HeroSectionProps {
  featuredArticle: FeaturedArticle
  latestBooks: Book[]
}

/**
 * HeroSection - Hero区域组件
 *
 * 特色文章 + 最新书籍网格
 * 高度 40vh，响应式布局
 */
export default function HeroSection({ featuredArticle, latestBooks }: HeroSectionProps) {
  return (
    <section className="relative h-[40vh] min-h-[400px] overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-white to-accent-500/10 dark:from-primary-500/5 dark:via-gray-900 dark:to-accent-500/5" />

      <div className="container mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 左侧：特色文章 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <Link href={featuredArticle.slug} className="group">
              <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all hover:shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                {/* 特色文章图片 */}
                <div className="relative h-48 w-full overflow-hidden sm:h-56">
                  <Image
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* 图片遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                {/* 特色文章内容 */}
                <div className="p-6">
                  {/* 标签 */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {featuredArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 标题 */}
                  <h2 className="mb-3 text-2xl font-bold leading-tight text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 sm:text-3xl">
                    {featuredArticle.title}
                  </h2>

                  {/* 摘要 */}
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                    {featuredArticle.summary}
                  </p>

                  {/* 元信息 */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <time>{featuredArticle.date}</time>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{featuredArticle.readTime}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
                    <span>阅读全文</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* 右侧：3x2 书籍网格 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <div className="grid grid-cols-2 gap-3">
              {latestBooks.slice(0, 6).map((book, index) => (
                <motion.div
                  key={book.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <Link
                    href={book.href || '#'}
                    className="group block overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-md transition-all hover:shadow-lg hover:border-primary-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={book.image}
                        alt={book.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* 悬停遮罩 */}
                      <div className="absolute inset-0 bg-primary-900/0 transition-colors group-hover:bg-primary-900/20" />
                    </div>

                    {/* 书名 */}
                    <div className="p-3">
                      <h3 className="line-clamp-2 text-xs font-bold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 sm:text-sm">
                        {book.name}
                      </h3>
                      {book.description && (
                        <p className="mt-1 line-clamp-1 text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">
                          {book.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
