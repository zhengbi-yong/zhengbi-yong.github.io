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
 * Only strips known-problematic old-style { styles: { bold: true } } marks;
 * keeps all standard BlockNote properties (id, props, children, etc.) intact.
 */
function deepNormalize(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(deepNormalize)

  const src = node as Record<string, unknown>
  const out: Record<string, unknown> = { ...src }

  // Fix legacy inline styles: old format uses { styles: { bold: true } }
  // BlockNote 0.49.0 uses { type: 'text', styles: {} } with StyledText
  // or marks array. Strip boolean-style styles that BlockNote rejects.
  if (out.styles && typeof out.styles === 'object') {
    const styles = out.styles as Record<string, unknown>
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(styles)) {
      if (v === true) cleaned[k] = {}  // convert boolean to empty object
      else cleaned[k] = v
    }
    out.styles = cleaned
  }

  // Recurse into children/content arrays
  if (Array.isArray(out.content)) {
    out.content = out.content.map(deepNormalize)
  }
  if (Array.isArray(out.children)) {
    out.children = out.children.map(deepNormalize)
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
