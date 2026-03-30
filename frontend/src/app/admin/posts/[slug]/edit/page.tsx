'use client'

/**
 * 编辑文章页面
 *
 * 复用新建文章页面结构，支持加载已有文章数据并回显到编辑器中
 */

import { useState, useEffect, use } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArticleMetadata } from '@/components/editor/ArticleMetadata'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { postService, adminService } from '@/lib/api/backend'
import type { PostDetail } from '@/lib/types/backend'

// 动态导入编辑器，避免 SSR 问题
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor').then((mod) => ({ default: mod.TiptapEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    ),
  }
)

export default function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // 文章数据状态
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [originalPost, setOriginalPost] = useState<PostDetail | null>(null)
  const [loadingPost, setLoadingPost] = useState(true)
  const [postStatus, setPostStatus] = useState<string>('Draft')

  // 加载文章数据
  useEffect(() => {
    const loadPost = async () => {
      try {
        const post = await postService.getPost(slug)
        setOriginalPost(post)
        setTitle(post.title)
        setSummary(post.summary || '')
        setCategory(post.category_id || '')
        setTags(post.tags?.map((t) => t.id) || [])
        setContent(post.content || '')
        setPostStatus(post.status)
      } catch (error) {
        console.error('Failed to load post:', error)
        setSaveStatus({
          type: 'error',
          message: '加载文章失败，请重新加载',
        })
      } finally {
        setLoadingPost(false)
      }
    }

    loadPost()
  }, [slug])

  // 验证表单
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setSaveStatus({ type: 'error', message: '请输入文章标题' })
      return false
    }
    if (!content) {
      setSaveStatus({ type: 'error', message: '请输入文章内容' })
      return false
    }
    return true
  }

  // 保存文章
  const handleSave = async (status: 'Published' | 'Draft' = 'Published') => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setSaveStatus({ type: null, message: '' })

    try {
      await adminService.updatePost(slug, {
        title,
        content,
        summary: summary || undefined,
        status,
        category_id: category || null,
        tag_ids: tags.length > 0 ? tags : null,
      })

      setSaveStatus({
        type: 'success',
        message: status === 'Published' ? '文章已更新并发布！' : '草稿已保存！',
      })
    } catch (error) {
      console.error('Failed to save post:', error)
      setSaveStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '保存失败，请重试',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">加载文章中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/posts-manage"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                编辑文章
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {title || '无标题'}
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('Draft')}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md',
                'bg-gray-200 dark:bg-gray-600',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-300 dark:hover:bg-gray-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              <Save className="w-4 h-4" />
              保存草稿
            </button>

            <button
              onClick={() => handleSave('Published')}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-md',
                'bg-blue-600 text-white',
                'hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                'font-medium'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  更新并发布
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 状态消息 */}
        {saveStatus.type && (
          <div
            className={cn(
              'mb-6 p-4 rounded-md',
              saveStatus.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            )}
          >
            {saveStatus.message}
          </div>
        )}

        {/* 当前状态指示 */}
        <div className="mb-4 flex items-center gap-2">
          <span className={cn(
            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
            postStatus === 'Published'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : postStatus === 'Draft'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          )}>
            当前状态: {postStatus}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            最后更新: {originalPost?.updated_at ? new Date(originalPost.updated_at).toLocaleString('zh-CN') : '未知'}
          </span>
        </div>

        {/* 元数据编辑区 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="编辑正文内容... (支持 Markdown 语法)"
            editable={!isSaving}
            className="min-h-[600px]"
          />
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">编辑提示：</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Slug: <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{slug}</code> (不可修改)</li>
              <li>修改后点击"更新并发布"或"保存草稿"保存更改</li>
              <li>可以在新标签页打开文章预览发布效果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
