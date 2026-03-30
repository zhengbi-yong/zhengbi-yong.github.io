'use client'

import { ReactNode, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import siteMetadata from '@/data/siteMetadata'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors } from 'contentlayer/generated'
import JsonLd from '@/components/seo/JsonLd'
import { PostBackendIntegration } from '@/components/post/PostBackendIntegration'
import { BackendComments } from '@/components/post/BackendComments'
import type { TOC } from '@/lib/types/toc'
import { resolvePostLayoutContent, type PostLayoutContent } from './postLayoutContent'
import { usePosts } from '@/lib/hooks/useBlogData'

import '@/styles/monograph-theme.css'

interface LayoutProps {
  content: PostLayoutContent
  authorDetails: CoreContent<Authors>[]
  children: ReactNode
  toc?: TOC
  showTOC?: boolean
}

/**
 * 文章详情页布局
 * 简洁三栏布局：左侧目录 | 中间文章内容 | 右侧元数据
 */
export default function PostLayoutMonograph({
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

  const [readingProgress, setReadingProgress] = useState(0)
  const [activeSection, setActiveSection] = useState('')

  // 获取相关文章推荐
  const { data: relatedPostsData } = usePosts({
    limit: 6,
    tag_slug: tags[0],
  })

  const recommendedPosts = relatedPostsData?.posts
    ?.filter((p) => p.slug !== slug && p.status === 'Published')
    ?.slice(0, 2) || []

  // 处理阅读进度
  const handleScroll = useCallback(() => {
    const totalHeight = document.body.scrollHeight - window.innerHeight
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
    setReadingProgress(Math.min(100, Math.max(0, progress)))

    if (toc && toc.length > 0) {
      const sections = toc.map((item) => item.url.replace('#', ''))
      let current = ''

      sections.forEach((section) => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 120) {
            current = section
          }
        }
      })

      setActiveSection(current)
    }
  }, [toc])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 计算阅读时间
  const wordCount = typeof children === 'string' ? children.split(/\s+/).length : 1000
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // 格式化日期
  const formattedDate = hasValidDate
    ? parsedDate.toLocaleDateString(siteMetadata.locale, { month: 'short', day: 'numeric', year: 'numeric' })
    : date

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={{
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
      }} />

      {/* 阅读进度条 */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-border z-40">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main className="pt-24 md:pt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 文章头部 */}
        <header className="mb-8 pb-8 border-b border-border">
          <div className="max-w-3xl">
            {categorySegment && (
              <Link
                href={`/blog/category/${categorySegment}`}
                className="inline-block text-xs font-medium text-primary mb-3 hover:underline"
              >
                {categorySegment}
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {summary}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>{authorDetails[0]?.name || siteMetadata.author}</span>
              <span className="text-border">·</span>
              <span>{formattedDate}</span>
              <span className="text-border">·</span>
              <span>{readingTime} 分钟阅读</span>
            </div>
          </div>
        </header>

        {/* 三栏布局 - 黄金比例 */}
        <div className="lg:grid lg:grid-cols-[16%_68%_16%] lg:gap-8">
          {/* 左栏：元数据 */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              {/* 作者信息 */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  作者
                </h3>
                <p className="text-sm font-medium text-foreground">
                  {authorDetails[0]?.name || siteMetadata.author}
                </p>
              </div>

              {/* 发布信息 */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  发布于
                </h3>
                <p className="text-sm text-foreground">
                  {formattedDate}
                </p>
              </div>

              {/* 阅读时间 */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  阅读时长
                </h3>
                <p className="text-sm text-foreground">
                  约 {readingTime} 分钟
                </p>
              </div>

              {/* 关键词 */}
              {tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    标签
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 5).map((tag) => (
                      <Link
                        key={tag}
                        href={`/tags/${tag}`}
                        className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* 中栏：文章内容 */}
          <article className="min-w-0 w-full">
            {/* 封面图 */}
            {images && images.length > 0 && (
              <figure className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={images[0]}
                  alt={title}
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </figure>
            )}

            {/* 文章正文 */}
            <PostBackendIntegration slug={slug}>
              <div className="monograph-content prose prose-lg dark:prose-invert max-w-none w-full">
                {children}
              </div>
            </PostBackendIntegration>

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* 推荐文章 */}
            {recommendedPosts.length > 0 && (
              <section className="mt-12">
                <h3 className="text-sm font-semibold text-foreground mb-4">相关推荐</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {recommendedPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                    >
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      {post.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {post.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 评论 */}
            <section className="mt-12 pt-8 border-t border-border" id="comments">
              <BackendComments slug={slug} />
            </section>
          </article>

          {/* 右栏：目录 */}
          <aside className="hidden lg:block">
            {toc && toc.length > 0 && (
              <div className="sticky top-20">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  目录
                </h3>
                <nav className="space-y-1">
                  {toc.map((item, index) => {
                    const id = item.url.replace('#', '')
                    const isActive = activeSection === id
                    return (
                      <button
                        key={`toc-${index}-${item.url}`}
                        onClick={() => {
                          const element = document.getElementById(id)
                          if (element) {
                            const offset = 80
                            const top = element.getBoundingClientRect().top + window.scrollY - offset
                            window.scrollTo({ top, behavior: 'smooth' })
                          }
                        }}
                        className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                          isActive
                            ? 'text-primary font-medium bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-xs text-muted-foreground/50 mr-1">{index + 1}.</span>
                        {item.value}
                      </button>
                    )
                  })}
                </nav>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
