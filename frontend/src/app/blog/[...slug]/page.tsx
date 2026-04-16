import '@/styles/prism.css'

import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { genPageMetadata } from '@/app/seo'
import PublicPageFrame from '@/components/layouts/PublicPageFrame'
import PublicLayout from '@/app/(public)/layout'

const DynamicPostPage = dynamic(
  () => import('./DynamicPostPage').then((mod) => mod.DynamicPostPage),
  {
    loading: () => (
      <PublicLayout>
        <PublicPageFrame>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="animate-pulse text-center">
              <div className="mx-auto mb-4 h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        </PublicPageFrame>
      </PublicLayout>
    ),
  }
)

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))

  return genPageMetadata({
    title: slug.split('/').pop() || 'Blog Post',
  })
}

export const revalidate = 3600

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))

  return (
    <PublicLayout>
      <DynamicPostPage slug={slug} />
    </PublicLayout>
  )
}
