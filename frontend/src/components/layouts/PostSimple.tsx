import { ReactNode } from 'react'
import { formatDate } from 'pliny/utils/formatDate'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import FloatingTOC from '@/components/FloatingTOC'
import type { TOC } from '@/lib/types/toc'
import { ReadingProgressWithApi } from '@/components/ReadingProgressWithApi'
import { resolvePostLayoutContent, type PostLayoutContent } from './postLayoutContent'

import { cn } from '@/lib/utils'

interface LayoutProps {
  content: PostLayoutContent
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  toc?: TOC
  showTOC?: boolean
}

export default function PostLayout({ content, next, prev, children, toc, showTOC }: LayoutProps) {
  const { path, slug, date, title } = resolvePostLayoutContent(content)
  const parsedDate = new Date(date)
  const hasValidDate = !Number.isNaN(parsedDate.getTime())

  return (
    <SectionContainer variant="reading" className="section-space-md">
      <ReadingProgressWithApi postSlug={slug || path} />

      <article className="surface-elevated overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] shadow-[var(--shadow-soft)]">
        <div className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <header>
            <div className="space-y-3 border-b border-[var(--border-subtle)] pb-8 text-center sm:pb-10">
              <dl>
                <div>
                  <dt className="sr-only">Published on</dt>
                  <dd className="text-sm leading-6 font-medium tracking-[0.08em] text-[var(--text-soft)] uppercase">
                    <time dateTime={date}>
                      {hasValidDate ? formatDate(date, siteMetadata.locale) : date}
                    </time>
                  </dd>
                </div>
              </dl>
              <div>
                <PageTitle className="text-[var(--text-primary)]">{title}</PageTitle>
              </div>
            </div>
          </header>

          <div className="divide-y divide-[var(--border-subtle)] pb-2 md:grid md:grid-cols-[minmax(0,3fr)_minmax(14rem,1fr)] md:gap-x-8 md:divide-y-0 lg:gap-x-10">
            <div className="min-w-0 md:col-span-1">
              <div className="prose dark:prose-invert max-w-none pt-8 pb-8 text-[var(--text-primary)]">{children}</div>
              {siteMetadata.comments && (
                <div className="border-t border-[var(--border-subtle)] pt-6 pb-6 text-center text-[var(--text-soft)]" id="comment">
                  <Comments slug={slug} />
                </div>
              )}
              <footer>
                <div className="flex flex-col gap-4 pt-4 text-sm font-medium sm:flex-row sm:justify-between sm:text-base md:pt-8">
                  {prev && prev.path && (
                    <div>
                      <Link
                        href={`/${prev.path}`}
                        className="text-[var(--brand-color)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--text-primary)]"
                        aria-label={`Previous post: ${prev.title}`}
                      >
                        &larr; {prev.title}
                      </Link>
                    </div>
                  )}
                  {next && next.path && (
                    <div className={cn(!prev && 'sm:ml-auto')}>
                      <Link
                        href={`/${next.path}`}
                        className="text-[var(--brand-color)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--text-primary)]"
                        aria-label={`Next post: ${next.title}`}
                      >
                        {next.title} &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </footer>
            </div>

            <div className="hidden md:sticky md:top-20 md:col-span-1 md:block md:self-start">
              <div className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 lg:p-5">
                <FloatingTOC toc={toc} enabled={showTOC} />
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <FloatingTOC toc={toc} enabled={showTOC} mobileOnly={true} />
          </div>
        </div>
      </article>
    </SectionContainer>
  )
}
