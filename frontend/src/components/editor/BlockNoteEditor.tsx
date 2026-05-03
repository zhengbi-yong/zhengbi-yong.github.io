'use client'

import { useEffect, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import { Loader2 } from 'lucide-react'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { codeBlockOptions } from '@blocknote/code-block'
import './BlockNoteEditor.css'

const codeBlock = createCodeBlockSpec(codeBlockOptions)

const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    codeBlock,
  },
})

/**
 * Strip legacy properties from content_json blocks.
 * BlockNote 0.49.0 rejects old-format { styles: { bold: true } },
 * custom id/props/children fields, etc.
 */
function deepNormalize(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(deepNormalize)

  const src = node as Record<string, unknown>
  const out: Record<string, unknown> = {}

  if ('type' in src) out.type = src.type
  if (typeof src.text === 'string') out.text = src.text
  if (typeof src.href === 'string') out.href = src.href
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
