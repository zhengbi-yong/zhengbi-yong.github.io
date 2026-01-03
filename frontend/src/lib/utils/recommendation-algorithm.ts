/**
 * 推荐算法工具
 *
 * 基于用户阅读历史和内容相似度生成推荐
 */

import { ContentItem } from '@/components/magazine/MasonryGrid'

/**
 * 计算两个标签集合的相似度
 * 使用 Jaccard 相似系数
 */
function calculateSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 || tags2.length === 0) return 0

  const intersection = tags1.filter((tag) => tags2.includes(tag))
  const union = [...new Set([...tags1, ...tags2])]

  return intersection.length / union.length
}

/**
 * 计算内容项目的权重分数
 * 基于多个因素：
 * - 标签相似度
 * - 发布时间（越新越好）
 * - 是否为特色内容
 */
function calculateItemScore(
  item: ContentItem,
  readTags: string[],
  maxAge: number = 30 // 最大内容年龄（天）
): number {
  let score = 0

  // 1. 标签相似度权重 (50%)
  const tagSimilarity = calculateSimilarity(item.tags || [], readTags)
  score += tagSimilarity * 0.5

  // 2. 时间衰减权重 (30%)
  if (item.date) {
    const itemAge = Math.floor((Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24))
    const timeScore = Math.max(0, 1 - itemAge / maxAge)
    score += timeScore * 0.3
  }

  // 3. 特色内容加成 (20%)
  if (item.featured) {
    score += 0.2
  }

  return score
}

/**
 * 生成推荐列表
 *
 * @param readHistory - 用户阅读历史
 * @param allItems - 所有可推荐的内容项
 * @param limit - 返回的推荐数量（默认4个）
 * @returns 推荐的内容项列表
 */
export function generateRecommendations(
  readHistory: ContentItem[],
  allItems: ContentItem[],
  limit: number = 4
): ContentItem[] {
  // 1. 提取已读内容的标签
  const readTags = readHistory.flatMap((item) => item.tags || [])

  // 2. 过滤掉已读内容
  const unreadItems = allItems.filter(
    (item) => !readHistory.some((read) => read.id === item.id)
  )

  // 3. 如果没有标签历史，返回最新内容
  if (readTags.length === 0) {
    return unreadItems
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })
      .slice(0, limit)
  }

  // 4. 计算每个未读项的分数
  const scored = unreadItems.map((item) => ({
    item,
    score: calculateItemScore(item, readTags),
  }))

  // 5. 按分数排序并返回top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item)
}

/**
 * 基于单篇内容推荐相似内容
 *
 * @param currentItem - 当前查看的内容
 * @param allItems - 所有内容项
 * @param limit - 返回的推荐数量
 * @returns 相似的内容项列表
 */
export function getSimilarItems(
  currentItem: ContentItem,
  allItems: ContentItem[],
  limit: number = 3
): ContentItem[] {
  const currentTags = currentItem.tags || []

  // 计算相似度并排序
  const similar = allItems
    .filter((item) => item.id !== currentItem.id)
    .map((item) => ({
      item,
      similarity: calculateSimilarity(currentTags, item.tags || []),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .filter((s) => s.similarity > 0) // 只返回有相关标签的
    .slice(0, limit)
    .map((s) => s.item)

  return similar
}
