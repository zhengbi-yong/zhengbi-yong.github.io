import { ReactNode } from 'react'
import siteMetadata from '@/data/siteMetadata'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors } from 'contentlayer/generated'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import FadeIn from '@/components/animations/FadeIn'
import FloatingTOC from '@/components/FloatingTOC'
import JsonLd from '@/components/seo/JsonLd'
import type { TOC } from '@/lib/types/toc'
import { ReadingProgressWithApi } from '@/components/ReadingProgressWithApi'
import ArticleAnalytics from '@/components/ArticleAnalytics'
import { RecentArticles } from '@/components/RecentArticles'
import { PostBackendIntegration } from '@/components/post/PostBackendIntegration'
import { CommentForm } from '@/components/post/CommentForm'
import { CommentListSimple } from '@/components/post/CommentListSimple'
import { BackendComments } from '@/components/post/BackendComments'
import { resolvePostLayoutContent, type PostLayoutContent } from './postLayoutContent'

import '@/styles/visitor-theme.css'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: PostLayoutContent
  authorDetails: CoreContent<Authors>[]
  children: ReactNode
  toc?: TOC
  showTOC?: boolean
}

export default function PostLayout({
  content,
  authorDetails,
  children,
  toc,
  showTOC,
}: LayoutProps) {
  const { slug, urlPath, date, title, tags, summary, images, categorySegment } =
    resolvePostLayoutContent(content)
  const parsedDate = new Date(date)
  const hasValidDate = !Number.isNaN(parsedDate.getTime())
  const isoDate = hasValidDate ? parsedDate.toISOString() : undefined

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: summary,
    image: images[0] ? `${siteMetadata.siteUrl}${images[0]}` : siteMetadata.socialBanner,
    datePublished: isoDate,
    dateModified: isoDate,
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
      '@id': `${siteMetadata.siteUrl}${urlPath}`,
    },
    keywords: tags.join(', '),
    inLanguage: siteMetadata.locale,
  }

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
      ...(categorySegment
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: categorySegment.charAt(0).toUpperCase() + categorySegment.slice(1),
              item: `${siteMetadata.siteUrl}/blog/category/${categorySegment}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: categorySegment ? 4 : 3,
        name: title,
        item: `${siteMetadata.siteUrl}${urlPath}`,
      },
    ],
  }

  return (
    <SectionContainer>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <ReadingProgressWithApi postSlug={slug} />
      <ArticleAnalytics articleId={slug} showDetails={false} compact={true} />

      <article className="visitor-article">
        <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-visitor-md pb-visitor-sm xl:pb-visitor-md">
            <div className="space-y-6 text-center">
              <dl>
                <div>
                  <dt className="sr-only">Published on</dt>
                  <dd className="mb-6 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
                    <time dateTime={isoDate || date}>
                      {hasValidDate
                        ? parsedDate.toLocaleDateString(siteMetadata.locale, postDateTemplate)
                        : date}
                    </time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle className="font-visitor-serif">{title}</PageTitle>
              </div>
            </div>
          </header>

          <div className="divide-y divide-gray-200 pb-visitor-lg md:grid md:grid-cols-[3fr_1fr] xl:grid-cols-[191fr_618fr_191fr] md:gap-x-4 xl:gap-x-8 md:divide-y-0 dark:divide-gray-700">
            <div className="hidden xl:flex xl:col-span-1 flex-shrink-0 flex-col">
              <div
                className="sticky top-20 flex h-full w-full flex-col"
                style={{ height: 'calc(100vh - 5rem)', maxHeight: 'calc(100vh - 5rem)' }}
              >
                <FloatingTOC toc={toc} enabled={showTOC} />
              </div>
            </div>

            <div className="md:col-span-1 xl:col-span-1 dark:divide-gray-700 xl:px-4">
              <FadeIn delay={0.2} duration={0.6} whileInView={true}>
                <PostBackendIntegration slug={slug}>
                  <div className="prose prose-lg dark:prose-invert visitor-article prose-headings:font-visitor-serif prose-headings:font-semibold prose-p:text-visitor-base prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-visitor-lg prose-img:shadow-visitor-soft mx-auto w-full max-w-full min-w-0 pt-visitor-md pb-visitor-md sm:max-w-2xl md:max-w-none">
                    {children}
                  </div>
                </PostBackendIntegration>
              </FadeIn>
            </div>

            <div className="hidden xl:flex xl:col-span-1 flex-shrink-0">
              <div className="sticky top-20 flex w-full flex-col" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
                  <div style={{ flex: '0 0 calc((100vh - 5rem) * 0.382)' }}>
                    <RecentArticles limit={3} currentSlug={slug} />
                  </div>

                  <div className="flex flex-col gap-3" style={{ flex: '0 0 calc((100vh - 5rem) * 0.618)' }}>
                    <CommentForm slug={slug} />
                    <CommentListSimple slug={slug} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            id="comments-section"
            className="mt-visitor-xl pt-visitor-lg border-t border-gray-200 dark:border-gray-700"
          >
            <BackendComments slug={slug} />
          </div>

          <div className="md:hidden" style={{ display: 'contents' }}>
            <FloatingTOC toc={toc} enabled={showTOC} mobileOnly={true} />
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
