'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getHighlighter } from '@/lib/shiki-highlighter'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
  title?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractLanguage(className?: string): string {
  if (!className) return ''
  const match = className.match(/language-(\w+)/)
  return match ? match[1]! : ''
}

function extractTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractTextContent).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextContent(
      (children as { props: { children?: React.ReactNode } }).props.children
    )
  }
  return ''
}

// ── Component ──────────────────────────────────────────────────────────────────
//
// Theme switching is 100% CSS-driven (no React, no useTheme):
// - Container bg/border uses CSS variables (var(--theme-*)) — same as rest of page
// - Header bar uses Tailwind dark: variants
// - Code content renders BOTH light+dark Shiki HTML, CSS toggles visibility
//
// When next-themes toggles .dark on <html>, EVERYTHING changes in one CSS frame:
// CSS variables, dark: variants, and dark:hidden/dark:block all recalc together.

export function CodeBlock({ children, className, title }: CodeBlockProps) {
  const [darkHtml, setDarkHtml] = useState<string | null>(null)
  const [lightHtml, setLightHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const language = extractLanguage(className)
  const codeText = extractTextContent(children)
  const trimmedCode = codeText.trimEnd()
  const codeLines = trimmedCode.split('\n').length

  // ── Pre-highlight BOTH themes once on mount ──
  // After this, theme switching is pure CSS — no Shiki re-runs, no React re-renders.
  useEffect(() => {
    if (!language || !trimmedCode.trim()) {
      setDarkHtml(null)
      setLightHtml(null)
      return
    }
    let cancelled = false
    getHighlighter()
      .then(async (h) => {
        const [dark, light] = await Promise.all([
          h.codeToHtml(trimmedCode, { lang: language, theme: 'github-dark' }),
          h.codeToHtml(trimmedCode, { lang: language, theme: 'github-light' }),
        ])
        if (!cancelled) {
          setDarkHtml(dark)
          setLightHtml(light)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [language, trimmedCode])

  // ── Copy handler ──
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trimmedCode)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
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
  }, [trimmedCode, codeText])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const hasHtml = !!(darkHtml && lightHtml)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative my-6 overflow-hidden rounded-lg border bg-[var(--theme-bg)] border-[var(--theme-border)] dark:border-gray-700/50">
      {/* Header bar — macOS window chrome */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] dark:bg-gray-800/90 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          {title ? (
            <span className="ml-2 text-xs text-[var(--theme-fg-tertiary)] font-mono truncate max-w-[200px]">
              {title}
            </span>
          ) : language ? (
            <span className="ml-2 text-xs text-[var(--theme-fg-tertiary)] font-mono uppercase tracking-wide">
              {language}
            </span>
          ) : null}
        </div>

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
                <Check size={14} /> Copied!
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
                <Copy size={14} /> Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Code content */}
      <div className="flex">
        {/* Line numbers */}
        <div className="hidden sm:flex flex-col flex-shrink-0 select-none border-r border-[var(--theme-border)] dark:border-gray-700/30 px-3 py-4 text-right font-mono text-[13px] leading-[1.7] text-[var(--theme-fg-secondary)]">
          {Array.from({ length: codeLines }, (_, i) => (
            <div key={i} className="min-h-[calc(0.8125rem*1.7)]">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code — BOTH variants, CSS toggles via dark: class */}
        <div className="flex-1 overflow-x-auto cb-code-body">
          {hasHtml ? (
            <>
              {/* Light variant */}
              <div
                className="block dark:hidden"
                dangerouslySetInnerHTML={{ __html: lightHtml! }}
              />
              {/* Dark variant */}
              <div
                className="hidden dark:block"
                dangerouslySetInnerHTML={{ __html: darkHtml! }}
              />
            </>
          ) : (
            <pre className="!m-0 p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap text-[var(--theme-fg-secondary)]">
              {codeText}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default CodeBlock
