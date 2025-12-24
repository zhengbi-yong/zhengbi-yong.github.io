import ListLayout from '@/layouts/ListLayout'
import { getSortedPosts, getPaginatedPosts } from '@/lib/utils/blog-cache'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 50

export const generateStaticParams = async () => {
  const posts = getSortedPosts()
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({
    page: (i + 1).toString(),
  }))
}

// 缓存配置：动态模式时1小时重新验证
// 注意：静态导出模式下，revalidate 不需要设置（页面已经是静态的）
// 对于动态部署，使用 3600 秒（1小时）的重新验证时间
export const revalidate = 3600

export default async function Page(props: { params: Promise<{ page: string }> }) {
  const params = await props.params
  const sortedPosts = getSortedPosts()
  const pageNumber = parseInt(params.page as string, 10)
  const { posts, pagination } = getPaginatedPosts(sortedPosts, pageNumber, POSTS_PER_PAGE)

  // Return 404 for invalid page numbers or empty pages
  if (pageNumber <= 0 || pageNumber > pagination.totalPages || isNaN(pageNumber)) {
    return notFound()
  }

  return (
    <div className="relative min-h-screen">
      <ListLayout
        posts={sortedPosts}
        initialDisplayPosts={posts}
        pagination={pagination}
        title="博客"
      />
    </div>
  )
}
