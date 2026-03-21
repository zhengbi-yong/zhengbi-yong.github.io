/**
 * 数据表格工具栏组件
 *
 * 功能：
 * - 快速搜索（Cmd+K）
 * - 批量选择操作
 * - 列显示/隐藏切换
 * - 导出按钮
 * - 刷新按钮
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  X,
  ChevronDown,
} from 'lucide-react'

export interface DataTableToolbarProps {
  onSearch?: (query: string) => void
  onRefresh?: () => void
  onExport?: () => void
  onFilter?: () => void
  searchPlaceholder?: string
  isLoading?: boolean
  totalCount?: number
  selectedCount?: number
  className?: string
}

export function DataTableToolbar({
  onSearch,
  onRefresh,
  onExport,
  onFilter,
  searchPlaceholder = '搜索...',
  isLoading = false,
  totalCount,
  selectedCount,
  className,
}: DataTableToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // 防抖搜索
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onSearch?.(query)
        }, 300)
      }
    })(),
    [onSearch]
  )

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    debouncedSearch(query)
  }

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('')
    onSearch?.('')
  }

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: 聚焦搜索框
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('datatable-search-input')
        searchInput?.focus()
      }

      // ESC: 清除搜索
      if (e.key === 'Escape' && searchQuery) {
        handleClearSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  return (
    <div className={cn(
      'admin-toolbar',
      'border-b border-gray-200 dark:border-gray-700',
      'bg-white dark:bg-gray-800',
      className
    )}>
      <div className="flex items-center justify-between gap-4">
        {/* 左侧：搜索和筛选 */}
        <div className="flex items-center gap-2 flex-1">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="datatable-search-input"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className={cn(
                'w-full pl-8 pr-8 py-1.5',
                'text-admin-sm',
                'border border-gray-300 dark:border-gray-600',
                'rounded-md',
                'bg-white dark:bg-gray-700',
                'text-gray-900 dark:text-gray-100',
                'placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'transition-all duration-150'
              )}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 筛选按钮 */}
          {onFilter && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'px-3 py-1.5',
                'text-admin-sm font-medium',
                'border border-gray-300 dark:border-gray-600',
                'rounded-md',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'transition-colors duration-150',
                'flex items-center gap-1.5',
                showFilters && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>筛选</span>
              <ChevronDown className={cn(
                'w-3.5 h-3.5 transition-transform duration-150',
                showFilters && 'rotate-180'
              )} />
            </button>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 选中计数 */}
          {selectedCount !== undefined && selectedCount > 0 && (
            <span className="text-admin-sm text-gray-600 dark:text-gray-400">
              已选择 <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedCount}</span> 项
            </span>
          )}

          {/* 总数显示 */}
          {totalCount !== undefined && (
            <span className="text-admin-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              共 {totalCount.toLocaleString()} 项
            </span>
          )}

          {/* 刷新按钮 */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'p-1.5',
                'text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'rounded-md',
                'transition-colors duration-150',
                isLoading && 'animate-spin'
              )}
              title="刷新"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          )}

          {/* 导出按钮 */}
          {onExport && (
            <button
              onClick={onExport}
              className={cn(
                'px-3 py-1.5',
                'text-admin-sm font-medium',
                'border border-gray-300 dark:border-gray-600',
                'rounded-md',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'transition-colors duration-150',
                'flex items-center gap-1.5'
              )}
              title="导出"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出</span>
            </button>
          )}

          {/* 设置按钮（列显示等） */}
          <button
            className={cn(
              'p-1.5',
              'text-gray-500 dark:text-gray-400',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'rounded-md',
              'transition-colors duration-150'
            )}
            title="列设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 筛选面板（展开时显示） */}
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 这里可以添加具体的筛选控件 */}
            <span className="text-admin-xs text-gray-500 dark:text-gray-400">
              筛选选项待实现...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 表格分页组件
 */
export interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className,
}: DataTablePaginationProps) {
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  // 生成页码数组
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    range.push(1)

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i)
      }
    }

    range.push(totalPages)

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  return (
    <div className={cn(
      'admin-pagination',
      'bg-white dark:bg-gray-800',
      'border-t border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center justify-between">
        {/* 左侧：信息显示 */}
        <div className="text-admin-sm text-gray-600 dark:text-gray-400">
          显示 {startIndex} - {endIndex} 项，共 {totalCount.toLocaleString()} 项
        </div>

        {/* 右侧：分页控件 */}
        <div className="flex items-center gap-2">
          {/* 每页显示数量 */}
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={cn(
                'px-2 py-1',
                'text-admin-sm',
                'border border-gray-300 dark:border-gray-600',
                'rounded-md',
                'bg-white dark:bg-gray-700',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          )}

          {/* 分页按钮 */}
          <div className="flex items-center gap-1">
            {/* 上一页 */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                'px-2 py-1',
                'text-admin-sm',
                'border border-gray-300 dark:border-gray-600',
                'rounded-md',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-150'
              )}
            >
              上一页
            </button>

            {/* 页码 */}
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={cn(
                  'min-w-[2rem] px-2 py-1',
                  'text-admin-sm',
                  'border rounded-md',
                  'transition-colors duration-150',
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                  page === '...' && 'cursor-default border-transparent'
                )}
              >
                {page}
              </button>
            ))}

            {/* 下一页 */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                'px-2 py-1',
                'text-admin-sm',
                'border border-gray-300 dark:border-gray-600',
                'rounded-md',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-150'
              )}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
