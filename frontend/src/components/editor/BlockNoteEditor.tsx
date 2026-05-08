'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import { Loader2 } from 'lucide-react'
import { BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs } from '@blocknote/core'
import { codeBlockOptions } from '@blocknote/code-block'
import { useTheme } from 'next-themes'
import { createCustomComponentBlockSpec } from './CustomComponentBlock'
import { registerAllCustomEditors } from './custom'
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

        try {
          await Promise.all([
            highlighter.loadTheme('github-dark'),
            highlighter.loadTheme('github-light'),
          ])
        } catch {}

        const originalGetLoadedThemes = highlighter.getLoadedThemes.bind(highlighter)
        highlighter.getLoadedThemes = () => {
          const isDark = themeRef.current === 'dark'
          return isDark
            ? ['github-dark', 'github-light']
            : ['github-light', 'github-dark']
        }

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

/**
 * Fix legacy boolean styles { bold: true } → { bold: {} }.
 * BlockNote 0.49.0 rejects boolean-style styles on inline content nodes.
 */
function fixStyles(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(fixStyles)

  const src = node as Record<string, unknown>
  const out: Record<string, unknown> = { ...src }

  if (out.styles && typeof out.styles === 'object') {
    const styles = out.styles as Record<string, unknown>
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(styles)) {
      cleaned[k] = v === true ? {} : v
    }
    out.styles = cleaned
  }

  if (Array.isArray(out.content)) {
    out.content = out.content.map(fixStyles)
  }
  if (Array.isArray(out.children)) {
    out.children = out.children.map(fixStyles)
  }

  return out
}

/**
 * BlockNote 0.49 native top-level block types.
 * Used to detect blocks that need conversion before the custom component
 * spec is registered (migration from old format).
 */
const NATIVE_BLOCK_TYPES = new Set([
  'paragraph', 'heading', 'bulletListItem', 'numberedListItem',
  'checkListItem', 'codeBlock', 'table', 'file', 'image', 'video',
  'audio', 'divider', 'quote', 'toggleListItem', 'customComponent',
])

/**
 * One-time migration: convert legacy block types to current format.
 * BlockNote 0.49 renames:
 * - 'thematicBreak' → 'divider'
 * - 'blockquote' → 'quote'
 * - 'html' → customComponent with componentName='HtmlBlock'
 * - Strip empty content/children from blocks that don't support them
 */
function migrateLegacyBlocks(blocks: any[]): any[] {
  // Block types that MUST NOT have content/children (content: 'none')
  const NO_CONTENT_TYPES = new Set([
    'divider', 'image', 'video', 'audio', 'file',
    'customComponent',
  ])

  return blocks.map((block) => {
    // BlockNote 0.49 renamed thematicBreak → divider
    if (block.type === 'thematicBreak') {
      return { ...block, type: 'divider' }
    }
    // BlockNote 0.49 renamed blockquote → quote (content type changed from block to inline)
    if (block.type === 'blockquote') {
      // Extract all text from nested blocks and flatten to inline content
      const inlineContent: any[] = []
      function extractText(nodes: any[]) {
        for (const node of nodes) {
          if (node.type === 'text') {
            inlineContent.push({ type: 'text', text: node.text, styles: node.styles || {} })
          } else if (Array.isArray(node.content)) {
            extractText(node.content)
          }
        }
      }
      extractText(block.content || [])
      return {
        id: block.id,
        type: 'quote',
        props: block.props || {},
        content: inlineContent.length > 0 ? inlineContent : [{ type: 'text', text: '', styles: {} }],
        children: [],
      }
    }
    // Legacy embed type → file
    if (block.type === 'embed') {
      return { ...block, type: 'file' }
    }
    if (block.type === 'html') {
      return {
        id: block.id,
        type: 'customComponent',
        props: {
          componentName: 'HtmlBlock',
          attributesJson: JSON.stringify({ html: block.props?.html || '' }),
          childrenJson: '[]',
        },
        content: [],
      }
    }
    if (block.type === 'customComponent') {
      const props = block.props || {}
      // Remove content/children — customComponent has content: 'none'
      const { content: _c, children: _ch, ...rest } = block
      return {
        ...rest,
        props: {
          componentName: props.componentName || '',
          attributesJson: JSON.stringify(props.attributes || {}),
          childrenJson: JSON.stringify(props.children || []),
        },
      }
    }

    // Clean up blocks that must not have content/children
    if (NO_CONTENT_TYPES.has(block.type)) {
      const { content: _c, children: _ch, ...rest } = block
      return rest
    }

    return block
  })
}

