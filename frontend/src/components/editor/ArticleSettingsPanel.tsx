'use client'

/**
 * ArticleSettingsPanel - Article metadata settings form
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { categoryService, tagService } from '@/lib/api/backend'
import type { Category, Tag } from '@/lib/types/backend'

interface ArticleSettingsPanelProps {
  title: string
  summary: string
  category: string
  tags: string[]
  showToc: boolean
  isFeatured: boolean
  layout: string
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  onTitleChange: (v: string) => void
  onSummaryChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onTagsChange: (v: string[]) => void
  onShowTocChange: (v: boolean) => void
  onIsFeaturedChange: (v: boolean) => void
  onLayoutChange: (v: string) => void
  onMetaTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
  onCanonicalUrlChange: (v: string) => void
  onSave: () => void
}

export function ArticleSettingsPanel({
  title,
  summary,
  category,
  tags,
  showToc,
  isFeatured,
  layout,
  metaTitle,
  metaDescription,
  canonicalUrl,
  onTitleChange,
  onSummaryChange,
  onCategoryChange,
  onTagsChange,
  onShowTocChange,
  onIsFeaturedChange,
  onLayoutChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onCanonicalUrlChange,
  onSave,
}: ArticleSettingsPanelProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tagsList, setTagsList] = useState<Tag[]>([])
  const [tagSelect, setTagSelect] = useState('')

  // Load categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const catsData = await categoryService.getCategories()
        const tagsData = await tagService.getTags()
        setCategories(catsData || [])
        setTagsList(tagsData || [])
      } catch (error) {
        console.error('Failed to load categories/tags:', error)
      }
    }
    loadData()
  }, [])

  const handleAddTag = () => {
    if (tagSelect && !tags.includes(tagSelect)) {
      onTagsChange([...tags, tagSelect])
      setTagSelect('')
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(tags.filter((t) => t !== tagId))
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          标题
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="文章标题"
          className="w-full"
        />
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary" className="text-sm font-medium">
          摘要
        </Label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="文章摘要（可选）"
          className="w-full min-h-[80px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">
          分类
        </Label>
        <select
          id="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">选择分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">标签</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tagId) => {
            const tag = tagsList.find((t) => t.id === tagId)
            return (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {tag?.name || tagId}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tagId)}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
        <div className="flex gap-2">
          <select
            value={tagSelect}
            onChange={(e) => setTagSelect(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">选择标签</option>
            {tagsList
              .filter((t) => !tags.includes(t.id))
              .map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
          </select>
          <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
            添加
          </Button>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-2">
        <Label htmlFor="layout" className="text-sm font-medium">
          布局
        </Label>
        <select
          id="layout"
          value={layout}
          onChange={(e) => onLayoutChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="PostLayoutMonograph">专著</option>
        </select>
      </div>

      {/* Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="showToc" className="text-sm font-medium">
            显示目录
          </Label>
          <input
            type="checkbox"
            id="showToc"
            checked={showToc}
            onChange={(e) => onShowTocChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="isFeatured" className="text-sm font-medium">
            推荐文章
          </Label>
          <input
            type="checkbox"
            id="isFeatured"
            checked={isFeatured}
            onChange={(e) => onIsFeaturedChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      </div>

      {/* SEO */}
      <div className="space-y-2">
        <Label htmlFor="metaTitle" className="text-sm font-medium">
          SEO 标题
        </Label>
        <Input
          id="metaTitle"
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder="SEO 标题（可选）"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaDescription" className="text-sm font-medium">
          SEO 描述
        </Label>
        <textarea
          id="metaDescription"
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="SEO 描述（可选）"
          className="w-full min-h-[60px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="canonicalUrl" className="text-sm font-medium">
          规范链接
        </Label>
        <Input
          id="canonicalUrl"
          value={canonicalUrl}
          onChange={(e) => onCanonicalUrlChange(e.target.value)}
          placeholder="规范链接（可选）"
          className="w-full"
        />
      </div>

      {/* Save button */}
      <Button onClick={onSave} className="w-full">
        保存设置
      </Button>
    </div>
  )
}
