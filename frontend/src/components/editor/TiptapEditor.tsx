'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Code2, Minus, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Image as ImageIcon, Link as LinkIcon, Highlighter, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, RemoveFormatting, Palette, Sigma, ChevronDown } from 'lucide-react'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskList from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import Typography from '@tiptap/extension-typography'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

// reactjs-tiptap-editor — core extensions (verified working with Webpack)
// import { Table } from 'reactjs-tiptap-editor/table'
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
// Code block language definitions
// =============================================================================

const CODE_LANGUAGES = [
  { label: '无语言', value: '' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'C', value: 'c' },
  { label: 'Shell / Bash', value: 'shellscript' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'TOML', value: 'toml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'MDX', value: 'mdx' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'SQL', value: 'sql' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Lua', value: 'lua' },
  { label: 'Haskell', value: 'haskell' },
  { label: 'R', value: 'r' },
  { label: 'Dockerfile', value: 'docker' },
  { label: 'Nginx', value: 'nginx' },
  { label: 'LaTeX', value: 'latex' },
  { label: 'Vim', value: 'vim' },
] as const

// =============================================================================
// ToolbarButton
// =============================================================================
function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
  ariaLabel,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || title || ''}
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
// CodeBlockLanguageSelector — dropdown to choose code block language
// =============================================================================
function CodeBlockLanguageSelector({
  editor,
  isCodeBlock,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  isCodeBlock: boolean
}) {
  const [open, setOpen] = useState(false)

  const currentLanguage = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor.isActive('codeBlock')) return ''
      const attrs = ctx.editor.getAttributes('codeBlock')
      return attrs?.language || ''
    },
  })

  const selectedLang = CODE_LANGUAGES.find((l) => l.value === currentLanguage)

  if (!isCodeBlock) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors border border-border/50 min-w-[80px]"
        title="选择代码语言"
      >
        <span className="truncate max-w-[80px]">
          {selectedLang?.label || '无语言'}
        </span>
        <ChevronDown className="h-3 w-3 flex-shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 max-h-[280px] w-[160px] overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
            {CODE_LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                className={cn(
                  'flex w-full items-center rounded px-2.5 py-1.5 text-xs transition-colors',
                  lang.value === currentLanguage
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'hover:bg-accent/50 text-muted-foreground'
                )}
                onClick={() => {
                  if (lang.value) {
                    editor.chain().focus().updateAttributes('codeBlock', { language: lang.value }).run()
                  } else {
                    // Clear language attribute — remove it
                    editor.chain().focus().updateAttributes('codeBlock', { language: null }).run()
                  }
                  setOpen(false)
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// =============================================================================
// Toolbar (E2: isolated component with atomic useEditorState subscriptions)
// =============================================================================
function Toolbar({
  editor,
  onInsertMath,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>
  onInsertMath: () => void
}) {
  const isBold = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('bold') })
  const isItalic = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('italic') })
  const isUnderline = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('underline') })
  const isStrike = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('strike') })
  const isCode = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('code') })
  const isHighlight = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('highlight') })
  const isH1 = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('heading', { level: 1 }) })
  const isH2 = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('heading', { level: 2 }) })
  const isH3 = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('heading', { level: 3 }) })
  const isBulletList = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('bulletList') })
  const isOrderedList = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('orderedList') })
  const isTaskList = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('taskList') })
  const isBlockquote = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('blockquote') })
  const isCodeBlock = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('codeBlock') })
  // const isTable = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('table') })
  const isSubscript = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('subscript') })
  const isSuperscript = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('superscript') })
  const isLink = useEditorState({ editor, selector: (ctx) => ctx.editor.isActive('link') })
  const canUndo = useEditorState({ editor, selector: (ctx) => ctx.editor.can().undo() })
  const canRedo = useEditorState({ editor, selector: (ctx) => ctx.editor.can().redo() })
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const linkUrl = useEditorState({ editor, selector: (ctx) => ctx.editor.getAttributes('link').href || '' })

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30 sticky top-0 z-20">
      {/* ── 文本格式 ── */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={isBold} ariaLabel="粗体 (Ctrl+B)" title="粗体 (Ctrl+B)">
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={isItalic} ariaLabel="斜体 (Ctrl+I)" title="斜体 (Ctrl+I)">
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={isUnderline} ariaLabel="下划线 (Ctrl+U)" title="下划线 (Ctrl+U)">
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={isStrike} ariaLabel="删除线" title="删除线">
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={isCode} ariaLabel="行内代码" title="行内代码">
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={isHighlight} ariaLabel="高亮" title="高亮">
        <Highlighter className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* ── 标题 ── */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={isH1} ariaLabel="一级标题" title="一级标题">
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={isH2} ariaLabel="二级标题" title="二级标题">
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={isH3} ariaLabel="三级标题" title="三级标题">
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* ── 列表 ── */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={isBulletList} ariaLabel="无序列表" title="无序列表">
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={isOrderedList} ariaLabel="有序列表" title="有序列表">
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={isTaskList} ariaLabel="任务列表" title="任务列表">
        <ListChecks className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* ── 区块 ── */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={isBlockquote} ariaLabel="引用" title="引用">
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={isCodeBlock} ariaLabel="代码块" title="代码块">
        <Code2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} ariaLabel="分隔线" title="分隔线">
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* ── 代码块语言选择器 (仅在代码块激活时显示) ── */}
      <CodeBlockLanguageSelector editor={editor} isCodeBlock={isCodeBlock} />

      <Divider />

      {/* ── 表格 ── */}
      {/* <ToolbarButton onClick={() => editor.chain().focus().insertTable().run()} active={isTable} ariaLabel="插入表格" title="插入表格">
        <Table2 className="h-4 w-4" />
      </ToolbarButton> */}

      <Divider />

      {/* ── 上标/下标 ── */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={isSubscript} ariaLabel="下标" title="下标">
        <SubscriptIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={isSuperscript} ariaLabel="上标" title="上标">
        <SuperscriptIcon className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* ── 对齐 ── */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} ariaLabel="左对齐" title="左对齐">
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} ariaLabel="居中" title="居中">
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} ariaLabel="右对齐" title="右对齐">
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* ── 链接 + 图片 ── */}
      <div className="relative">
        <ToolbarButton onClick={() => setShowLinkInput(!showLinkInput)} active={isLink} ariaLabel="链接" title="链接">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 z-50 mt-1 flex items-center gap-2 rounded-lg border bg-popover p-2 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <input
              type="url"
              defaultValue={linkUrl}
              placeholder="输入 URL..."
              className="h-7 w-48 rounded border bg-background px-2 text-xs outline-none focus:border-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value
                  if (val) editor.chain().focus().setLink({ href: val }).run()
                  else editor.chain().focus().unsetLink().run()
                  setShowLinkInput(false)
                }
                if (e.key === 'Escape') setShowLinkInput(false)
              }}
            />
            <button
              type="button"
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                const input = document.activeElement as HTMLInputElement
                const val = input?.value || ''
                if (val) editor.chain().focus().setLink({ href: val }).run()
                else editor.chain().focus().unsetLink().run()
                setShowLinkInput(false)
              }}
            >
              确认
            </button>
          </div>
        )}
      </div>
      <ToolbarButton onClick={() => {
        const url = window.prompt('输入图片 URL:')
        if (url) editor.chain().focus().setImage({ src: url }).run()
      }} ariaLabel="插入图片" title="插入图片">
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* ── 文字颜色 ── */}
      <div className="relative">
        <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} title="文字颜色" ariaLabel="文字颜色">
          <Palette className="h-4 w-4" />
        </ToolbarButton>
        {showColorPicker && (
          <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border bg-popover p-2 shadow-lg grid grid-cols-6 gap-1" onClick={(e) => e.stopPropagation()}>
            {['#000000','#434343','#666666','#999999','#b7b7b7','#cccccc',
              '#d9161c','#e83933','#ed6c47','#f5a623','#f7c948','#fce83a',
              '#11a849','#33b749','#48c774','#74d89b','#b3e4c3','#d4edda',
              '#2b7ff5','#5b9cf6','#74b9ff','#a3d5ff','#c8e6ff','#e3f2fd',
              '#8e44ad','#a569bd','#bb8fce','#d2b4de','#e8daef','#f3e5f5',
            ].map((color) => (
              <button
                key={color}
                type="button"
                className="h-5 w-5 rounded border"
                style={{ backgroundColor: color }}
                onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false) }}
                title={color}
              />
            ))}
            <button
              type="button"
              className="col-span-6 mt-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
              onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false) }}
            >
              清除颜色
            </button>
          </div>
        )}
      </div>

      <Divider />

      {/* ── 清除格式 ── */}
      <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} ariaLabel="清除格式" title="清除格式">
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>

      {/* ── 数学公式 ── */}
      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarButton onClick={onInsertMath} ariaLabel="插入公式" title="数学公式">
          <Sigma className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo} ariaLabel="撤销 (Ctrl+Z)" title="撤销 (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo} ariaLabel="重做 (Ctrl+Shift+Z)" title="重做 (Ctrl+Shift+Z)">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
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
        codeBlock: false, // We use CodeBlockLowlight instead
      }),

      // Code block with syntax highlighting support (lowlight)
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
      }),

      // Core formatting
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),

      // Media
      Image.configure({ inline: false, HTMLAttributes: { class: 'max-w-full rounded-lg' } }),

      // Math (Katex = toolbar command for formulas)

      // Table
      // Table.configure({ resizable: true }),
      // TODO: Table moved — fix extension

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
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
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
      type: displayMode ? 'blockMath' : 'inlineMath',
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
