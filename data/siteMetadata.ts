/**
 * 站点元数据配置
 * 包含站点基本信息、社交媒体链接、分析配置等
 */

import type { AnalyticsConfig } from 'pliny/analytics'
import type { SearchConfig } from 'pliny/search'
import type { CommentsConfig } from 'pliny/comments'
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
  | 'emailoctopus'
  | 'beehiiv'

export interface Newsletter {
  provider: NewsletterProvider
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
  bluesky?: string
  x?: string
  twitter?: string
  facebook?: string
  youtube?: string
  linkedin?: string
  threads?: string
  instagram?: string
  medium?: string
  locale: string
  stickyNav: boolean
  analytics: Analytics & AnalyticsConfig
  newsletter: Newsletter
  comments: CommentsConfig
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

const siteMetadata: SiteMetadata = {
  title: 'Zhengbi Yong',
  author: '雍征彼',
  headerTitle: 'Zhengbi Yong',
  description: '踏平坎坷成大道，斗罢艰险又出发。',
  language: 'zh-CN',
  theme: 'system',
  siteUrl: 'https://tailwind-nextjs-starter-blog.vercel.app',
  siteRepo: 'https://github.com/timlrx/tailwind-nextjs-starter-blog',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.svg`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,
  mastodon: 'https://mastodon.social/@mastodonuser',
  email: 'zhengbi.yong@outlook.com',
  github: 'https://github.com/zhengbi-yong',
  x: 'https://twitter.com/x',
  facebook: 'https://facebook.com',
  youtube: 'https://youtube.com',
  linkedin: 'https://www.linkedin.com',
  threads: 'https://www.threads.net',
  instagram: 'https://www.instagram.com',
  locale: 'zh-CN',
  stickyNav: false,
  analytics: {
    umamiAnalytics: {
      umamiWebsiteId: process.env.NEXT_UMAMI_ID ?? '',
    },
  },
  newsletter: {
    provider: 'buttondown',
  },
  comments: {
    provider: 'giscus',
    giscusConfig: {
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? '',
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID ?? '',
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? '',
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? '',
      mapping: 'pathname',
      reactions: '1',
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'en',
    },
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
}

export default siteMetadata

