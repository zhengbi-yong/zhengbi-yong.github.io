'use client'

import { useMemo } from 'react'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { categorizePostsByBookStructure } from '@/lib/utils/book-categorizer'
import Book from '@/components/book/Book'
import ArticleCard from '@/components/book/ArticleCard'

interface BookShelfLayoutProps {
  posts: CoreContent<Blog>[]
  title?: string
}

export default function BookShelfLayout({ posts, title = '博客书架' }: BookShelfLayoutProps) {
  // 将文章按书籍结构分类
  const bookShelfData = useMemo(() => {
    return categorizePostsByBookStructure(posts)
  }, [posts])

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="pt-8 pb-10 md:pt-12 md:pb-12">
        {/* 标题区域 */}
        <div className="mb-8 text-center md:mb-12">
          <h1 className="mx-auto mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-4xl leading-tight font-extrabold tracking-tight text-transparent sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg dark:text-gray-400">
            按分类浏览文章，点击书籍展开查看章节和文章
          </p>
        </div>

        {/* 书架背景容器 */}
        <div className="relative">
          {/* 书架背景效果 */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-gray-100/30 via-gray-50/20 to-gray-100/40 dark:from-gray-900/30 dark:via-gray-950/20 dark:to-gray-900/40"></div>

          {/* 书架木板纹理 */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-[linear-gradient(90deg,_rgba(0,0,0,0.02)_1px,_transparent_1px),_linear-gradient(rgba(0,0,0,0.02)_1px,_transparent_1px)] bg-[size:40px_40px] opacity-50"></div>

          {/* 书架网格布局 */}
          <div className="relative grid grid-cols-1 gap-8 px-4 py-8 sm:gap-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bookShelfData.books.map((book, index) => (
              <Book key={book.name} book={book} index={index} />
            ))}
          </div>
        </div>

        {/* 未分类文章 */}
        {bookShelfData.uncategorized.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">其他文章</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookShelfData.uncategorized.map((article, index) => (
                <ArticleCard key={article.path} article={article} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {bookShelfData.books.length === 0 && bookShelfData.uncategorized.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">暂无文章</p>
          </div>
        )}
      </div>
    </div>
  )
}
