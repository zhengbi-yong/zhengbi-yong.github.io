'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { formatDate } from 'pliny/utils/formatDate'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import { shouldDisableComplexAnimations } from '@/lib/utils/performance-optimized'

interface ArticleCardProps {
  article: CoreContent<Blog>
  index?: number
  categoryColor?: string // 分类颜色，用于左侧彩色条
}

export default function ArticleCard({
  article,
  index = 0,
  categoryColor = 'bg-primary-500',
}: ArticleCardProps) {
  const { path, date, title, summary, tags } = article
  const [disableComplexAnimations, setDisableComplexAnimations] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setDisableComplexAnimations(shouldDisableComplexAnimations())
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <motion.article
      className="group/card relative h-full overflow-hidden rounded-xl border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      initial={{ opacity: 0, y: disableComplexAnimations ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: disableComplexAnimations ? 0 : index * 0.05 }}
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
      {/* 左侧彩色条 */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 ${categoryColor} transition-all duration-300 group-hover/card:w-1.5 group-hover/card:shadow-lg`}
      />

      {/* 内容区域 */}
      <div className="p-4">
        {/* 顶部：日期和标签 */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <time
            dateTime={date}
            className="flex-shrink-0 text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
          >
            {formatDate(date, siteMetadata.locale)}
          </time>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-medium uppercase"
                >
                  {tag.split(' ').join('-')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 标题 - 可点击链接 */}
        <Link href={`/${path}`} className="block">
          <h3 className="group-hover/card:text-primary-600 dark:group-hover/card:text-primary-400 mb-2 line-clamp-2 cursor-pointer text-base leading-6 font-bold tracking-tight text-gray-900 transition-colors duration-200 dark:text-gray-100">
            {title}
          </h3>
        </Link>

        {/* 摘要 */}
        {summary && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {summary}
          </p>
        )}
      </div>
    </motion.article>
  )
}
