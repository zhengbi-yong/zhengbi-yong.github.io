'use client'

import AnimatedText from '@/components/home/AnimatedText'
import { cn } from '@/components/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

/**
 * SectionHeader - 区块标题组件
 * 参考 Astro 项目的 SectionHeader 组件，适配项目现有风格
 * 包含标题和可选的描述，使用 AnimatedText 动画效果
 */
export default function SectionHeader({
  title,
  description,
  className = '',
}: SectionHeaderProps) {
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
    </div>
  )
}

