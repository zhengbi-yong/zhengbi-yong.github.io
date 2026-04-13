'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import SlideIn from '@/components/animations/SlideIn'
import { ListSkeleton } from '@/components/loaders'
import { useBlogStore } from '@/lib/store/blog-store'
import postPreloader from '@/lib/utils/post-preloader'

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
  // removed: unused segments variable
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

export default function ListLayout({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const [searchValue, setSearchValue] = useState('')
  const { allPosts, setAllPosts, isCacheValid, searchQuery, setSearchQuery } = useBlogStore()

  // 缓存管理：首次加载时写入缓存，后续优先使用缓存
  useEffect(() => {
    // 如果传入的 posts 不为空，且缓存无效或为空，则更新缓存
    if (posts.length > 0 && (!isCacheValid() || allPosts.length === 0)) {
      setAllPosts(posts)
    }
  }, [posts, allPosts.length, isCacheValid, setAllPosts])

  // 恢复搜索状态
  useEffect(() => {
    if (searchQuery) {
      setSearchValue(searchQuery)
    }
  }, [searchQuery])

  // 保存搜索状态
  useEffect(() => {
    setSearchQuery(searchValue)
  }, [searchValue, setSearchQuery])

  // 优先使用缓存的博客列表（如果缓存有效），否则使用传入的 posts
  const effectivePosts = useMemo(() => {
    if (isCacheValid() && allPosts.length > 0) {
      return allPosts
    }
    return posts
  }, [isCacheValid, allPosts, posts])

  // 激进预加载：页面加载后，使用 requestIdleCallback 批量预加载所有文章
  useEffect(() => {
    if (effectivePosts.length === 0) {
      return
    }

    // 提取所有文章的 slug
    const slugs = effectivePosts.map((post) => {
      // 从 path 中提取 slug（例如：blog/2024/01/post-name -> 2024/01/post-name）
      const pathParts = post.path.split('/')
      if (pathParts[0] === 'blog') {
        return pathParts.slice(1).join('/')
      }
      return post.path.replace(/^blog\//, '')
    })

    // 使用 requestIdleCallback 批量预加载（低优先级，不阻塞主线程）
    const preloadAllPosts = () => {
      postPreloader.preloadPosts(slugs, 'low')
      // 开始处理队列
      postPreloader.processQueueIdle()
    }

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadAllPosts, { timeout: 5000 })
      } else {
        // 降级方案：延迟 2 秒后执行
        setTimeout(preloadAllPosts, 2000)
      }
    }
  }, [effectivePosts])

  // 使用 useMemo 优化搜索过滤性能
  const filteredBlogPosts = useMemo(() => {
    if (!searchValue) return effectivePosts
    const lowerSearchValue = searchValue.toLowerCase()
    return effectivePosts.filter((post) => {
      const searchContent = post.title + post.summary + post.tags?.join(' ')
      return searchContent.toLowerCase().includes(lowerSearchValue)
    })
  }, [effectivePosts, searchValue])

  // If initialDisplayPosts exist, display it if no searchValue is specified
  const displayPosts = useMemo(() => {
    return initialDisplayPosts.length > 0 && !searchValue ? initialDisplayPosts : filteredBlogPosts
  }, [initialDisplayPosts, searchValue, filteredBlogPosts])

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
  }, [displayPosts.length, searchValue])

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
    if (visibleCount >= displayPosts.length || searchValue) return undefined

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
  }, [visibleCount, displayPosts.length, loadMore, searchValue])

  // 获取当前可见的文章列表
  const visiblePosts = useMemo(() => {
    return displayPosts.slice(0, visibleCount)
  }, [displayPosts, visibleCount])

  // 清除搜索
  const clearSearch = () => {
    setSearchValue('')
  }

  return (
    <>
      <div className="section-space-md mx-auto max-w-[var(--container-reading)]">
        <div className="border-b border-[var(--border-subtle)] pb-10 sm:pb-12">
          <div className="mb-8 text-center md:mb-10">
            <p className="mb-3 text-[11px] font-medium tracking-[0.28em] text-[var(--text-soft)] uppercase">
              Writing Archive
            </p>
            <h1 className="mx-auto mb-4 text-4xl leading-tight font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-[var(--text-soft)] sm:text-lg">
              探索我的技术见解和创作内容
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="relative mx-auto w-full max-w-2xl">
              <label className="block">
                <span className="sr-only">搜索</span>
                <input
                  aria-label="搜索"
                  type="text"
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="搜索文章标题、内容或标签..."
                  value={searchValue}
                  className="block w-full rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3.5 pr-12 pl-12 text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-fast)] placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-color)_18%,transparent)] focus:outline-none"
                />
              </label>
              <svg
                className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--text-faint)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchValue && (
                <button
                  onClick={clearSearch}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-[var(--text-faint)] transition-all duration-[var(--motion-fast)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                  aria-label="清除搜索"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {searchValue && (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-soft)]">
                <span>
                  找到{' '}
                  <span className="font-semibold text-[var(--brand-color)]">
                    {filteredBlogPosts.length}
                  </span>{' '}
                  篇文章
                </span>
                {filteredBlogPosts.length !== effectivePosts.length && (
                  <span className="text-[var(--text-faint)]">（共 {effectivePosts.length} 篇）</span>
                )}
              </div>
            )}
          </div>
        </div>

        <ul className="mt-8 space-y-3 sm:space-y-4">
          {!filteredBlogPosts.length && posts.length === 0 && (
            <li>
              <ListSkeleton itemCount={3} />
            </li>
          )}
          {!filteredBlogPosts.length && posts.length > 0 && (
            <li className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-6 py-8 text-center text-[var(--text-soft)] shadow-[var(--shadow-soft)]">
              No posts found.
            </li>
          )}
          {visiblePosts.map((post, index) => {
            const { path, date, title, summary, tags } = post
            return (
              <SlideIn
                key={path}
                direction="up"
                delay={Math.min(index * 0.05, 1)}
                className="py-0"
                whileInView={true}
              >
                <li>
                  <article className="group rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] transition-all duration-[var(--motion-base)] hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-medium)] sm:p-5">
                    <div className="space-y-3">
                      <div>
                        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                          <h3 className="text-xl leading-7 font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                            <Link
                              href={`/${path}`}
                              className="group/link relative transition-colors duration-[var(--motion-fast)] hover:text-[var(--brand-color)]"
                            >
                              <span className="relative">
                                {title}
                                <span className="absolute bottom-0 left-0 h-px w-0 bg-current transition-all duration-[var(--motion-base)] group-hover/link:w-full"></span>
                              </span>
                            </Link>
                          </h3>
                          <time
                            dateTime={date}
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
              </SlideIn>
            )
          })}
          {!searchValue && visibleCount < displayPosts.length && (
            <li ref={loadMoreRef} className="py-4 text-center">
              <div className="text-sm text-[var(--text-soft)]">
                加载更多文章... ({visibleCount} / {displayPosts.length})
              </div>
            </li>
          )}
        </ul>
      </div>
      {pagination && pagination.totalPages > 1 && !searchValue && (
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
      )}
    </>
  )
}
