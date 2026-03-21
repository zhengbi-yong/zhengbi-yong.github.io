'use client'

/**
 * 新建文章页面
 *
 * 完整的文章创建流程：
 * 1. 编辑元数据（标题、摘要、分类、标签）
 * 2. 使用富文本编辑器撰写内容
 * 3. 一键发布到数据库
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArticleMetadata } from '@/components/editor/ArticleMetadata'
import { Loader2, Save, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [content, setContent] = useState('<p>开始写作...</p>')

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
    if (!content || content === '<p>开始写作...</p>') {
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
      // 生成 slug（从标题转换）
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // 获取 token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')

      if (!token) {
        throw new Error('未登录，请先登录')
      }

      const response = await fetch('http://localhost:3000/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          slug,
          summary,
          content,
          status,
          category_id: category,
          tag_ids: tags,
        }),
      })

      // 检查响应是否为空
      const contentType = response.headers.get('content-type')
      const hasJsonBody = contentType && contentType.includes('application/json')

      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = '发布失败'
        if (hasJsonBody) {
          try {
            const error = await response.json()
            errorMessage = error.message || error.error || errorMessage
          } catch {
            // 如果解析失败，使用状态码作为错误信息
            errorMessage = `发布失败 (HTTP ${response.status})`
          }
        }
        throw new Error(errorMessage)
      }

      // 解析成功响应
      let result = null
      if (hasJsonBody) {
        try {
          result = await response.json()
        } catch {
          // 如果响应为空或解析失败，使用默认值
          result = { slug, title }
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

    // 生成临时 slug
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 在新窗口打开预览
    window.open(`/admin/posts/preview/${slug}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              创建新文章
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              使用 Markdown 语法，享受流畅的写作体验
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              disabled={isPublishing || !title}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md',
                'bg-gray-100 dark:bg-gray-700',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-200 dark:hover:bg-gray-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              <Eye className="w-4 h-4" />
              预览
            </button>

            <button
              onClick={() => handlePublish('Draft')}
              disabled={isPublishing}
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
              onClick={() => handlePublish('Published')}
              disabled={isPublishing}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-md',
                'bg-blue-600 text-white',
                'hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                'font-medium'
              )}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  发布中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  发布文章
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 状态消息 */}
        {publishStatus.type && (
          <div
            className={cn(
              'mb-6 p-4 rounded-md',
              publishStatus.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            )}
          >
            {publishStatus.message}
          </div>
        )}

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
            placeholder="开始输入正文内容... (支持 Markdown 语法)"
            editable={!isPublishing}
            className="min-h-[600px]"
          />
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">快速开始：</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>输入 <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"># 标题</code> 创建标题</li>
              <li>输入 <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">- 列表项</code> 创建列表</li>
              <li>输入 <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">```代码</code> 创建代码块</li>
              <li>输入 <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">$公式$</code> 插入数学公式</li>
              <li>输入 <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">/</code> 打开快捷菜单</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
