import { ReactNode } from 'react'
import siteMetadata from '@/data/siteMetadata'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
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

// 导入游客界面主题样式
import '@/styles/visitor-theme.css'


const postDateTemplate: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: CoreContent<Blog>
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
  const { path, slug, date, title, tags, summary, images } = content
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

      {/* 阅读进度条 - 集成后端API */}
      <ReadingProgressWithApi postSlug={slug || path} />

      {/* 文章分析组件 - 使用 slug 作为文章ID */}
      <ArticleAnalytics articleId={slug || path} showDetails={false} compact={true} />
      <article className="visitor-article">
        <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
          <header className="pt-visitor-md pb-visitor-sm xl:pb-visitor-md">
            <div className="space-y-6 text-center">
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
                <PageTitle className="font-visitor-serif">{title}</PageTitle>
              </div>
            </div>
          </header>
          <div className="divide-y divide-gray-200 pb-visitor-lg md:grid md:grid-cols-[3fr_1fr] xl:grid-cols-[191fr_618fr_191fr] md:gap-x-4 xl:gap-x-8 md:divide-y-0 dark:divide-gray-700">
            {/* 左侧：目录 (TOC) - 在xl以下屏幕隐藏 */}
            <div className="hidden xl:flex xl:col-span-1 flex-shrink-0 flex-col">
              <div className="sticky top-20 flex flex-col h-full w-full" style={{ height: 'calc(100vh - 5rem)', maxHeight: 'calc(100vh - 5rem)' }}>
                <FloatingTOC toc={toc} enabled={showTOC} />
              </div>
            </div>

            {/* 中间：文章内容 - 沉浸式阅读体验 */}
            <div className="md:col-span-1 xl:col-span-1 dark:divide-gray-700 xl:px-4">
              <FadeIn delay={0.2} duration={0.6} whileInView={true}>
                <PostBackendIntegration slug={slug || path}>
                  <div className="prose prose-lg dark:prose-invert visitor-article prose-headings:font-visitor-serif prose-headings:font-semibold prose-p:text-visitor-base prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-visitor-lg prose-img:shadow-visitor-soft mx-auto w-full max-w-full min-w-0 pt-visitor-md pb-visitor-md sm:max-w-2xl md:max-w-none">
                    {children}
                  </div>
                </PostBackendIntegration>
              </FadeIn>
            </div>

            {/* 右侧：相关文章 + 评论区 - 整体sticky容器 */}
            <div className="hidden xl:flex xl:col-span-1 flex-shrink-0">
              {/* 整体sticky容器，固定三个部分的相对位置 */}
              <div className="sticky top-20 flex w-full flex-col" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
                  {/* 相关文章 - 38.2% */}
                  <div style={{ flex: '0 0 calc((100vh - 5rem) * 0.382)' }}>
                    <RecentArticles limit={3} currentSlug={slug} />
                  </div>

                  {/* 评论区（表单+列表）- 61.8% */}
                  <div className="flex flex-col gap-3" style={{ flex: '0 0 calc((100vh - 5rem) * 0.618)' }}>
                    {/* 评论表单 */}
                    <CommentForm slug={slug || path} />
                    {/* 评论列表 */}
                    <CommentListSimple slug={slug || path} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 文章底部的完整评论区 - 包含评论表单和评论列表 */}
          <div id="comments-section" className="mt-visitor-xl pt-visitor-lg border-t border-gray-200 dark:border-gray-700">
            <BackendComments slug={slug || path} />
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
