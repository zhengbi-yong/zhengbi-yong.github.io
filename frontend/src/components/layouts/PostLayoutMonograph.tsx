'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import siteMetadata from '@/data/siteMetadata'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors } from 'contentlayer/generated'
import JsonLd from '@/components/seo/JsonLd'
import { PostBackendIntegration } from '@/components/post/PostBackendIntegration'
import { DEFAULT_COVER_IMAGE } from '@/lib/utils/default-image'
import { BackendComments } from '@/components/post/BackendComments'
import type { TOC } from '@/lib/types/toc'
import { resolvePostLayoutContent, type PostLayoutContent } from './postLayoutContent'
import { usePosts } from '@/lib/hooks/useBlogData'
import { MonographTOC } from './MonographTOC'

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
  showTOC: _showTOC,
}: LayoutProps) {
  const { slug, urlPath, date, title, tags, summary, images, categorySegment } =
    resolvePostLayoutContent(content)
  const parsedDate = new Date(date)
  const hasValidDate = !Number.isNaN(parsedDate.getTime())
  const isoDate = hasValidDate ? parsedDate.toISOString() : undefined

  const [readingProgress, setReadingProgress] = useState(0)

  // Related posts
  const { data: relatedPostsData } = usePosts({
    limit: 6,
    tag_slug: tags[0],
  })

  const recommendedPosts = relatedPostsData?.posts
    ?.filter((p) => p.slug !== slug && p.status === 'Published')
    ?.slice(0, 2) || []

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main style={{ padding: '6rem 1rem 0' }}>
        {/* Article Header */}
        <header style={{
          maxWidth: 'min(80ch, 90%)',
          margin: '0 auto',
          textAlign: 'center',
          marginBottom: 'var(--space-3)',
        }}>
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
            <p style={{
              fontFamily: 'var(--mono-font-serif)',
              fontSize: 'var(--font-size-h3)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 'var(--line-height-body)',
              color: 'var(--mono-text-muted)',
              marginBottom: 'var(--space-2)',
            }}>
              {summary}
            </p>
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
        </header>

        {/* Asymmetric Editorial Grid */}
        <div className="monograph-grid">
          {/* Main content column */}
          <article className="monograph-content">
            {/* Cover image */}
            <figure style={{ marginBottom: 'var(--space-2)' }}>
              <img
                src={(images && images.length > 0) ? images[0] : DEFAULT_COVER_IMAGE}
                alt={title}
                style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '4px' }}
                loading="eager"
              />
            </figure>

            {/* Article body */}
            <PostBackendIntegration slug={slug}>
              <div className="prose max-w-none w-full" style={{ color: 'var(--mono-text)' }}>
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
          <MonographTOC toc={toc} />
        </div>
      </main>
    </div>
  )
}
