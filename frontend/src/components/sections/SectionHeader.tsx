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
export default function SectionHeader({ title, description, className = '' }: SectionHeaderProps) {
  return (
    <div className={cn('relative z-20 mx-auto mt-12 mb-16 w-full text-center', className)}>
      <h2 className="text-center text-4xl font-bold tracking-normal text-neutral-800 sm:text-5xl dark:text-neutral-100">
        <AnimatedText delay={0.2} stagger={0.08} content={title} />
      </h2>

      {description && (
        <div className="m-auto mt-3 max-w-full text-sm leading-6 text-neutral-700 sm:mt-4 sm:text-base sm:leading-7 lg:mt-6 lg:max-w-4xl lg:text-lg lg:leading-8 dark:text-neutral-300">
          <AnimatedText delay={0.6} stagger={0.03} content={description} />
        </div>
      )}
    </div>
  )
}
