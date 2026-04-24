'use client'

/**
 * 文章元数据管理组件
 *
 * 管理：
 * - 文章标题
 * - 文章摘要
 * - 分类选择
 * - 标签多选
 */

import { useState, useEffect } from 'react'
import { X, Tag as TagIcon, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryService, tagService } from '@/lib/api/backend'

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
            'text-4xl font-bold text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-600',
            'focus:outline-none focus:border-blue-500 dark:focus:border-blue-400',
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
            'text-xl text-gray-600 dark:text-gray-400',
            'placeholder:text-gray-400 dark:placeholder:text-gray-600',
            'focus:outline-none resize-none',
            'transition-colors'
          )}
        />
      </div>

      {/* 分类和标签 */}
      <div className="flex flex-wrap gap-4 items-start">
        {/* 分类选择 */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            分类
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={loading}
            className={cn(
              'w-full px-3 py-2 bg-white dark:bg-gray-800',
              'border border-gray-300 dark:border-gray-600 rounded-md',
              'text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <option value="">选择分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 标签选择 */}
        <div className="flex-[2] min-w-[300px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <TagIcon className="w-4 h-4 inline mr-1" />
            标签
          </label>
          <div className="relative">
            {/* 已选标签 */}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
              {selectedTagObjects.map((tag) => (
                <span
                  key={tag.id}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm',
                    'bg-blue-100 dark:bg-blue-900/30',
                    'text-blue-700 dark:text-blue-300',
                    'border border-blue-200 dark:border-blue-800'
                  )}
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* 标签输入 */}
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value)
                  setShowTagDropdown(true)
                }}
                onFocus={() => setShowTagDropdown(true)}
                placeholder="搜索或添加标签..."
                className={cn(
                  'w-full px-3 py-2 bg-white dark:bg-gray-800',
                  'border border-gray-300 dark:border-gray-600 rounded-md',
                  'text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />

              {/* 标签下拉菜单 */}
              {showTagDropdown && filteredTags.length > 0 && (
                <>
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTag(tag.id)}
                        className={cn(
                          'w-full px-3 py-2 text-left',
                          'hover:bg-gray-100 dark:hover:bg-gray-700',
                          'text-gray-900 dark:text-gray-100',
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
                  'mt-2 text-sm text-blue-600 dark:text-blue-400',
                  'hover:underline'
                )}
              >
                + 创建新标签 "{tagInput}"
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
