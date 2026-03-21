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
    <div className="space-y-2 pt-8 pb-8 md:space-y-5">
      <nav className="flex items-center justify-between gap-4">
        {!prevPage && (
          <button
            className="cursor-not-allowed rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 transition-all duration-200 dark:bg-gray-800 dark:text-gray-600"
            disabled={!prevPage}
          >
            上一页
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg border border-gray-200 bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
          >
            上一页
          </Link>
        )}
        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentPage} / {totalPages} 页
        </span>
        {!nextPage && (
          <button
            className="cursor-not-allowed rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 transition-all duration-200 dark:bg-gray-800 dark:text-gray-600"
            disabled={!nextPage}
          >
            下一页
          </button>
        )}
        {nextPage && (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg border border-gray-200 bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
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
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="pt-8 pb-10 md:pt-12 md:pb-12">
          {/* 标题区域 - 居中 */}
          <div className="mb-8 text-center md:mb-10">
            <h1 className="mx-auto mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-4xl leading-tight font-extrabold tracking-tight text-transparent sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg dark:text-gray-400">
              探索我的技术见解和创作内容
            </p>
          </div>

          {/* 搜索区域 - 居中 */}
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
                  className="focus:border-primary-500 focus:ring-primary-500/20 block w-full rounded-xl border border-gray-300 bg-white/90 px-4 py-3.5 pr-12 pl-12 text-gray-900 shadow-md backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 hover:shadow-lg focus:ring-2 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-gray-600"
                />
              </label>
              {/* 搜索图标 */}
              <svg
                className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
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
              {/* 清除按钮 */}
              {searchValue && (
                <button
                  onClick={clearSearch}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
            {/* 搜索结果计数 - 居中 */}
            {searchValue && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  找到{' '}
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {filteredBlogPosts.length}
                  </span>{' '}
                  篇文章
                </span>
                {filteredBlogPosts.length !== effectivePosts.length && (
                  <span className="text-gray-400 dark:text-gray-600">
                    （共 {effectivePosts.length} 篇）
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <ul>
          {!filteredBlogPosts.length && posts.length === 0 && (
            <li>
              <ListSkeleton itemCount={3} />
            </li>
          )}
          {!filteredBlogPosts.length && posts.length > 0 && (
            <li className="py-8 text-center text-gray-500 dark:text-gray-400">No posts found.</li>
          )}
          {visiblePosts.map((post, index) => {
            const { path, date, title, summary, tags } = post
            return (
              <SlideIn
                key={path}
                direction="up"
                delay={Math.min(index * 0.05, 1)} // 减少延迟，避免过长动画
                className="py-2"
                whileInView={true}
              >
                <li>
                  <article className="group hover:border-primary-300/50 dark:hover:border-primary-600/50 rounded-lg border border-gray-200/50 bg-white/60 p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 dark:border-gray-700/50 dark:bg-gray-900/60 dark:hover:shadow-gray-900/50">
                    <div className="space-y-2">
                      <div>
                        <div className="mb-1 flex flex-wrap items-baseline gap-2">
                          <h3 className="text-lg leading-6 font-bold tracking-tight">
                            <Link
                              href={`/${path}`}
                              className="hover:text-primary-600 dark:hover:text-primary-400 group/link relative text-gray-900 transition-colors duration-200 dark:text-gray-100"
                            >
                              <span className="relative">
                                {title}
                                <span className="bg-primary-500 dark:bg-primary-400 absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover/link:w-full"></span>
                              </span>
                            </Link>
                          </h3>
                          <time
                            dateTime={date}
                            className="flex-shrink-0 text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
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
                      <div className="prose max-w-none text-sm leading-snug text-gray-600 dark:text-gray-300">
                        {summary}
                      </div>
                    </div>
                  </article>
                </li>
              </SlideIn>
            )
          })}
          {/* 加载更多触发器 */}
          {!searchValue && visibleCount < displayPosts.length && (
            <li ref={loadMoreRef} className="py-4 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
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
