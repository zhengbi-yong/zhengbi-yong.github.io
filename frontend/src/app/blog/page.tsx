import { genPageMetadata } from '@/app/seo'
import BlogPageWrapper from './BlogPageWrapper'
import PublicLayout from '@/app/(public)/layout'

export const metadata = genPageMetadata({ title: 'Blog' })
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function BlogPage() {
  return (
    <PublicLayout>
      <BlogPageWrapper />
    </PublicLayout>
  )
}
