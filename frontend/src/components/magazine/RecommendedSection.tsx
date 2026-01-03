'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ContentItem } from './MasonryGrid'
import { generateRecommendations } from '@/lib/utils/recommendation-algorithm'
import SmartCard from './SmartCard'

/**
 * RecommendedSection 组件属性
 */
interface RecommendedSectionProps {
  readHistory: ContentItem[]
  allItems: ContentItem[]
  title?: string
  description?: string
  limit?: number
}

/**
 * RecommendedSection - 智能推荐区域组件
 *
 * 基于用户阅读历史和内容相似度生成个性化推荐
 * 横向滚动展示
 */
export default function RecommendedSection({
  readHistory,
  allItems,
  title = '你可能还喜欢',
  description = '基于您的阅读历史智能推荐',
  limit = 4,
}: RecommendedSectionProps) {
  // 生成推荐
  const recommendations = generateRecommendations(readHistory, allItems, limit)

  // 如果没有推荐，不显示
  if (recommendations.length === 0) {
    return null
  }

  return (
    <section className="border-t bg-gradient-to-r from-primary-50 via-white to-accent-50 py-12 dark:border-gray-700 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </motion.div>

        {/* 推荐卡片 - 横向滚动 */}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {recommendations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex-shrink-0 w-80"
            >
              <Link href={item.slug} className="block">
                <div className="group relative overflow-hidden rounded-2xl border-2 bg-white shadow-md transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                  {/* 图片 */}
                  {item.image && (
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                      {/* 悬停遮罩 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  )}

                  {/* 内容 */}
                  <div className="p-5">
                    {/* 标签 */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {item.tags.slice(0, 2).map((tag) => (
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
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                      {item.title}
                    </h3>

                    {/* 摘要 */}
                    {item.summary && (
                      <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                        {item.summary}
                      </p>
                    )}

                    {/* 日期 */}
                    {item.date && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.date).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>

                  {/* 类型指示器 */}
                  <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                      {item.type === 'book' ? '📚' : item.type === 'article' ? '📄' : '📖'}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 查看更多链接 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            查看全部内容
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
