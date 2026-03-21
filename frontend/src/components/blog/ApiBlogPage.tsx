'use client'

/**
 * API-based Blog Page Component with Categories
 * Fetches blog posts from backend API and organizes them by category
 */

import { usePosts, useCategories } from '@/lib/hooks/useBlogData'
import { genPageMetadata } from '@/app/seo'
import type { Metadata } from 'next'
import { useState, useMemo } from 'react'
import Link from 'next/link'

// Generate metadata for page
export function generateMetadata(): Metadata {
  return genPageMetadata({ title: 'Blog' })
}

const POSTS_PER_PAGE = 50

export default function ApiBlogPage() {
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: postsData, isLoading: postsLoading, error: postsError } = usePosts({
    status: 'Published',
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: POSTS_PER_PAGE,
    page,
    category_slug: selectedCategory || undefined,
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()

  const categories = Array.isArray(categoriesData) ? categoriesData : []

  // Organize posts by category
  const postsByCategory = useMemo(() => {
    if (!postsData?.posts) return {}

    const grouped: Record<string, typeof postsData.posts> = {}

    // Add 'all' category for all posts
    grouped.all = postsData.posts

    postsData.posts.forEach((post) => {
      const categorySlug = post.category_slug || 'uncategorized'
      if (!grouped[categorySlug]) {
        grouped[categorySlug] = []
      }
      grouped[categorySlug].push(post)
    })

    return grouped
  }, [postsData?.posts])

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    const posts = postsByCategory[selectedCategory || 'all'] || []

    if (!searchQuery.trim()) return posts

    return posts.filter((post) => {
      const query = searchQuery.toLowerCase()
      return (
        post.title.toLowerCase().includes(query) ||
        post.summary?.toLowerCase().includes(query)
      )
    })
  }, [postsByCategory, selectedCategory, searchQuery])

  // Display posts (filtered or all)
  const displayPosts = selectedCategory || searchQuery ? filteredPosts : postsData?.posts || []
  const totalPages = Math.ceil((postsData?.total || 0) / POSTS_PER_PAGE)

  if (postsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (postsError || !postsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {postsError instanceof Error ? postsError.message : '无法加载文章列表，请稍后重试'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">博客</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
            <span>共 {postsData.total} 篇文章</span>
            {selectedCategory && <span>· {selectedCategory}</span>}
            {searchQuery && <span>· 搜索: "{searchQuery}"</span>}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === null
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            全部 ({postsData.total})
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.slug
                  ? 'bg-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.name} ({category.post_count || 0})
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Category Badge */}
              {post.category_name && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                    {post.category_name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h2 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {post.title}
              </h2>

              {/* Summary */}
              {post.summary && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {post.summary}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-4">
                  <span>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('zh-CN')
                      : '未发布'}
                  </span>
                  <span>{post.reading_time} 分钟阅读</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>👁 {post.view_count}</span>
                  <span>❤️ {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {displayPosts.length > 0 && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              下一页
            </button>
          </div>
        )}

        {/* No Results */}
        {displayPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {searchQuery ? `没有找到包含 "${searchQuery}" 的文章` : '该分类下暂无文章'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
