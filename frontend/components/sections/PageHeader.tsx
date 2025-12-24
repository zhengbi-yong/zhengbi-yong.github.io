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
    <div className={cn('relative z-20 mx-auto mt-12 mb-16 w-full text-center', className)}>
      <h2 className="text-center text-4xl font-bold tracking-normal text-neutral-800 sm:text-5xl dark:text-neutral-100">
        <AnimatedText delay={0.2} stagger={0.08} content={title} />
      </h2>

      {description && (
        <div className="m-auto mt-3 max-w-full text-sm leading-6 text-neutral-700 sm:mt-4 sm:text-base sm:leading-7 lg:mt-6 lg:max-w-3xl lg:text-lg lg:leading-8 dark:text-neutral-300">
          <AnimatedText delay={0.6} stagger={0.03} content={description} />
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="mt-12 mb-2 flex flex-wrap justify-center gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-light tracking-wide text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
