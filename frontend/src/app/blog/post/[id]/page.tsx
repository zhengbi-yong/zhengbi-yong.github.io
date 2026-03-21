'use client'

/**
 * API-based Post Page
 * Fetches and displays a single post by ID from the backend API
 */

import { usePostById } from '@/lib/hooks/useBlogData'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ApiPostPage() {
  const params = useParams()
  const id = params.id as string

  const { data: post, isLoading, error, isError } = usePostById(id)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            文章不存在
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error instanceof Error ? error.message : '无法加载文章，请稍后重试'}
          </p>
          <Link
            href="/blog"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回博客列表
          </Link>
        </div>
      </div>
    )
  }

  // Success - render post
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/blog" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          ← 返回博客
        </Link>
      </nav>

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl mb-4">
          {post.title}
        </h1>

        {post.summary && (
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            {post.summary}
          </p>
        )}

        {/* Post Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}

          {post.author_name && (
            <>
              <span>•</span>
              <span>{post.author_name}</span>
            </>
          )}

          <span>•</span>
          <span>{post.view_count} 次浏览</span>

          <span>•</span>
          <span>{post.like_count} 点赞</span>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Post Content */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content_html || post.content || '' }}
      />

      {/* Post Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← 返回博客列表
          </Link>

          <div className="flex gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              {post.comment_count} 评论
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {post.like_count} 点赞
            </span>
          </div>
        </div>
      </footer>
    </article>
  )
}
