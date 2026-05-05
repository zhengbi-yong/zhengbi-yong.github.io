'use client'

/**
 * 文章预览页面
 *
 * 通过 URL 参数接收 Markdown 内容并实时渲染预览
 * 用于新建/编辑文章时的实时预览功能
 */

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { useRouter } from 'next/navigation'

// 简单的 Markdown 转 HTML 转换（用于基础预览）
function SimpleMarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-border dark:border-border pl-4 italic my-4">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-secondary dark:bg-card px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary dark:text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className="border-border dark:border-border my-8" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-border dark:border-border">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border dark:border-border bg-muted dark:bg-card px-4 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border dark:border-border px-4 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function PreviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const title = searchParams.get('title') || '无标题'
  const content = searchParams.get('content') || ''

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background dark:bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-secondary rounded w-3/4 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-secondary rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-secondary rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-secondary rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background transition-colors">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 border-b border-border dark:border-border bg-background/80 dark:bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">预览模式</span>
            <span className="px-2 py-0.5 text-xs bg-[var(--theme-warning)]/10 dark:bg-yellow-900/30 text-[var(--theme-warning)] dark:text-yellow-300 rounded">
              仅供预览
            </span>
          </div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-100"
          >
            ← 返回编辑
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <h1 className="text-3xl font-bold text-foreground dark:text-foreground mb-8">
          {title}
        </h1>

        {/* Markdown 内容 */}
        {content ? (
          <SimpleMarkdownPreview content={content} />
        ) : (
          <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground">
            <p>暂无内容</p>
            <p className="text-sm mt-2">在编辑器中添加内容后即可预览</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground dark:text-muted-foreground">加载中...</div>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
