'use client'

/**
 * API-based Blog Page Component
 * Fetches blog posts from the backend API using React Query
 */

import { usePosts } from '@/lib/hooks/useBlogData'
import BookShelfLayout from '@/layouts/BookShelfLayout'
import { genPageMetadata } from 'app/seo'
import type { Metadata } from 'next'

// Generate metadata for the page
export function generateMetadata(): Metadata {
  return genPageMetadata({ title: 'Blog' })
}

export default function ApiBlogPage() {
  const { data, isLoading, error, isError } = usePosts({
    status: 'published',
    sort_by: 'published_at',
    sort_order: 'desc',
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : '无法加载文章列表，请稍后重试'}
          </p>
        </div>
      </div>
    )
  }

  // Convert API response to Blog format (minimal conversion for display)
  const posts = data.posts.map((post) => ({
    ...post,
    path: post.slug, // For now, use slug directly
    date: post.published_at || post.created_at,
    // Add any other fields needed by BookShelfLayout
  }))

  return (
    <div className="relative min-h-screen">
      <BookShelfLayout posts={posts} title="博客书架" />
    </div>
  )
}
