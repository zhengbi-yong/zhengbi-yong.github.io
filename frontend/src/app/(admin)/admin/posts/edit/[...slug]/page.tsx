'use client'

/**
 * 编辑文章页面
 *
 * 复用新建文章页面结构,支持加载已有文章数据并回显到编辑器中
 */

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import { ArticleMetadata } from '@/components/editor/ArticleMetadata'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { postService, adminService } from '@/lib/api/backend'
import { loadToEditor } from '@/lib/mdx/MDXContentBridge'
import type { PostDetail } from '@/lib/types/backend'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { LoadingState } from '@/components/admin/empty-state'

import TiptapEditor from '@/components/editor/TiptapEditor'

export default function EditPostPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = use(params)
  const slug = decodeURIComponent(slugArray.join('/'))
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [contentMdx, setContentMdx] = useState('')
  const [originalPost, setOriginalPost] = useState<PostDetail | null>(null)
  const [loadingPost, setLoadingPost] = useState(true)
  const [postStatus, setPostStatus] = useState<string>('Draft')
  const originalMdxRef = useRef<string>('')

  useEffect(() => {
    const loadPost = async () => {
      try {
        const post = await postService.getPost(slug)
        setOriginalPost(post)
        setTitle(post.title)
        setSummary(post.summary || '')
        setCategory(post.category_id || '')
        setTags(post.tags?.map((t) => t.id) || [])
        originalMdxRef.current = post.content || ''
        if (post.content_json) {
          setContent(JSON.stringify(post.content_json))
        } else {
          const { content: editorContent } = loadToEditor(post.content || '')
          setContent(editorContent)
        }
        setPostStatus(post.status)
      } catch (error) {
        console.error('Failed to load post:', error)
        setSaveStatus({
          type: 'error',
          message: '加载文章失败,请重新加载',
        })
      } finally {
        setLoadingPost(false)
      }
    }

    loadPost()
  }, [slug])

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

  const handleSave = async (status: 'Published' | 'Draft' = 'Published') => {
    if (!validateForm()) return
    setIsSaving(true)
    setSaveStatus({ type: null, message: '' })
    try {
      if (!originalPost) return
      let jsonPayload: Record<string, unknown> | undefined
      let mdxPayload: string | undefined
      try {
        jsonPayload = JSON.parse(content)
        mdxPayload = contentMdx || undefined
      } catch {
        jsonPayload = undefined
        mdxPayload = contentMdx || content
      }
      await adminService.updatePost(originalPost.id, {
        title,
        content: contentMdx || content,
        content_json: jsonPayload,
        content_mdx: mdxPayload,
        content_format: 'mdx',
        summary: summary || undefined,
        status,
        category_id: category || null,
        tag_ids: tags.length > 0 ? tags : null,
      })
      setSaveStatus({
        type: 'success',
        message: status === 'Published' ? '文章已更新并发布!' : '草稿已保存!',
      })
    } catch (error) {
      console.error('Failed to save post:', error)
      setSaveStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '保存失败,请重试',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="加载文章中..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/posts-manage"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">编辑文章</h1>
              <p className="text-sm text-muted-foreground mt-1">{title || '无标题'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => handleSave('Draft')}
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              保存草稿
            </Button>
            <Button
              onClick={() => handleSave('Published')}
              disabled={isSaving}
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
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {saveStatus.type && (
          <div
            className={cn(
              'mb-6 p-4 rounded-lg border',
              saveStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            )}
          >
            {saveStatus.message}
          </div>
        )}
        <div className="mb-4 flex items-center gap-2">
          <Badge
            className={cn(
              'rounded-full',
              postStatus === 'Published'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                : postStatus === 'Draft'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
            variant="outline"
          >
            当前状态: {postStatus}
          </Badge>
          <span className="text-xs text-muted-foreground">
            最后更新: {originalPost?.updated_at ? new Date(originalPost.updated_at).toLocaleString('zh-CN') : '未知'}
          </span>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
          <ArticleMetadata title={title} summary={summary} category={category} tags={tags} onTitleChange={setTitle} onSummaryChange={setSummary} onCategoryChange={setCategory} onTagsChange={setTags} />
        </div>
        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
          <TiptapEditor content={content} onDualChange={(json: string, mdx: string) => { setContent(json); setContentMdx(mdx) }} />
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          <div className="bg-muted/50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">编辑提示:</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Slug: <code className="px-1 py-0.5 bg-secondary rounded text-secondary-foreground">{slug}</code> (不可修改)</li>
              <li>修改后点击"更新并发布"或"保存草稿"保存更改</li>
              <li>可以在新标签页打开文章预览发布效果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
