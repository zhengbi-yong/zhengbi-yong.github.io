'use client'

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { highlightCode } from '@/lib/shiki-highlighter'

interface CodeBlockProps {
  children: ReactNode
  className?: string
  title?: string
}

function extractLanguage(className?: string): string {
  if (!className) return ''
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : ''
}

/**
 * Recursively extract plain text from React children.
 * Strips out any DOM elements (including copy buttons) and returns only code text.
 */
function extractTextContent(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractTextContent).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextContent(
      (children as { props: { children?: ReactNode } }).props.children
    )
  }
  return ''
}

/**
 * Extract just the inner code content from Shiki's full HTML output.
 * Shiki wraps in <pre><code>...</code></pre>; we need only the inner part.
 */
function extractShikiContent(html: string): string {
  const match = html.match(/<pre[^>]*><code[^>]*>([\s\S]*)<\/code><\/pre>/)
  return match ? match[1] : html
}

export function CodeBlock({ children, className, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const language = extractLanguage(className)
  const codeText = extractTextContent(children)

  // E3: Async Shiki highlighting — yields to React's scheduler
  useEffect(() => {
    if (!language || !codeText.trim()) {
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const html = await highlightCode(codeText, language, 'github-dark')
        if (!cancelled) {
          setHighlightedHtml(html)
        }
      } catch {
        // fallback to default rendering
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [language, codeText])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers / insecure contexts
      const textarea = document.createElement('textarea')
      textarea.value = codeText
      textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }, [codeText])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="group/code relative my-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700/50 bg-[#F5F3F0] dark:bg-gray-900/95">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700/50 px-4 py-2 bg-stone-200 dark:bg-gray-800/80">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          {title && (
            <span className="ml-2 text-xs text-gray-400 font-mono truncate max-w-[200px]">
              {title}
            </span>
          )}
          {!title && language && (
            <span className="ml-2 text-xs text-gray-400 font-mono uppercase tracking-wide">
              {language}
            </span>
          )}
        </div>

        {/* Copy button — always visible, no hover required */}
        <motion.button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          )}
          whileTap={{ scale: 0.92 }}
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Check size={14} />
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Copy size={14} />
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Code content */}
      <div className="relative">
        {language ? (
          <div className="flex">
            {/* Line numbers — hidden on very small screens */}
            <div className="hidden sm:flex flex-shrink-0 select-none border-r border-gray-700/30 px-3 py-4 text-right font-mono text-xs leading-[1.7] text-gray-600 dark:text-gray-500">
              {codeText.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className="flex-1 overflow-x-auto">
              {highlightedHtml ? (
                <pre
                  className="p-4 text-sm leading-[1.7]"
                  dangerouslySetInnerHTML={{
                    __html: extractShikiContent(highlightedHtml),
                  }}
                />
              ) : (
                <div className="p-4 text-sm font-mono leading-[1.7] text-gray-800 dark:text-gray-200 opacity-90">
                  {children}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3">
            <Terminal size={14} className="text-gray-500 flex-shrink-0" />
            <div className="overflow-x-auto flex-1 font-mono text-sm">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeBlock
