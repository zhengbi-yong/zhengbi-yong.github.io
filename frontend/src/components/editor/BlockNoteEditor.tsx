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
          return parsed as any
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
  //
  // 根因: ProseMirror 在 mousedown 冒泡阶段调用 preventDefault(),
  // 阻止了原生 <select> 获得焦点和打开下拉菜单.
  //
  // 方案: 在 document 级别 capture 阶段拦截 mousedown,
  // 当目标是代码块内的 <select> 时:
  //   - stopImmediatePropagation() 阻止事件到达 ProseMirror
  //   - 不调用 preventDefault(),保留浏览器打开 select 的默认行为
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'SELECT' &&
        target.closest('.bn-block-content')
      ) {
        e.stopImmediatePropagation()
        // 不调用 preventDefault — 让浏览器自然打开 <select>
      }
    }

    // document capture 阶段,比任何元素级 handler 都早
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
        theme={bnTheme}
      />
    </div>
  )
}

export { BlockNoteEditor }
export default BlockNoteEditor
