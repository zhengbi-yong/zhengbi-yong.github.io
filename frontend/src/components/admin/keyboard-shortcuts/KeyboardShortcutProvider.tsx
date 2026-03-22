/**
 * 全局快捷键系统
 *
 * 默认快捷键：
 * - Cmd/Ctrl + K: 打开命令面板
 * - Cmd/Ctrl + /: 显示快捷键帮助
 * - Cmd/Ctrl + N: 新建文章
 * - Cmd/Ctrl + F: 快速搜索
 * - ESC: 关闭模态框
 * - ↑↓: 表格行导航
 * - Enter: 打开选中项
 */

'use client'

import { useEffect, createContext, useContext, useCallback, useState } from 'react'

interface ShortcutAction {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  handler: () => void
}

interface KeyboardShortcutContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  registerShortcut: (action: ShortcutAction) => () => void
  shortcuts: ShortcutAction[]
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType | undefined>(undefined)

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutContext)
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutProvider')
  }
  return context
}

interface KeyboardShortcutProviderProps {
  children: React.ReactNode
}

export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shortcuts, setShortcuts] = useState<ShortcutAction[]>([])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  // 注册快捷键
  const registerShortcut = useCallback((action: ShortcutAction) => {
    setShortcuts(prev => [...prev, action])

    // 返回清理函数
    return () => {
      setShortcuts(prev => prev.filter(s => s !== action))
    }
  }, [])

  // 检查按键是否匹配
  const matchesShortcut = useCallback(
    (event: KeyboardEvent, shortcut: ShortcutAction): boolean => {
      const isCtrlOrMeta = shortcut.ctrlKey || shortcut.metaKey
      const pressedCtrlOrMeta = event.ctrlKey || event.metaKey

      return (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (!shortcut.ctrlKey || event.ctrlKey) &&
        (!shortcut.metaKey || event.metaKey) &&
        (!shortcut.shiftKey || event.shiftKey) &&
        (!shortcut.altKey || event.altKey) &&
        (isCtrlOrMeta ? pressedCtrlOrMeta : true)
      )
    },
    []
  )

  // 全局键盘事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略输入框中的按键
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // 检查所有注册的快捷键
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault()
          shortcut.handler()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, matchesShortcut])

  // 默认快捷键
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = []

    // Cmd/Ctrl + K: 打开命令面板
    cleanupFunctions.push(
      registerShortcut({
        key: 'k',
        metaKey: true,
        ctrlKey: true,
        description: '打开命令面板',
        handler: toggle,
      })
    )

    // ESC: 关闭面板
    cleanupFunctions.push(
      registerShortcut({
        key: 'Escape',
        description: '关闭面板',
        handler: close,
      })
    )

    // Cmd/Ctrl + /: 显示帮助（暂时用 toggle 代替）
    cleanupFunctions.push(
      registerShortcut({
        key: '/',
        metaKey: true,
        ctrlKey: true,
        description: '快捷键帮助',
        handler: () => {
          // TODO: 实现帮助面板
          console.log('Keyboard shortcuts help')
        },
      })
    )

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [registerShortcut, toggle, close])

  return (
    <KeyboardShortcutContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        registerShortcut,
        shortcuts,
      }}
    >
      {children}
    </KeyboardShortcutContext.Provider>
  )
}

/**
 * 快捷键显示格式化
 * 将快捷键对象转换为可读的字符串
 */
export function formatShortcut(shortcut: Omit<ShortcutAction, 'handler' | 'description'>): string {
  const parts: string[] = []

  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.metaKey) parts.push('⌘')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.altKey) parts.push('Alt')

  parts.push(shortcut.key.toUpperCase())

  return parts.join(' + ')
}
