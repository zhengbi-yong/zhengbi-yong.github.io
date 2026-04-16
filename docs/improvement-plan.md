# 文章编辑器改进计划

> **目标：** 改进 `frontend/src/app/admin/posts/new/page.tsx` 的 Tiptap 编辑器

**改进项：**
1. 自动保存草稿到 localStorage（每 30 秒 + 内容变化时）
2. 修复预览功能（跳转到真实存在的路由）
3. 草稿列表（查看/恢复历史草稿）
4. 工具栏添加快捷键提示 tooltip

**架构：**
- 使用 `localStorage` 存储草稿（key: `post_drafts`）
- 草稿格式：`{ id, title, summary, category, tags, content, updatedAt }`
- 预览：使用 Markdown 实时预览组件

---

## Task 1: 创建草稿管理 Hook

**Files:**
- Create: `frontend/src/lib/hooks/useDraft.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'

export interface Draft {
  id: string
  title: string
  summary: string
  category: string
  tags: string[]
  content: string
  updatedAt: number
}

const DRAFTS_KEY = 'post_drafts'

export function useDraft(existingId?: string) {
  const [drafts, setDrafts] = useState<Draft[]>([])

  // 加载所有草稿
  const loadDrafts = useCallback(() => {
    try {
      const stored = localStorage.getItem(DRAFTS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  // 保存草稿
  const saveDraft = useCallback((draft: Draft) => {
    try {
      const all = loadDrafts()
      const idx = all.findIndex(d => d.id === draft.id)
      if (idx >= 0) {
        all[idx] = draft
      } else {
        all.unshift(draft)
      }
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
      setDrafts(all)
    } catch (e) {
      console.error('Failed to save draft:', e)
    }
  }, [loadDrafts])

  // 删除草稿
  const deleteDraft = useCallback((id: string) => {
    const all = loadDrafts().filter(d => d.id !== id)
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
    setDrafts(all)
  }, [loadDrafts])

  // 获取单个草稿
  const getDraft = useCallback((id: string): Draft | null => {
    return loadDrafts().find(d => d.id === id) || null
  }, [loadDrafts])

  useEffect(() => {
    setDrafts(loadDrafts())
  }, [loadDrafts])

  return { drafts, saveDraft, deleteDraft, getDraft }
}
```

---

## Task 2: 修改 NewPostPage 集成自动保存

**Modify:** `frontend/src/app/admin/posts/new/page.tsx`

在 `useState` 区域添加：
```typescript
const [draftId] = useState(() => existingDraftId || crypto.randomUUID())
const { saveDraft, getDraft } = useDraft()

// 自动保存逻辑
useEffect(() => {
  if (!title && !content) return
  
  const timer = setTimeout(() => {
    saveDraft({
      id: draftId,
      title,
      summary,
      category,
      tags,
      content,
      updatedAt: Date.now()
    })
  }, 2000) // 停止输入 2 秒后保存

  return () => clearTimeout(timer)
}, [title, summary, category, tags, content, draftId, saveDraft])
```

---

## Task 3: 修复预览功能

预览目前跳转到不存在的路由，改为使用 `window.open` 传递参数到新窗口的 Markdown 预览页。

**Create:** `frontend/src/app/admin/posts/preview/[slug]/page.tsx`

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PreviewPage() {
  const params = useSearchParams()
  const [html, setHtml] = useState('')

  useEffect(() => {
    const content = params.get('content') || ''
    // 简单的 Markdown → HTML 转换（生产环境应使用 unified/remark）
    // 这里用 replace 模拟，实际应引入 markdown 库
    const simpleHtml = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
    setHtml(simpleHtml)
  }, [params])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
```

**Modify:** `NewPostPage` 的 `handlePreview`:
```typescript
const handlePreview = () => {
  const params = new URLSearchParams({
    title: title || '无标题',
    content: content || ''
  })
  window.open(`/admin/posts/preview/temp?${params}`, '_blank')
}
```

---

## Task 4: 添加工具栏快捷键 tooltip

**Modify:** `frontend/src/components/editor/EditorToolbar.tsx`

在每个 `ToolbarButton` 添加 `title` 属性（已有），确保显示快捷键：

```typescript
// 在 ToolbarButton 组件中确保 title 显示快捷键
title={`${title} (${getShortcut(title)})`}

// 添加辅助函数
const getShortcut = (title: string) => {
  const shortcuts: Record<string, string> = {
    '粗体': 'Ctrl+B',
    '斜体': 'Ctrl+I',
    '下划线': 'Ctrl+U',
    '撤销': 'Ctrl+Z',
    '重做': 'Ctrl+Shift+Z',
  }
  return shortcuts[title] || ''
}
```

---

## Task 5: 添加草稿列表侧边栏

**Create:** `frontend/src/components/editor/DraftSidebar.tsx`

```typescript
'use client'

import { useDraft, Draft } from '@/lib/hooks/useDraft'
import { formatDistanceToNow } from '@/lib/utils'

interface DraftSidebarProps {
  onSelect: (draft: Draft) => void
  currentId: string
}

export function DraftSidebar({ onSelect, currentId }: DraftSidebarProps) {
  const { drafts, deleteDraft } = useDraft()

  return (
    <div className="w-64 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">草稿列表</h3>
      {drafts.length === 0 && (
        <p className="text-sm text-gray-500">暂无草稿</p>
      )}
      {drafts.map(draft => (
        <div
          key={draft.id}
          className={`p-3 mb-2 rounded-lg cursor-pointer ${
            draft.id === currentId ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'
          }`}
          onClick={() => onSelect(draft)}
        >
          <div className="font-medium text-sm truncate">
            {draft.title || '无标题'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(draft.updatedAt)} 保存
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('确定删除此草稿？')) {
                deleteDraft(draft.id)
              }
            }}
            className="mt-2 text-xs text-red-500 hover:text-red-700"
          >
            删除
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## Task 6: 集成草稿侧边栏到 NewPostPage

**Modify:** `frontend/src/app/admin/posts/new/page.tsx`

添加侧边栏状态和布局：
```typescript
const [showDrafts, setShowDrafts] = useState(false)

// 布局调整：添加侧边栏
<div className="flex min-h-screen bg-gray-50">
  {showDrafts && (
    <DraftSidebar
      currentId={draftId}
      onSelect={(draft) => {
        setTitle(draft.title)
        setSummary(draft.summary)
        setCategory(draft.category)
        setTags(draft.tags)
        setContent(draft.content)
      }}
    />
  )}
  {/* 原有内容 */}
</div>
```

---

## 验证步骤

1. 访问 `http://192.168.0.161:3001/admin/posts/new`
2. 输入标题和内容，等待 2 秒后刷新页面
3. 草稿应自动恢复
4. 点击"预览"按钮，应打开新窗口显示 Markdown 预览
5. 工具栏按钮 hover 应显示快捷键提示
