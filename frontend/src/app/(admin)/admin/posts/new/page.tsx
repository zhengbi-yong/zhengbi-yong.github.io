'use client'

// crypto.randomUUID polyfill for environments where it's not available
const randomUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: generate UUID-like string using crypto.getRandomValues
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    // Ultimate fallback for test environments
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * 新建文章页面
 *
 * 完整的文章创建流程:
 * 1. 编辑元数据(标题,摘要,分类,标签)
 * 2. 使用富文本编辑器撰写内容
 * 3. 一键发布到数据库
 *
 * 草稿功能:
 * - 自动保存到 localStorage(停止输入 2 秒后)
 * - 页面加载时自动恢复上次草稿
 * - 支持查看/恢复/删除历史草稿
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArticleMetadata } from '@/components/editor/ArticleMetadata'
import { Loader2, Eye, FileText, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDraft, Draft } from '@/lib/hooks/useDraft'
import TiptapEditor from '@/components/editor/TiptapEditor'
import { api } from '@/lib/api/apiClient'
import { Button } from '@/components/shadcn/ui/button'

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
  const [content, setContent] = useState('') // blocks JSON(编辑器原始数据 -> content_json)
  const [contentMdx, setContentMdx] = useState('') // Markdown/MDX(博客详情页消费 -> content_mdx)

  // 草稿状态
  const [draftId] = useState(() => randomUUID())
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

  // 自动保存草稿(停止输入 2 秒后)
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
      // 生成 slug:统一使用长 ID(UUID v4),保证全局唯一,可扩展
      // 无论中英文标题,一律使用 UUID,确保 URL 格式统一美观
      const slug = randomUUID()

      // BlockNote 输出双轨数据:content_json(blocks JSON)+ content_mdx(Markdown)
      let jsonPayload: Record<string, unknown> | undefined
      let mdxPayload: string | undefined
      try {
        jsonPayload = JSON.parse(content)
        // 优先使用独立的 contentMdx(来自 onDualChange)
        mdxPayload = contentMdx || undefined
      } catch {
        jsonPayload = undefined
        mdxPayload = contentMdx || content
      }

      const requestBody = {
        title,
        slug,
        summary,
        content,
        content_json: jsonPayload,
        content_mdx: mdxPayload,
        content_format: 'mdx',
        status,
        category_id: category || null,
        tag_ids: tags.length > 0 ? tags : null,
      }

      console.log('[NewPostPage] 发送文章创建请求:', JSON.stringify(requestBody, null, 2))

      // GOLDEN_RULES 1.1: 使用 credentials: 'include' 自动发送 HttpOnly Cookie
      // 不手动设置 Authorization 头
      await api.post('/api/v1/admin/posts', requestBody, {
        cache: false,
      })

      console.log('[NewPostPage] 响应状态: 200 (via apiClient)')

      setPublishStatus({
        type: 'success',
        message: status === 'Published' ? '文章发布成功!' : '草稿保存成功!',
      })

      // 3秒后跳转到文章详情页
      setTimeout(() => {
        router.push(`/blog/${slug}`)
      }, 3000)
    } catch (error) {
      console.error('[NewPostPage] 发布失败:', error)
      setPublishStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '发布失败,请重试',
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

    // 跳转到预览页,传递内容作为 URL 参数
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
    <div className="min-h-screen bg-background">
      {/* 极简 sticky 顶栏 - Notion/Ghost 风格 */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* 左侧: 面包屑 */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-default">文章管理</span>
            <span>/</span>
            <span className="text-foreground font-medium">新建文章</span>
          </div>

          {/* 右侧: 操作按钮 */}
          <div className="flex items-center gap-2">
            {publishStatus.type && (
              <span className={cn(
                'text-xs mr-1',
                publishStatus.type === 'success' ? 'text-emerald-500' : 'text-destructive'
              )}>
                {publishStatus.message}
              </span>
            )}
            <Button
              variant={showDrafts ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowDrafts(!showDrafts)}
            >
              <FileText className="h-3.5 w-3.5" />
              草稿 ({draftsWithTime.length})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              disabled={isPublishing || !title}
            >
              <Eye className="h-3.5 w-3.5" />
              预览
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePublish('Draft')}
              disabled={isPublishing}
            >
              保存草稿
            </Button>

            <Button
              size="sm"
              onClick={() => handlePublish('Published')}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  发布中...
                </>
              ) : (
                '发布文章'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 gap-6 mx-auto max-w-5xl px-4 py-6">
        {/* 草稿列表侧边栏 */}
        {showDrafts && (
          <div className="w-64 flex-shrink-0 bg-card border rounded-lg p-4 shadow-sm overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">草稿列表</h3>
              <button
                onClick={() => setShowDrafts(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            {draftsWithTime.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无草稿</p>
            ) : (
              <div className="space-y-2">
                {draftsWithTime.map(draft => (
                  <div
                    key={draft.id}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors',
                      draft.id === draftId
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                    onClick={() => handleRestoreDraft(draft)}
                  >
                    <div className="font-medium text-sm text-foreground truncate">
                      {draft.title || '无标题'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {draft.timeAgo}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestoreDraft(draft)
                        }}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        title="恢复此草稿"
                      >
                        <RotateCcw className="w-3 h-3" /> 恢复
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('确定删除此草稿?')) {
                            deleteDraft(draft.id)
                          }
                        }}
                        className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
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
          {/* 元数据编辑区 */}
          <div className="mb-6 bg-card rounded-lg border shadow-sm p-6">
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
          <div className="overflow-hidden bg-card rounded-lg border shadow-sm">
            <TiptapEditor
              content={content}
              onDualChange={(json: string, mdx: string) => {
                setContent(json)
                setContentMdx(mdx)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
