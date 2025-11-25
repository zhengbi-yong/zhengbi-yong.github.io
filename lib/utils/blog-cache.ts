import { cache } from 'react'
import { allBlogs } from 'contentlayer/generated'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import type { CoreContent } from 'pliny/utils/contentlayer'

/**
 * 获取排序后的博客文章列表（带缓存）
 * 使用 Next.js cache 函数实现请求级缓存，避免重复计算
 */
export const getSortedPosts = cache((): CoreContent<Blog>[] => {
  return allCoreContent(sortPosts(allBlogs))
})

/**
 * 获取分页后的博客文章
 * @param posts 文章列表
 * @param page 页码（从1开始）
 * @param postsPerPage 每页文章数量
 * @returns 分页后的文章列表和分页信息
 */
export function getPaginatedPosts(
  posts: CoreContent<Blog>[],
  page: number,
  postsPerPage: number = 5
): {
  posts: CoreContent<Blog>[]
  pagination: { currentPage: number; totalPages: number }
} {
  const totalPages = Math.ceil(posts.length / postsPerPage)
  const startIndex = postsPerPage * (page - 1)
  const endIndex = startIndex + postsPerPage
  const paginatedPosts = posts.slice(startIndex, endIndex)

  return {
    posts: paginatedPosts,
    pagination: {
      currentPage: page,
      totalPages,
    },
  }
}

