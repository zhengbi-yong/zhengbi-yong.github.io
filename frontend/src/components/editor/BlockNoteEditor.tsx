'use client'

import { useEffect, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import { Loader2 } from 'lucide-react'
import './BlockNoteEditor.css'

/**
 * Normalize legacy content_json blocks for BlockNote 0.49.0 compatibility.
 *
 * Two known issues from the migration script:
 * 1. Block-level nodes (paragraphs with id/props/children) wrongly nested
 *    inside inline content arrays — content[0].content[0].content[0].text
 *    instead of content[0].text. Flatten these.
 * 2. Old-style boolean styles { bold: true } which BlockNote rejects.
 */

/** Recursively extract all leaf text nodes from a nested block tree */
function extractTextNodes(node: unknown): Record<string, unknown>[] {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(extractTextNodes)

  const src = node as Record<string, unknown>
  const result: Record<string, unknown>[] = []

  // If this is a text node, collect it
  if (src.type === 'text' && typeof src.text === 'string') {
    const clean: Record<string, unknown> = { type: 'text', text: src.text }
    if (src.styles && typeof src.styles === 'object') {
      const styles = src.styles as Record<string, unknown>
      const cleaned: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(styles)) {
        cleaned[k] = v === true ? {} : v  // boolean → empty object
      }
      clean.styles = cleaned
    }
    result.push(clean)
  }

  // Recurse into content/children arrays
  if (Array.isArray(src.content)) {
    result.push(...src.content.flatMap(extractTextNodes))
  }
  if (Array.isArray(src.children)) {
    result.push(...src.children.flatMap(extractTextNodes))
  }

  return result
}

/** Check if a node looks like a block-level node (has id/props/children) */
function isBlockNode(node: Record<string, unknown>): boolean {
  return ('id' in node || 'props' in node || 'children' in node)
}

function deepNormalize(node: unknown, isInline: boolean = false): unknown {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(n => deepNormalize(n, isInline))

  const src = node as Record<string, unknown>

  // Inline context: if this is a block node masquerading as inline content,
  // flatten it to extract actual text nodes
  if (isInline && isBlockNode(src)) {
    const texts = extractTextNodes(src)
    if (texts.length > 0) return texts
    // Empty block-wrapped node → skip it (return empty placeholder that gets filtered)
    return []
  }

  const out: Record<string, unknown> = { ...src }

  // Fix legacy inline styles: boolean → empty object
  if (out.styles && typeof out.styles === 'object') {
    const styles = out.styles as Record<string, unknown>
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(styles)) {
      cleaned[k] = v === true ? {} : v
    }
    out.styles = cleaned
  }

  // Process content: each child is in inline context
  if (Array.isArray(out.content)) {
    const processed = out.content.flatMap(n => {
      const result = deepNormalize(n, true)
      // deepNormalize may return an array (flattened inline nodes) or a single node
      if (Array.isArray(result)) return result.filter(x => x && typeof x === 'object' && Object.keys(x as object).length > 0)
      return result ? [result] : []
    })
    out.content = processed
  }

  // Process children: each child is a block, not inline
  if (Array.isArray(out.children)) {
    out.children = out.children.map(n => deepNormalize(n, false))
  }

  return out
}

function BlockNoteEditor({
  content,
  onChange,
}: {
  content?: string
  onChange?: (json: string, mdx: string) => void
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useCreateBlockNote({
    initialContent: (() => {
      if (!content) return undefined
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          return deepNormalize(parsed) as any
        }
        return undefined
      } catch {
        return undefined
      }
    })(),
  })

  useEffect(() => {
    const unsub = editor.onChange(() => {
      const cb = onChangeRef.current
      if (!cb) return

      try {
        const blocksJson = JSON.stringify(editor.document)
        const markdown = editor.blocksToMarkdownLossy()
        cb(blocksJson, markdown)
      } catch (e) {
        console.error('[BlockNoteEditor] conversion failed:', e)
        cb(JSON.stringify(editor.document), '')
      }
    })

    return () => {
      unsub()
    }
  }, [editor])

  // 修复 Prosemirror 拦截代码块语言选择器的点击事件
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'SELECT' &&
        target.closest('.bn-block-content')
      ) {
        e.stopImmediatePropagation()
      }
    }
    document.addEventListener('mousedown', handler, true)
    return () => {
      document.removeEventListener('mousedown', handler, true)
    }
  }, [])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground border rounded-lg">
        <Loader2 className="animate-spin mr-2" />
        编辑器加载中...
      </div>
    )
  }

  return (
    <div className="min-h-[400px]">
      <BlockNoteView
        editor={editor}
        theme="light"
      />
    </div>
  )
}

export { BlockNoteEditor }
export default BlockNoteEditor
