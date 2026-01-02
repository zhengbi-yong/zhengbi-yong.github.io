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
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const basePath = pathname
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/page\/\d+$/, '') // Remove any trailing /page
  console.log(pathname)
  console.log(basePath)
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            Previous
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            Previous
          </Link>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            Next
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
            Next
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
    if (isLoadingRef.current || visibleCount >= displayPosts.length) return

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
    if (visibleCount >= displayPosts.length) return

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
      <div>
        <div className="pt-6 pb-6">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:hidden sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {title}
          </h1>
        </div>
        <div className="flex sm:space-x-24">
          <div className="hidden h-full max-h-screen max-w-[280px] min-w-[280px] flex-wrap overflow-auto rounded-sm bg-gray-50 pt-5 shadow-md sm:flex dark:bg-gray-900/70 dark:shadow-gray-800/40">
            <div className="px-6 py-4">
              {pathname.startsWith('/blog') ? (
                <h3 className="text-primary-500 font-bold uppercase">All Posts</h3>
              ) : (
                <Link
                  href={`/blog`}
                  className="hover:text-primary-500 dark:hover:text-primary-500 font-bold text-gray-700 uppercase dark:text-gray-300"
                >
                  All Posts
                </Link>
              )}
              <ul>
                {sortedTags.map((t) => {
                  return (
                    <li key={t} className="my-3">
                      {decodeURI(pathname.split('/tags/')[1]) === slug(t) ? (
                        <h3 className="text-primary-500 inline px-3 py-2 text-sm font-bold uppercase">
                          {`${t} (${tagCounts[t]})`}
                        </h3>
                      ) : (
                        <Link
                          href={`/tags/${slug(t)}`}
                          className="hover:text-primary-500 dark:hover:text-primary-500 px-3 py-2 text-sm font-medium text-gray-500 uppercase dark:text-gray-300"
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
          </div>
          <div>
            <ul>
              {visiblePosts.map((post) => {
                const { path, date, title, summary, tags } = post
                return (
                  <li key={path} className="py-2">
                    <article className="flex flex-col space-y-1.5">
                      <div className="space-y-2">
                        <div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h2 className="text-lg leading-6 font-bold tracking-tight">
                              <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
                                {title}
                              </Link>
                            </h2>
                            <time
                              dateTime={date}
                              suppressHydrationWarning
                              className="flex-shrink-0 text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
                            >
                              {formatDate(date, siteMetadata.locale)}
                            </time>
                          </div>
                          <div className="flex flex-wrap">
                            {tags?.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-sm leading-snug text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
              {/* 加载更多触发器 */}
              {visibleCount < displayPosts.length && (
                <li ref={loadMoreRef} className="py-4 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
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
