'use client'

/**
 * Novel 编辑器适配器
 *
 * 基于 @novel/editor 的富文本编辑器组件。
 * 保持与 TiptapEditor 相同的接口：{ content?: string; onChange?: (v: string) => void }
 * 以最小侵入方式替换现有编辑器。
 *
 * 内置功能：
 * - Slash 命令菜单（输入 / 弹出）
 * - 气泡菜单（选中文本时）
 * - 代码块（语言选择）
 * - 数学公式（KaTeX，$...$ 或 $$...$$）
 * - 图片粘贴/拖拽 + 大小调整
 * - Twitter/X 粘贴自动嵌入
 * - 全局拖拽手柄（重排序）
 * - 任务列表
 * - 高亮标记
 *
 * NOT currently in Novel: table, callout, search/replace, textAlign
 * — those are added manually via @tiptap extensions below.
 */

import { useCallback, useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorBubble,
  EditorBubbleItem,
  Command as SlashCommand,
  StarterKit,
  CodeBlockLowlight,
  TaskItem,
  TaskList,
  TiptapLink,
  TiptapUnderline,
  TiptapImage,
  Color,
  TextStyle,
  Placeholder,
  Mathematics,
  Twitter,
  HorizontalRule,
  CustomKeymap,
  createSuggestionItems,
  renderItems,
  type SuggestionItem,
} from 'novel'

