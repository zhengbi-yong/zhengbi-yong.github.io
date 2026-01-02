'use client'

import { useState, useEffect } from 'react'
import { allBlogs } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'
import { getPopularArticles } from '@/components/hooks/useArticleAnalytics'
import Link from '@/components/Link'
import Tag from '@/components/Tag'

// 将文章数据转换为便于显示的格式
function formatArticleTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getArticleBySlug(articleId: string): CoreContent<(typeof allBlogs)[0]> | undefined {
  // 尝试直接匹配 slug
  let article = allBlogs.find((blog) => blog.slug === articleId)

  // 如果没找到，尝试匹配 path
  if (!article) {
    article = allBlogs.find((blog) => blog.path === articleId)
  }

  // 如果还没找到，尝试匹配 path 的最后一部分
  if (!article) {
    const pathParts = articleId.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    article = allBlogs.find((blog) => {
      const blogPathParts = blog.path.split('/')
      return blogPathParts[blogPathParts.length - 1] === lastPart
    })
  }

  // 如果还没找到，尝试匹配 slug 的最后一部分
  if (!article) {
    const pathParts = articleId.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    article = allBlogs.find((blog) => blog.slug === lastPart)
  }

  return article
}

export default function PopularArticlesPage() {
  const [popularArticles, setPopularArticles] = useState<
    Array<{
      articleId: string
      analytics: any
    }>
  >([])

  useEffect(() => {
    // 在客户端获取热门文章数据
    const articles = getPopularArticles(20) // 获取前20篇热门文章
    setPopularArticles(articles)
  }, [])
  
  // 过滤并验证文章：只保留能找到对应文章的数据，且参与度分数大于0
  const validArticles = popularArticles.filter(({ articleId, analytics }) => {
    // 过滤掉空ID
    if (!articleId || articleId.length === 0) return false
    
    // 过滤掉参与度分数为0的文章（没有实际阅读数据）
    if (!analytics || analytics.engagementScore === 0) return false
    
    // 尝试找到对应的文章，如果能找到就保留
    const article = getArticleBySlug(articleId)
    return !!article
  })

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="pt-8 pb-10 md:pt-12 md:pb-12">
          {/* 标题区域 */}
          <div className="mb-8 text-center md:mb-12">
            <h1 className="mx-auto mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-4xl leading-tight font-extrabold tracking-tight text-transparent sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
              热门文章
            </h1>
            <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg dark:text-gray-400">
              基于读者参与度排序的最受欢迎文章
            </p>
          </div>

          {validArticles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                暂时没有热门文章数据。开始阅读一些文章来生成排行榜吧！
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 px-4 py-8 sm:gap-10 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
            {validArticles.map(({ articleId, analytics }, index) => {
              const article = getArticleBySlug(articleId)
              const title = article?.title || formatArticleTitle(articleId)
              const summary = article?.summary
              const tags = article?.tags
              const path = article?.path

              // 获取热度标签和颜色
              const getPopularityBadge = () => {
                if (analytics.engagementScore >= 80) {
                  return {
                    text: '🔥 爆款',
                    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                  }
                }
                if (analytics.engagementScore >= 60) {
                  return {
                    text: '📈 热门',
                    className:
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
                  }
                }
                if (analytics.engagementScore >= 40) {
                  return {
                    text: '👀 关注',
                    className:
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
                  }
                }
                return {
                  text: '📝 新作',
                  className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
                }
              }

              const badge = getPopularityBadge()

              return (
                <article
                  key={articleId}
                  className="group flex flex-col space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                >
                  {/* 排名标记 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : index === 1
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {analytics.engagementScore}/100
                    </div>
                  </div>

                  {/* 文章标题 */}
                  <div>
                    <h3 className="text-lg leading-6 font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      {path ? (
                        <Link
                          href={`/${path}`}
                          className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {title}
                        </Link>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{title}</span>
                      )}
                    </h3>
                    {summary && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {summary}
                      </p>
                    )}
                  </div>

                  {/* 标签 */}
                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 3).map((tag) => (
                        <Tag key={tag} text={tag} />
                      ))}
                      {tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{tags.length - 3} 更多
                        </span>
                      )}
                    </div>
                  )}

                  {/* 统计数据 */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">👁 {analytics.viewCount}</span>
                      <span className="flex items-center gap-1">
                        ⏱ {Math.round(analytics.averageReadingTime / 60)}min
                      </span>
                      <span className="flex items-center gap-1">
                        📊 {Math.round(analytics.scrollDepth * 100)}%
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
            </div>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
          关于热门文章排行
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          热度分数综合考虑了浏览次数、阅读时间和滚动深度。分数范围从0到100，分数越高表示文章越受欢迎。
          热度数据仅存储在您的本地浏览器中，不会上传到服务器。
        </p>
      </div>
    </>
  )
}
