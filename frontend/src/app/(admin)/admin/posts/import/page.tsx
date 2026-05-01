'use client'

/**
 * MDX 导入页面
 *
 * 支持三种导入方式:
 * 1. 粘贴 MDX/Markdown 文本
 * 2. 拖拽/选择 .mdx/.md 文件
 * 3. 输入外部 URL（Phase 2）
 *
 * 导入流程:
 * 1. 选模式 (preview / create / upsert)
 * 2. 输入 MDX → 点击「预览」
 * 3. 显示预览结果（标题、元数据、统计）
 * 4. 确认无误 → 点击「导入」
 * 5. 显示成功提示 + 链接到编辑页面
 */

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { DataCard } from '@/components/admin/data-card'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Textarea } from '@/components/shadcn/ui/textarea'
import { Badge } from '@/components/shadcn/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/ui/select'
import {
  ArrowLeft,
  Eye,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Hash,
  Tag,
  BookOpen,
  Type,
  Loader2,
  Files,
  XCircle,
} from 'lucide-react'

type ImportMode = 'preview' | 'create' | 'upsert'

interface PreviewData {
  frontmatter?: {
    title?: string
    date?: string
    category?: string
    summary?: string
    tags?: string[]
    draft?: boolean
    show_toc?: boolean
    layout?: string
  }
  word_count?: number
  reading_time_minutes?: number
  has_content?: boolean
}

interface ImportResult {
  id?: string
  slug: string
  title: string
  action: string
  preview?: PreviewData
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

function getModeLabel(mode: ImportMode) {
  switch (mode) {
    case 'preview':
      return '预览'
    case 'create':
      return '创建'
    case 'upsert':
      return '创建/更新'
  }
}

function getModeDescription(mode: ImportMode) {
  switch (mode) {
    case 'preview':
      return '仅解析并预览，不写入数据库'
    case 'create':
      return '创建新文章（slug 已存在则报错）'
    case 'upsert':
      return '创建或更新（slug 已存在时更新）'
  }
}

export default function ImportMdxPage() {
  // ── State ──────────────────────────────────────────────────────────
  const [mdxText, setMdxText] = useState('')
  const [mode, setMode] = useState<ImportMode>('preview')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // ── Batch state ───────────────────────────────────────────────────
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<any[] | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)

  // ── Handlers ───────────────────────────────────────────────────────

  /** 粘贴区变化 */
  const handleTextChange = (value: string) => {
    setMdxText(value)
    setPreview(null)
    setError(null)
    setSuccess(null)
  }

