'use client'

import { useEffect, useState } from 'react'
import { formatDate } from 'pliny/utils/formatDate'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
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

  useEffect(() => {
    setDisableComplexAnimations(shouldDisableComplexAnimations())
  }, [])

  const cardClasses = disableComplexAnimations
    ? 'group/card relative overflow-hidden rounded-xl border border-gray-200/70 bg-white dark:border-gray-700/70 dark:bg-gray-900'
    : `group/card hover:border-primary-400/80 dark:hover:border-primary-500/80 hover:shadow-primary-500/20 dark:hover:shadow-primary-400/20 relative overflow-hidden rounded-xl border border-gray-200/70 bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-gray-700/70 dark:bg-gray-900 animate-fade-in-up`

  return (
    <article
      className={cardClasses}
      style={{
        animationDelay: disableComplexAnimations ? '0ms' : `${index * 50}ms`,
      }}
    >
      {/* 左侧彩色条 */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 ${categoryColor} transition-all duration-300 group-hover/card:w-1.5 group-hover/card:shadow-lg`}
      />

      {/* 内容区域 */}
      <div className="py-5 pr-5 pl-6">
        {/* 顶部：日期和标签 */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <time
            dateTime={date}
            className="flex-shrink-0 text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
          >
            {formatDate(date, siteMetadata.locale)}
          </time>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
          <h3 className="group-hover/card:text-primary-600 dark:group-hover/card:text-primary-400 mb-3 line-clamp-2 cursor-pointer text-lg leading-7 font-bold tracking-tight text-gray-900 transition-colors duration-200 sm:text-xl dark:text-gray-100">
            {title}
          </h3>
        </Link>

        {/* 摘要 */}
        {summary && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {summary}
          </p>
        )}

        {/* 阅读更多提示（悬停时显示） */}
        {!disableComplexAnimations && (
          <Link href={`/${path}`} className="block">
            <div className="mt-2 flex items-center justify-end opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
              <span className="text-primary-500 dark:text-primary-400 flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
                阅读更多
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover/card:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </Link>
        )}
      </div>
    </article>
  )
}
