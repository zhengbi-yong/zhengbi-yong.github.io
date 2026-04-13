'use client'

import { Loader2 } from 'lucide-react'

interface EditorStatusBarProps {
  wordCount: number
  charCount: number
  saveState: 'saving' | 'saved' | 'unsaved'
  lastSaved: Date | null
}

export function EditorStatusBar({ wordCount, charCount, saveState, lastSaved }: EditorStatusBarProps) {
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
      <div className="flex items-center gap-4">
        <span>{wordCount} 词</span>
        <span>{charCount} 字符</span>
        <span>~{readingTime} 分钟阅读</span>
      </div>
      <div className="flex items-center gap-2">
        {saveState === 'saving' ? (
          <span className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            保存中...
          </span>
        ) : saveState === 'unsaved' ? (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            未保存
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            已保存
            {lastSaved && (
              <span className="text-gray-400">
                {lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
