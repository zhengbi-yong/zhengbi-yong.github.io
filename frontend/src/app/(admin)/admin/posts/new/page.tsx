'use client'

/**
 * 新建文章页面
 *
 * 完整的文章创建流程：
 * 1. 编辑元数据（标题、摘要、分类、标签）
 * 2. 使用富文本编辑器撰写内容
 * 3. 一键发布到数据库
 *
 * 草稿功能：
 * - 自动保存到 localStorage（停止输入 2 秒后）
 * - 页面加载时自动恢复上次草稿
 * - 支持查看/恢复/删除历史草稿
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArticleMetadata } from '@/components/editor/ArticleMetadata'
import { Loader2, Save, Eye, FileText, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDraft, Draft } from '@/lib/hooks/useDraft'

// 动态导入编辑器，避免 SSR 问题
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor').then((mod) => ({ default: mod.TiptapEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] animate-pulse items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    ),
  }
)

export default function NewPostPage() {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // 文章数据状态
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [content, setContent] = useState('开始写作...') // 改为 Markdown 格式

  // 草稿状态
  const [draftId] = useState(() => crypto.randomUUID())
  const [showDrafts, setShowDrafts] = useState(false)
  const { draftsWithTime, saveDraft, deleteDraft, getCurrentDraft } = useDraft(draftId)

  // 自动恢复草稿
  useEffect(() => {
    const existingDraft = getCurrentDraft()
    if (existingDraft) {
      setTitle(existingDraft.title)
      setSummary(existingDraft.summary)
      setCategory(existingDraft.category)
      setTags(existingDraft.tags)
      if (existingDraft.content && existingDraft.content !== '开始写作...') {
        setContent(existingDraft.content)
      }
    }
  }, [getCurrentDraft])

  // 自动保存草稿（停止输入 2 秒后）
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!title && !content) {
      return undefined
    }

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      saveDraft({
        id: draftId,
        title,
        summary,
        category,
        tags,
        content,
        updatedAt: Date.now(),
      })
    }, 2000)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [title, summary, category, tags, content, draftId, saveDraft])

  // 验证表单
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setPublishStatus({ type: 'error', message: '请输入文章标题' })
      return false
    }
    if (!category) {
      setPublishStatus({ type: 'error', message: '请选择文章分类' })
      return false
    }
    if (tags.length === 0) {
      setPublishStatus({ type: 'error', message: '请至少选择一个标签' })
      return false
    }
    if (!content || content === '开始写作...') {
      setPublishStatus({ type: 'error', message: '请输入文章内容' })
      return false
    }
    return true
  }

  // 发布文章
  const handlePublish = async (status: 'Published' | 'Draft' = 'Published') => {
    if (!validateForm()) {
      return
    }

    setIsPublishing(true)
    setPublishStatus({ type: null, message: '' })

    try {
      // 生成 slug：统一使用长 ID（UUID v4），保证全局唯一、可扩展
      // 无论中英文标题，一律使用 UUID，确保 URL 格式统一美观
      const slug = crypto.randomUUID()

      const requestBody = {
        title,
        slug,
        summary,
        content,
        status,
        category_id: category || null,
        tag_ids: tags.length > 0 ? tags : null,
      }

      console.log('[NewPostPage] 发送文章创建请求:', JSON.stringify(requestBody, null, 2))

      // GOLDEN_RULES 1.1: 使用 credentials: 'include' 自动发送 HttpOnly Cookie
      // 不手动设置 Authorization 头
      const response = await fetch('/api/v1/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      console.log('[NewPostPage] 响应状态:', response.status, response.statusText)

      // 检查响应是否为空
      const contentType = response.headers.get('content-type')
      const hasJsonBody = contentType && contentType.includes('application/json')

      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = `发布失败 (HTTP ${response.status})`
        if (hasJsonBody) {
          try {
            const error = await response.json()
            console.error('[NewPostPage] 错误响应:', error)
            errorMessage = error.message || error.error || errorMessage
          } catch (e) {
            console.error('[NewPostPage] 解析错误响应失败:', e)
            // 如果解析失败，使用状态码作为错误信息
            errorMessage = `发布失败 (HTTP ${response.status})`
          }
        }
        throw new Error(errorMessage)
      }

      // 解析成功响应
      if (hasJsonBody) {
        try {
          await response.json()
        } catch {
          // 如果响应为空或解析失败，继续使用本地 slug 跳转
        }
      }

      setPublishStatus({
        type: 'success',
        message: status === 'Published' ? '文章发布成功！' : '草稿保存成功！',
      })

      // 3秒后跳转到文章详情页
      setTimeout(() => {
        router.push(`/blog/${slug}`)
      }, 3000)
    } catch (error) {
      console.error('[NewPostPage] 发布失败:', error)
      setPublishStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '发布失败，请重试',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // 预览文章
  const handlePreview = () => {
    if (!title.trim()) {
      setPublishStatus({ type: 'error', message: '请先输入文章标题' })
      return
    }

    // 跳转到预览页，传递内容作为 URL 参数
    const params = new URLSearchParams({
      title: title || '无标题',
      content: content || '',
    })
    window.open(`/admin/posts/preview/temp?${params}`, '_blank')
  }

  // 恢复草稿
  const handleRestoreDraft = (draft: Draft) => {
    setTitle(draft.title)
    setSummary(draft.summary)
    setCategory(draft.category)
    setTags(draft.tags)
    setContent(draft.content)
    setPublishStatus({
      type: null,
      message: `已恢复草稿: ${draft.title || '无标题'}`,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">创建新文章</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              使用 Markdown 语法，享受流畅的写作体验
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2',
                showDrafts
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                'transition-colors'
              )}
            >
              <FileText className="h-4 w-4" />
              草稿 ({draftsWithTime.length})
            </button>

            <button
              onClick={handlePreview}
              disabled={isPublishing || !title}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2',
                'bg-gray-100 dark:bg-gray-700',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-200 dark:hover:bg-gray-600',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors'
              )}
            >
              <Eye className="h-4 w-4" />
              预览
            </button>

            <button
              onClick={() => handlePublish('Draft')}
              disabled={isPublishing}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2',
                'bg-gray-200 dark:bg-gray-600',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-300 dark:hover:bg-gray-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors'
              )}
            >
              <Save className="h-4 w-4" />
              保存草稿
            </button>

            <button
              onClick={() => handlePublish('Published')}
              disabled={isPublishing}
              className={cn(
                'flex items-center gap-2 rounded-md px-6 py-2',
                'bg-blue-600 text-white',
                'hover:bg-blue-700',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors',
                'font-medium'
              )}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  发布中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  发布文章
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 gap-6 mx-auto max-w-7xl px-4 py-8">
        {/* 草稿列表侧边栏 */}
        {showDrafts && (
          <div className="w-64 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">草稿列表</h3>
              <button
                onClick={() => setShowDrafts(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            {draftsWithTime.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">暂无草稿</p>
            ) : (
              <div className="space-y-2">
                {draftsWithTime.map(draft => (
                  <div
                    key={draft.id}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors',
                      draft.id === draftId
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    onClick={() => handleRestoreDraft(draft)}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {draft.title || '无标题'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {draft.timeAgo}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestoreDraft(draft)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                        title="恢复此草稿"
                      >
                        <RotateCcw className="w-3 h-3" /> 恢复
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('确定删除此草稿？')) {
                            deleteDraft(draft.id)
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        title="删除此草稿"
                      >
                        <Trash2 className="w-3 h-3" /> 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 主要编辑区 */}
        <div className="flex-1 min-w-0">
          {/* 状态消息 */}
          {publishStatus.type && (
            <div
              className={cn(
                'mb-6 rounded-md p-4',
                publishStatus.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : publishStatus.type === 'error'
                  ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  : 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
              )}
            >
              {publishStatus.message}
            </div>
          )}

          {/* 元数据编辑区 */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <ArticleMetadata
              title={title}
              summary={summary}
              category={category}
              tags={tags}
              onTitleChange={setTitle}
              onSummaryChange={setSummary}
              onCategoryChange={setCategory}
              onTagsChange={setTags}
            />
          </div>

          {/* 富文本编辑器 */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="开始输入正文内容... (支持 Markdown 语法)"
              editable={!isPublishing}
              className="min-h-[600px]"
            />
          </div>

          {/* 底部提示 */}
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <h3 className="mb-2 font-semibold">快速开始：</h3>
              <ul className="list-inside list-disc space-y-1">
                <li>
                  输入{' '}
                  <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700"># 标题</code>{' '}
                  创建标题
                </li>
                <li>
                  输入{' '}
                  <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">- 列表项</code>{' '}
                  创建列表
                </li>
                <li>
                  输入{' '}
                  <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">```代码</code>{' '}
                  创建代码块
                </li>
                <li>
                  输入{' '}
                  <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">$公式$</code>{' '}
                  插入数学公式
                </li>
                <li>
                  输入 <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">/</code>{' '}
                  打开快捷菜单
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
