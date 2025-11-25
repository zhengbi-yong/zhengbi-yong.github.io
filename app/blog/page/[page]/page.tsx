import ListLayout from '@/layouts/ListLayout'
import { getSortedPosts, getPaginatedPosts } from '@/lib/utils/blog-cache'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 5

export const generateStaticParams = async () => {
  const posts = getSortedPosts()
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({
    page: (i + 1).toString(),
  }))
}

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
    <ListLayout
      posts={sortedPosts}
      initialDisplayPosts={posts}
      pagination={pagination}
      title="博客"
    />
  )
}