  /** 文件上传 */
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.mdx') && !file.name.endsWith('.md')) {
      setError('仅支持 .mdx 和 .md 文件')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setMdxText(text)
      setPreview(null)
      setError(null)
      setSuccess(null)
    }
    reader.readAsText(file)
    // 也加入批量列表
    setBatchFiles((prev) => {
      if (prev.some((f) => f.name === file.name)) return prev
      return [...prev, file]
    })
  }

  const handleMultipleFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) => f.name.endsWith('.mdx') || f.name.endsWith('.md')
    )
    if (validFiles.length === 0) {
      setError('没有有效的 .mdx 或 .md 文件')
      return
    }
    if (validFiles.length === 1) {
      handleFileSelect(validFiles[0])
    } else {
      setBatchFiles((prev) => {
        const names = new Set(prev.map((f) => f.name))
        const newFiles = validFiles.filter((f) => !names.has(f.name))
        return [...prev, ...newFiles].slice(0, 50)
      })
      setMdxText('')
      setPreview(null)
    }
    setError(null)
    setSuccess(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleMultipleFiles(e.dataTransfer.files)
  }, [])

  /** 预览 */
  const handlePreview = async () => {
    if (!mdxText.trim()) {
      setError('请输入 MDX 内容')
      return
    }
    setLoading(true)
    setError(null)
    setPreview(null)
    setSuccess(null)

    try {
      const resp = await fetch(
        `${BACKEND_URL}/api/v1/admin/posts/import/mdx`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mdx_text: mdxText,
            slug: slug.trim() || undefined,
            mode: 'preview',
          }),
        }
      )
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error?.message || data?.message || '预览失败')
      }
      setPreview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '预览失败')
    } finally {
      setLoading(false)
    }
  }

  /** 导入 */
  const handleImport = async () => {
    if (!mdxText.trim()) {
      setError('请输入 MDX 内容')
      return
    }
    if (mode === 'preview') {
      setError('预览模式下不能导入，请选择「创建」或「创建/更新」模式')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(
        `${BACKEND_URL}/api/v1/admin/posts/import/mdx`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mdx_text: mdxText,
            slug: slug.trim() || undefined,
            mode,
          }),
        }
      )
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error?.message || data?.message || '导入失败')
      }
      setSuccess(data)
      setPreview(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setLoading(false)
    }
  }

  /** 重置 */
  const handleReset = () => {
    setMdxText('')
    setSlug('')
    setPreview(null)
    setError(null)
    setSuccess(null)
  }

  /** 批量导入 */
  const handleBatchImport = async () => {
    if (batchFiles.length === 0) {
      setError('请先添加文件')
      return
    }
    if (mode === 'preview') {
      setError('批量导入不支持预览模式')
      return
    }

    setBatchLoading(true)
    setError(null)
    setBatchResults(null)

    try {
      const formData = new FormData()
      batchFiles.forEach((f) => formData.append('files', f))
      formData.append('mode', mode)

      const resp = await fetch(
        `${BACKEND_URL}/api/v1/admin/posts/import/batch`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      )
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error?.message || data?.message || '批量导入失败')
      }
      setBatchResults(data.results || [])
      setBatchFiles([])
    } catch (e) {
      setError(e instanceof Error ? e.message : '批量导入失败')
    } finally {
      setBatchLoading(false)
    }
  }

  /** 清除批量文件列表 */
  const handleClearBatch = () => {
    setBatchFiles([])
    setBatchResults(null)
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader title="导入 MDX" description="粘贴或上传 MDX/Markdown 文件导入为文章">
        <Button variant="outline" asChild>
          <Link href="/admin/posts-manage">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            返回文章管理
          </Link>
        </Button>
      </PageHeader>

      {/* 模式选择 + Slug */}
      <DataCard title="导入设置">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>导入模式</Label>
            <Select
              value={mode}
              onValueChange={(v: ImportMode) => {
                setMode(v)
                setSuccess(null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preview">👁️ 仅预览（不写入）</SelectItem>
                <SelectItem value="create">✨ 创建新文章</SelectItem>
                <SelectItem value="upsert">🔄 创建 / 更新</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getModeDescription(mode)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>自定义 Slug（可选）</Label>
            <Input
              placeholder="留空则自动生成"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              用于文章 URL 路径，如 /blog/my-post
            </p>
          </div>
        </div>
      </DataCard>

      {/* MDX 输入区 */}
      <DataCard title="MDX 内容">
        <div className="space-y-4">
          {/* 拖拽上传区 */}
          <div
            className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mdx,.md"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleMultipleFiles(e.target.files)
                }
              }}
            />
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">
              拖拽 .mdx / .md 文件到此处
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              支持多文件（最多 50 个）
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              或
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Files className="mr-1.5 h-3.5 w-3.5" />
              选择文件
            </Button>
          </div>

          {/* 批量文件列表 */}
          {batchFiles.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Files className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    已选择 {batchFiles.length} 个文件
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {mode !== 'preview' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleBatchImport}
                      disabled={batchLoading}
                    >
                      {batchLoading ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="mr-1 h-3.5 w-3.5" />
                      )}
                      批量导入
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearBatch}
                    disabled={batchLoading}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    清除
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                {batchFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate">{f.name}</span>
                    <span className="text-muted-foreground/50">
                      ({Math.round(f.size / 1024)}KB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 粘贴区 */}
          <div className="space-y-2">
            <Label>或直接粘贴 MDX 文本</Label>
            <Textarea
              placeholder={`---
title: '我的文章标题'
date: '2025-01-15'
category: '技术'
tags:
  - Rust
  - Web
summary: '这是一篇示例文章'
---

# 第一章

正文内容...`}
              className="min-h-[320px] font-mono text-sm"
              value={mdxText}
              onChange={(e) => handleTextChange(e.target.value)}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <Button onClick={handlePreview} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-1.5 h-4 w-4" />
              )}
              预览
            </Button>
            {mode !== 'preview' && (
              <Button
                variant="default"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-4 w-4" />
                )}
                导入
              </Button>
            )}
            <Button variant="ghost" onClick={handleReset} disabled={loading}>
              清空
            </Button>
          </div>
        </div>
      </DataCard>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">导入失败</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* 成功提示 */}
      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700">
              {success.action === 'created' ? '导入成功！' : '更新成功！'}
            </p>
            <p className="text-sm text-emerald-600/80 mt-1">
              文章「{success.title}」已{success.action === 'created' ? '创建' : '更新'}。
            </p>
            <div className="flex items-center gap-3 mt-3">
              {success.id && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/posts/edit/${encodeURIComponent(success.slug)}`}>
                    编辑文章
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/posts-manage">查看文章列表</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 预览结果 */}
      {preview && preview.preview && (
        <DataCard title="预览结果">
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {preview.preview.frontmatter?.title && (
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">标题</p>
                    <p className="text-sm font-medium">{preview.preview.frontmatter.title}</p>
                  </div>
                </div>
              )}
              {preview.preview.frontmatter?.date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">日期</p>
                    <p className="text-sm">{preview.preview.frontmatter.date}</p>
                  </div>
                </div>
              )}
              {preview.preview.frontmatter?.category && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">分类</p>
                    <p className="text-sm">{preview.preview.frontmatter.category}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">字数</p>
                  <p className="text-sm">{preview.preview.word_count ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">阅读时间</p>
                  <p className="text-sm">
                    {preview.preview.reading_time_minutes ?? 0} 分钟
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Slug</p>
                  <p className="text-sm font-mono text-xs">{preview.slug}</p>
                </div>
              </div>
            </div>

            {/* 标签 */}
            {preview.preview.frontmatter?.tags &&
              preview.preview.frontmatter.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">标签</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.preview.frontmatter.tags.map((t, i) => (
                      <Badge key={i} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* 摘要 */}
            {preview.preview.frontmatter?.summary && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">摘要</p>
                <p className="text-sm text-foreground/80">
                  {preview.preview.frontmatter.summary}
                </p>
              </div>
            )}

            {/* 状态 */}
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  preview.preview.frontmatter?.draft ? 'warning' : 'success'
                }
              >
                {preview.preview.frontmatter?.draft ? '草稿' : '已发布'}
              </Badge>
              {preview.preview.frontmatter?.show_toc && (
                <Badge variant="outline">目录</Badge>
              )}
              {preview.preview.frontmatter?.layout &&
                preview.preview.frontmatter.layout !== 'PostLayout' && (
                  <Badge variant="outline">
                    {preview.preview.frontmatter.layout}
                  </Badge>
                )}
            </div>
          </div>
        </DataCard>
      )}

      {/* 批量导入结果 */}
      {batchResults && batchResults.length > 0 && (
        <DataCard title={`批量导入结果 (${batchResults.filter((r: any) => r.status === 'ok').length}/${batchResults.length} 成功)`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">文件</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">标题</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">状态</th>
                  <th className="py-2 font-medium text-muted-foreground">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batchResults.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 text-xs font-mono truncate max-w-[180px]">
                      {r.filename}
                    </td>
                    <td className="py-2 pr-4">
                      {r.status === 'ok' && r.title ? (
                        <Link
                          href={`/admin/posts/edit/${encodeURIComponent(r.slug || '')}`}
                          className="text-primary hover:underline"
                        >
                          {r.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {r.status === 'ok' ? (
                        <Badge variant="success" className="text-xs">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          成功
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="mr-1 h-3 w-3" />
                          失败
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                      {r.error || r.slug || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataCard>
      )}
    </div>
  )
}
