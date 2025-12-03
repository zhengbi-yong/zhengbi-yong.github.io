'use client'

import Link from '@/components/Link'
import Image from '@/components/Image'
import { cn } from '@/components/lib/utils'

interface BlogCardProps {
  content: {
    title: string
    description?: string
    publishDate: string
    tags?: string[]
    img?: string
    img_alt?: string
    slug: string
    link?: string
  }
  layout?: 'vertical' | 'horizontal'
  className?: string
}

/**
 * BlogCard - 博客卡片组件
 * 参考 Astro 项目的 BlogCard 组件，适配项目现有风格
 * 支持垂直和水平两种布局，包含图片、标题、描述、日期、标签等信息
 */
export default function BlogCard({
  content,
  layout = 'vertical',
  className = '',
}: BlogCardProps) {
  const {
    title,
    description,
    publishDate,
    tags = [],
    img,
    img_alt,
    slug,
    link,
  } = content

  const formattedDate = new Date(publishDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const postLink = link || `/blog/${slug}`
  const isHorizontal = layout === 'horizontal'

  return (
    <article
      className={cn(
        'group relative overflow-hidden bg-white/50 dark:bg-gray-900/50 border border-primary-500/35 dark:border-primary-400/35 p-4 rounded-2xl backdrop-blur-sm transition-all duration-500',
        isHorizontal && 'md:flex md:items-center',
        className
      )}
    >
      {/* Image container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl dark:border-neutral-800/60 border-4 border-white',
          isHorizontal ? 'md:w-1/2' : 'aspect-[3/2]'
        )}
      >
        {/* Image */}
        {img ? (
          <Image
            src={img}
            alt={img_alt || `Related to ${title}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-700 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-400"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
        )}

        {/* Gradient overlay and button shown on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
          <span className="w-14 h-14 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-full flex items-center justify-center transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-lg hover:scale-110">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-500 dark:text-primary-400"
            >
              <path d="M7 7h10v10"></path>
              <path d="M7 17 17 7"></path>
            </svg>
          </span>
        </div>

        {/* Article link */}
        <Link href={postLink} className="absolute inset-0 z-10">
          <span className="sr-only">Read More About {title}</span>
        </Link>
      </div>

      {/* Content area */}
      <div
        className={cn(
          'p-6 px-2 md:p-6 flex flex-col',
          isHorizontal && 'md:w-1/2'
        )}
      >
        {/* Date and tags */}
        <div className="flex items-center text-sm mb-4 gap-2">
          <time className="inline-flex items-center text-neutral-500 dark:text-neutral-400 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1.5 opacity-60"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
              <line x1="16" x2="16" y1="2" y2="6"></line>
              <line x1="8" x2="8" y1="2" y2="6"></line>
              <line x1="3" x2="21" y1="10" y2="10"></line>
            </svg>
            {formattedDate}
          </time>
          {tags && tags.length > 0 && (
            <>
              <span className="text-neutral-400 dark:text-neutral-500">·</span>
              <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-gray-800/15 px-3 py-1 text-[11px] font-light text-primary-500/75 dark:text-primary-400/85 border border-primary-500/25 dark:border-primary-400/25">
                {tags[0]}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <Link href={postLink}>
          <h2
            className={cn(
              'font-bold text-neutral-900 dark:text-white mb-3 leading-tight transition-colors duration-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 line-clamp-2',
              isHorizontal ? 'text-3xl' : 'text-2xl'
            )}
          >
            {title}
          </h2>
        </Link>

        {/* Description */}
        {description && (
          <p className="text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-5 text-sm leading-relaxed">
            {description}
          </p>
        )}

        {/* Read More button */}
        <div className="mt-auto pt-4">
          <Link
            href={postLink}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500 dark:text-primary-400 transition-all duration-300 group/link"
          >
            <span className="relative">
              Read More
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-500 dark:bg-primary-400 transition-all duration-300 group-hover/link:w-full"></span>
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover/link:translate-x-1"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}

