'use client'

import { useMemo } from 'react'
import { notFound } from 'next/navigation'
import BookDetailLayout from '@/components/layouts/BookDetailLayout'
import { useCategory, usePosts } from '@/lib/hooks/useBlogData'
import { getBookByCategory } from '@/lib/utils/book-categorizer'
import { toBlogLikePost } from '@/lib/adapters/backend-posts'

interface ApiCategoryPageProps {
  category: string
}

export default function ApiCategoryPage({ category }: ApiCategoryPageProps) {
  const normalizedCategory = decodeURIComponent(category)

  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategory(normalizedCategory)

  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = usePosts({
    status: 'Published',
    category_slug: normalizedCategory,
    sort_by: 'published_at',
    sort_order: 'desc',
    limit: 200,
    page: 1,
  })

  const book = useMemo(() => {
    const mappedPosts = (postsData?.posts || []).map(toBlogLikePost)
    return getBookByCategory(normalizedCategory, mappedPosts as any)
  }, [normalizedCategory, postsData?.posts])

  if (categoryLoading || postsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载分类内容...</p>
        </div>
      </div>
    )
  }

  if (categoryError || postsError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">分类加载失败</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {categoryError instanceof Error
              ? categoryError.message
              : postsError instanceof Error
                ? postsError.message
                : '无法加载当前分类，请稍后重试。'}
          </p>
        </div>
      </div>
    )
  }

  if (!categoryData || !book) {
    notFound()
  }

  return (
    <div className="relative min-h-screen">
      <BookDetailLayout book={{ ...book, name: categoryData.name }} />
    </div>
  )
}
