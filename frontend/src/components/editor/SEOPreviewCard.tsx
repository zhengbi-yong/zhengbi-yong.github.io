'use client'

import { cn } from '@/lib/utils'

interface SEOPreviewCardProps {
  title: string
  metaTitle?: string
  metaDescription?: string
  summary?: string
  canonicalUrl?: string
  slug: string
}

export function SEOPreviewCard({
  title,
  metaTitle,
  metaDescription,
  summary,
  canonicalUrl,
  slug,
}: SEOPreviewCardProps) {
  const displayTitle = metaTitle || title || '无标题'
  const displayDescription = metaDescription || summary || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zhengbi-yong.github.io'
  const displayUrl = canonicalUrl || `${siteUrl}/blog/${slug}`

  // Truncate display URL for preview
  const truncatedUrl = displayUrl.length > 70
    ? displayUrl.substring(0, 67) + '...'
    : displayUrl

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Google 搜索预览
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-1">
        {/* URL */}
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {truncatedUrl}
        </p>
        {/* Title */}
        <p className={cn(
          'text-[15px] leading-snug line-clamp-2',
          displayTitle.length > 60
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-blue-600 dark:text-blue-400'
        )}>
          {displayTitle}
        </p>
        {/* Description */}
        {displayDescription ? (
          <p className={cn(
            'text-xs leading-relaxed line-clamp-2 text-gray-600 dark:text-gray-400',
            displayDescription.length > 160 && 'text-gray-500'
          )}>
            {displayDescription}
          </p>
        ) : (
          <p className="text-xs text-gray-300 dark:text-gray-600 italic">
            未设置描述，搜索引擎将自动提取
          </p>
        )}
      </div>
    </div>
  )
}
