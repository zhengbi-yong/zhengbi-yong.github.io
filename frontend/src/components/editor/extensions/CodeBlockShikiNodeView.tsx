// Shiki-powered CodeBlock NodeView for TipTap
// Renders code blocks with dual-theme (github-light / github-dark) highlighting.
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { getShikiHighlighter } from '@/lib/shiki-highlighter'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'c',
  'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'bash', 'shell',
  'sql', 'html', 'css', 'scss', 'json', 'yaml', 'toml', 'markdown',
  'mdx', 'xml', 'dockerfile', 'graphql', 'r', 'lua', 'perl', 'elixir',
  'haskell', 'dart', 'jsx', 'tsx', 'regex', 'diff', 'plaintext',
]

export function CodeBlockShikiNodeView({
  node,
  updateAttributes,
  deleteNode,
  getPos,
  editor,
}: NodeViewProps) {
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lang = (node.attrs.language as string) || 'plaintext'

  // Extract raw text from ProseMirror codeBlock child text nodes
  const getRawText = useCallback(() => {
    // TipTap 3.x: node.content is a Fragment; use node.textContent for plain text
    return node.textContent
  }, [node.textContent])

  // Update editValue when node text changes (e.g., user typed in the raw node)
  useEffect(() => {
    if (isEditing) {
      setEditValue(node.textContent)
    }
  }, [node.textContent, isEditing])

  // Highlight with Shiki whenever language or content changes
  useEffect(() => {
    let cancelled = false
    const text = getRawText() || ' '

    getShikiHighlighter().then(highlighter => {
      if (cancelled) return
      try {
        const html = highlighter.codeToHtml(text, {
          lang: LANGUAGES.includes(lang) ? lang : 'plaintext',
          themes: { light: 'github-light', dark: 'github-dark' },
        })
        if (!cancelled) setHighlightedHtml(html)
      } catch {
        if (!cancelled) {
          setHighlightedHtml(
            `<pre class="shiki"><code>${escapeHtml(text)}</code></pre>`
          )
        }
      }
    })

    return () => { cancelled = true }
  }, [lang, getRawText])

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  function handleDoubleClick() {
    // TipTap 3.x: node.content is a Fragment; use node.textContent
    setEditValue(node.textContent)
    setIsEditing(true)
  }

  function handleSave() {
    if (!isEditing) return
    const newText = editValue
    setIsEditing(false)

    // Replace the text content of this codeBlock node via a ProseMirror transaction
    const resolvedPos = typeof getPos === 'function' ? getPos() : getPos
    if (typeof resolvedPos === 'number' && editor) {
      const tr = editor.state.tr
      const codeBlockNode = editor.state.doc.nodeAt(resolvedPos)
      if (codeBlockNode) {
        // Calculate total content width of the codeBlock
        const from = resolvedPos + 1 // skip opening tag
        const to = from + codeBlockNode.content.size
        tr.replaceWith(from, to, editor.state.schema.text(newText))
        editor.view.dispatch(tr)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      setIsEditing(false)
      e.preventDefault()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave()
      e.preventDefault()
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = editValue.substring(0, start) + '  ' + editValue.substring(end)
      setEditValue(newValue)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      })
    }
  }

  function handleLanguageSelect(l: string) {
    updateAttributes({ language: l })
    setShowLangPicker(false)
  }

  return (
    <NodeViewWrapper
      className="shiki-code-block not-prose relative group my-4 rounded-lg overflow-hidden border border-border"
      data-language={lang}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border select-none">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangPicker(v => !v)}
            className="text-xs px-2 py-1 rounded bg-background hover:bg-accent transition-colors font-mono text-muted-foreground"
          >
            {lang}
          </button>
          {showLangPicker && (
            <div className="absolute top-full left-0 z-50 mt-1 w-48 max-h-64 overflow-y-auto bg-background border border-border rounded-lg shadow-lg">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleLanguageSelect(l)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors font-mono ${
                    lang === l ? 'text-primary font-semibold' : 'text-foreground'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={deleteNode}
            className="text-xs px-2 py-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="删除代码块"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Code content — double-click to edit */}
      <div onDoubleClick={handleDoubleClick} className="relative cursor-text">
        {isEditing ? (
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[120px] bg-background text-foreground text-sm font-mono resize-y rounded border border-primary/50 p-3 outline-none"
              spellCheck={false}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs px-3 py-1 rounded border hover:bg-accent transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                保存 (Ctrl+Enter)
              </button>
            </div>
          </div>
        ) : (
          <div
            className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre.shiki]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
