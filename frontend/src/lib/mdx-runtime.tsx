/**
 * MDX Runtime Configuration
 *
 * 配置MDX运行时编译，支持所有Contentlayer已有的插件功能
 * 包括：数学公式、化学公式、代码高亮、GitHub警告块等
 */

'use client'

import { useState, useEffect } from 'react'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { remarkAlert } from 'remark-github-blockquote-alert'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeKatexNoTranslate from 'rehype-katex-notranslate'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypeMhchem from '@/lib/rehype-mhchem'
import { components } from '@/components/MDXComponents'

/**
 * 序列化MDX内容
 * 将MDX字符串编译为可在客户端渲染的格式
 *
 * @param content - MDX源代码字符串
 * @returns 序列化后的MDX source
 */
export async function serializeMDX(content: string) {
  return await serialize(content, {
    mdxOptions: {
      // Remark plugins - Markdown处理
      remarkPlugins: [
        remarkGfm, // GitHub风格Markdown
        remarkMath, // 数学公式支持
        remarkAlert, // GitHub风格警告块
      ],
      // Rehype plugins - HTML处理
      rehypePlugins: [
        rehypeSlug, // 为标题生成slug
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'prepend',
            headingProperties: {
              className: ['content-header'],
            },
          },
        ],
        rehypeMhchem, // 化学公式支持（自定义插件）
        rehypeKatex, // KaTeX数学公式渲染
        rehypeKatexNoTranslate, // KaTeX无翻译
        [
          rehypePrismPlus,
          {
            defaultLanguage: 'javascript',
            ignoreMissing: true,
          },
        ], // 代码高亮
      ],
      format: 'mdx',
    },
  })
}

/**
 * MDX运行时渲染器Props类型
 */
export type MDXRuntimeProps = {
  content: string
} & Partial<Omit<MDXRemoteProps, 'source'>>

/**
 * MDX运行时渲染器组件
 *
 * 在客户端动态渲染从API获取的MDX内容
 *
 * @example
 * ```tsx
 * <MDXRuntime content={post.content} />
 * ```
 */
export function MDXRuntime({ content, ...props }: MDXRuntimeProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteProps['source'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMDX() {
      try {
        setIsLoading(true)
        setError(null)
        const source = await serializeMDX(content)
        if (!cancelled) {
          setMdxSource(source)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadMDX()

    return () => {
      cancelled = true
    }
  }, [content])

  if (isLoading) {
    return <MDXLoadingSkeleton />
  }

  if (error) {
    return <MDXErrorMessage error={error} />
  }

  if (!mdxSource) {
    return <MDXEmptyState />
  }

  return (
    <>
      {/* 化学公式初始化 */}
      <MhchemInit />
      {/* MDX渲染 */}
      <MDXRemote {...mdxSource} components={components} {...props} />
    </>
  )
}

/**
 * MDX加载骨架屏
 */
function MDXLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  )
}

/**
 * MDX错误消息
 */
function MDXErrorMessage({ error }: { error: Error }) {
  return (
    <div className="text-red-600 dark:text-red-400 p-4 border border-red-300 dark:border-red-700 rounded-lg">
      <h3 className="font-bold text-lg mb-2">文章内容加载失败</h3>
      <p className="text-sm">{error.message}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm">查看详细错误</summary>
        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
          {error.stack}
        </pre>
      </details>
    </div>
  )
}

/**
 * MDX空状态
 */
function MDXEmptyState() {
  return (
    <div className="text-gray-500 dark:text-gray-400 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
      文章内容为空
    </div>
  )
}

/**
 * 化学公式初始化组件
 */
function MhchemInit() {
  return null
  // TODO: 如果需要mhchem支持，可以在这里初始化
  // 当前项目中mhchem已经在rehype-mhchem插件中处理
}
