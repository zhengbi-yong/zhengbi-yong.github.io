'use client'

import { useState, useMemo, useEffect } from 'react'
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
  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
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
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed transition-all duration-200" 
            disabled={!prevPage}
          >
            上一页
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            上一页
          </Link>
        )}
        <span className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
          {currentPage} / {totalPages} 页
        </span>
        {!nextPage && (
          <button 
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed transition-all duration-200" 
            disabled={!nextPage}
          >
            下一页
          </button>
        )}
        {nextPage && (
          <Link 
            href={`/${basePath}/page/${currentPage + 1}`} 
            rel="next"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 shadow-sm hover:shadow-md"
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

  // 清除搜索
  const clearSearch = () => {
    setSearchValue('')
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="pt-8 pb-10 md:pt-12 md:pb-12">
          {/* 标题区域 - 居中 */}
          <div className="mb-8 md:mb-10 text-center">
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent mx-auto">
              {title}
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 sm:text-lg max-w-2xl mx-auto">
              探索我的技术见解和创作内容
            </p>
          </div>

          {/* 搜索区域 - 居中 */}
          <div className="space-y-4 flex flex-col items-center">
            <div className="relative w-full max-w-2xl mx-auto">
              <label className="block">
                <span className="sr-only">搜索</span>
                <input
                  aria-label="搜索"
                  type="text"
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="搜索文章标题、内容或标签..."
                  value={searchValue}
                  className="focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 block w-full rounded-xl border border-gray-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-3.5 pl-12 pr-12 text-gray-900 dark:text-gray-100 shadow-md transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg"
                />
              </label>
              {/* 搜索图标 */}
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
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
                  找到 <span className="font-semibold text-primary-600 dark:text-primary-400">{filteredBlogPosts.length}</span> 篇文章
                </span>
                {filteredBlogPosts.length !== effectivePosts.length && (
                  <span className="text-gray-400 dark:text-gray-600">（共 {effectivePosts.length} 篇）</span>
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
          {displayPosts.map((post, index) => {
            const { path, date, title, summary, tags } = post
            return (
              <SlideIn
                key={path}
                direction="up"
                delay={index * 0.1}
                className="py-4"
                whileInView={true}
              >
                <li>
                  <article className="group rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-primary-300/50 dark:hover:border-primary-600/50 xl:grid xl:grid-cols-4 xl:items-start xl:gap-6">
                    <dl className="mb-4 xl:mb-0">
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-sm leading-6 font-medium text-gray-500 dark:text-gray-400 xl:sticky xl:top-20">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </dl>
                    <div className="space-y-4 xl:col-span-3">
                      <div>
                        <h3 className="text-2xl leading-8 font-bold tracking-tight mb-3">
                          <Link 
                            href={`/${path}`} 
                            className="text-gray-900 dark:text-gray-100 transition-colors duration-200 hover:text-primary-600 dark:hover:text-primary-400 relative group/link"
                          >
                            <span className="relative">
                              {title}
                              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 dark:bg-primary-400 transition-all duration-300 group-hover/link:w-full"></span>
                            </span>
                          </Link>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {tags?.map((tag) => <Tag key={tag} text={tag} />)}
                        </div>
                      </div>
                      <div className="prose max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                        {summary}
                      </div>
                    </div>
                  </article>
                </li>
              </SlideIn>
            )
          })}
        </ul>
      </div>
      {pagination && pagination.totalPages > 1 && !searchValue && (
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
      )}
    </>
  )
}
