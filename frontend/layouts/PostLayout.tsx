import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import FadeIn from '@/components/animations/FadeIn'
import FloatingTOC from '@/components/FloatingTOC'
import JsonLd from '@/components/seo/JsonLd'
import type { TOC } from '@/lib/types/toc'
import ReadingProgress from '@/components/ReadingProgress'
import ArticleAnalytics from '@/components/ArticleAnalytics'
import { RecentArticles } from '@/components/RecentArticles'

const editUrl = (path: string) => `${siteMetadata.siteRepo}/blob/main/data/${path}`
const discussUrl = (path: string) =>
  `https://mobile.twitter.com/search?q=${encodeURIComponent(`${siteMetadata.siteUrl}/${path}`)}`

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
  toc?: TOC
  showTOC?: boolean
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  children,
  toc,
  showTOC,
}: LayoutProps) {
  const { filePath, path, slug, date, title, tags, summary, images } = content
  const basePath = path.split('/')[0]

  // 生成文章的 Schema.org 结构化数据
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: summary,
    image: images?.[0] ? `${siteMetadata.siteUrl}${images[0]}` : siteMetadata.socialBanner,
    datePublished: new Date(date).toISOString(),
    dateModified: new Date(date).toISOString(),
    author: {
      '@type': 'Person',
      name: authorDetails[0]?.name || siteMetadata.author,
      email: authorDetails[0]?.email || siteMetadata.email,
      url: siteMetadata.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteMetadata.title,
      logo: {
        '@type': 'ImageObject',
        url: `${siteMetadata.siteUrl}${siteMetadata.siteLogo}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteMetadata.siteUrl}/${path}`,
    },
    keywords: tags?.join(', '),
    inLanguage: siteMetadata.locale,
  }

  // 生成面包屑导航 Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteMetadata.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteMetadata.siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: basePath.charAt(0).toUpperCase() + basePath.slice(1),
        item: `${siteMetadata.siteUrl}/blog/${basePath}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: title,
        item: `${siteMetadata.siteUrl}/${path}`,
      },
    ],
  }

  return (
    <SectionContainer>
      {/* JSON-LD 结构化数据 */}
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* 阅读进度条 */}
      <ReadingProgress />

      {/* 文章分析组件 - 使用 slug 作为文章ID */}
      <ArticleAnalytics articleId={slug || path} showDetails={false} compact={true} />
      <article>
        <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-6 xl:pb-8">
            <div className="space-y-4 text-center">
              <dl>
                <div>
                  <dt className="sr-only">Published on</dt>
                  <dd className="mb-6 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
                    <time dateTime={date}>
                      {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
                    </time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle>{title}</PageTitle>
              </div>
            </div>
          </header>
          <div className="divide-y divide-gray-200 pb-8 md:grid md:grid-cols-[3fr_1fr] xl:grid-cols-[1.5fr_3fr_1.5fr] md:gap-x-4 xl:gap-x-8 md:divide-y-0 dark:divide-gray-700">
            {/* 左侧：最新文章 - 在xl以下屏幕隐藏 */}
            <div className="hidden xl:flex xl:col-span-1 flex-shrink-0 flex-col">
              <div className="sticky top-20 flex flex-col h-full w-full" style={{ height: 'calc(100vh - 5rem)', maxHeight: 'calc(100vh - 5rem)' }}>
                <RecentArticles limit={15} />
              </div>
            </div>

            {/* 中间：文章内容 */}
            <div className="md:col-span-1 xl:col-span-1 dark:divide-gray-700 xl:px-4">
              <FadeIn delay={0.2} duration={0.6} whileInView={true}>
                <div className="prose dark:prose-invert prose-headings:mt-8 prose-headings:mb-4 prose-p:my-4 prose-p:leading-7 prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline mx-auto w-full max-w-full min-w-0 pt-10 pb-8 sm:max-w-2xl md:max-w-none">
                  {children}
                </div>
              </FadeIn>
            </div>

            {/* 右侧：TOC */}
            <div className="hidden md:sticky md:top-20 md:col-span-1 md:block md:flex md:flex-col md:self-start" style={{ height: 'calc(100vh - 5rem)', maxHeight: 'calc(100vh - 5rem)' }}>
              <div className="flex flex-col h-full w-full" style={{ height: '100%', maxHeight: '100%' }}>
                <FloatingTOC toc={toc} enabled={showTOC} />
              </div>
            </div>
          </div>
          {/* 移动端浮动 ToC - 在布局外部渲染，只渲染移动端组件 */}
          <div className="md:hidden" style={{ display: 'contents' }}>
            <FloatingTOC toc={toc} enabled={showTOC} mobileOnly={true} />
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
