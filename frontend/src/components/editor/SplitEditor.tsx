'use client'

/**
 * SplitEditor - Full-screen split-pane MDX editor with live preview
 *
 * Features:
 * - Overleaf-like full screen editing experience
 * - View modes: Edit Only | Split | Preview Only
 * - Left: Raw text editor with line numbers
 * - Right: Live markdown preview with KaTeX rendering
 * - Synchronized scrolling between panes
 * - Collapsible settings sidebar
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import MarkdownIt from 'markdown-it'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'

// Configure markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

// Custom renderer to handle KaTeX inline math: $...$
const defaultTextRender = md.renderer.rules.text

md.renderer.rules.text = function (tokens, idx, options, env, self) {
  const content = tokens[idx].content

  // Check for inline math: $...$
  const inlineMathRegex = /\$([^$]+)\$/g
  if (inlineMathRegex.test(content)) {
    return content.replace(inlineMathRegex, (match, math) => {
      try {
         
        const decoded = math.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        return katex.renderToString(decoded, {
          displayMode: false,
          throwOnError: false,
        })
      } catch (_) {
        return `<span class="text-red-500">${match}</span>`
      }
    })
  }

  if (defaultTextRender) {
    return defaultTextRender(tokens, idx, options, env, self)
  }
  return content
}

// KaTeX block renderer - processes $$...$$ display math
function renderKaTeXBlock(content: string): string {
  const displayMathRegex = /\$\$([^$]+)\$\$/g
  return content.replace(displayMathRegex, (match, math) => {
    try {
       
      const decoded = math.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      return `<div class="katex-display">${katex.renderToString(decoded, {
        displayMode: true,
        throwOnError: false,
      })}</div>`
    } catch (_) {
      return `<div class="text-red-500">${match}</div>`
    }
  })
}

export type ViewMode = 'edit' | 'split' | 'preview'

interface SplitEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  viewMode?: ViewMode
}

export function SplitEditor({
  content = '',
  onChange,
  placeholder = '开始写作...\n\n支持 Markdown 语法和 LaTeX 数学公式：\n- 块公式：$$E = mc^2$$\n- 行内公式：$\\alpha + \\beta$',
  className = '',
  viewMode = 'split',
}: SplitEditorProps) {

  const [text, setText] = useState(content)
  const [renderedHtml, setRenderedHtml] = useState('')
  const [lineCount, setLineCount] = useState(1)
  const rightPaneRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Render markdown to HTML
  const renderMarkdown = useCallback((input: string) => {
    if (!input.trim()) {
      return '<p class="text-gray-400 italic">预览区域</p>'
    }

    let html = md.render(input)
    // Process KaTeX display blocks
    html = renderKaTeXBlock(html)
    return html
  }, [])

  // Update rendered preview when text changes
  useEffect(() => {
    const html = renderMarkdown(text)
    setRenderedHtml(html)
    setLineCount(text.split('\n').length)
  }, [text, renderMarkdown])

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    onChange?.(newText)
  }

  // Sync scroll from left to right
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (viewMode !== 'split') return
    const textarea = e.target as HTMLTextAreaElement
    if (rightPaneRef.current) {
      const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1)
      const rightScrollMax = rightPaneRef.current.scrollHeight - rightPaneRef.current.clientHeight
      rightPaneRef.current.scrollTop = scrollRatio * rightScrollMax
    }
  }

  // Sync scroll from right to left
  const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (viewMode !== 'split') return
    const target = e.target as HTMLDivElement
    if (textareaRef.current) {
      const scrollRatio = target.scrollTop / (target.scrollHeight - target.clientHeight || 1)
      const leftScrollMax = textareaRef.current.scrollHeight - textareaRef.current.clientHeight
      textareaRef.current.scrollTop = scrollRatio * leftScrollMax
    }
  }

  // Tab key handler for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.target as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = text.substring(0, start) + '  ' + text.substring(end)
      setText(newText)
      onChange?.(newText)
      // Set cursor position after the tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  // Generate line numbers
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div className={cn('flex h-full flex-col bg-white dark:bg-gray-900', className)}>
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        {viewMode !== 'preview' && (
          <div
            className={cn(
              'flex border-r border-gray-200 dark:border-gray-700',
              viewMode === 'edit' ? 'w-full' : 'w-1/2'
            )}
          >
            {/* Line numbers */}
            <div className="w-14 flex-shrink-0 overflow-hidden border-r border-gray-200 bg-gray-50 select-none dark:border-gray-700 dark:bg-gray-800">
              <div className="py-4 pr-4 text-right font-mono text-xs leading-[1.6rem] text-gray-400 dark:text-gray-500">
                {lineNumbers.map((num) => (
                  <div key={num} className="h-[1.6rem]">
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder={placeholder}
                className="absolute inset-0 h-full w-full resize-none border-none bg-white p-6 font-mono text-base leading-[1.6rem] text-gray-900 placeholder-gray-300 focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-600"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Preview area */}
        {viewMode !== 'edit' && (
          <div
            ref={rightPaneRef}
            onScroll={handleRightScroll}
            className={cn(
              'overflow-auto bg-white dark:bg-gray-900',
              viewMode === 'preview' ? 'w-full' : 'w-1/2'
            )}
          >
            <div className="mx-auto max-w-3xl p-8">
              <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
                <span>{text.split(/\s+/).filter(Boolean).length} 字</span>
              </div>
              <div
                className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8 prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6 prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4 prose-p:leading-relaxed prose-p:mb-4 prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ul:ml-6 prose-ol:list-decimal prose-ol:ml-6 prose-li:mb-1 prose-img:rounded-lg prose-img:shadow-md prose-hr:border-gray-200 dark:prose-hr:border-gray-700 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-2 prose-th:bg-gray-100 dark:prose-th:bg-gray-700 prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2 max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
