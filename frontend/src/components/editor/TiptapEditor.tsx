'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Mathematics from '@tiptap/extension-mathematics'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import Typography from '@tiptap/extension-typography'
import { ShikiCodeBlock } from './extensions/ShikiCodeBlock'

// reactjs-tiptap-editor — core extensions (verified working with Webpack)
import { Table } from 'reactjs-tiptap-editor/table'
import { Mention } from 'reactjs-tiptap-editor/mention'
import { Indent } from 'reactjs-tiptap-editor/indent'
import { Color } from 'reactjs-tiptap-editor/color'
import { FontSize } from 'reactjs-tiptap-editor/fontsize'
import { LineHeight } from 'reactjs-tiptap-editor/lineheight'
import { TextDirection } from 'reactjs-tiptap-editor/textdirection'
import { MoreMark } from 'reactjs-tiptap-editor/moremark'
import { SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace'
import { Katex as KatexExtension } from 'reactjs-tiptap-editor/katex'
import { Video as VideoExtension } from 'reactjs-tiptap-editor/video'
import { Twitter as TwitterExtension } from 'reactjs-tiptap-editor/twitter'
import { Callout as CalloutExtension } from 'reactjs-tiptap-editor/callout'

import { cn } from '@/lib/utils'

// =============================================================================
// ToolbarButton
// =============================================================================
function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded hover:bg-accent transition-colors text-sm flex-shrink-0',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-border mx-0.5 flex-shrink-0" />
}

