'use client'

/**
 * Tiptap 富文本编辑器组件
 *
 * 功能特性：
 * - Markdown 实时预览（所见即所得）
 * - 代码高亮支持
 * - 数学公式渲染
 * - 任务列表、图片、链接等富文本功能
 * - Notion 风格的极简 UI
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Mathematics from '@tiptap/extension-mathematics'
import { common, createLowlight } from 'lowlight'
import { cn } from '@/lib/utils'
import { EditorToolbar } from './EditorToolbar'
import { FloatingMenu } from './FloatingMenu'
import { useMemo, useEffect, useState } from 'react'
import katex from 'katex'

// 创建代码高亮实例（按需加载常用语言）
const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function TiptapEditor({
  content = '',
  onChange,
  placeholder = '开始写作...',
  editable = true,
  className,
}: TiptapEditorProps) {
  // 防止 SSR 水合错误
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 初始化编辑器
  const editor = useEditor({
    immediatelyRender: false, // 禁用 SSR 渲染，防止水合错误
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用 lowlight 替代默认代码块
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto',
        },
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
          displayMode: false,
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none',
          'min-h-[500px] px-8 py-6',
          'prose-headings:font-bold prose-headings:tracking-tight',
          'prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8',
          'prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6',
          'prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4',
          'prose-p:leading-relaxed prose-p:mb-4',
          'prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
          'prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
          'prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950',
          'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
          'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-ul:list-disc prose-ul:ml-6',
          'prose-ol:list-decimal prose-ol:ml-6',
          'prose-li:mb-1',
          'prose-img:rounded-lg prose-img:shadow-md',
          'prose-hr:border-gray-200 dark:prose-hr:border-gray-700',
          // 任务列表样式
          'prose-ul[data-type="taskList"]:list-none prose-ul[data-type="taskList"]:ml-0',
          'prose-ul[data-type="taskList"] > li:mb-2',
          'prose-ul[data-type="taskList"] > li > label:cursor-pointer prose-ul[data-type="taskList"] > li > label:select-none',
          // 数学公式样式
          'math-inline:mx-1 math-inline:px-1',
          'math-block:my-4 math-block:mx-auto math-block:text-center',
          className
        ),
      },
    },
  })

  // 如果还未挂载到客户端，显示加载状态（防止 SSR 水合错误）
  if (!mounted) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-[600px] rounded-lg" />
    )
  }

  // 如果编辑器还未初始化，显示加载状态
  if (!editor) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-[600px] rounded-lg" />
    )
  }

  return (
    <div className="w-full">
      {/* 工具栏 */}
      <EditorToolbar editor={editor} />

      {/* 编辑器内容区 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-b-lg bg-white dark:bg-gray-900">
        <EditorContent editor={editor} />
      </div>

      {/* 浮动菜单 */}
      <FloatingMenu editor={editor} />

      {/* 底部状态栏 */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
        <div className="flex items-center gap-4">
          <span>{editor.storage.characterCount?.words() || 0} 词</span>
          <span>{editor.storage.characterCount?.characters() || 0} 字符</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            已保存
          </span>
        </div>
      </div>
    </div>
  )
}
