'use client'

import { useState, useCallback } from 'react'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export default function CodeBlock({ children, className }: CodeBlockProps) {
  // Extract language from className like "language-typescript"
  const match = /language-(\w+)/.exec(className || '')
  const lang = match ? match[1] : 'code'

  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    // Extract text content from children
    const text = extractText(children)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [children, lang])

  return (
    <div className="code-block rounded-xl overflow-hidden my-6 shadow-md">
      {/* Title bar - macOS window chrome */}
      <div className="code-block-header flex items-center justify-between bg-background dark:bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-xs text-muted-foreground ml-2 font-mono uppercase tracking-wide">
            {lang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-card transition-colors duration-150"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content - always dark */}
      <div className="code-block-body bg-[#1e1e2e] dark:bg-[#0d0d14] p-4 overflow-x-auto">
        <pre className="text-sm leading-relaxed">
          <code className="text-muted-foreground">{children}</code>
        </pre>
      </div>
    </div>
  )
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    const props = (children as React.ReactElement<{ children?: React.ReactNode }>).props
    return extractText(props.children)
  }
  return ''
}
