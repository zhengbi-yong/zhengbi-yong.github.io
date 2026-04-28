'use client'

/**
 * API-based Post Page
 * Fetches and displays a single post by ID from the backend API
 * MDX content is compiled server-side via /api/mdx/compile and rendered via MDXRemote
 */

import { usePostById } from '@/lib/hooks/useBlogData'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'

// MDXRemote components
// Shiki output: <pre class="shiki ..."> — must pass through with class intact
// Plain code: <pre><code> — apply custom dark styling
const mdxComponents = {
  pre: (props: React.ComponentProps<'pre'>) => {
    const isShiki = props.className?.includes('shiki')
    if (isShiki) {
      // Shiki output: preserve full classes (includes language + bg color), add line-number styles
      return <pre {...props} />
    }
    // Fallback: plain code block
    return (
      <pre className="not-prose bg-[#0d1117] border border-[#30363d] rounded-lg p-4 overflow-x-auto my-4" {...props} />
    )
  },
  code: (props: React.ComponentProps<'code'>) => {
    // Inside Shiki pre, code has bg/color set by Shiki — pass through
    const parent = (props as any).parentElement
    const inShiki = parent?.className?.includes('shiki')
    if (inShiki) return <code {...props} />
    return <code className="bg-[#0d1117] text-[#e6edf3] font-mono text-sm" {...props} />
  },
}

function PostContent({ source }: { source: string }) {
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!source) return

    async function compileMdx() {
      try {
        const res = await fetch('/api/mdx/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Compilation failed')
        }
        const serialized = await res.json()
        setCompiled(serialized)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'MDX compilation failed')
        console.error('MDX compile error:', err)
      }
    }

    compileMdx()
  }, [source])

  if (error) {
    return (
      <div className="p-4 my-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">内容渲染失败: {error}</p>
      </div>
    )
  }

  if (!compiled) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    )
  }

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <MDXRemote {...compiled} components={mdxComponents} />
    </div>
  )
}

export default function ApiPostPage() {
  const params = useParams()
  const id = params.id as string

  const { data: post, isLoading, error, isError } = usePostById(id)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground dark:text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            文章不存在
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground mb-6">
            {error instanceof Error ? error.message : '无法加载文章，请稍后重试'}
          </p>
          <Link
            href="/blog"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回博客列表
          </Link>
        </div>
      </div>
    )
  }

  // Success - render post
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link href="/blog" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          ← 返回博客
        </Link>
      </nav>

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground dark:text-foreground sm:text-4xl mb-4">
          {post.title}
        </h1>

        {post.summary && (
          <p className="text-xl text-muted-foreground dark:text-muted-foreground mb-4">
            {post.summary}
          </p>
        )}

        {/* Post Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {new Date(post.published_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}

          {post.author_name && (
            <>
              <span>•</span>
              <span>{post.author_name}</span>
            </>
          )}

          <span>•</span>
          <span>{post.view_count} 次浏览</span>

          <span>•</span>
          <span>{post.like_count} 点赞</span>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-muted dark:bg-card text-foreground dark:text-muted-foreground rounded-full text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Post Content - MDX compiled and rendered */}
      <PostContent source={post.content_mdx || post.content || ''} />

      {/* Post Footer */}
      <footer className="mt-12 pt-8 border-t border-border dark:border-border">
        <div className="flex justify-between items-center">
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← 返回博客列表
          </Link>

          <div className="flex gap-4">
            <span className="text-muted-foreground dark:text-muted-foreground">
              {post.comment_count} 评论
            </span>
            <span className="text-muted-foreground dark:text-muted-foreground">
              {post.like_count} 点赞
            </span>
          </div>
        </div>
      </footer>
    </article>
  )
}
