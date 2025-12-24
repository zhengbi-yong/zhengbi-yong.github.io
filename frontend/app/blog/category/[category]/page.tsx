import { notFound } from 'next/navigation'
import { getSortedPosts } from '@/lib/utils/blog-cache'
import { getBookByCategory, categorizePostsByBookStructure } from '@/lib/utils/book-categorizer'
import { genPageMetadata } from 'app/seo'
import BookDetailLayout from '@/layouts/BookDetailLayout'

export async function generateMetadata(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const categoryName = decodeURIComponent(params.category)
  return genPageMetadata({ title: `${categoryName} - 博客分类` })
}

export const generateStaticParams = async () => {
  const sortedPosts = getSortedPosts()
  const bookShelfData = categorizePostsByBookStructure(sortedPosts)
  return bookShelfData.books.map((book) => ({
    category: encodeURIComponent(book.name),
  }))
}

export const dynamic = 'force-static'
export const revalidate = 3600

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const categoryName = decodeURIComponent(params.category)
  const sortedPosts = getSortedPosts()

  // 获取分类数据
  const book = getBookByCategory(categoryName, sortedPosts)

  if (!book) {
    notFound()
  }

  return (
    <div className="relative min-h-screen">
      <BookDetailLayout book={book} />
    </div>
  )
}
