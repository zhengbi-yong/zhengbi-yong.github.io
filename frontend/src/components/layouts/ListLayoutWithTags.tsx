'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import tagData from '@/app/tag-data.json'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/page\/\d+$/, '') // Remove any trailing /page
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="section-space-sm pt-8 pb-8 md:pt-10 md:pb-10">
      <nav className="flex items-center justify-between gap-4 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-soft)]">
        {!prevPage && (
          <button
            className="cursor-not-allowed rounded-[calc(var(--radius-panel)-10px)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--text-faint)] opacity-70"
            disabled={!prevPage}
          >
            上一页
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
            className="rounded-[calc(var(--radius-panel)-10px)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-fast)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--brand-color)]"
          >
            上一页
          </Link>
        )}
        <span className="rounded-[calc(var(--radius-panel)-10px)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
          {currentPage} / {totalPages} 页
        </span>
        {!nextPage && (
          <button
            className="cursor-not-allowed rounded-[calc(var(--radius-panel)-10px)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--text-faint)] opacity-70"
            disabled={!nextPage}
          >
            下一页
          </button>
        )}
        {nextPage && (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="rounded-[calc(var(--radius-panel)-10px)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-fast)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--brand-color)]"
          >
            下一页
          </Link>
        )}
      </nav>
    </div>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const pathname = usePathname()
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  // 分批渲染状态
  const [visibleCount, setVisibleCount] = useState(15) // 初始显示15篇
  const loadMoreRef = useRef<HTMLLIElement>(null)
  const isLoadingRef = useRef(false)
  const lastLoadTimeRef = useRef(0)

  // 重置可见数量当文章列表变化时
  useEffect(() => {
    setVisibleCount(15)
    isLoadingRef.current = false
    lastLoadTimeRef.current = 0
  }, [displayPosts.length])

  // 分批加载更多文章
  const loadMore = useCallback(() => {
    // 防止重复加载：如果正在加载或已达到上限，则返回
    if (isLoadingRef.current || visibleCount >= displayPosts.length) return undefined

    // 节流：距离上次加载至少100ms
    const now = Date.now()
    if (now - lastLoadTimeRef.current < 100) return

    isLoadingRef.current = true
    lastLoadTimeRef.current = now

    // 使用 requestAnimationFrame 确保在下一帧渲染
    requestAnimationFrame(() => {
      setVisibleCount((prev) => {
        const next = Math.min(prev + 15, displayPosts.length)
        isLoadingRef.current = false
        return next
      })
    })
  }, [visibleCount, displayPosts.length])

  // 使用 Intersection Observer + 滚动事件监听，确保滚动时持续加载
  useEffect(() => {
    if (visibleCount >= displayPosts.length) return undefined

    let observer: IntersectionObserver | null = null
    let scrollTimeout: NodeJS.Timeout | null = null

    // Intersection Observer：检测加载触发器是否进入视口
    const setupObserver = () => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadMore()
            }
          })
        },
        {
          rootMargin: '500px', // 提前500px开始加载，让加载更早触发
          threshold: 0,
        }
      )

      const currentRef = loadMoreRef.current
      if (currentRef) {
        observer.observe(currentRef)
      }
    }

    // 滚动事件监听：作为补充，确保滚动时持续加载
    const handleScroll = () => {
      if (visibleCount >= displayPosts.length) return

      // 清除之前的定时器
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      // 防抖：滚动停止后100ms检查是否需要加载
      scrollTimeout = setTimeout(() => {
        const currentRef = loadMoreRef.current
        if (currentRef) {
          const rect = currentRef.getBoundingClientRect()
          const windowHeight = window.innerHeight || document.documentElement.clientHeight

          // 如果加载触发器在视口下方500px内，则加载更多
          if (rect.top < windowHeight + 500) {
            loadMore()
          }
        }
      }, 100)
    }

    setupObserver()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleScroll, { passive: true })

    return () => {
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [visibleCount, displayPosts.length, loadMore])

  // 获取当前可见的文章列表
  const visiblePosts = useMemo(() => {
    return displayPosts.slice(0, visibleCount)
  }, [displayPosts, visibleCount])

  return (
    <>
      <div className="section-space-md mx-auto max-w-[min(100%,var(--container-content)+18rem)]">
        <div className="border-b border-[var(--border-subtle)] pb-10 sm:pb-12">
          <div className="mb-8 text-center md:mb-10">
            <p className="mb-3 text-[11px] font-medium tracking-[0.28em] text-[var(--text-soft)] uppercase">
              Topics & Tags
            </p>
            <h1 className="mx-auto text-4xl leading-tight font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl md:text-6xl">
              {title}
            </h1>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start">
          <aside className="surface-elevated hidden max-h-[calc(100vh-7rem)] overflow-auto rounded-[var(--radius-panel)] p-5 lg:sticky lg:top-24 lg:block">
            <div>
              {pathname.startsWith('/blog') ? (
                <h3 className="text-[11px] font-semibold tracking-[0.24em] text-[var(--brand-color)] uppercase">
                  All Posts
                </h3>
              ) : (
                <Link
                  href={`/blog`}
                  className="text-[11px] font-semibold tracking-[0.24em] text-[var(--text-primary)] uppercase transition-colors duration-[var(--motion-fast)] hover:text-[var(--brand-color)]"
                >
                  All Posts
                </Link>
              )}
              <ul className="mt-4 space-y-2.5">
                {sortedTags.map((t) => {
                  const isActive = decodeURI(pathname.split('/tags/')[1]) === slug(t)
                  return (
                    <li key={t}>
                      {isActive ? (
                        <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--brand-color)_14%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--brand-color)]">
                          {`${t} (${tagCounts[t]})`}
                        </span>
                      ) : (
                        <Link
                          href={`/tags/${slug(t)}`}
                          className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-[var(--text-soft)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--brand-color)]"
                          aria-label={`View posts tagged ${t}`}
                        >
                          {`${t} (${tagCounts[t]})`}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>

          <div>
            <ul className="space-y-3 sm:space-y-4">
              {visiblePosts.map((post) => {
                const { path, date, title, summary, tags } = post
                return (
                  <li key={path}>
                    <article className="group rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-base)] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-medium)] sm:p-5">
                      <div className="space-y-3">
                        <div>
                          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                            <h2 className="text-xl leading-7 font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                              <Link
                                href={`/${path}`}
                                className="group/link relative transition-colors duration-[var(--motion-fast)] hover:text-[var(--brand-color)]"
                              >
                                <span className="relative">
                                  {title}
                                  <span className="absolute bottom-0 left-0 h-px w-0 bg-current transition-all duration-[var(--motion-base)] group-hover/link:w-full"></span>
                                </span>
                              </Link>
                            </h2>
                            <time
                              dateTime={date}
                              suppressHydrationWarning
                              className="flex-shrink-0 text-xs font-medium tracking-[0.08em] whitespace-nowrap text-[var(--text-soft)] uppercase"
                            >
                              {formatDate(date, siteMetadata.locale)}
                            </time>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {tags?.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-sm leading-relaxed text-[var(--text-soft)]">
                          {summary}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
              {visibleCount < displayPosts.length && (
                <li ref={loadMoreRef} className="py-4 text-center">
                  <div className="text-sm text-[var(--text-soft)]">
                    加载更多文章... ({visibleCount} / {displayPosts.length})
                  </div>
                </li>
              )}
            </ul>
            {pagination && pagination.totalPages > 1 && (
              <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
