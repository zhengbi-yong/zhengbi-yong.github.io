'use client'

import { NodeViewWrapper, NodeViewContent, type ReactNodeViewProps } from '@tiptap/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { highlightCode } from '@/lib/shiki-highlighter'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'csharp', label: 'C#' },
  { id: 'swift', label: 'Swift' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'php', label: 'PHP' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'shell', label: 'Shell' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'toml', label: 'TOML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'xml', label: 'XML' },
  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'graphql', label: 'GraphQL' },
  { id: 'latex', label: 'LaTeX' },
  { id: 'plaintext', label: 'Plain Text' },
]

export function ShikiCodeBlockComponent({ node, updateAttributes }: ReactNodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlighted, setHighlighted] = useState('')
  const [langOpen, setLangOpen] = useState(false)
  // language stored in node.attrs.language (defined in ShikiCodeBlock extension)
  const language = (node.attrs.language || 'typescript').toString().toLowerCase()

  // Extract raw text from TipTap's node children via the editor DOM
  const getRawText = (): string => {
    if (!containerRef.current) return ''
    return containerRef.current.textContent || ''
  }

  // E3: async highlight with setTimeout — yields to React's scheduler
  useEffect(() => {
    let cancelled = false

    if (!containerRef.current) {
      return undefined
    }

    const text = containerRef.current.textContent || ''
    if (!text.trim()) {
      return undefined
    }

    const timer = setTimeout(async () => {
      const result = await highlightCode(text, language, 'github-dark')
      if (!cancelled) {
        setHighlighted(result)
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [language])

  const isDecorated = highlighted.includes('class="')

  const handleLanguageChange = useCallback((newLang: string) => {
    setLangOpen(false)
    updateAttributes({ language: newLang })
  }, [updateAttributes])

  // Close dropdown on outside click
  useEffect(() => {
    if (!langOpen) return undefined
    const handler = () => setLangOpen(false)
    // Use mousedown instead of click for faster response
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [langOpen])

  const currentLang = LANGUAGES.find(l => l.id === language) || { id: language, label: language }

  return (
    <NodeViewWrapper>
      <div className={cn('group relative my-4 rounded-lg border bg-[#0d1117]')}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 rounded-t-lg">
          {/* Language selector dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(o => !o)}
              className="text-xs text-gray-400 font-mono hover:text-gray-200 transition-colors flex items-center gap-1"
              title="切换语言"
            >
              {currentLang.label}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-40 max-h-48 overflow-y-auto rounded-md border border-white/10 bg-gray-900 shadow-lg"
                   onClick={e => e.stopPropagation()}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleLanguageChange(lang.id)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs font-mono transition-colors',
                      lang.id === language
                        ? 'text-white bg-blue-600/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(getRawText())}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            title="复制代码"
          >
            复制
          </button>
        </div>

        {/* Body */}
        {isDecorated ? (
          // Shiki has finished — render highlighted HTML
          <div
            className="p-4 overflow-x-auto text-sm font-mono leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          // Pending — show raw content (NodeViewContent renders the Prosemirror-managed text)
          <div className="relative overflow-x-auto">
            <div
              ref={containerRef}
              className="p-4 overflow-x-auto text-sm font-mono text-gray-200 opacity-80"
            >
              <NodeViewContent />
            </div>
            {/* Loading shimmer */}
            {!highlighted && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/50">
                <span className="text-xs text-gray-500">高亮中...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
