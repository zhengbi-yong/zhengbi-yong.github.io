import { genPageMetadata } from '@/app/seo'
import BlogPageWrapper from './BlogPageWrapper'

export const metadata = genPageMetadata({ title: 'Blog' })
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function BlogPage() {
  return <BlogPageWrapper />
}
