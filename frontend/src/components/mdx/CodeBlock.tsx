'use client'

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { highlightCodeToTokens, buildCodeBlockHtml } from '@/lib/shiki-highlighter'

interface CodeBlockProps {
  children: ReactNode
  className?: string
  title?: string
}

function extractLanguage(className?: string): string {
  if (!className) return ''
  const match = className.match(/language-(\w+)/)
  return match ? match[1]! : ''
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

export function CodeBlock({ children, className, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)
  const [shikiColors, setShikiColors] = useState<{ fg: string; bg: string } | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { resolvedTheme } = useTheme()
  const language = extractLanguage(className)
  const codeText = extractTextContent(children)
  // Trim trailing whitespace so Shiki doesn't generate an extra trailing empty line
  const trimmedCode = codeText.trimEnd()
  const codeLines = trimmedCode.split('\n').length
  const shikiTheme = resolvedTheme === 'dark' ? 'github-dark' : 'github-light'

  // Async token-level highlighting — build our own HTML for full line-count control
  useEffect(() => {
    if (!language || !trimmedCode.trim()) {
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const result = await highlightCodeToTokens(trimmedCode, language, shikiTheme)
        if (!cancelled && result) {
          const { html, fg, bg } = buildCodeBlockHtml(result.tokens, codeLines, result.fg, result.bg)
          // Debug: verify line count
          const shikiLines = result.tokens.length
          if (shikiLines !== codeLines) {
            console.warn(
              `[CodeBlock] Shiki raw=${shikiLines} codeLines=${codeLines} lang=${language} — limited to ${codeLines}`
            )
          }
          setHighlightedHtml(html)
          setShikiColors({ fg, bg })
        }
      } catch {
        // fallback to default rendering
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [language, trimmedCode, shikiTheme, codeLines])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trimmedCode)
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
    <div
      className="group/code relative my-6 overflow-hidden rounded-lg border border-[var(--theme-border)] dark:border-gray-700/50"
      style={{
        backgroundColor: shikiColors?.bg ?? undefined,
        color: shikiColors?.fg ?? undefined,
      }}
    >
      {/* CSS: font-size:0 on container collapses \n text nodes between .line spans.
           .line spans restore font-size; min-height ensures empty lines are visible.
           Line count is exact — built from tokens, limited to codeLines. */}
      <style>{`
        .code-block-content { font-size: 0; }
        .code-block-content .line { display: block; font-size: 0.875rem; line-height: 1.7; white-space: pre; min-height: calc(0.875rem * 1.7); }
      `}</style>
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[var(--theme-border)] dark:border-gray-700/50 px-4 py-2 bg-[var(--theme-bg-secondary)] dark:bg-gray-800/90">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          {title && (
            <span className="ml-2 text-xs text-[var(--theme-fg-tertiary)] font-mono truncate max-w-[200px]">
              {title}
            </span>
          )}
          {!title && language && (
            <span className="ml-2 text-xs text-[var(--theme-fg-tertiary)] font-mono uppercase tracking-wide">
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
        <div className="flex">
          {/* Line numbers — hidden on very small screens */}
          <div className="hidden sm:flex flex-col flex-shrink-0 select-none border-r border-gray-700/30 px-3 py-4 text-right font-mono text-sm leading-[1.7] text-[var(--theme-fg-secondary)] dark:text-[var(--theme-fg-secondary)]">
            {trimmedCode.split('\n').map((_, i) => (
              <div key={i} className="min-h-[calc(0.875rem*1.7)]">{i + 1}</div>
            ))}
          </div>
          <div className="flex-1 overflow-x-auto">
            {highlightedHtml ? (
              <div
                className="code-block-content font-mono"
                style={{ padding: '1rem' }}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <div
                className="p-4 text-sm font-mono leading-[1.7] whitespace-pre-wrap"
                style={{ color: shikiColors?.fg ?? undefined }}
              >
                {codeText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeBlock
