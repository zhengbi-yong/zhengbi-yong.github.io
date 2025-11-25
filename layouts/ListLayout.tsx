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
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex justify-between">
        {!prevPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!prevPage}>
            上一页
          </button>
        )}
        {prevPage && (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
          >
            上一页
          </Link>
        )}
        <span>
          {currentPage} / {totalPages} 页
        </span>
        {!nextPage && (
          <button className="cursor-auto disabled:opacity-50" disabled={!nextPage}>
            下一页
          </button>
        )}
        {nextPage && (
          <Link href={`/${basePath}/page/${currentPage + 1}`} rel="next">
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

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            {title}
          </h1>
          <div className="relative max-w-lg">
            <label>
              <span className="sr-only">搜索</span>
              <input
                aria-label="搜索"
                type="text"
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索"
                className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-900 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
            <svg
              className="absolute top-3 right-3 h-5 w-5 text-gray-400 dark:text-gray-300"
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
                  <article className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </dl>
                    <div className="space-y-3 xl:col-span-3">
                      <div>
                        <h3 className="text-2xl leading-8 font-bold tracking-tight">
                          <Link href={`/${path}`} className="text-gray-900 dark:text-gray-100">
                            {title}
                          </Link>
                        </h3>
                        <div className="flex flex-wrap">
                          {tags?.map((tag) => <Tag key={tag} text={tag} />)}
                        </div>
                      </div>
                      <div className="prose max-w-none text-gray-500 dark:text-gray-400">
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
