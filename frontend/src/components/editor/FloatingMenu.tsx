'use client'

/**
 * 浮动菜单组件
 *
 * 快速插入 Markdown 格式的快捷命令
 */

import { Editor, isNodeSelection } from '@tiptap/react'
import { Check, List, Quote, Heading1, Heading2, Code, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'

interface FloatingMenuProps {
  editor: Editor | null
}

export function FloatingMenu({ editor }: FloatingMenuProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      const { state, view } = editor
      const { selection } = state

      // 检查是否在段落开头
      const { $from } = selection
      const isStartOfParagraph = $from.parentOffset === 0
      const isTextSelection = !isNodeSelection(selection)

      // 检查是否输入了 /
      const textBefore = $from.nodeBefore?.textContent || ''
      const showMenu = isStartOfParagraph && isTextSelection && textBefore === '/'

      if (showMenu) {
        const coords = view.coordsAtPos($from.pos)
        setPosition({
          x: coords.left,
          y: coords.bottom + 8,
        })
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    editor.on('update', handleUpdate)
    editor.on('selectionUpdate', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!editor || !visible) {
    return null
  }

  const menuItems = [
    {
      icon: Heading1,
      label: '一级标题',
      action: () => {
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run()
      },
    },
    {
      icon: Heading2,
      label: '二级标题',
      action: () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run()
      },
    },
    {
      icon: List,
      label: '无序列表',
      action: () => {
        editor.chain().focus().toggleBulletList().run()
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run()
      },
    },
    {
      icon: Quote,
      label: '引用',
      action: () => {
        editor.chain().focus().toggleBlockquote().run()
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run()
      },
    },
    {
      icon: Code,
      label: '代码块',
      action: () => {
        editor.chain().focus().toggleCodeBlock().run()
        editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run()
      },
    },
    {
      icon: ImageIcon,
      label: '图片',
      action: () => {
        const url = prompt('输入图片 URL:')
        if (url) {
          editor.chain().focus().setImage({ src: url }).run()
          editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run()
        }
      },
    },
  ]

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-64"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 mb-2">
          基础 blocks
        </div>
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={item.action}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'text-gray-700 dark:text-gray-300',
                  'transition-colors'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {index + 1}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 遮罩层 */}
      {visible && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setVisible(false)}
        />
      )}
    </>
  )
}
