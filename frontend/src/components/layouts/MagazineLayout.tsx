'use client'

import { useState, useMemo } from 'react'
import HeroSection from '@/components/magazine/HeroSection'
import MasonryGrid, { ContentItem } from '@/components/magazine/MasonryGrid'
import FilterBar, { FilterState } from '@/components/magazine/FilterBar'
import RecommendedSection from '@/components/magazine/RecommendedSection'
import SectionContainer from '@/components/SectionContainer'
import { isFeatureEnabled } from '@/lib/feature-flags'

/**
 * MagazineLayout 组件属性
 */
interface MagazineLayoutProps {
  // 特色文章数据
  featuredArticle?: {
    title: string
    summary: string
    date: string
    readTime: string
    image: string
    slug: string
    tags: string[]
  }

  // 书籍数据
  latestBooks?: Array<{
    name: string
    description?: string
    image: string
    href?: string
  }>

  // 所有内容项（用于网格和推荐）
  allItems?: ContentItem[]

  // 用户阅读历史（用于推荐）
  readHistory?: ContentItem[]

  // 分类列表
  categories?: string[]
}

/**
 * MagazineLayout - 杂志风格布局（完整版）
 *
 * 整合所有杂志风格组件：
 * - Hero Section - 特色文章 + 书籍网格
 * - Filter Bar - 分类过滤和搜索
 * - Masonry Grid - 瀑布流布局
 * - Recommended Section - 智能推荐
 */
export default function MagazineLayout({
  featuredArticle,
  latestBooks = [],
  allItems = [],
  readHistory = [],
  categories = ['全部', '机器人', '控制', '感知'],
}: MagazineLayoutProps) {
  const [filter, setFilter] = useState<FilterState>({
    category: '全部',
    sortBy: 'latest',
    searchQuery: '',
  })

  // 过滤和排序内容
  const filteredItems = useMemo(() => {
    let items = [...allItems]

    // 分类过滤
    if (filter.category !== '全部') {
      items = items.filter((item) =>
        item.tags?.some((tag) => tag.includes(filter.category))
      )
    }

    // 搜索过滤
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary?.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // 排序
    items.sort((a, b) => {
      if (filter.sortBy === 'latest') {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      }
      if (filter.sortBy === 'popular') {
        // 假设有readCount字段，如果没有则使用日期
        const countA = a.readCount || 0
        const countB = b.readCount || 0
        return countB - countA
      }
      // relevant - 使用featured标记作为相关性指标
      if (filter.sortBy === 'relevant') {
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      }
      return 0
    })

    return items
  }, [allItems, filter])

  return (
    <SectionContainer variant="shell" className="surface-shell section-space-md">
      <div data-testid="magazine-layout">
      {/* Hero Section */}
      {featuredArticle && isFeatureEnabled('magazineLayout') && (
        <HeroSection
          featuredArticle={featuredArticle}
          latestBooks={latestBooks}
        />
      )}

      {/* Filter Bar */}
      {isFeatureEnabled('magazineLayout') && (
        <FilterBar
          data-testid="magazine-filter-bar"
          categories={categories}
          onFilterChange={setFilter}
        />
      )}

      {/* Masonry Grid */}
      <section className="section-space-sm" data-testid="magazine-masonry-section">
        <div className="container-content">
          {isFeatureEnabled('masonryGrid') ? (
            <MasonryGrid
              items={filteredItems}
              onItemClick={(item) => {
                // 处理项目点击
                console.log('Clicked item:', item)
              }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="surface-elevated rounded-[var(--radius-panel)] p-6"
                >
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
                      {item.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recommended Section */}
      {isFeatureEnabled('recommendations') && readHistory.length > 0 && (
        <RecommendedSection
          data-testid="magazine-recommended-section"
          readHistory={readHistory}
          allItems={allItems}
        />
      )}
      </div>
    </SectionContainer>
  )
}
