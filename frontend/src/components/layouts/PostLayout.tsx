'use client'

import { ReactNode, useRef, useCallback, useState } from 'react'
import siteMetadata from '@/data/siteMetadata'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors } from 'contentlayer/generated'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import FadeIn from '@/components/animations/FadeIn'
import { TableOfContents } from '@/components/navigation/TableOfContents'
import ReadingProgressBar from '@/components/ReadingProgressBar'
import JsonLd from '@/components/seo/JsonLd'
import ArticleAnalytics from '@/components/ArticleAnalytics'
import { PostBackendIntegration } from '@/components/post/PostBackendIntegration'
import { RecentArticles } from '@/components/RecentArticles'
import { CommentDrawer } from '@/components/post/CommentDrawer'
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

  // Golden ratio: 1/ phi = 0.618 (small) | 1 / phi = 1.618 (large)
  const PHI = 0.618 // golden ratio constant
 const ASyMM_PHI = 1.618 // golden ratio small padding

  return (
    <SectionContainer>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <ReadingProgressBar />
      <ArticleAnalytics articleId={slug} showDetails={false} compact={true} />

      {/* Main article wrapper with micro-interactions */}
      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="visitor-article"
      >
        <header className="pt-visitor-md pb-visitor-sm xl:pb-visitor-md">
          {/* Date badge with micro-interaction */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <dt className="sr-only">Published on</dt>
            <motion.dd
              whileInView={{ once: true }}
              className="text-sm leading-6 font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200"
            >
              <time dateTime={isoDate || date}>
                {hasValidDate
                  ? parsedDate.toLocaleDateString(siteMetadata.locale, postDateTemplate)
                  : date}
              </time>
            </dd>
          </dl>

          {/* Title with stagger animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-2"
          >
            <div>
              <PageTitle className="font-visitor-serif">{title}</PageTitle>
            </div>

            {/* Tags with micro-interaction */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              {tags.map((tag, tagIndex) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 + tagIndex * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className={`
                    visitor-tag cursor-pointer
                    inline-flex items-center px-3 py-1 text-sm font-medium
                    text-gray-600 dark:text-gray-400
                    bg-gray-100 dark:bg-gray-800 rounded-full
                    transition-all duration-150
                  `}
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </header>

        {/* Golden-ratio asymmetric layout */}
        {/* Left column (38.2%) - TOC | Content (61.8%) - Right column (recent + comments FAB) */}
        <div className="divide-y divide-gray-200 pb-visitor-lg md:grid md:grid-cols-1 xl:grid-cols-[382fr_618fr_618fr_191fr] md:gap-x-4 xl:gap-x-10 md:divide-y-0 dark:divide-gray-700">
          {/* Left: Sticky TOC (38.2% = golden ratio small) */}
          <div className="hidden xl:flex xl:col-span-1 flex-shrink-0 flex-col">
            <div
              className="sticky top-20 flex h-full w-full flex-col"
              style={{ height: 'calc(100vh - 5rem)', maxHeight: 'calc(100vh - 5rem)' }}
            >
              <TableOfContents toc={toc} enabled={showTOC} />
            </div>
          </div>

          {/* Center: Article content (61.8% = golden ratio large) */}
          <div className="md:col-span-1 xl:col-span-1 dark:divide-gray-700 xl:px-4">
            <FadeIn delay={0.2} duration={0.6} whileInView={true}>
              <PostBackendIntegration slug={slug}>
                <div className="prose prose-lg dark:prose-invert visitor-article prose-headings:font-visitor-serif prose-headings:font-semibold prose-p:text-visitor-base prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-visitor-lg prose-img:shadow-visitor-soft mx-auto w-full max-w-full min-w-0 pt-visitor-md pb-visitor-md sm:max-w-2xl md:max-w-none">
                  {children}
                </div>
              </PostBackendIntegration>
            </FadeIn>
          </div>

          {/* Right column (hidden on desktop, FAB on mobile) */}
          <div className="hidden xl:flex xl:col-span-1 flex-shrink-0">
            <div className="sticky top-20 flex w-full flex-col" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
                <div style={{ flex: '0 0 calc((100vh - 5rem) * 0.382)' }}>
                  <RecentArticles limit={3} currentSlug={slug} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section - Full comments on mobile/tablet */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          id="comments-section"
          className="mt-visitor-lg pt-visitor-lg border-t border-gray-200 dark:border-gray-700 md:hidden xl:hidden"
        >
          <BackendComments slug={slug} />
        </motion.div>

        {/* Mobile floating TOC */}
        <div className="md:hidden xl:hidden" style={{ display: 'contents' }}>
          <TableOfContents toc={toc} enabled={showTOC} mobileOnly={true} />
        </div>

        {/* Comment FAB - Always visible */}
        <CommentDrawer slug={slug} />
      </motion.article>
    </SectionContainer>
  )
}
