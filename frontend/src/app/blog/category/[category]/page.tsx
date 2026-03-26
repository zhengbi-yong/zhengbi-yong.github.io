import { genPageMetadata } from '@/app/seo'
import ApiCategoryPage from './ApiCategoryPage'

export async function generateMetadata(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  const categoryName = decodeURIComponent(params.category)
  return genPageMetadata({ title: `${categoryName} - 博客分类` })
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params
  return <ApiCategoryPage category={params.category} />
}
