import { Authors, allAuthors } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import AuthorLayout from '@/components/layouts/AuthorLayout'
import { components as mdxComponents } from '@/components/MDXComponents'
import { coreContent } from 'pliny/utils/contentlayer'
import { genPageMetadata } from '@/app/seo'
import PublicLayout from '@/app/(public)/layout'
import PublicPageFrame from '@/components/layouts/PublicPageFrame'

export const metadata = genPageMetadata({ title: 'About' })

export default function Page() {
  const author = allAuthors.find((p) => p.slug === '雍征彼') as Authors
  const mainContent = coreContent(author)

  return (
    <PublicLayout>
      <PublicPageFrame>
        <section className="mb-16 max-w-3xl space-y-5 md:mb-24">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-700 dark:text-amber-500">
            Biography · Research · Writing
          </p>
          <h1
            className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-6xl"
            style={{ fontFamily: 'var(--font-newsreader)' }}
          >
            About
          </h1>
          <p className="max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-400 md:text-lg">
            以更统一的公共页面框架呈现个人背景、研究方向与写作方法，同时保留原有 MDX 内容结构。
          </p>
        </section>
        <AuthorLayout content={mainContent}>
          <MDXLayoutRenderer code={author.body.code} components={mdxComponents} />
        </AuthorLayout>
      </PublicPageFrame>
    </PublicLayout>
  )
}
