/**
 * 布局算法工具
 *
 * 用于智能计算内容项在瀑布流布局中的尺寸和位置
 */

import { ContentItem, CardSize } from '@/components/magazine/MasonryGrid'

/**
 * 内容重要性评分
 */
export interface ContentScore {
  item: ContentItem
  score: number
}

/**
 * 计算内容项的重要性分数
 *
 * 因素：
 * - 是否为特色内容 (+3)
 * - 标签数量 (+0.5 per tag)
 * - 摘要长度 (+0.01 per character)
 * - 发布时间 (+2 if within 7 days)
 */
export function calculateContentScore(item: ContentItem): number {
  let score = 0

  // 特色内容
  if (item.featured) {
    score += 3
  }

  // 标签数量（内容丰富度）
  if (item.tags && item.tags.length > 0) {
    score += item.tags.length * 0.5
  }

  // 摘要长度（内容完整性）
  if (item.summary) {
    score += Math.min(item.summary.length * 0.01, 1)
  }

  // 发布时间（新鲜度）
  if (item.date) {
    const daysSince = Math.floor(
      (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince <= 7) {
      score += 2
    } else if (daysSince <= 30) {
      score += 1
    }
  }

  return score
}

/**
 * 基于分数分配卡片尺寸
 *
 * 分配策略：
 * - 分数 >= 4: large (20%)
 * - 分数 >= 3: tall (30%)
 * - 分数 >= 2: wide (20%)
 * - 分数 < 2: small (30%)
 */
export function assignCardSize(item: ContentItem): CardSize {
  const score = calculateContentScore(item)

  if (score >= 4) return 'large'
  if (score >= 3) return 'tall'
  if (score >= 2) return 'wide'
  return 'small'
}

/**
 * 批量分配卡片尺寸
 * 确保整体分布符合预期比例
 */
export function assignCardSizes(items: ContentItem[]): CardSize[] {
  // 计算所有项的分数
  const scored = items.map((item) => ({
    item,
    score: calculateContentScore(item),
  }))

  // 按分数排序
  scored.sort((a, b) => b.score - a.score)

  // 分配尺寸，确保符合预期比例
  const sizes: CardSize[] = []
  const total = items.length
  const targetDistribution = {
    large: Math.floor(total * 0.2), // 20%
    tall: Math.floor(total * 0.3), // 30%
    wide: Math.floor(total * 0.2), // 20%
    small: total - Math.floor(total * 0.2) - Math.floor(total * 0.3) - Math.floor(total * 0.2), // 30%
  }

  const distribution = { ...targetDistribution }

  for (const { score } of scored) {
    let size: CardSize

    if (score >= 4 && distribution.large > 0) {
      size = 'large'
      distribution.large--
    } else if (score >= 3 && distribution.tall > 0) {
      size = 'tall'
      distribution.tall--
    } else if (score >= 2 && distribution.wide > 0) {
      size = 'wide'
      distribution.wide--
    } else {
      size = 'small'
      distribution.small--
    }

    sizes.push(size)
  }

  return sizes
}

/**
 * 优化瀑布流布局
 * 尽量平衡每列的高度
 */
export interface MasonryLayout {
  items: ContentItem[]
  sizes: CardSize[]
  columns: number
}

/**
 * 计算最优瀑布流布局
 */
export function optimizeMasonryLayout(
  items: ContentItem[],
  columnCount: number
): MasonryLayout {
  // 分配初始尺寸
  const sizes = assignCardSizes(items)

  // 计算每个卡片的预估高度
  const cardHeights = sizes.map((size) => {
    switch (size) {
      case 'large':
        return 400 // 2x2
      case 'tall':
        return 400 // 1x2
      case 'wide':
        return 200 // 2x1
      case 'small':
        return 200 // 1x1
    }
  })

  // 使用贪心算法平衡列高度
  const columnHeights = new Array(columnCount).fill(0)
  const layout: ContentItem[] = []
  const layoutSizes: CardSize[] = []

  // 创建项目-高度-尺寸的配对数组
  const pairs = items.map((item, index) => ({
    item,
    height: cardHeights[index],
    size: sizes[index],
  }))

  // 按高度降序排序（大的先放）
  pairs.sort((a, b) => b.height - a.height)

  for (const { item, height, size } of pairs) {
    // 找到当前最短的列
    const minColumn = columnHeights.indexOf(Math.min(...columnHeights))

    // 放入该列
    layout.push(item)
    layoutSizes.push(size)
    columnHeights[minColumn] += height
  }

  return {
    items: layout,
    sizes: layoutSizes,
    columns: columnCount,
  }
}
