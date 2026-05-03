'use client'

import { useEffect, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import { Loader2 } from 'lucide-react'
import './BlockNoteEditor.css'

/**
 * Fix legacy boolean styles { bold: true } → { bold: {} }.
 * BlockNote 0.49.0 rejects boolean-style styles on inline content nodes.
 */
function fixStyles(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(fixStyles)

  const src = node as Record<string, unknown>
  const out: Record<string, unknown> = { ...src }

  // Fix boolean styles
  if (out.styles && typeof out.styles === 'object') {
    const styles = out.styles as Record<string, unknown>
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(styles)) {
      cleaned[k] = v === true ? {} : v
    }
    out.styles = cleaned
  }

  // Recurse into content/children
  if (Array.isArray(out.content)) {
    out.content = out.content.map(fixStyles)
  }
  if (Array.isArray(out.children)) {
    out.children = out.children.map(fixStyles)
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
          return fixStyles(parsed) as any
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

  // Prevent ProseMirror from intercepting select element clicks in code block language picker
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
