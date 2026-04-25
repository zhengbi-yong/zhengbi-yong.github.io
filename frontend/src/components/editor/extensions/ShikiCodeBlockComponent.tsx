'use client'

import { NodeViewWrapper, NodeViewContent, type ReactNodeViewProps } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { highlightCode } from '@/lib/shiki-highlighter'
import { cn } from '@/lib/utils'

export function ShikiCodeBlockComponent({ node }: ReactNodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlighted, setHighlighted] = useState('')
  // language stored as data-language (set by ShikiCodeBlock extension's renderHTML)
  const language = (node.attrs['data-language'] || 'typescript').toString().toLowerCase()

  // Extract raw text from TipTap's node children via the editor DOM
  const getRawText = (): string => {
    if (!containerRef.current) return ''
    return containerRef.current.textContent || ''
  }

  // E3: async highlight with setTimeout — yields to React's scheduler
  useEffect(() => {
    if (!containerRef.current) {
      return undefined
    }

    const text = containerRef.current.textContent || ''
    if (!text.trim()) {
      return undefined
    }

    const timer = setTimeout(async () => {
      const result = await highlightCode(text, language, 'github-dark')
      setHighlighted(result)
    }, 0)

    return () => clearTimeout(timer)
  }, [language])

  const isDecorated = highlighted.includes('class="')

  return (
    <NodeViewWrapper>
      <div className={cn('group relative my-4 rounded-lg overflow-hidden border bg-[#0d1117]')}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <span className="text-xs text-gray-400 font-mono">{language}</span>
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
          <div className="relative">
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
