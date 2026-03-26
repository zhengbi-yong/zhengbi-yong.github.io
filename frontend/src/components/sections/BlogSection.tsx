'use client'

import BlogCard from './BlogCard'
import SectionHeader from './SectionHeader'
import { Button } from '@/components/shadcn/ui/button'
import Link from 'next/link'
import AnimatedText from '@/components/home/AnimatedText'
import { cn } from '@/components/lib/utils'
import type { BlogLikePost } from '@/lib/adapters/backend-posts'

// Extended blog type with optional featured field
interface BlogWithFeatured extends BlogLikePost {
  featured?: boolean
}

interface BlogSectionProps {
  title?: string
  description?: string
  posts: BlogWithFeatured[]
  limit?: number
  listPage?: boolean
  showViewAllButton?: boolean
  pagination?: {
    enable: boolean
    currentPage: number
  }
  postsPerPage?: number
}
/**
 * BlogSection - 博客部分组件
 * 基于提供的 Astro BlogSection 组件转换而来
 * 支持特色文章、分页、列表页模式等功能
 */
export default function BlogSection({
  title = 'Latest Articles',
  description = '',
  posts,
  limit = 3,
  listPage = false,
  showViewAllButton = true,
  pagination = {
    enable: false,
    currentPage: 1,
  },
  postsPerPage = 3,
}: BlogSectionProps) {
  // 按发布日期排序文章
  let sortedPosts = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // 查找特色文章（假设有 featured 字段，如果没有则跳过）
  const featuredPost = sortedPosts.find((post) => post.featured)

  // 如果存在特色文章且在列表页，从主列表中移除
  if (featuredPost && listPage) {
    sortedPosts = sortedPosts.filter((post) => !post.featured)
  }

  // 计算总页数
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage)

  // 如果启用了分页，则只显示当前页的文章
  let displayedPosts = sortedPosts
  if (pagination.enable) {
    const indexOfLastPost = pagination.currentPage * postsPerPage
    const indexOfFirstPost = indexOfLastPost - postsPerPage
    displayedPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost)
  } else if (!listPage) {
    // 如果不是列表页，限制显示的文章数量
    displayedPosts = sortedPosts.slice(0, limit)
  }

  // 为每篇文章添加链接属性
  const postsWithLinks = displayedPosts.map((post) => {
    const link = `/blog/${post.slug}`
    return {
      ...post,
      link,
    }
  })

  // 为特色文章创建带链接的版本
  const featuredPostWithLink = featuredPost
    ? {
        ...featuredPost,
        link: `/blog/${featuredPost.slug}`,
      }
    : null

  return (
    <>
      {/* 特色文章部分 - 仅在列表页第一页显示 */}
      {listPage && featuredPostWithLink && pagination.currentPage === 1 && (
        <section className="mb-16">
          <div className="container mx-auto px-4 sm:px-6 xl:px-8">
            <h2 className="font-brand mb-6 text-3xl text-neutral-800 dark:text-white">
              <AnimatedText delay={0.75} stagger={0.08} content="Featured" />
            </h2>
            <div className="rounded-2xl p-1 dark:from-neutral-900 dark:to-neutral-800">
              <BlogCard
                layout="horizontal"
                content={{
                  title: featuredPostWithLink.title,
                  description: featuredPostWithLink.summary || '',
                  publishDate: featuredPostWithLink.date,
                  tags: featuredPostWithLink.tags || [],
                  img: featuredPostWithLink.images?.[0] || '',
                  img_alt: featuredPostWithLink.title,
                  slug: featuredPostWithLink.slug,
                  link: featuredPostWithLink.link,
                }}
              />
            </div>
          </div>
        </section>
      )}

      <section>
        <div className={cn('container mx-auto space-y-10 px-4 sm:px-6 md:space-y-16 xl:px-8')}>
          {!listPage && title && <SectionHeader title={title} description={description} />}

          {/* 列表页标题 */}
          {listPage && title && (
            <div className="mx-auto">
              <h2 className="font-brand text-3xl text-neutral-800 dark:text-white">{title}</h2>
            </div>
          )}

          <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
          {postsWithLinks.map((post, _index) => (
              <BlogCard
                key={post.slug}
                content={{
                  title: post.title,
                  description: post.summary || '',
                  publishDate: post.date,
                  tags: post.tags || [],
                  img: post.images?.[0] || '',
                  img_alt: post.title,
                  slug: post.slug,
                  link: post.link,
                }}
              />
            ))}
          </div>

          {/* 分页组件 - 如果需要可以添加 */}
          {listPage && totalPages > 1 && pagination.enable && (
            <div className="mt-12 flex justify-center">
              {/* TODO: 添加 Pagination 组件 */}
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                第 {pagination.currentPage} 页，共 {totalPages} 页
              </p>
            </div>
          )}
        </div>

        {/* "View All Articles" 按钮 - 仅在非列表页且启用时显示 */}
        {!listPage && showViewAllButton && (
          <div className="mt-12 mb-12 flex justify-center">
            <Link href="/blog" className="w-full max-w-60">
              <Button className="w-full">
                View All Articles
              </Button>
            </Link>
          </div>
        )}
      </section>
    </>
  )
}
