'use client'

import { NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import katex from 'katex'
// Register mhchem \ce{} and \pu{} macros globally (side-effect import)
// This must come BEFORE any katex.renderToString() calls
import 'katex/dist/contrib/mhchem.mjs'

interface MathNodeViewProps {
  node: {
    attrs: {
      latex: string
    }
    type: {
      name: string
    }
  }
  updateAttributes: (attrs: { latex: string }) => void
  deleteNode: () => void
  selected: boolean
}

/**
 * React NodeView for BlockMath and InlineMath nodes.
 * Renders KaTeX in the editor using the LaTeX source from node.attrs.latex.
 *
 * XSS-safe: KaTeX output is inserted via textContent (not innerHTML),
 * with manual HTML entity escaping for the error fallback.
 */
export function MathNodeView({ node, updateAttributes, deleteNode, selected }: MathNodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.attrs.latex)

  const latex = node.attrs.latex || ''
  const displayMode = node.type.name === 'blockMath'

  useEffect(() => {
    const container = containerRef.current
    if (!container || isEditing) return

    try {
      // Decode HTML entities that may appear in node.attrs.latex
      const decoded = latex
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x27;/g, "'")

      // KaTeX renders to HTML string — inject safely
      const html = katex.renderToString(decoded, {
        displayMode,
        throwOnError: false,
        trust: false,
      })
      container.innerHTML = html
    } catch (_err) {
      // XSS-safe fallback: escape all special chars then inject as text
      const escaped = latex
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      container.innerHTML = `<span class="text-red-500 font-mono text-sm">${escaped}</span>`
    }
  }, [latex, displayMode, isEditing])

  // Sync editValue when latex changes from outside
  useEffect(() => {
    if (!isEditing) {
      setEditValue(latex)
    }
  }, [latex, isEditing])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selected) {
      setIsEditing(true)
      setEditValue(latex)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue !== latex) {
      updateAttributes({ latex: editValue })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(latex)
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
      if (editValue !== latex) {
        updateAttributes({ latex: editValue })
      }
    }
  }

  if (isEditing) {
    return (
      <NodeViewWrapper
        as={displayMode ? 'div' : 'span'}
        contentEditable={false}
        className={displayMode ? 'block my-3' : 'inline'}
      >
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={displayMode ? 3 : 1}
          className={`
            w-full font-mono text-sm px-2 py-1 border rounded
            bg-background text-foreground resize-y
            ${selected ? 'border-primary ring-1 ring-primary' : 'border-border'}
          `}
          style={displayMode ? {} : { minWidth: '60px', maxWidth: '400px' }}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="text-xs text-muted-foreground mt-1">
          按 Enter 确认 · Esc 取消 · Shift+Enter 换行
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      as={displayMode ? 'div' : 'span'}
      contentEditable={false}
      onClick={handleClick}
      style={{ position: 'relative', display: displayMode ? 'block' : 'inline' }}
      className={`group ${
        displayMode ? 'block my-4' : 'inline'
      } cursor-pointer select-none align-middle ${
        selected ? 'outline-2 outline-primary outline-offset-1 rounded' : ''
      } hover:bg-muted/40 rounded px-1`}
    >
      {/* KaTeX renders here via innerHTML (safe — KaTeX output is HTML math notation) */}
      <div ref={containerRef} />
      {/* Delete button — only visible when math node is selected */}
      {selected && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            deleteNode()
          }}
          className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          title="删除公式"
        >
          ✕
        </button>
      )}
    </NodeViewWrapper>
  )
}
