/**
 * 站点元数据配置
 * 包含站点基本信息、社交媒体链接、分析配置等
 */

import type { AnalyticsConfig } from 'pliny/analytics'
import type { SearchConfig } from 'pliny/search'
import type { ReactNode } from 'react'

export type Theme = 'system' | 'dark' | 'light'

export interface UmamiAnalyticsConfig {
  umamiWebsiteId?: string
  src?: string
}

export interface PlausibleAnalyticsConfig {
  plausibleDataDomain?: string
  src?: string
}

export interface PosthogAnalyticsConfig {
  posthogProjectApiKey?: string
}

export interface GoogleAnalyticsConfig {
  googleAnalyticsId?: string
}

export interface Analytics {
  umamiAnalytics?: UmamiAnalyticsConfig
  plausibleAnalytics?: PlausibleAnalyticsConfig
  simpleAnalytics?: Record<string, unknown>
  posthogAnalytics?: PosthogAnalyticsConfig
  googleAnalytics?: GoogleAnalyticsConfig
}

export type NewsletterProvider =
  | 'mailchimp'
  | 'buttondown'
  | 'convertkit'
  | 'klaviyo'
  | 'revue'
  | 'emailoctopus'
  | 'beehive'

export interface Newsletter {
  provider: NewsletterProvider
}

export type CommentsProvider = 'giscus' | 'utterances' | 'disqus'

export type GiscusMapping = 'pathname' | 'url' | 'title'

export interface GiscusConfig {
  repo?: string
  repositoryId?: string
  category?: string
  categoryId?: string
  mapping?: GiscusMapping
  reactions?: '1' | '0'
  metadata?: '1' | '0'
  theme?: string
  darkTheme?: string
  themeURL?: string
  lang?: string
}

export interface Comments {
  provider: CommentsProvider
  giscusConfig?: GiscusConfig
}

export type SearchProvider = 'kbar' | 'algolia'

export interface KbarConfig {
  searchDocumentsPath?: string
}

export interface AlgoliaConfig {
  appId?: string
  apiKey?: string
  indexName?: string
}

export interface Search {
  provider: SearchProvider
  kbarConfig?: KbarConfig
  algoliaConfig?: AlgoliaConfig
}

export interface SiteMetadata {
  title: string
  author: string
  headerTitle: string | ReactNode
  description: string
  language: string
  theme: Theme
  siteUrl: string
  siteRepo: string
  siteLogo: string
  socialBanner: string
  mastodon?: string
  email: string
  github?: string
  x?: string
  twitter?: string
  facebook?: string
  youtube?: string
  linkedin?: string
  threads?: string
  instagram?: string
  locale: string
  stickyNav: boolean
  analytics: Analytics & AnalyticsConfig
  newsletter: Newsletter
  comments: Comments
  search: Search & SearchConfig
}

/**
 * 类型守卫：验证 siteMetadata 是否符合类型定义
 */
export function isValidSiteMetadata(data: unknown): data is SiteMetadata {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const metadata = data as Partial<SiteMetadata>

  return (
    typeof metadata.title === 'string' &&
    typeof metadata.author === 'string' &&
    typeof metadata.description === 'string' &&
    typeof metadata.language === 'string' &&
    typeof metadata.siteUrl === 'string' &&
    typeof metadata.email === 'string'
  )
}

