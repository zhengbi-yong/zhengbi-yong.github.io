import 'css/prism.css'
import 'katex/dist/katex.css'

import PageTitle from '@/components/PageTitle'
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
  // Filter out drafts in production - 使用缓存的排序结果
  const sortedCoreContents = getSortedPosts()
  const postIndex = sortedCoreContents.findIndex((p) => p.slug === slug)
  if (postIndex === -1) {
    return notFound()
  }

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
  const jsonLd = post.structuredData
  jsonLd['author'] = authorDetails.map((author) => {
    return {
      '@type': 'Person',
      name: author.name,
    }
  })

  const layoutKey = post.layout && isLayoutKey(post.layout) ? post.layout : defaultLayout
  const Layout = layouts[layoutKey]

  // 获取目录数据（computedFields 中的 toc 是目录数据）
  // 注意：coreContent 可能会过滤掉 computedFields，所以直接从原始 post 对象获取
  let toc: TOC | undefined = undefined
  if (post.toc && Array.isArray(post.toc)) {
    toc = post.toc as TOC
  } else if (post.toc) {
    // 如果 post.toc 存在但不是数组，尝试解析
    try {
      const parsedToc = typeof post.toc === 'string' ? JSON.parse(post.toc) : post.toc
      if (Array.isArray(parsedToc)) {
        toc = parsedToc as TOC
      }
    } catch (e) {
      console.error('Failed to parse TOC:', e)
    }
  }

  // 计算是否显示目录：文章 frontmatter 中的 showTOC 优先，否则使用站点默认配置
  const showTOC =
    post.showTOC !== undefined ? post.showTOC : siteMetadata.defaultShowTOC ?? true

  // 调试信息
  console.log('[BlogPage] TOC Debug:', {
    hasToc: !!post.toc,
    tocType: typeof post.toc,
    tocIsArray: Array.isArray(post.toc),
    tocLength: Array.isArray(post.toc) ? post.toc.length : 'N/A',
    showTOC,
    postShowTOC: post.showTOC,
    defaultShowTOC: siteMetadata.defaultShowTOC,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 自动缓存文章内容，后续访问瞬间打开 */}
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
