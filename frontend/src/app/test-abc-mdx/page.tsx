import { allBlogs } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { notFound } from 'next/navigation'
import { genPageMetadata } from '@/app/seo'
import { components as mdxComponents } from '@/components/MDXComponents'

const fixtureSlug = 'music/abc-notation-fixture'

export const metadata = genPageMetadata({
  title: 'ABC MDX Fixture',
  description: 'Regression page for verifying ABC fenced code blocks in the static MDX pipeline.',
})

export default function TestAbcMdxPage() {
  const fixture = allBlogs.find((post) => post.slug === fixtureSlug)

  if (!fixture) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{fixture.title}</h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
          This route renders a real fixture from <code>data/blog</code> through Contentlayer and the
          shared MDX component map.
        </p>
      </header>

      <article
        data-testid="abc-mdx-fixture"
        className="prose prose-lg dark:prose-invert max-w-none"
      >
        <MDXLayoutRenderer code={fixture.body.code} components={mdxComponents} />
      </article>
    </main>
  )
}
