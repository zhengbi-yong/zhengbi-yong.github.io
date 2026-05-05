'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import { Loader2 } from 'lucide-react'
import { BlockNoteSchema, createCodeBlockSpec } from '@blocknote/core'
import { codeBlockOptions } from '@blocknote/code-block'
import { useTheme } from 'next-themes'
import './BlockNoteEditor.css'

// ── Theme-aware code block highlighter ────────────────────────────────────────
//
// prosemirror-highlight uses getLoadedThemes()[0] as the default theme.
// We reorder themes so [0] is always the CURRENT next-themes theme.
// Additionally wrap codeToTokens as belt-and-suspenders.
function useCodeBlockSpec() {
  const { resolvedTheme } = useTheme()
  const themeRef = useRef(resolvedTheme)
  themeRef.current = resolvedTheme

  return useMemo(() => {
    return createCodeBlockSpec({
      ...codeBlockOptions,
      createHighlighter: async () => {
        const highlighter = await codeBlockOptions.createHighlighter()

        // 1. Reorder getLoadedThemes so [0] = current theme
        const originalGetLoadedThemes = highlighter.getLoadedThemes.bind(highlighter)
        highlighter.getLoadedThemes = () => {
          const isDark = themeRef.current === 'dark'
          return isDark
            ? ['github-dark', 'github-light']
            : ['github-light', 'github-dark']
        }

        // 2. Belt-and-suspenders: wrap codeToTokens to inject theme directly
        const originalCodeToTokens = highlighter.codeToTokens.bind(highlighter)
        highlighter.codeToTokens = (code: string, options?: any) => {
          const themeName = themeRef.current === 'dark' ? 'github-dark' : 'github-light'
          return originalCodeToTokens(code, { ...(options || {}), theme: themeName })
        }

        return highlighter
      },
    })
  }, [])
}

// ── Schema ────────────────────────────────────────────────────────────────────
// We recreate schema whenever the codeBlockSpec changes (theme-aware spec).
// useMemo with empty deps is safe — the createHighlighter closure captures
// themeRef which is always updated before any highlight call.

/**
 * Fix legacy boolean styles { bold: true } → { bold: {} }.
 * BlockNote 0.49.0 rejects boolean-style styles on inline content nodes.
 * This runs at content load time to catch any DB-level cleanup misses.
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

/**
 * BlockNote 编辑器组件
 *
 * 功能：
 * - Shiki 语法高亮（@blocknote/code-block）
 * - 43 种编程语言选择器
 * - 暗色/亮色主题自适应（next-themes）
 * - 双轨输出：BlockNote JSON（SSOT） + Markdown（博客渲染）
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

  // 强制 ProseMirror 重新高亮代码块（主题切换后装饰器不会自动更新）
  const prevThemeRef = useRef(resolvedTheme)
  useEffect(() => {
    if (!editor) return
    const prev = prevThemeRef.current
    prevThemeRef.current = resolvedTheme
    if (prev === resolvedTheme || !prev) return // skip initial render

    // Dispatch a minimal ProseMirror transaction that touches code blocks
    // to force the highlight plugin to re-parse with the new theme.
    const view = (editor as any)._tiptapEditor?.view
    if (!view) return
    const { state } = view
    const tr = state.tr
    let changed = false
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'codeBlock') {
        // Set node markup (same type+attrs) to mark the node as "changed"
        // This triggers plugin state recomputation without altering content
        tr.setNodeMarkup(pos, undefined, node.attrs)
        changed = true
      }
    })
    if (changed) view.dispatch(tr)
  }, [resolvedTheme, editor])

  // BlockNote 的 theme prop: "light" | "dark"
  // 未挂载前默认 light 避免 hydration mismatch
  const bnTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  // ── 主题感知的代码块 spec（编辑器内 Shiki 高亮跟随主题） ──
  const codeBlockSpec = useCodeBlockSpec()

  // 扩展默认 schema，仅覆盖 codeBlock（官方推荐方式）
  const schema = useMemo(
    () =>
      BlockNoteSchema.create().extend({
        blockSpecs: { codeBlock: codeBlockSpec },
      }),
    [codeBlockSpec]
  )

  const editor = useCreateBlockNote({
    schema,
    initialContent: (() => {
      if (!content) return undefined
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          // Debug: log code block content on load
          for (const block of parsed) {
            if (block.type === 'codeBlock') {
              const text = block.content?.[0]?.text || ''
              const propsCode = block.props?.code || ''
              const contentLen = block.content?.length || 0
              console.log(
                '[BlockNoteEditor] codeBlock loaded:',
                `lang=${block.props?.language}`,
                `contentLen=${contentLen}`,
                `contentText_chars=${text.length}`,
                `contentText_lines=${text.split('\n').length}`,
                `propsCode_chars=${propsCode.length}`,
                `propsCode_lines=${propsCode.split('\n').length}`,
                `hasPropsCode=${!!block.props?.code}`,
                `text_preview=${JSON.stringify(text.slice(0, 60))}`,
                `code_preview=${JSON.stringify(propsCode.slice(0, 60))}`
              )
            }
          }
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
        // Deep-clone to avoid mutating editor.document
        const doc = JSON.parse(JSON.stringify(editor.document))
        
        // Normalize code blocks: merge multiple text nodes into one with \n separators.
        // BlockNote sometimes splits code block text at \n into separate text nodes;
        // when loaded back, adjacent text nodes without \n get concatenated → single line.
        // Also check props.code — @blocknote/code-block may store code there.
        if (Array.isArray(doc)) {
          for (const block of doc) {
            if (block.type === 'codeBlock' && Array.isArray(block.content)) {
              const firstText = block.content[0]?.text || ''
              const propsCode = block.props?.code || ''
              const nodeCount = block.content.length
              console.log(
                '[BlockNoteEditor] codeBlock saved:',
                `lang=${block.props?.language}`,
                `textNodes=${nodeCount}`,
                `contentText_chars=${firstText.length}`,
                `contentText_lines=${firstText.split('\n').length}`,
                `propsCode_chars=${propsCode.length}`,
                `propsCode_lines=${propsCode.split('\n').length}`,
                `hasPropsCode=${!!block.props?.code}`,
                `text_preview=${JSON.stringify(firstText.slice(0, 60))}`,
                `code_preview=${JSON.stringify(propsCode.slice(0, 60))}`
              )
              
              // Merge multiple text nodes into one (preserving \n between lines)
              if (nodeCount > 1) {
                const merged = block.content.map((n: any) => n.text || '').join('\n')
                block.content = [{ type: 'text', text: merged, styles: {} }]
                console.log(
                  '[BlockNoteEditor] codeBlock merged:',
                  `${nodeCount} → 1 text node, chars=${merged.length}`
                )
              }
            }
          }
        }
        
        const blocksJson = JSON.stringify(doc)
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

  // 修复 ProseMirror 拦截代码块语言选择器的点击事件
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
        key={bnTheme}
        editor={editor}
        theme={bnTheme}
      />
    </div>
  )
}

export { BlockNoteEditor }
export default BlockNoteEditor