// Separate Tiptap extensions (not re-exported by Novel)
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { common, createLowlight } from 'lowlight'
import type { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/react'

// =============================================================================
// Slash command items
// =============================================================================

interface CommandProps {
  editor: Editor
  range: { from: number; to: number }
}

const slashItems: SuggestionItem[] = createSuggestionItems([
  {
    title: '文本',
    description: '纯文本段落',
    searchTerms: ['paragraph', 'p', 'text'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: '一级标题',
    description: '大标题',
    searchTerms: ['heading1', 'h1', 'title'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: '二级标题',
    description: '中标题',
    searchTerms: ['heading2', 'h2', 'subtitle'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: '三级标题',
    description: '小标题',
    searchTerms: ['heading3', 'h3'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: '项目列表',
    description: '无序列表',
    searchTerms: ['bullet', 'ul', 'list'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: '编号列表',
    description: '有序列表',
    searchTerms: ['ordered', 'ol', 'number'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: '任务列表',
    description: '带复选框的列表',
    searchTerms: ['task', 'todo', 'checkbox'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: '引用',
    description: '块引用',
    searchTerms: ['blockquote', 'quote'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: '代码块',
    description: '代码块（含语法高亮）',
    searchTerms: ['code', 'codeblock', 'pre'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: '图片',
    description: '插入图片',
    searchTerms: ['image', 'img', 'photo', 'media'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setImage({ src: '' }).run()
    },
  },
  {
    title: '数学公式',
    description: '行内数学公式 (LaTeX)',
    searchTerms: ['math', 'latex', 'equation', 'formula'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setLatex({ latex: '' }).run()
    },
  },
  {
    title: '分隔线',
    description: '水平分割线',
    searchTerms: ['hr', 'divider', 'horizontal', 'separator'],
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
])

// =============================================================================
// NovelEditor Inner
// =============================================================================

function NovelEditorInner({
  content,
  onChange,
}: {
  content: string
  onChange: (v: string) => void
}) {
  const [editorRef, setEditorRef] = useState<Editor | null>(null)

  // Parse initial content once
  const initialContent = useMemo<JSONContent | undefined>(() => {
    if (!content) return undefined
    try {
      return JSON.parse(content) as JSONContent
    } catch {
      return undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
    [onChange]
  )

  // Sync external content changes into editor
  useEffect(() => {
    if (!editorRef || !content) return
    try {
      const incoming = JSON.parse(content) as JSONContent
      const current = editorRef.getJSON()
      if (JSON.stringify(current) !== JSON.stringify(incoming)) {
        editorRef.commands.setContent(incoming)
      }
    } catch {
      // ignore
    }
  }, [editorRef, content])

  return (
    <div className="relative w-full border rounded-lg overflow-hidden bg-background">
      <EditorRoot>
        <EditorContent
          className="relative min-h-[400px] w-full"
          initialContent={initialContent}
          editorProps={{
            attributes: {
              class:
                'prose prose-sm dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none',
            },
          }}
          immediatelyRender={false}
          extensions={[
            StarterKit.configure({
              code: {
                HTMLAttributes: {
                  class: 'bg-muted px-1 py-0.5 rounded text-sm font-mono',
                },
              },
              codeBlock: false,
              heading: {
                levels: [1, 2, 3],
              },
              horizontalRule: false, // Use Novel's HorizontalRule instead
            }),
            CodeBlockLowlight.configure({
              lowlight: createLowlight(common),
            }),
            TiptapUnderline,
            TiptapLink.configure({
              openOnClick: false,
              HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
            }),
            TiptapImage.configure({
              inline: false,
              HTMLAttributes: { class: 'max-w-full rounded-lg' },
            }),
            TaskList,
            TaskItem.configure({ nested: true }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Subscript,
            Superscript,
            Typography,
            Mathematics.configure({
              shouldRender: (state, pos) => {
                const node = state.doc.nodeAt(pos)
                return node?.type.name !== 'codeBlock'
              },
              katexOptions: { throwOnError: false },
            }),
            Twitter,
            HorizontalRule,
            SlashCommand.configure({
              suggestion: {
                items: () => slashItems,
                render: renderItems,
              },
            }),
            CustomKeymap,
            Placeholder.configure({
              placeholder: ({ node }) => {
                if (node.type.name === 'heading') {
                  return `Heading ${node.attrs.level}`
                }
                return "Press '/' for commands"
              },
              includeChildren: true,
            }),
          ]}
          onUpdate={handleUpdate}
          onCreate={({ editor }) => setEditorRef(editor)}
        >
          {/* Slash command menu */}
          <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-lg">
            <EditorCommandEmpty className="px-2 py-1 text-sm text-muted-foreground">
              无匹配命令
            </EditorCommandEmpty>
            <EditorCommandList>
              {slashItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          {/* Bubble menu — formatting toolbar */}
          <EditorBubble
            tippyOptions={{
              placement: 'top',
              moveTransition: 'transform 0.15s ease-out',
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
          >
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleBold().run()}
              className="flex cursor-pointer items-center justify-center p-2 text-sm hover:bg-accent"
            >
              <span className="font-bold">B</span>
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
              className="flex cursor-pointer items-center justify-center p-2 text-sm hover:bg-accent"
            >
              <span className="italic">I</span>
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleUnderline().run()}
              className="flex cursor-pointer items-center justify-center p-2 text-sm hover:bg-accent underline"
            >
              <span className="underline">U</span>
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleStrike().run()}
              className="flex cursor-pointer items-center justify-center p-2 text-sm hover:bg-accent"
            >
              <span className="line-through">S</span>
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleCode().run()}
              className="flex cursor-pointer items-center justify-center p-2 text-sm hover:bg-accent font-mono"
            >
              {'<>'}
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => {
                const href = window.prompt('链接 URL:', editor.getAttributes('link').href || '')
                if (href === null) return
                if (href) editor.chain().focus().setLink({ href }).run()
                else editor.chain().focus().unsetLink().run()
              }}
              className="flex cursor-pointer items-center justify-center p-2 text-sm hover:bg-accent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleHighlight().run()}
              className="flex cursor-pointer items-center justify-center p-2 text-sm hover:bg-accent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 11-6 6v3h9l3-3" />
                <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
              </svg>
            </EditorBubbleItem>
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  )
}

// =============================================================================
// Dynamic import wrapper — forces client-only rendering (SSR defense)
// =============================================================================
const DynamicEditor = dynamic(() => Promise.resolve(NovelEditorInner), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px] text-muted-foreground border rounded-lg">
      <Loader2 className="animate-spin mr-2" />
      编辑器加载中...
    </div>
  ),
})

export { NovelEditorInner }

export default function NotionEditor(props: {
  content?: string
  onChange?: (v: string) => void
}) {
  return (
    <DynamicEditor
      content={props.content ?? ''}
      onChange={props.onChange ?? (() => {})}
    />
  )
}
