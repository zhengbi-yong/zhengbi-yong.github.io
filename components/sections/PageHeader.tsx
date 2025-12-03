'use client'

import AnimatedText from '@/components/home/AnimatedText'
import { cn } from '@/components/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  tags?: string[]
  className?: string
}

/**
 * PageHeader - 页面标题组件
 * 参考 Astro 项目的 PageHeader 组件
 * 包含标题、描述和可选的标签，使用 AnimatedText 动画
 */
export default function PageHeader({
  title,
  description,
  tags = [],
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative z-20 w-full mx-auto mt-12 mb-16 text-center',
        className
      )}
    >
      <h2 className="text-4xl font-bold text-center tracking-normal sm:text-5xl text-neutral-800 dark:text-neutral-100">
        <AnimatedText delay={0.2} stagger={0.08} content={title} />
      </h2>

      {description && (
        <div className="mt-3 text-sm leading-6 sm:mt-4 lg:mt-6 sm:leading-7 lg:leading-8 sm:text-base lg:text-lg text-neutral-700 dark:text-neutral-300 max-w-full lg:max-w-3xl m-auto">
          <AnimatedText delay={0.6} stagger={0.03} content={description} />
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-12 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-gray-100/80 dark:bg-gray-800/15 px-3 py-1 text-[11px] font-light text-primary-600/85 dark:text-primary-400/85 border border-primary-500/35 dark:border-primary-400/25 tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

