'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpDown, X } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'

/**
 * 过滤器状态
 */
export interface FilterState {
  category: string
  sortBy: 'latest' | 'popular' | 'relevant'
  searchQuery: string
}

/**
 * FilterBar 组件属性
 */
interface FilterBarProps {
  categories: string[]
  onFilterChange: (filter: FilterState) => void
  className?: string
}

/**
 * 排序选项标签
 */
const sortByLabels: Record<FilterState['sortBy'], string> = {
  latest: '最新发布',
  popular: '最多阅读',
  relevant: '相关度',
}

/**
 * FilterBar - 过滤栏组件
 *
 * 功能：
 * - 分类过滤（全部/机器人/控制/感知等）
 * - 智能排序（最新/热门/相关）
 * - 实时搜索
 * - 粘性定位（sticky top-16）
 * - 活动状态指示
 */
export default function FilterBar({ categories, onFilterChange, className = '' }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [sortBy, setSortBy] = useState<FilterState['sortBy']>('latest')
  const [searchQuery, setSearchQuery] = useState('')

  // 处理分类变更
  function handleCategoryChange(category: string) {
    setActiveCategory(category)
    onFilterChange({ category, sortBy, searchQuery })
  }

  // 处理排序变更
  function handleSortChange(value: FilterState['sortBy']) {
    setSortBy(value)
    onFilterChange({ category: activeCategory, sortBy: value, searchQuery })
  }

  // 处理搜索
  function handleSearchChange(value: string) {
    setSearchQuery(value)
    onFilterChange({ category: activeCategory, sortBy, searchQuery: value })
  }

  // 清除搜索
  function handleClearSearch() {
    setSearchQuery('')
    onFilterChange({ category: activeCategory, sortBy, searchQuery: '' })
  }

  return (
    <div className={className} data-testid="filter-bar">
      <div className="sticky top-16 z-40 border-b bg-white/80 backdrop-blur-md transition-all dark:border-gray-700 dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {/* 分类按钮组 */}
            <div className="flex flex-wrap gap-2" data-testid="filter-categories">
              <AnimatePresence>
                {categories.map((category) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant={activeCategory === category ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleCategoryChange(category)}
                      data-testid={`filter-category-${category}`}
                      className={
                        activeCategory === category
                          ? 'shadow-md'
                          : 'hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }
                    >
                      {category}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 分隔线 */}
            <div className="hidden h-6 w-px bg-gray-300 dark:bg-gray-600 md:block" />

            {/* 排序下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="filter-sort-dropdown">
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="hidden sm:inline">排序: {sortByLabels[sortBy]}</span>
                  <span className="sm:hidden">排序</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleSortChange('latest')}>
                  最新发布
                  {sortBy === 'latest' && <span className="ml-auto text-primary-600">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('popular')}>
                  最多阅读
                  {sortBy === 'popular' && <span className="ml-auto text-primary-600">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('relevant')}>
                  相关度
                  {sortBy === 'relevant' && <span className="ml-auto text-primary-600">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 搜索框 */}
            <div className="ml-auto relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索书籍、文章..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 w-48 md:w-64"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 活动过滤器指示 */}
          {(activeCategory !== '全部' || searchQuery) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              data-testid="filter-active-indicator"
            >
              <span>当前过滤:</span>
              {activeCategory !== '全部' && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                  {activeCategory}
                </span>
              )}
              {searchQuery && (
                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:bg-accent-900 dark:text-accent-300">
                  搜索: {searchQuery}
                </span>
              )}
              <button
                onClick={() => {
                  setActiveCategory('全部')
                  setSearchQuery('')
                  onFilterChange({ category: '全部', sortBy, searchQuery: '' })
                }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
              >
                清除全部
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
