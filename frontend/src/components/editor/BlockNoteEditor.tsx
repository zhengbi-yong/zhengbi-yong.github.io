'use client'

import { useEffect, useRef, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import { Loader2 } from 'lucide-react'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { codeBlockOptions } from '@blocknote/code-block'
import { useTheme } from 'next-themes'
import './BlockNoteEditor.css'

const codeBlock = createCodeBlockSpec(codeBlockOptions)
const schema = BlockNoteSchema.create().extend({ blockSpecs: { codeBlock } })

/**
 * Deep-normalize legacy content_json for BlockNote 0.49.0.
 *
 * BlockNote 0.49.0 has a strict ProseMirror schema that rejects:
 * - Text node `styles` (old format: { bold: true, italic: true })
 * - Text node `marks` (old format for links, etc.)
 * - Block-level `props` / `backgroundColor` / `textColor` / `textAlignment`
 * - Custom `id` format
 * - Any unknown attributes
 *
 * We keep only: type, content (recursive), text, href (for links)
 */
function deepNormalize(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(deepNormalize)

  const src = node as Record<string, unknown>
  const out: Record<string, unknown> = {}

  // Always keep 'type'
  if ('type' in src) out.type = src.type

  // Keep 'text' (the actual text content)
  if (typeof src.text === 'string') out.text = src.text

  // Keep 'href' for inline links
  if (typeof src.href === 'string') out.href = src.href

  // Recursively normalize 'content' arrays
  if (Array.isArray(src.content)) {
    out.content = src.content.map(deepNormalize)
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

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const bnTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  const editor = useCreateBlockNote({
    schema,
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
        const blocks = editor.document
        const json = JSON.stringify(blocks)
        cb(json, '')
      } catch (err) {
        console.warn('[BlockNoteEditor] onChange error:', err)
      }
    })
    return unsub
  }, [editor])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载编辑器中...
      </div>
    )
  }

  return (
    <div className="blocknote-editor-container">
      <BlockNoteView editor={editor} theme={bnTheme} />
    </div>
  )
}

export default BlockNoteEditor
