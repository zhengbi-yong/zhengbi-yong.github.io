'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useCategories, usePosts } from '@/lib/hooks/useBlogData'

const POSTS_PER_PAGE = 200

export default function ApiBlogPage() {
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts({
    status: 'Published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: POSTS_PER_PAGE,
    page,
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const categories = Array.isArray(categoriesData) ? categoriesData : []

  const postsByCategory = useMemo(() => {
    if (!postsData?.posts) {
      return {}
    }

    const grouped: Record<string, typeof postsData.posts> = {
      all: postsData.posts,
    }

    postsData.posts.forEach((post) => {
      const categorySlug = post.category_slug || 'uncategorized'
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = []
      }
      grouped[categorySlug].push(post)
    })

    return grouped
  }, [postsData?.posts])

  const filteredPosts = useMemo(() => {
    const posts = postsByCategory[selectedCategory || 'all'] || []

    if (!searchQuery.trim()) {
      return posts
    }

    const query = searchQuery.toLowerCase()
    return posts.filter((post) => {
      return post.title.toLowerCase().includes(query) || post.summary?.toLowerCase().includes(query)
    })
  }, [postsByCategory, searchQuery, selectedCategory])

  const displayPosts = selectedCategory || searchQuery ? filteredPosts : postsData?.posts || []
  const totalPages = Math.max(1, Math.ceil((postsData?.total || 0) / POSTS_PER_PAGE))

  if (postsLoading || categoriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (postsError || !postsData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">加载失败</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {postsError instanceof Error ? postsError.message : '无法加载文章列表，请稍后重试。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen py-8">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold">博客</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
            <span>共 {postsData.total} 篇文章</span>
            {selectedCategory && <span>分类: {selectedCategory}</span>}
            {searchQuery && <span>搜索: "{searchQuery}"</span>}
          </div>
        </div>

        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索文章..."
            className="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-lg px-4 py-2 transition-colors ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
          >
            全部 ({postsData.total})
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              className={`rounded-lg px-4 py-2 transition-colors ${
                selectedCategory === category.slug
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              {category.name} ({category.post_count || 0})
            </button>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-lg bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl dark:bg-gray-800"
            >
              {post.category_name && (
                <div className="mb-3">
                  <span className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 inline-block rounded-full px-3 py-1 text-xs font-medium">
                    {post.category_name}
                  </span>
                </div>
              )}

              <h2 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2 line-clamp-2 text-xl font-bold transition-colors">
                {post.title}
              </h2>

              {post.summary && (
                <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                  {post.summary}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-4">
                  <span>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('zh-CN')
                      : '未发布'}
                  </span>
                  <span>{post.reading_time || 1} 分钟阅读</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>浏览 {post.view_count}</span>
                  <span>点赞 {post.like_count}</span>
                  <span>评论 {post.comment_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {displayPosts.length > 0 && totalPages > 1 && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="rounded-lg bg-gray-200 px-6 py-2 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page === totalPages}
              className="rounded-lg bg-gray-200 px-6 py-2 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              下一页
            </button>
          </div>
        )}

        {displayPosts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {searchQuery ? `没有找到包含 "${searchQuery}" 的文章。` : '当前分类下暂无文章。'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
