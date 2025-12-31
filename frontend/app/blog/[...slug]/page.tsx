import 'css/prism.css'
import 'katex/dist/katex.css'

import dynamic from 'next/dynamic'
import PageTitle from '@/components/PageTitle'
import Script from 'next/script'

// 动态导入mhchem初始化组件（Client Component，内部已有客户端检查）
const MhchemInit = dynamic(() =>
  import('@/components/chemistry/MhchemInit').then((mod) => mod.default)
)
import { components } from '@/components/MDXComponents'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { sortPosts, coreContent, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allAuthors } from 'contentlayer/generated'
import { getSortedPosts } from '@/lib/utils/blog-cache'
import type { Authors, Blog } from 'contentlayer/generated'
import PostSimple from '@/layouts/PostSimple'
import PostLayout from '@/layouts/PostLayout'
import PostBanner from '@/layouts/PostBanner'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { ReactNode } from 'react'
import CachedPostContent from '@/components/CachedPostContent'
import type { TOC } from '@/lib/types/toc'

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  children: ReactNode
}

const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
} satisfies Record<string, React.ComponentType<LayoutProps>>

const defaultLayout: keyof typeof layouts = 'PostLayout'

function isAuthorEntry(author: Authors | undefined): author is Authors {
  return Boolean(author)
}

function isLayoutKey(key: string): key is keyof typeof layouts {
  return key in layouts
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const post = allBlogs.find((p) => p.slug === slug)
  const authorList = post?.authors || ['default']
  const authorDetails = authorList
    .map((author) => allAuthors.find((p) => p.slug === author))
    .filter(isAuthorEntry)
    .map((author) => coreContent(author))

  if (!post) {
    return
  }

  const publishedAt = new Date(post.date).toISOString()
  const modifiedAt = new Date(post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author) => author.name)
  let imageList = [siteMetadata.socialBanner]
  if (post.images) {
    imageList = typeof post.images === 'string' ? [post.images] : post.images
  }
  const ogImages = imageList.map((img) => {
    return {
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => {
  return allBlogs.map((p) => ({ slug: p.slug.split('/').map((name) => decodeURI(name)) }))
}

// 缓存配置：静态导出时永久缓存，动态模式时1小时重新验证
export const revalidate = 3600

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))

  // 尝试从静态生成获取文章
  const sortedCoreContents = getSortedPosts()
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)

  if (postIndex !== -1) {
    // 文章存在静态版本 - 使用现有的渲染逻辑
    const prev = sortedCoreContents[postIndex + 1]
    const next = sortedCoreContents[postIndex - 1]
    const post = allBlogs.find((p) => p.slug === slug)

    if (!post) {
      return notFound()
    }

    const authorList = post.authors || ['default']
    const authorDetails = authorList
      .map((author) => allAuthors.find((p) => p.slug === author))
      .filter(isAuthorEntry)
      .map((author) => coreContent(author))
    const mainContent = coreContent(post)

    const jsonLd = post.structuredData || {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      dateModified: post.lastmod || post.date,
      description: post.summary || '',
      image:
        post.images && Array.isArray(post.images) && post.images.length > 0
          ? post.images[0]
          : siteMetadata.socialBanner,
      url: `${siteMetadata.siteUrl}/${post._raw.flattenedPath}`,
    }
    jsonLd['author'] = authorDetails.map((author) => {
      return {
        '@type': 'Person',
        name: author.name,
      }
    })

    const layoutKey = post.layout && isLayoutKey(post.layout) ? post.layout : defaultLayout
    const Layout = layouts[layoutKey]
    const toc: TOC | undefined = post.toc && Array.isArray(post.toc) ? (post.toc as TOC) : undefined
    const showTOC = post.showTOC !== undefined ? post.showTOC : (siteMetadata.defaultShowTOC ?? true)

    return (
      <>
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd, null, 0),
            }}
          />
        )}
        <Script
          src="/chemistry/rdkit/RDKit_minimal.js"
          strategy="beforeInteractive"
        />
        <MhchemInit />
        <CachedPostContent slug={slug} post={post} />
        <Layout
          content={mainContent}
          authorDetails={authorDetails}
          next={next}
          prev={prev}
          toc={toc}
          showTOC={showTOC}
        >
          <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
        </Layout>
      </>
    )
  }

  // 文章不存在静态版本 - 返回动态渲染组件
  return <DynamicPostPage slug={slug} />
}

// 动态文章页面组件（从API获取内容）
// 这是一个客户端组件，在服务端组件中会被渲染
import dynamic from 'next/dynamic'

const DynamicPostPage = dynamic(
  () => import('./DynamicPostPage').then((mod) => mod.DynamicPostPage),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
          </div>
        </div>
      </div>
    ),
  }
)