// =============================================================================
// Toolbar (E2: isolated component with atomic useEditorState subscriptions)
// =============================================================================
function Toolbar({ editor, onInsertMath }: { editor: NonNullable<ReturnType<typeof useEditor>>, onInsertMath: () => void }) {
  const isBold = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('bold') })
  const isItalic = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('italic') })
  const isUnderline = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('underline') })
  const isStrike = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('strike') })
  const isCode = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('code') })
  const isH1 = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('heading', { level: 1 }) })
  const isH2 = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('heading', { level: 2 }) })
  const isH3 = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('heading', { level: 3 }) })
  const isBulletList = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('bulletList') })
  const isOrderedList = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('orderedList') })
  const isTaskList = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('taskList') })
  const isBlockquote = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('blockquote') })
  const isCodeBlock = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('codeBlock') })
  const canUndo = useEditorState({ editor, selector: (ctx) => ctx.editor.can().undo() })
  const canRedo = useEditorState({ editor, selector: (ctx) => ctx.editor.can().redo() })

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
      {/* Bold */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={isBold} title="粗体 (Ctrl+B)">
        <span className="font-bold">B</span>
      </ToolbarButton>

      {/* Italic */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={isItalic} title="斜体 (Ctrl+I)">
        <span className="italic">I</span>
      </ToolbarButton>

      {/* Underline */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={isUnderline} title="下划线 (Ctrl+U)">
        <span className="underline">U</span>
      </ToolbarButton>

      {/* Strike */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={isStrike} title="删除线">
        <span className="line-through">S</span>
      </ToolbarButton>

      {/* Code */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={isCode} title="行内代码">
        <code className="text-xs">&lt;/&gt;</code>
      </ToolbarButton>

      <Divider />

      {/* Heading 1 */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={isH1} title="一级标题">
        H1
      </ToolbarButton>

      {/* Heading 2 */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={isH2} title="二级标题">
        H2
      </ToolbarButton>

      {/* Heading 3 */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={isH3} title="三级标题">
        H3
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={isBulletList} title="无序列表">
        • List
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={isOrderedList} title="有序列表">
        1. List
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={isTaskList} title="任务列表">
        ☑ Task
      </ToolbarButton>

      <Divider />

      {/* Blockquote */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={isBlockquote} title="引用">
        &ldquo;&rdquo;
      </ToolbarButton>

      {/* Code Block */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={isCodeBlock} title="代码块">
        {'{ }'}
      </ToolbarButton>

      {/* Horizontal Rule */}
      {/* @ts-ignore TipTap StarterKit types incomplete */}
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="分隔线">
        —
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="左对齐">
        ≡ L
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="居中">
        ≡ C
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="右对齐">
        ≡ R
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={onInsertMath} active={false} title="插入公式">
        <span className="font-serif text-sm">Σ</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo} active={false} title="撤销 (Ctrl+Z)">
        ↩
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo} active={false} title="重做 (Ctrl+Shift+Z)">
        ↪
      </ToolbarButton>
    </div>
  )
}

// =============================================================================
// InsertMathModal
// =============================================================================
function InsertMathModal({
  onClose,
  onInsert,
}: {
  onClose: () => void
  onInsert: (latex: string, displayMode: boolean) => void
}) {
  const [latex, setLatex] = useState('')
  const [displayMode, setDisplayMode] = useState(false)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!latex) { setPreview(''); return }
    import('katex').then(({ default: katex }) => {
      try {
        setPreview(katex.renderToString(latex, { displayMode, throwOnError: false }))
      } catch {
        setPreview('<span style="color:red">语法错误</span>')
      }
    })
  }, [latex, displayMode])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[600px] max-w-[90vw]">
        <h3 className="text-lg font-semibold mb-4">插入数学公式</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">LaTeX 公式</label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="E=mc^2"
              rows={3}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm font-mono"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={displayMode} onChange={(e) => setDisplayMode(e.target.checked)} />
              块级公式（居中显示）
            </label>
          </div>
          <div
            className="border rounded-md p-4 min-h-[60px] text-center bg-muted/30"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">取消</button>
          <button
            type="button"
            onClick={() => { if (latex.trim()) { onInsert(latex, displayMode); onClose() } }}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            插入
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// RichTextEditorInner (SSR-safe, client-only)
// =============================================================================
function RichTextEditorInner({
  content,
  onChange,
}: {
  content: string
  onChange: (v: string) => void
}) {
  const [showMathModal, setShowMathModal] = useState(false)

  const editor = useEditor({
    extensions: [
      // StarterKit — disable built-ins we replace with better alternatives
      StarterKit.configure({
        code: { HTMLAttributes: { class: 'bg-muted px-1 py-0.5 rounded text-sm font-mono' } },
        link: false,
        underline: false,
        // Note: do NOT disable codeBlock — StarterKit needs it for toggleCodeBlock command.
        // Our ShikiCodeBlock (priority:100) intercepts parsing/rendering of codeBlock nodes.
      }),

      // Shiki syntax-highlighted code block (replaces StarterKit codeBlock rendering, not the command)
      ShikiCodeBlock,

      // Core formatting
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),

      // Media
      Image.configure({ inline: false, HTMLAttributes: { class: 'max-w-full rounded-lg' } }),

      // Math (Mathematics = TipTap nodes; Katex = toolbar command)
      Mathematics,

      // Table
      Table.configure({ resizable: true }),

      // Mention
      Mention,

      // Lists
      TaskList,
      TaskItem.configure({ nested: true }),

      // Indent / spacing
      Indent,

      // Color / typography
      Color,
      FontSize,
      LineHeight,
      TextDirection,

      // Marks
      MoreMark,
      SearchAndReplace,

      // Typography B6: smart quotes, em-dashes, etc.
      Typography,

      // TipTap-rendered extensions from reactjs-tiptap-editor
      KatexExtension,
      VideoExtension,
      TwitterExtension,
      CalloutExtension,

      // Placeholder
      Placeholder.configure({ placeholder: '开始写作...' }),
    ],

    // SSR defense: prevent hydration mismatch
    immediatelyRender: false,

    // E1: Disable full-re-render on every transaction (cuts redundant React reconciler work)
    shouldRerenderOnTransaction: false,

    content: (() => {
      if (!content) return undefined
      try { return JSON.parse(content) }
      catch { return undefined }
    })(),

    onUpdate: ({ editor: e }) => {
      onChange(JSON.stringify(e.getJSON()))
    },
  })

  // Sync external content changes into editor without destroying cursor
  useEffect(() => {
    if (!editor) return
    try {
      const incoming = content ? JSON.parse(content) : { type: 'doc', content: [] }
      const current = editor.getJSON()
      if (JSON.stringify(current) !== JSON.stringify(incoming)) {
        editor.commands.setContent(incoming)
      }
    } catch {
      // ignore malformed JSON
    }
  }, [editor, content])

  const insertMath = useCallback((latex: string, displayMode: boolean) => {
    if (!editor) return
    editor.chain().focus().insertContent({
      type: displayMode ? 'math' : 'inlineMath',
      attrs: { latex },
    }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground border rounded-lg">
        <Loader2 className="animate-spin mr-2" />
        编辑器加载中...
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        {/* E2: Toolbar subscribes to atomic state — only re-renders when its own buttons change */}
        <Toolbar editor={editor} onInsertMath={() => setShowMathModal(true)} />

        {/* Editor surface */}
        <div className="prose prose-sm max-w-none p-4 min-h-[400px] focus-within:outline-none">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showMathModal && (
        <InsertMathModal onClose={() => setShowMathModal(false)} onInsert={insertMath} />
      )}
    </>
  )
}

// =============================================================================
// Dynamic import wrapper — forces client-only rendering (SSR defense)
// =============================================================================
const DynamicEditor = dynamic(
  () => Promise.resolve(RichTextEditorInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground border rounded-lg">
        <Loader2 className="animate-spin mr-2" />
        编辑器加载中...
      </div>
    ),
  }
)

export { RichTextEditorInner }

export default function TiptapEditor(props: { content?: string; onChange?: (v: string) => void }) {
  return <DynamicEditor content={props.content ?? ''} onChange={props.onChange ?? (() => {})} />
}
