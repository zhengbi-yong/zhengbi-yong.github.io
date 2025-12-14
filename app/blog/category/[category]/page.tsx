import { notFound } from 'next/navigation'
import { getSortedPosts } from '@/lib/utils/blog-cache'
import { getBookByCategory } from '@/lib/utils/book-categorizer'
import { genPageMetadata } from 'app/seo'
import BookDetailLayout from '@/layouts/BookDetailLayout'
import ShaderBackgroundClient from '@/components/ShaderBackgroundClient'

export async function generateMetadata(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const categoryName = decodeURIComponent(params.category)
  return genPageMetadata({ title: `${categoryName} - 博客分类` })
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
      {/* 着色器背景 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundClient intensity={0.6} />
      </div>
      {/* 内容背景遮罩 */}
      <div className="fixed inset-0 -z-[5] bg-white/30 backdrop-blur-sm dark:bg-gray-950/40" />
      {/* 分类详情内容 */}
      <div className="relative z-10">
        <BookDetailLayout book={book} />
      </div>
    </div>
  )
}
