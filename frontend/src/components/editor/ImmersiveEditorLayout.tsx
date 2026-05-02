'use client'

/**
 * ImmersiveEditorLayout - Full-screen layout wrapper for Overleaf-like editing
 *
 * Features:
 * - 100% viewport height editor
 * - Traditional software-style menu bar with settings modal
 * - Status bar at bottom (word count, character count, etc.)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, X } from 'lucide-react'
import { useEditorContext } from '@/lib/contexts/EditorContext'
import { MenuBar, MenuItem } from './MenuBar'
import { cn } from '@/lib/utils'

interface ImmersiveEditorLayoutProps {
  children: React.ReactNode
  menuItems?: MenuItem[]
  className?: string
  /** Word count from editor */
  wordCount?: number
  /** Character count from editor */
  charCount?: number
  /** Line count from editor */
  lineCount?: number
  /** Settings panel content */
  settingsPanel?: React.ReactNode
}

export function ImmersiveEditorLayout({
  children,
  menuItems,
  className = '',
  wordCount = 0,
  charCount = 0,
  lineCount = 0,
  settingsPanel,
}: ImmersiveEditorLayoutProps) {
  const { setImmersiveMode } = useEditorContext()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Enter immersive mode on mount, exit on unmount
  useEffect(() => {
    setImmersiveMode(true)
    return () => {
      setImmersiveMode(false)
      setSettingsOpen(false)
    }
  }, [setImmersiveMode])

  // Add settings menu item to menu items
  const allMenuItems = menuItems
    ? [
        ...menuItems,
        {
          id: 'settings',
          label: '设置',
          submenu: [
            {
              id: 'article-settings',
              label: '文章设置',
              action: () => setSettingsOpen(true),
            },
          ],
        },
      ]
    : []

  return (
    <div className={cn('fixed inset-0 z-40 flex flex-col bg-background dark:bg-background', className)}>
      {/* Top bar with back button and menu */}
      <div className="flex h-10 flex-shrink-0 items-center gap-2 border-b border-border bg-secondary px-3 dark:border-border dark:bg-card">
        {/* Back button */}
        <Link
          href="/admin/posts-manage"
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors',
            'text-muted-foreground hover:bg-gray-200 dark:text-muted-foreground dark:hover:bg-secondary'
          )}
          title="返回列表"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">返回</span>
        </Link>

        {/* Menu bar */}
        {allMenuItems.length > 0 && (
          <div className="flex-1">
            <MenuBar items={allMenuItems} className="h-8 border-none bg-transparent" />
          </div>
        )}
      </div>

      {/* Main editor content */}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>

      {/* Status bar */}
      <div className="flex h-6 flex-shrink-0 items-center gap-4 border-t border-border bg-secondary px-3 text-xs text-muted-foreground dark:border-border dark:bg-card dark:text-muted-foreground">
        <span>{wordCount.toLocaleString()} 字</span>
        <span>{charCount.toLocaleString()} 字符</span>
        <span>{lineCount.toLocaleString()} 行</span>
        <span className="flex-1" />
        <span>Markdown</span>
      </div>

      {/* Settings modal */}
      {settingsOpen && settingsPanel && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSettingsOpen(false)} />
          {/* Modal */}
          <div className="fixed inset-4 z-50 flex flex-col rounded-lg border border-border bg-background shadow-2xl dark:border-border dark:bg-card overflow-hidden">
            {/* Modal header */}
            <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border px-4 dark:border-border">
              <h2 className="text-base font-semibold text-foreground dark:text-white">文章设置</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-muted-foreground dark:hover:bg-secondary dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-4">{settingsPanel}</div>
          </div>
        </>
      )}
    </div>
  )
}
