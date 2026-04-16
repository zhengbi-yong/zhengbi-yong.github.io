/**
 * 草稿管理 Hook
 *
 * 提供 localStorage 持久化的草稿管理功能：
 * - 自动保存（内容变化后 2 秒防抖）
 * - 草稿列表（查看/恢复/删除）
 * - 自动恢复上次编辑内容
 */

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

/**
 * 带格式化时间的草稿显示对象
 */
export interface DraftWithTime extends Draft {
  timeAgo: string
}

const DRAFTS_KEY = 'post_drafts'

/**
 * 格式化草稿时间为相对时间描述
 */
function formatDraftTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

/**
 * 将 Draft 转换为带时间描述的 DraftWithTime
 */
function enrichDraftWithTime(draft: Draft): DraftWithTime {
  return {
    ...draft,
    timeAgo: formatDraftTime(draft.updatedAt),
  }
}

/**
 * 批量转换草稿列表
 */
function enrichDraftsWithTime(drafts: Draft[]): DraftWithTime[] {
  return drafts.map(enrichDraftWithTime)
}

function loadDraftsFromStorage(): Draft[] {
  try {
    const stored = localStorage.getItem(DRAFTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveDraftsToStorage(drafts: Draft[]): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch (e) {
    console.error('[useDraft] Failed to save drafts:', e)
  }
}

export function useDraft(existingDraftId?: string) {
  const [drafts, setDrafts] = useState<Draft[]>([])

  // 初始加载
  useEffect(() => {
    setDrafts(loadDraftsFromStorage())
  }, [])

  // 保存单个草稿（更新或新增）
  const saveDraft = useCallback((draft: Draft) => {
    setDrafts(prev => {
      const idx = prev.findIndex(d => d.id === draft.id)
      let updated: Draft[]
      if (idx >= 0) {
        updated = [...prev]
        updated[idx] = draft
      } else {
        updated = [draft, ...prev]
      }
      saveDraftsToStorage(updated)
      return updated
    })
  }, [])

  // 删除草稿
  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => {
      const updated = prev.filter(d => d.id !== id)
      saveDraftsToStorage(updated)
      return updated
    })
  }, [])

  // 获取单个草稿
  const getDraft = useCallback((id: string): Draft | null => {
    return loadDraftsFromStorage().find(d => d.id === id) || null
  }, [])

  // 获取当前草稿（用于自动恢复）
  const getCurrentDraft = useCallback((): Draft | null => {
    if (!existingDraftId) return null
    return getDraft(existingDraftId)
  }, [existingDraftId, getDraft])

  // 清除所有草稿
  const clearAllDrafts = useCallback(() => {
    setDrafts([])
    localStorage.removeItem(DRAFTS_KEY)
  }, [])

  // 获取带时间描述的草稿列表（用于 UI 显示）
  const getDraftsWithTime = useCallback((): DraftWithTime[] => {
    return enrichDraftsWithTime(drafts)
  }, [drafts])

  return {
    drafts,
    draftsWithTime: getDraftsWithTime(),
    saveDraft,
    deleteDraft,
    getDraft,
    getCurrentDraft,
    clearAllDrafts,
  }
}
