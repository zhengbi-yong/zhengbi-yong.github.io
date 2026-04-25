'use client'

import type { ReactNode } from 'react'
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
import { TableOfContents } from '@/components/navigation/TableOfContents'
import SectionContainer from '@/components/SectionContainer'
import { useReadingProgressWithApi } from '@/components/hooks/useReadingProgressWithApi'
import { SummaryRenderer } from '@/components/SummaryRenderer'

import '@/styles/monograph-theme.css'

interface LayoutProps {
  content: PostLayoutContent
  authorDetails: CoreContent<Authors>[]
  children: ReactNode
  toc?: TOC
  showTOC?: boolean
}

/**
 * Monograph article detail layout
 * Asymmetric editorial grid: gutter | content (~65ch) | sidenote (220px)
 * Metadata in header row, TOC in right sidenote column
 */
export default function PostLayoutMonograph({
  content,
  authorDetails,
  children,
  toc: tocProp,
  showTOC,
}: LayoutProps) {
  const { slug, urlPath, date, title, tags, summary, images, categorySegment } =
    resolvePostLayoutContent(content)
  const parsedDate = new Date(date)
  const hasValidDate = !Number.isNaN(parsedDate.getTime())
  const isoDate = hasValidDate ? parsedDate.toISOString() : undefined

  // Reading progress with API sync (login-protected)
  const { scrollPercentage } = useReadingProgressWithApi({
    postSlug: slug || urlPath,
    enabled: true,
  })

  // All published posts for prev/next navigation
  const { data: allPostsData } = usePosts({ limit: 100 })
  const allPosts = allPostsData?.posts || []

  // Related posts (same tag, for recommendation section)
  const { data: relatedPostsData } = usePosts({
    limit: 6,
    tag_slug: tags[0],
  })

  const recommendedPosts = relatedPostsData?.posts
    ?.filter((p) => p.slug !== slug && p.status === 'Published')
    ?.slice(0, 2) || []

  const wordCount = typeof children === 'string' ? children.split(/\s+/).length : 1000
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const formattedDate = hasValidDate
    ? parsedDate.toLocaleDateString(siteMetadata.locale, { month: 'short', day: 'numeric', year: 'numeric' })
    : date

  const toc = tocProp || []

  return (
    <div className="monograph-article min-h-screen">
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

      {/* Reading progress bar */}
      <div className="monograph-reading-progress">
        <div
          className="monograph-reading-progress-bar"
          style={{ width: `${Math.round(scrollPercentage * 100)}%` }}
          suppressHydrationWarning
        />
      </div>

      <main className="section-space-md px-4 sm:px-6">
        <SectionContainer variant="wide">
        {/* Article Header */}
        <header style={{
          maxWidth: 'none',
          textAlign: 'center',
          marginBottom: 'var(--space-3)',
          position: 'relative',
          overflow: 'hidden',
        }} className="surface-elevated rounded-[var(--radius-panel)] px-5 py-8 shadow-[var(--shadow-soft)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          {/* Hero image as background */}
          {images && images.length > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${images[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
              }}
            >
              {/* Gradient overlay for text readability */}
              <div
              style={{
                position: 'absolute',
                inset: 0,
              }}
              className="!bg-gradient-to-b !from-stone-100/90 !to-stone-100/95 dark:!from-[#0D0D0D]/90 dark:!to-[#0D0D0D]/95"
              />
            </div>
          )}
          {/* Header content above background */}
          <div style={{ position: 'relative', zIndex: 1 }}>
          {categorySegment && (
            <Link
              href={`/blog/category/${categorySegment}`}
              style={{
                fontFamily: 'var(--mono-font-sans)',
                fontSize: 'var(--font-size-xs)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.15em',
                color: 'var(--mono-accent)',
                textDecoration: 'none',
                display: 'inline-block',
                marginBottom: '0.75rem',
              }}
            >
              {categorySegment}
            </Link>
          )}
          <h1 style={{
            fontFamily: 'var(--mono-font-serif)',
            fontSize: 'var(--font-size-h1)',
            fontWeight: 400,
            lineHeight: 'var(--line-height-heading)',
            letterSpacing: '-0.02em',
            color: 'var(--mono-text)',
            marginBottom: 'var(--space-1)',
          }}>
            {title}
          </h1>
          {summary && (
            <div style={{
              fontFamily: 'var(--mono-font-serif)',
              fontSize: 'var(--font-size-h3)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 'var(--line-height-body)',
              color: 'var(--mono-text-muted)',
              marginBottom: 'var(--space-2)',
            }}>
              <SummaryRenderer summary={summary} />
            </div>
          )}
          {/* Metadata row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontFamily: 'var(--mono-font-sans)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--mono-text-muted)',
            paddingBottom: 'var(--space-2)',
            borderBottom: '1px solid var(--mono-border)',
          }}>
            <span>{authorDetails[0]?.name || siteMetadata.author}</span>
            <span style={{ color: 'var(--mono-border)' }}>·</span>
            <span>{formattedDate}</span>
            <span style={{ color: 'var(--mono-border)' }}>·</span>
            <span>{readingTime} 分钟阅读</span>
            {tags.length > 0 && (
              <>
                <span style={{ color: 'var(--mono-border)' }}>·</span>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '0.15em 0.5em',
                        border: '1px solid var(--mono-border)',
                        borderRadius: '2px',
                        color: 'var(--mono-text-muted)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          </div>
        </header>

        {/* Asymmetric Editorial Grid */}
        <div className="surface-elevated monograph-grid rounded-[var(--radius-panel)] px-5 py-8 shadow-[var(--shadow-soft)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          {/* Main content column */}
          <article className="monograph-content">
            {/* Article body */}
            <PostBackendIntegration slug={slug}>
              <div className="prose max-w-none w-full" style={{ color: 'var(--mono-text)', maxWidth: 'none' }}>
                {children}
              </div>
            </PostBackendIntegration>

            {/* Tags footer */}
            {tags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: 'var(--space-2)',
                paddingTop: 'var(--space-2)',
                borderTop: '1px solid var(--mono-border)',
              }}>
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    style={{
                      fontFamily: 'var(--mono-font-sans)',
                      fontSize: 'var(--font-size-xs)',
                      padding: '0.25em 0.75em',
                      border: '1px solid var(--mono-border)',
                      borderRadius: '2px',
                      color: 'var(--mono-text-muted)',
                      textDecoration: 'none',
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Recommended posts */}
            {recommendedPosts.length > 0 && (
              <section style={{ marginTop: 'var(--space-3)' }}>
                <h3 style={{
                  fontFamily: 'var(--mono-font-sans)',
                  fontSize: 'var(--font-size-xs)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.15em',
                  color: 'var(--mono-text-muted)',
                  marginBottom: 'var(--space-1)',
                }}>
                  相关推荐
                </h3>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  {recommendedPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      style={{
                        display: 'block',
                        padding: 'var(--space-1)',
                        border: '1px solid var(--mono-border)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <h4 style={{
                        fontFamily: 'var(--mono-font-serif)',
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 600,
                        color: 'var(--mono-text)',
                        marginBottom: '0.25rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {post.title}
                      </h4>
                      {post.summary && (
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--mono-text-muted)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}>
                          {post.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Post Navigation: prev / next */}
            {(() => {
              const publishedPosts = allPosts.filter((p) => p.status === 'Published')
              const sorted = [...publishedPosts].sort(
                (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
              )
              const currentIndex = sorted.findIndex((p) => p.slug === slug)
              const prevPost = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null
              const nextPost = currentIndex > 0 ? sorted[currentIndex - 1] : null
              if (!prevPost && !nextPost) return null
              return (
                <nav style={{
                  display: 'grid',
                  gridTemplateColumns: prevPost && nextPost ? '1fr 1fr' : '1fr',
                  gap: 'var(--space-1)',
                  marginTop: 'var(--space-3)',
                  paddingTop: 'var(--space-2)',
                  borderTop: '1px solid var(--mono-border)',
                  /* 手机端 prev/next 不会横向撑出 */
                  minWidth: 0,
                }}>
                  {prevPost ? (
                    <Link
                      href={`/blog/${prevPost.slug}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        padding: 'var(--space-1)',
                        border: '1px solid var(--mono-border)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        transition: 'border-color 0.2s',
                        /* 允许 flex 子项收缩，防止长标题撑出 */
                        minWidth: 0,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--mono-font-sans)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--mono-text-muted)',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.1em',
                      }}>← 上一篇</span>
                      <span style={{
                        fontFamily: 'var(--mono-font-serif)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--mono-text)',
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>{prevPost.title}</span>
                    </Link>
                  ) : <div />}
                  {nextPost ? (
                    <Link
                      href={`/blog/${nextPost.slug}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        padding: 'var(--space-1)',
                        border: '1px solid var(--mono-border)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        textAlign: 'right' as const,
                        transition: 'border-color 0.2s',
                        /* 允许 flex 子项收缩，防止长标题撑出 */
                        minWidth: 0,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--mono-font-sans)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--mono-text-muted)',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.1em',
                      }}>下一篇 →</span>
                      <span style={{
                        fontFamily: 'var(--mono-font-serif)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--mono-text)',
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>{nextPost.title}</span>
                    </Link>
                  ) : <div />}
                </nav>
              )
            })()}

            {/* Comments */}
            <section style={{
              marginTop: 'var(--space-3)',
              paddingTop: 'var(--space-2)',
              borderTop: '1px solid var(--mono-border)',
            }} id="comments">
              <BackendComments slug={slug} />
            </section>
          </article>

          {/* Sidenote column: TOC (desktop) + floating FAB (mobile/tablet) */}
          {showTOC !== false && toc.length > 0 && (
            <aside className="monograph-toc-aside">
              <TableOfContents toc={toc} />
            </aside>
          )}
        </div>
        </SectionContainer>
      </main>
    </div>
  )
}