/**
 * BlockNote 编辑器组件
 *
 * 功能：
 * - Shiki 语法高亮（@blocknote/code-block）
 * - 43 种编程语言选择器
 * - 暗色/亮色主题自适应（next-themes）
 * - 自定义组件编辑（RDKit, ECharts, Nivo, AntV, 化学结构, 动画包裹器等）
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

  // ── Register custom editors synchronously (must happen before useCreateBlockNote) ──
  // Called at module scope to avoid timing issues
  if (typeof window !== 'undefined' && !(window as any).__customEditorsRegistered) {
    (window as any).__customEditorsRegistered = true
    registerAllCustomEditors()
  }

  // 跟随 next-themes 的主题设置
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // BlockNote 的 theme prop: "light" | "dark"
  const bnTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  // ── 主题感知的代码块 spec ──
  const codeBlockSpec = useCodeBlockSpec()

  // ── 自定义组件 block spec ──
  const customComponentSpec = useMemo(() => {
    const factory = createCustomComponentBlockSpec()
    return factory() // invoke the factory to get the actual BlockSpec
  }, [])

  // ── 完整 schema：所有默认块 + codeBlock(Shiki高亮) + customComponent ──
  // BlockNoteSchema.create() 不带参数时使用 defaultBlockSpecs，
  // 传入 blockSpecs 时会完全替换。extend() 同样替换 blockSpecs。
  // 因此必须一次性传入所有需要的块规格，包括默认块。
  const schema = useMemo(
    () =>
      BlockNoteSchema.create({
        blockSpecs: {
          ...defaultBlockSpecs,
          // 用 Shiki 高亮版覆盖默认 codeBlock
          codeBlock: codeBlockSpec,
          // 自定义组件块
          customComponent: customComponentSpec,
        },
      }),
    [codeBlockSpec, customComponentSpec]
  )

  const editor = useCreateBlockNote({
    schema,
    initialContent: (() => {
      if (!content) return undefined
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          // Migrate any legacy block types
          const migrated = migrateLegacyBlocks(parsed)

          // Debug: log code block content on load
          for (const block of migrated) {
            if (block.type === 'codeBlock') {
              const text = block.content?.[0]?.text || ''
              console.log(
                '[BlockNoteEditor] codeBlock loaded:',
                `lang=${block.props?.language}`,
                `text=${text.slice(0, 60)}`
              )
            }
            if (block.type === 'customComponent') {
              console.log(
                '[BlockNoteEditor] customComponent loaded:',
                block.props?.componentName
              )
            }
          }
          return fixStyles(migrated) as any
        }
        return undefined
      } catch (e) {
        console.error('[BlockNoteEditor] parse error:', e)
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

        // Reverse migration: convert attributesJson/childrenJson back to attributes/children
        if (Array.isArray(doc)) {
          for (const block of doc) {
            if (block.type === 'customComponent') {
              const props = block.props || {}
              if (props.attributesJson) {
                try {
                  props.attributes = JSON.parse(props.attributesJson)
                } catch { props.attributes = {} }
                delete props.attributesJson
              }
              if (props.childrenJson) {
                try {
                  props.children = JSON.parse(props.childrenJson)
                } catch { props.children = [] }
                delete props.childrenJson
              }
            }
          }
        }

        // Normalize code blocks: merge multiple text nodes
        if (Array.isArray(doc)) {
          for (const block of doc) {
            if (block.type === 'codeBlock' && Array.isArray(block.content)) {
              const nodeCount = block.content.length
              if (nodeCount > 1) {
                const merged = block.content.map((n: any) => n.text || '').join('\n')
                block.content = [{ type: 'text', text: merged, styles: {} }]
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

  // 强制 ProseMirror 重新高亮代码块（主题切换后装饰器不会自动更新）
  const prevThemeRef = useRef(resolvedTheme)
  useEffect(() => {
    if (!editor) return
    const prev = prevThemeRef.current
    prevThemeRef.current = resolvedTheme
    if (prev === resolvedTheme || !prev) return

    const view = (editor as any)._tiptapEditor?.view
    if (!view) return
    const { state } = view
    const tr = state.tr
    let changed = false
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'codeBlock') {
        tr.replaceWith(pos, pos + node.nodeSize,
          node.type.create(node.attrs, node.content, node.marks))
        changed = true
      }
    })
    if (changed) view.dispatch(tr)
  }, [resolvedTheme, editor])

  // 修复 ProseMirror 拦截代码块语言选择器的点击事件
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
        key={bnTheme}
        editor={editor}
        theme={bnTheme}
      />
    </div>
  )
}

export { BlockNoteEditor }
export default BlockNoteEditor
