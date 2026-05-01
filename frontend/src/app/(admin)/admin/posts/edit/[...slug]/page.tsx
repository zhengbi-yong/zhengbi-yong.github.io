'use client'

/**
 * 编辑文章页面
 *
 * 复用新建文章页面结构,支持加载已有文章数据并回显到编辑器中
 */

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import { ArticleMetadata } from '@/components/editor/ArticleMetadata'
import { Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { postService, adminService } from '@/lib/api/backend'
import { apiClient } from '@/lib/api/apiClient'
import { useQueryClient } from '@tanstack/react-query'
import { loadToEditor } from '@/lib/mdx/MDXContentBridge'
import type { PostDetail } from '@/lib/types/backend'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { LoadingState } from '@/components/admin/empty-state'

import TiptapEditor from '@/components/editor/TiptapEditor'

export default function EditPostPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = use(params)
  const slug = decodeURIComponent(slugArray.join('/'))
  const queryClient = useQueryClient()
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
      // 清除缓存，确保前端文章页面立即显示更新内容
      apiClient.clearCache()
      queryClient.invalidateQueries({ queryKey: ['post', slug] })
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
      {/* 极简 sticky 顶栏 — Notion/Ghost 风格 */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* 左侧: 返回 + 面包屑 */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/posts-manage"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="返回文章列表"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
              <Link href="/admin/posts-manage" className="hover:text-foreground transition-colors">文章管理</Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{title || '无标题'}</span>
            </div>
            <Badge
              className={cn(
                'ml-1 rounded-full text-xs',
                postStatus === 'Published'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : postStatus === 'Draft'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-secondary text-secondary-foreground'
              )}
              variant="outline"
            >
              {postStatus === 'Published' ? '已发布' : postStatus === 'Draft' ? '草稿' : postStatus}
            </Badge>
          </div>

          {/* 右侧: 操作按钮 */}
          <div className="flex items-center gap-2">
            {saveStatus.type && (
              <span className={cn(
                'text-xs mr-1',
                saveStatus.type === 'success' ? 'text-emerald-500' : 'text-destructive'
              )}>
                {saveStatus.message}
              </span>
            )}
            <span className="hidden text-xs text-muted-foreground lg:block">
              {originalPost?.updated_at ? new Date(originalPost.updated_at).toLocaleString('zh-CN') : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSave('Draft')}
              disabled={isSaving}
            >
              保存草稿
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('Published')}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  保存中...
                </>
              ) : (
                '更新发布'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
          <ArticleMetadata title={title} summary={summary} category={category} tags={tags} onTitleChange={setTitle} onSummaryChange={setSummary} onCategoryChange={setCategory} onTagsChange={setTags} />
        </div>
        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
          <TiptapEditor content={content} onDualChange={(json: string, mdx: string) => { setContent(json); setContentMdx(mdx) }} />
        </div>
      </div>
    </div>
  )
}
