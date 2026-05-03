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

// 带语法高亮和语言选择器的代码块 spec（使用 @blocknote/code-block 预配置）
const codeBlock = createCodeBlockSpec(codeBlockOptions)

// 扩展默认 schema，仅覆盖 codeBlock（官方推荐方式）
const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    codeBlock,
  },
})

/**
 * BlockNote 编辑器组件（客户端渲染）
 *
 * 使用 @blocknote/code-block 提供的 codeBlockOptions：
 * - 43 种编程语言支持（含中文显示名）
 * - Shiki 语法高亮（默认 light/dark 主题）
 * - Tab 缩进支持
 *
 * 数据流（双轨输出）：
 *   onChange(json, mdx) → {
 *     json: blocks JSON → content_json（SSOT）
 *     mdx: Markdown → content_mdx（博客详情页渲染）
 *   }
 */
function BlockNoteEditor({
  content,
  onChange,
}: {
  content?: string
  onChange?: (json: string, mdx: string) => void
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // 跟随 next-themes 的主题设置
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // BlockNote 的 theme prop: "light" | "dark"
  // 未挂载前默认 light 避免 hydration mismatch
  const bnTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  const editor = useCreateBlockNote({
    schema,
    initialContent: (() => {
      if (!content) return undefined
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          // Normalize legacy content_json: recursively strip incompatible
          // styles and marks from all text nodes. BlockNote 0.49.0's
          // ProseMirror schema rejects legacy style objects like
          // { bold: true } and legacy marks.
          // Deep-recursive: handles nested bullet lists, tables, etc.
          function stripStyles(node: any): any {
            if (!node || typeof node !== 'object') return node
            const out: any = { ...node }
            if (node.type === 'text') {
              delete out.styles
              delete out.marks
            }
            if (Array.isArray(node.content)) {
              out.content = node.content.map(stripStyles)
            }
            return out
          }
          return parsed.map(stripStyles) as any
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
