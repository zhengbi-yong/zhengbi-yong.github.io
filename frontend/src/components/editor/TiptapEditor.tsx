'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// TipTap 扩展 — 从 @tiptap/ 包导入（稳定版本）
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Mathematics from '@tiptap/extension-mathematics'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'

// reactjs-tiptap-editor 扩展
import { Table } from 'reactjs-tiptap-editor/table'
import { Katex } from 'reactjs-tiptap-editor/katex'
import { Video } from 'reactjs-tiptap-editor/video'
import { Twitter } from 'reactjs-tiptap-editor/twitter'
import { Callout } from 'reactjs-tiptap-editor/callout'
import { Mention } from 'reactjs-tiptap-editor/mention'
import { Indent } from 'reactjs-tiptap-editor/indent'
import { Color } from 'reactjs-tiptap-editor/color'
import { FontSize } from 'reactjs-tiptap-editor/fontsize'
import { LineHeight } from 'reactjs-tiptap-editor/lineheight'
import { TextDirection } from 'reactjs-tiptap-editor/textdirection'
import { MoreMark } from 'reactjs-tiptap-editor/moremark'
import { SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace'
import { cn } from '@/lib/utils'

// ===== 工具栏按钮 =====
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
        'p-2 rounded hover:bg-accent transition-colors text-sm',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 bg-border mx-1" />
}

// ===== KaTeX NodeView 渲染器 =====
// Note: Mathematics 扩展内置 NodeView，Katex 用于命令/快捷键触发
// 如需自定义渲染，可通过 Extension 的 addNodeView() 接入

// ===== 公式插入弹窗 =====
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
    import('katex').then(({ default: katex }) => {
      try {
        setPreview(katex.renderToString(latex || '\\text{输入 LaTeX...}', {
          displayMode,
          throwOnError: false,
        }))
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
              <input
                type="checkbox"
                checked={displayMode}
                onChange={(e) => setDisplayMode(e.target.checked)}
              />
              块级公式（居中显示）
            </label>
          </div>
          <div
            className="border rounded-md p-4 min-h-[60px] text-center bg-muted/30"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => { onInsert(latex, displayMode); onClose() }}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            插入
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== 富文本编辑器 =====
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
      // 核心格式 — StarterKit
      StarterKit.configure({
        code: { HTMLAttributes: { class: 'bg-muted px-1 py-0.5 rounded text-sm font-mono' } },
        link: false,      // 使用下方显式导入的 @tiptap/extension-link
        underline: false, // 使用下方显式导入的 @tiptap/extension-underline
      }),
      // 基础格式扩展
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // 媒体
      Image.configure({ inline: false, HTMLAttributes: { class: 'max-w-full rounded-lg' } }),
      // 数学公式
      Mathematics,
      Katex,
      // 表格
      Table.configure({ resizable: true }),
      // 视频嵌入
      Video,
      // Twitter/X 嵌入
      Twitter,
      // 标注框
      Callout,
      // @提及
      Mention,
      // 列表（含任务列表）
      TaskList,
      TaskItem.configure({ nested: true }),
      // 缩进
      Indent,
      // 颜色与字体
      Color,
      FontSize,
      LineHeight,
      TextDirection,
      // 分隔与搜索
      MoreMark,
      SearchAndReplace,
      // Placeholder
      Placeholder.configure({ placeholder: '开始写作...' }),
    ],
    immediatelyRender: false,
    content: (() => {
      if (!content) return undefined
      try { return JSON.parse(content) }
      catch { return undefined }
    })(),
    onUpdate: ({ editor: e }) => {
      onChange(JSON.stringify(e.getJSON()))
    },
  })

  // Sync content when external content prop changes
  useEffect(() => {
    if (!editor) return
    try {
      const incoming = content ? JSON.parse(content) : { type: 'doc', content: [] }
      const current = editor.getJSON()
      if (JSON.stringify(current) !== JSON.stringify(incoming)) {
        editor.commands.setContent(incoming)
      }
    } catch {
      // ignore parse errors
    }
  }, [editor, content])

  const insertMath = (latex: string, displayMode: boolean) => {
    if (!editor) return
    editor.chain().focus().insertContent({
      type: displayMode ? 'math' : 'inlineMath',
      attrs: { latex },
    }).run()
  }

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
        {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {/* 文本格式 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="粗体 (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="斜体 (Ctrl+I)"
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="下划线 (Ctrl+U)"
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="删除线"
          >
            <span className="line-through">S</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="行内代码"
          >
            <code className="text-xs">&lt;/&gt;</code>
          </ToolbarButton>

          <Divider />

          {/* 标题 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="一级标题"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="二级标题"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="三级标题"
          >
            H3
          </ToolbarButton>

          <Divider />

          {/* 列表 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="无序列表"
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="有序列表"
          >
            1. List
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive('taskList')}
            title="任务列表"
          >
            ☑ Task
          </ToolbarButton>

          <Divider />

          {/* 块级元素 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="引用"
          >
            &ldquo;&rdquo;
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="代码块"
          >
            {'{ }'}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            active={false}
            title="分隔线"
          >
            —
          </ToolbarButton>

          <Divider />

          {/* 对齐 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="左对齐"
          >
            ≡ L
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="居中"
          >
            ≡ C
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="右对齐"
          >
            ≡ R
          </ToolbarButton>

          <Divider />

          {/* 数学公式 */}
          <ToolbarButton
            onClick={() => setShowMathModal(true)}
            active={false}
            title="插入公式"
          >
            <span className="font-serif text-sm">Σ</span>
          </ToolbarButton>

          <Divider />

          {/* 历史 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            active={false}
            title="撤销 (Ctrl+Z)"
          >
            ↩
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            active={false}
            title="重做 (Ctrl+Shift+Z)"
          >
            ↪
          </ToolbarButton>
        </div>

        {/* 编辑区域 */}
        <div className="prose prose-sm max-w-none p-4 min-h-[400px] focus-within:outline-none">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 数学公式弹窗 */}
      {showMathModal && (
        <InsertMathModal
          onClose={() => setShowMathModal(false)}
          onInsert={insertMath}
        />
      )}
    </>
  )
}

// ===== 动态导入包装（ssr: false — 强制客户端渲染） =====
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

// Named export for direct import (bypass dynamic wrapper)
// Use this in pages that want to manage dynamic() themselves
export { RichTextEditorInner }

export default function TiptapEditor(props: {
  content?: string
  onChange?: (v: string) => void
}) {
  return (
    <DynamicEditor
      content={props.content || ''}
      onChange={props.onChange || (() => {})}
    />
  )
}
