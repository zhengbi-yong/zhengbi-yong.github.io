/**
 * 命令面板（Cmd+K 调出）
 * 类似 VS Code 的命令面板
 * - 快速导航到各个管理页面
 * - 搜索文章、用户、评论
 * - 执行常用操作
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Activity,
  Settings,
  Search,
  X,
} from 'lucide-react'
import { useKeyboardShortcuts } from './KeyboardShortcutProvider'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'actions' | 'search'
}

export function CommandPalette() {
  const { isOpen, close } = useKeyboardShortcuts()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 命令列表
  const commands: Command[] = [
    // 导航命令
    {
      id: 'nav-dashboard',
      label: '仪表板',
      description: '查看系统概览和统计数据',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => router.push('/admin'),
      category: 'navigation',
    },
    {
      id: 'nav-users',
      label: '用户管理',
      description: '管理用户、角色和权限',
      icon: <Users className="w-4 h-4" />,
      action: () => router.push('/admin/users'),
      category: 'navigation',
    },
    {
      id: 'nav-comments',
      label: '评论审核',
      description: '审核和管理用户评论',
      icon: <MessageSquare className="w-4 h-4" />,
      action: () => router.push('/admin/comments'),
      category: 'navigation',
    },
    {
      id: 'nav-posts',
      label: '文章管理',
      description: '管理文章内容和发布',
      icon: <FileText className="w-4 h-4" />,
      action: () => router.push('/admin/posts'),
      category: 'navigation',
    },
    {
      id: 'nav-analytics',
      label: '数据分析',
      description: '查看网站流量和用户行为',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => router.push('/admin/analytics'),
      category: 'navigation',
    },
    {
      id: 'nav-monitoring',
      label: '系统监控',
      description: '查看系统健康状态和性能',
      icon: <Activity className="w-4 h-4" />,
      action: () => router.push('/admin/monitoring'),
      category: 'navigation',
    },
    {
      id: 'nav-settings',
      label: '系统设置',
      description: '配置系统参数和偏好',
      icon: <Settings className="w-4 h-4" />,
      action: () => router.push('/admin/settings'),
      category: 'navigation',
    },
  ]

  // 过滤命令
  const filteredCommands = commands.filter(
    command =>
      command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      command.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 重置搜索和选择
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
          break
        case 'Enter':
          event.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            close()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, close])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={close}
      />

      {/* 命令面板 */}
      <div
        className={cn(
          'relative w-full max-w-xl bg-white dark:bg-gray-800',
          'rounded-lg shadow-2xl',
          'border border-gray-200 dark:border-gray-700',
          'overflow-hidden'
        )}
      >
        {/* 搜索输入框 */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-4 h-4 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索命令..."
            className={cn(
              'flex-1 bg-transparent border-none outline-none',
              'text-admin-base text-gray-900 dark:text-white',
              'placeholder-gray-400'
            )}
          />
          <button
            onClick={close}
            className={cn(
              'ml-2 p-1 rounded',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              'transition-colors'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 命令列表 */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              没有找到匹配的命令
            </div>
          ) : (
            <div className="px-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action()
                    close()
                  }}
                  className={cn(
                    'w-full flex items-start px-3 py-2 rounded-md',
                    'text-left transition-colors',
                    'mb-1 last:mb-0',
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400">
                    {command.icon}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-admin-sm font-medium text-gray-900 dark:text-white">
                      {command.label}
                    </div>
                    {command.description && (
                      <div className="text-admin-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {command.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div
          className={cn(
            'px-4 py-2 border-t border-gray-200 dark:border-gray-700',
            'flex items-center justify-between',
            'text-admin-xs text-gray-500 dark:text-gray-400'
          )}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd
                className={cn(
                  'px-1.5 py-0.5 rounded',
                  'bg-gray-100 dark:bg-gray-700',
                  'font-mono text-xs'
                )}
              >
                ↑↓
              </kbd>
              <span>导航</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className={cn(
                  'px-1.5 py-0.5 rounded',
                  'bg-gray-100 dark:bg-gray-700',
                  'font-mono text-xs'
                )}
              >
                ↵
              </kbd>
              <span>选择</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className={cn(
                  'px-1.5 py-0.5 rounded',
                  'bg-gray-100 dark:bg-gray-700',
                  'font-mono text-xs'
                )}
              >
                esc
              </kbd>
              <span>关闭</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
