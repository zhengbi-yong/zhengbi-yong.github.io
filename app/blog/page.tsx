import { getSortedPosts, getPaginatedPosts } from '@/lib/utils/blog-cache'
import { genPageMetadata } from 'app/seo'
import ListLayout from '@/layouts/ListLayout'

const POSTS_PER_PAGE = 5

export const metadata = genPageMetadata({ title: 'Blog' })

export default async function BlogPage(props: { searchParams: Promise<{ page: string }> }) {
  const sortedPosts = getSortedPosts()
  const params = await props.searchParams
  const pageNumber = parseInt(params.page || '1', 10)
  const { posts, pagination } = getPaginatedPosts(sortedPosts, pageNumber, POSTS_PER_PAGE)

  return (
    <ListLayout
      posts={sortedPosts}
      initialDisplayPosts={posts}
      pagination={pagination}
      title="博客"
    />
  )
}
