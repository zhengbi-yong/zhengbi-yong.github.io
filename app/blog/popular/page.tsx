'use client'

import { useState, useEffect } from 'react'
import { allBlogs } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'
import { getPopularArticles } from '@/components/hooks/useArticleAnalytics'
import PageTitle from '@/components/PageTitle'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import PopularArticles from '@/components/ArticleAnalytics'

// 将文章数据转换为便于显示的格式
function formatArticleTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getArticleBySlug(slug: string): CoreContent<typeof allBlogs[0]> | undefined {
  // 尝试直接匹配 slug
  let article = allBlogs.find((blog) => blog.slug === slug)

  // 如果没找到，尝试匹配 path 的最后一部分
  if (!article) {
    article = allBlogs.find((blog) => {
      const pathParts = blog.path.split('/')
      return pathParts[pathParts.length - 1] === slug
    })
  }

  return article
}

export default function PopularArticlesPage() {
  const [popularArticles, setPopularArticles] = useState<Array<{
    articleId: string
    analytics: any
  }>>([])

  useEffect(() => {
    // 在客户端获取热门文章数据
    const articles = getPopularArticles(20) // 获取前20篇热门文章
    setPopularArticles(articles)
  }, [])
  const validArticles = popularArticles.filter(({ articleId }) => {
    // 过滤掉无效的文章ID
    return !articleId.includes('.') && !articleId.includes('/') && articleId.length > 0
  })

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <PageTitle>🔥 热门文章</PageTitle>
          <p className="text-lg leading-7 text-gray-600 dark:text-gray-400">
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
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {validArticles.map(({ articleId, analytics }, index) => {
              const article = getArticleBySlug(articleId)
              const title = article?.title || formatArticleTitle(articleId)
              const summary = article?.summary
              const tags = article?.tags
              const path = article?.path

              // 获取热度标签和颜色
              const getPopularityBadge = () => {
                if (analytics.engagementScore >= 80) {
                  return { text: '🔥 爆款', className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
                }
                if (analytics.engagementScore >= 60) {
                  return { text: '📈 热门', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' }
                }
                if (analytics.engagementScore >= 40) {
                  return { text: '👀 关注', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' }
                }
                return { text: '📝 新作', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' }
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
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {analytics.engagementScore}/100
                    </div>
                  </div>

                  {/* 文章标题 */}
                  <div>
                    <h3 className="text-lg font-semibold leading-6 tracking-tight text-gray-900 dark:text-gray-100">
                      {path ? (
                        <Link
                          href={`/${path}`}
                          className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
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
                      <span className="flex items-center gap-1">
                        👁 {analytics.viewCount}
                      </span>
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

      {/* 提示信息 */}
      <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
          📊 关于热门文章排行
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          热度分数综合考虑了浏览次数、阅读时间和滚动深度。分数范围从0到100，分数越高表示文章越受欢迎。
          热度数据仅存储在您的本地浏览器中，不会上传到服务器。
        </p>
      </div>
    </>
  )
}