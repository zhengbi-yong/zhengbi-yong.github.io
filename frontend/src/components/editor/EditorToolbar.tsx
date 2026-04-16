'use client'

/**
 * 编辑器工具栏组件
 *
 * 提供富文本编辑的所有格式化工具
 */

import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface EditorToolbarProps {
  editor: Editor | null
}

// 快捷键映射
const SHORTCUTS: Record<string, string> = {
  '粗体': 'Ctrl+B',
  '斜体': 'Ctrl+I',
  '下划线': 'Ctrl+U',
  '下划线 (Ctrl+U)': 'Ctrl+U',  // 特殊处理
  '删除线': 'Ctrl+Shift+X',
  '行内代码': 'Ctrl+E',
  '一级标题': 'Ctrl+Alt+1',
  '二级标题': 'Ctrl+Alt+2',
  '三级标题': 'Ctrl+Alt+3',
  '无序列表': 'Ctrl+Shift+8',
  '有序列表': 'Ctrl+Shift+7',
  '任务列表': 'Ctrl+Shift+9',
  '引用': 'Ctrl+Shift+B',
  '撤销': 'Ctrl+Z',
  '重做': 'Ctrl+Shift+Z',
  '左对齐': '',
  '居中': '',
  '右对齐': '',
  '添加链接': '',
  '插入图片': '',
  '水平线': '',
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showImageInput, setShowImageInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  if (!editor) {
    return null
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageInput(false)
    }
  }

  // 获取带快捷键的完整 title
  const getFullTitle = (title: string): string => {
    const shortcut = SHORTCUTS[title]
    if (shortcut) {
      return `${title} (${shortcut})`
    }
    return title
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
    disabled,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    disabled?: boolean
    title: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={getFullTitle(title)}
      className={cn(
        'p-2 rounded-md transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        active && 'bg-gray-200 dark:bg-gray-600',
        'text-gray-700 dark:text-gray-300'
      )}
    >
      {children}
    </button>
  )

  const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
      {children}
    </div>
  )

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-t-lg bg-gray-50 dark:bg-gray-800 p-2 flex items-center gap-2 flex-wrap">
      {/* 撤销/重做 */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="撤销 (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="重做 (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 标题 */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="一级标题"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="二级标题"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="三级标题"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 文本格式 */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="粗体 (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="斜体 (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="下划线 (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="删除线"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="行内代码"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 列表 */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
          title="任务列表"
        >
          <CheckSquare className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 对齐 */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="左对齐"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="居中"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="右对齐"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 其他 */}
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="引用"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="水平线"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {/* 链接 */}
      <ToolbarGroup>
        {showLinkInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="输入链接..."
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLink()
                if (e.key === 'Escape') {
                  setShowLinkInput(false)
                  setLinkUrl('')
                }
              }}
              autoFocus
            />
            <button
              onClick={addLink}
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        ) : (
          <ToolbarButton
            onClick={() => setShowLinkInput(true)}
            title="添加链接"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
      </ToolbarGroup>

      {/* 图片 */}
      <ToolbarGroup>
        {showImageInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="图片 URL..."
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addImage()
                if (e.key === 'Escape') {
                  setShowImageInput(false)
                  setImageUrl('')
                }
              }}
              autoFocus
            />
            <button
              onClick={addImage}
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              插入
            </button>
          </div>
        ) : (
          <ToolbarButton
            onClick={() => setShowImageInput(true)}
            title="插入图片"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
      </ToolbarGroup>

      {/* 数学公式提示 */}
      <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
        提示: 使用 $...$ 表示行内公式，$$...$$ 表示块级公式
      </div>
    </div>
  )
}
