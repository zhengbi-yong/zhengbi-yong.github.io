'use client'

import { useMemo, useEffect, useState } from 'react'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import { categorizePostsByBookStructure } from '@/lib/utils/book-categorizer'
import Book from '@/components/book/Book'
import ArticleCard from '@/components/book/ArticleCard'
import { PopularArticles } from '@/components/ArticleAnalytics'
import { RecentArticles } from '@/components/RecentArticles'
import { shouldDisableComplexAnimations } from '@/lib/utils/performance-optimized'

interface BookShelfLayoutProps {
  posts: CoreContent<Blog>[]
  title?: string
}

export default function BookShelfLayout({ posts, title = '博客书架' }: BookShelfLayoutProps) {
  const [disableComplexAnimations, setDisableComplexAnimations] = useState(false)

  useEffect(() => {
    setDisableComplexAnimations(shouldDisableComplexAnimations())
  }, [])

  // 将文章按书籍结构分类
  const bookShelfData = useMemo(() => {
    return categorizePostsByBookStructure(posts)
  }, [posts])

  return (
    <div className="min-h-screen">
      {/* 标题区域 */}
      <div className="mb-6 text-center pt-6 pb-4">
        <h1 className="mx-auto mb-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-3xl leading-tight font-extrabold tracking-tight text-transparent sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
          {title}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          按分类浏览文章，点击书籍展开查看章节和文章
        </p>
      </div>

      {/* 三列布局：窄-宽-窄 */}
      <div className="flex h-[calc(100vh-200px)] items-stretch gap-4 overflow-y-auto overflow-x-hidden px-4 pb-4 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 8px;
            background: transparent;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb {
            background: transparent;
            border-radius: 4px;
            transition: background 0.2s;
          }
          div:hover::-webkit-scrollbar-thumb {
            background: rgb(209, 213, 219);
          }
          .dark div:hover::-webkit-scrollbar-thumb {
            background: rgb(75, 85, 99);
          }
        `}</style>
        {/* 左侧窄列：最新文章 - 在xl以下屏幕隐藏 */}
        <div className="hidden xl:flex flex-shrink-0 w-64 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
            <RecentArticles limit={5} />
          </div>
        </div>

        {/* 中间宽列：书架内容 - 网格布局，自动换行 */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-0 auto-rows-fr">
            {bookShelfData.books.map((book, index) => (
              <div key={book.name} className="p-0">
                <Book key={book.name} book={book} index={disableComplexAnimations ? 0 : index} />
              </div>
            ))}
            {/* 未分类文章 */}
            {bookShelfData.uncategorized.length > 0 &&
              bookShelfData.uncategorized.map((article, index) => (
                <div key={article.path} className="p-0">
                  <ArticleCard
                    article={article}
                    index={disableComplexAnimations ? 0 : index}
                  />
                </div>
              ))}
          </div>
        </div>

        {/* 右侧窄列：热门文章 - 在xl以下屏幕隐藏 */}
        <div className="hidden xl:flex flex-shrink-0 w-64 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgb(209_213_219)_transparent] dark:hover:[scrollbar-color:rgb(75_85_99)_transparent]">
            <PopularArticles limit={5} />
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {bookShelfData.books.length === 0 && bookShelfData.uncategorized.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">暂无文章</p>
        </div>
      )}
    </div>
  )
}
