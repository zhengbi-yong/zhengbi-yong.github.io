'use client'

/**
 * 文章元数据管理组件
 *
 * 管理:
 * - 文章标题
 * - 文章摘要
 * - 分类选择
 * - 标签多选
 */

import { useState, useEffect } from 'react'
import { X, Tag as TagIcon, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryService, tagService } from '@/lib/api/backend'
import { Input } from '@/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/ui/select'
import { Badge } from '@/components/shadcn/ui/badge'

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface ArticleMetadataProps {
  title: string
  summary: string
  category: string
  tags: string[]
  onTitleChange: (title: string) => void
  onSummaryChange: (summary: string) => void
  onCategoryChange: (category: string) => void
  onTagsChange: (tags: string[]) => void
}

export function ArticleMetadata({
  title,
  summary,
  category,
  tags,
  onTitleChange,
  onSummaryChange,
  onCategoryChange,
  onTagsChange,
}: ArticleMetadataProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  // 加载分类和标签
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true)
      try {
        const [catData, tagData] = await Promise.all([
          categoryService.getCategories(),
          tagService.getTags(),
        ])
        setCategories(catData || [])
        setAllTags(tagData || [])
      } catch (error) {
        console.error('Failed to fetch metadata:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [])

  // 过滤标签
  const filteredTags = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !tags.includes(tag.id)
  )

  // 添加标签
  const addTag = (tagId: string) => {
    if (!tags.includes(tagId)) {
      onTagsChange([...tags, tagId])
    }
    setTagInput('')
    setShowTagDropdown(false)
  }

  // 移除标签
  const removeTag = (tagId: string) => {
    onTagsChange(tags.filter((t) => t !== tagId))
  }

  // 获取已选标签对象
  const selectedTagObjects = allTags.filter((tag) => tags.includes(tag.id))

  return (
    <div className="space-y-6">
      {/* 文章标题 */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="文章标题"
          className={cn(
            'w-full px-0 py-4 bg-transparent border-0 border-b-2',
            'text-4xl font-bold text-foreground',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none focus:border-primary',
            'transition-colors'
          )}
        />
      </div>

      {/* 文章摘要 */}
      <div>
        <textarea
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="在这里写一段简短的摘要..."
          rows={2}
          className={cn(
            'w-full px-4 py-3 bg-transparent border-0',
            'text-xl text-muted-foreground',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none resize-none',
            'transition-colors'
          )}
        />
      </div>

      {/* 分类和标签 */}
      <div className="flex flex-wrap gap-4 items-start">
        {/* 分类选择 */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            分类
          </label>
          <Select
            value={category || undefined}
            onValueChange={onCategoryChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 标签选择 */}
        <div className="flex-[2] min-w-[300px]">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            <TagIcon className="w-4 h-4 inline mr-1" />
            标签
          </label>
          <div className="relative">
            {/* 已选标签 */}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border rounded-md bg-card">
              {selectedTagObjects.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={cn(
                    'gap-1 px-3 py-1 rounded-full',
                    'bg-primary/10 text-primary border-primary/20'
                  )}
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* 标签输入 */}
            <div className="relative">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value)
                  setShowTagDropdown(true)
                }}
                onFocus={() => setShowTagDropdown(true)}
                placeholder="搜索或添加标签..."
              />

              {/* 标签下拉菜单 */}
              {showTagDropdown && filteredTags.length > 0 && (
                <>
                  <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTag(tag.id)}
                        className={cn(
                          'w-full px-3 py-2 text-left',
                          'hover:bg-muted',
                          'text-foreground',
                          'transition-colors'
                        )}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  {/* 遮罩层 */}
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowTagDropdown(false)}
                  />
                </>
              )}
            </div>

            {/* 创建新标签提示 */}
            {tagInput && filteredTags.length === 0 && (
              <button
                onClick={() => {
                  // TODO: 实现创建新标签的逻辑
                  alert('创建新标签功能待实现')
                }}
                className={cn(
                  'mt-2 text-sm text-primary',
                  'hover:underline'
                )}
              >
                + 创建新标签 &quot;{tagInput}&quot;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
