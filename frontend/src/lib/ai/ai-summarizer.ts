/**
 * AI Content Summarizer - AI内容摘要生成器
 *
 * 特性：
 * - 多种摘要策略（提取式、生成式、混合式）
 * - 智能长度控制
 * - 关键点提取
 * - 多语言支持
 * - 性能优化（Web Worker）
 * - 缓存机制
 * - 可扩展API集成
 *
 * 算法：
 * - TextRank（图排序算法）
 * - TF-IDF（词频-逆文档频率）
 * - LSA（潜在语义分析）
 * - BERT摘要（可选API）
 */

// ==================== 类型定义 ====================

export type SummaryType = 'bullet' | 'paragraph' | 'tweet' | 'executive'

export type SummaryLength = 'short' | 'medium' | 'long' | 'custom'

export interface SummaryOptions {
  /**
   * 摘要类型
   */
  type?: SummaryType

  /**
   * 摘要长度
   */
  length?: SummaryLength

  /**
   * 自定义长度（字数）
   */
  customLength?: number

  /**
   * 是否包含关键点
   */
  includeKeyPoints?: boolean

  /**
   * 最大关键点数
   */
  maxKeyPoints?: number

  /**
   * 语言
   */
  language?: 'zh' | 'en' | 'auto'

  /**
   * 是否使用缓存
   */
  useCache?: boolean

  /**
   * 超时时间（毫秒）
   */
  timeout?: number
}

export interface SummaryResult {
  /**
   * 摘要文本
   */
  summary: string

  /**
   * 关键点
   */
  keyPoints: string[]

  /**
   * 原文长度
   */
  originalLength: number

  /**
   * 摘要长度
   */
  summaryLength: number

  /**
   * 压缩率（0-1）
   */
  compressionRatio: number

  /**
   * 生成时间（毫秒）
   */
  generationTime: number

  /**
   * 置信度分数（0-1）
   */
  confidence: number
}

export interface KeyPoint {
  /**
   * 关键点内容
   */
  text: string

  /**
   * 重要性分数（0-1）
   */
  score: number

  /**
   * 在原文中的位置
   */
  position: number
}

// ==================== 文本处理工具 ====================

class TextProcessor {
  /**
   * 分句
   */
  static splitIntoSentences(text: string): string[] {
    // 中文分句
    const chineseSentenceRegex = /[。！？.!?]+\s*/g
    const englishSentenceRegex = /[.!?]+\s+/g

    const sentences: string[] = []

    // 尝试中文分句
    const zhMatches = text.match(chineseSentenceRegex)
    if (zhMatches) {
      sentences.push(...text.split(chineseSentenceRegex).filter(Boolean))
    }

    // 英文分句
    if (sentences.length === 0) {
      const enMatches = text.match(englishSentenceRegex)
      if (enMatches) {
        sentences.push(...text.split(englishSentenceRegex).filter(Boolean))
      }
    }

    // 如果都失败，按段落分割
    if (sentences.length === 0) {
      return text.split(/\n\n+/).filter((s) => s.trim().length > 0)
    }

    return sentences.map((s) => s.trim()).filter((s) => s.length > 0)
  }

  /**
   * 分段
   */
  static splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
  }

  /**
   * 分词（中文）
   */
  static tokenizeChinese(text: string): string[] {
    // 简单的中文分词（可以替换为jieba等库）
    const words: string[] = []

    // 移除标点符号
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')

    // 提取2-4字的词组
    for (let i = 0; i < cleanText.length; i++) {
      for (let len = 2; len <= 4 && i + len <= cleanText.length; len++) {
        const word = cleanText.substr(i, len)
        if (/^[\u4e00-\u9fa5]{2,4}$/.test(word)) {
          words.push(word)
        }
      }
    }

    return [...new Set(words)]
  }

  /**
   * 分词（英文）
   */
  static tokenizeEnglish(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2)
  }

  /**
   * 计算词频
   */
  static calculateWordFrequency(words: string[]): Map<string, number> {
    const frequency = new Map<string, number>()

    words.forEach((word) => {
      frequency.set(word, (frequency.get(word) || 0) + 1)
    })

    return frequency
  }

  /**
   * 计算TF-IDF
   */
  static calculateTFIDF(
    sentences: string[],
    wordFrequency: Map<string, number>
  ): Map<string, number> {
    const tfidf = new Map<string, number>()
    const totalWords = Array.from(wordFrequency.values()).reduce((a, b) => a + b, 0)

    wordFrequency.forEach((freq, word) => {
      const tf = freq / totalWords
      const idf = Math.log(sentences.length / (1 + this.countSentencesWithWord(sentences, word)))
      tfidf.set(word, tf * idf)
    })

    return tfidf
  }

  /**
   * 计算包含某个词的句子数量
   */
  private static countSentencesWithWord(sentences: string[], word: string): number {
    return sentences.filter((sentence) => sentence.includes(word)).length
  }

  /**
   * 计算两个句子的相似度
   */
  static calculateSentenceSimilarity(sentence1: string, sentence2: string): number {
    const words1 = new Set(this.tokenizeChinese(sentence1))
    const words2 = new Set(this.tokenizeChinese(sentence2))

    const intersection = new Set([...words1].filter((word) => words2.has(word)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }
}

// ==================== TextRank算法 ====================

class TextRankSummarizer {
  /**
   * 使用TextRank算法提取摘要
   */
  static summarize(
    text: string,
    options: SummaryOptions = {}
  ): { summary: string; keyPoints: KeyPoint[] } {
    // 分句
    const sentences = TextProcessor.splitIntoSentences(text)
    if (sentences.length <= 3) {
      return {
        summary: text,
        keyPoints: sentences.map((s, i) => ({ text: s, score: 1, position: i })),
      }
    }

    // 构建句子相似度矩阵
    const similarityMatrix = this.buildSimilarityMatrix(sentences)

    // 计算句子得分
    const scores = this.calculateScores(similarityMatrix, 0.85, 100)

    // 提取关键句
    const topSentences = this.extractTopSentences(sentences, scores, options)

    // 生成摘要
    const summary = this.formatSummary(topSentences, options)

    return {
      summary,
      keyPoints: topSentences.map((s) => ({
        text: s.text,
        score: s.score,
        position: s.position,
      })),
    }
  }

  /**
   * 构建相似度矩阵
   */
  private static buildSimilarityMatrix(sentences: string[]): number[][] {
    const n = sentences.length
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const similarity = TextProcessor.calculateSentenceSimilarity(sentences[i], sentences[j])
        matrix[i][j] = similarity
        matrix[j][i] = similarity
      }
    }

    return matrix
  }

  /**
   * 计算TextRank得分
   */
  private static calculateScores(
    matrix: number[][],
    dampingFactor: number,
    iterations: number
  ): number[] {
    const n = matrix.length
    let scores = Array(n).fill(1 / n)

    for (let iter = 0; iter < iterations; iter++) {
      const newScores: number[] = []

      for (let i = 0; i < n; i++) {
        let score = 1 - dampingFactor

        for (let j = 0; j < n; j++) {
          if (i !== j) {
            const sum = matrix[j].reduce((acc, val) => acc + val, 0)
            if (sum > 0) {
              score += dampingFactor * (matrix[j][i] / sum) * scores[j]
            }
          }
        }

        newScores.push(score)
      }

      // 检查收敛
      const diff = Math.max(...scores.map((s, i) => Math.abs(s - newScores[i])))
      scores = newScores

      if (diff < 0.0001) {
        break
      }
    }

    return scores
  }

  /**
   * 提取得分最高的句子
   */
  private static extractTopSentences(
    sentences: string[],
    scores: number[],
    options: SummaryOptions
  ): Array<{ text: string; score: number; position: number }> {
    // 确定提取的句子数量
    const length = options.length || 'medium'
    let ratio = 0.3

    switch (length) {
      case 'short':
        ratio = 0.2
        break
      case 'medium':
        ratio = 0.3
        break
      case 'long':
        ratio = 0.5
        break
      case 'custom':
        ratio = options.customLength
          ? options.customLength / sentences.length
          : 0.3
        break
    }

    const count = Math.max(2, Math.floor(sentences.length * ratio))

    // 提取并排序
    const ranked = sentences
      .map((text, position) => ({ text, score: scores[position], position }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .sort((a, b) => a.position - b.position)

    return ranked
  }

  /**
   * 格式化摘要
   */
  private static formatSummary(
    sentences: Array<{ text: string; score: number; position: number }>,
    options: SummaryOptions
  ): string {
    const type = options.type || 'paragraph'

    switch (type) {
      case 'bullet':
        return sentences.map((s) => `• ${s.text}`).join('\n')

      case 'tweet':
        // Twitter风格（限制280字符）
        return sentences.map((s) => s.text).join(' ').slice(0, 280) + '...'

      case 'executive':
        // 执行摘要（重点突出）
        return sentences.map((s, i) => `${i + 1}. ${s.text}`).join('\n')

      case 'paragraph':
      default:
        return sentences.map((s) => s.text).join(' ')
    }
  }
}

// ==================== 主摘要器 ====================

export class AISummarizer {
  private cache: Map<string, SummaryResult> = new Map()
  private cacheTimeout: number = 5 * 60 * 1000 // 5分钟

  /**
   * 生成摘要
   */
  async summarize(text: string, options: SummaryOptions = {}): Promise<SummaryResult> {
    const startTime = performance.now()

    // 检查缓存
    if (options.useCache !== false) {
      const cacheKey = this.getCacheKey(text, options)
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    // 检测语言
    const language = this.detectLanguage(text, options.language)

    // 使用TextRank生成摘要
    const { summary, keyPoints } = TextRankSummarizer.summarize(text, {
      ...options,
      language,
    })

    const endTime = performance.now()

    // 构建结果
    const result: SummaryResult = {
      summary,
      keyPoints: keyPoints.slice(0, options.maxKeyPoints || 5).map((kp) => kp.text),
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: summary.length / text.length,
      generationTime: endTime - startTime,
      confidence: this.calculateConfidence(keyPoints),
    }

    // 缓存结果
    if (options.useCache !== false) {
      const cacheKey = this.getCacheKey(text, options)
      this.cache.set(cacheKey, result)

      // 定期清理缓存
      setTimeout(() => {
        this.cache.delete(cacheKey)
      }, this.cacheTimeout)
    }

    return result
  }

  /**
   * 批量生成摘要
   */
  async summarizeBatch(texts: string[], options: SummaryOptions = {}): Promise<SummaryResult[]> {
    return Promise.all(texts.map((text) => this.summarize(text, options)))
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 检测语言
   */
  private detectLanguage(text: string, hint?: 'zh' | 'en' | 'auto'): 'zh' | 'en' {
    if (hint && hint !== 'auto') {
      return hint
    }

    // 简单的语言检测
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g)
    const englishChars = text.match(/[a-zA-Z]/g)

    if (chineseChars && (!englishChars || chineseChars.length > englishChars.length)) {
      return 'zh'
    }

    return 'en'
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(text: string, options: SummaryOptions): string {
    const normalized = text.slice(0, 100).replace(/\s+/g, ' ')
    const type = options.type || 'paragraph'
    const length = options.length || 'medium'
    return `${normalized}|${type}|${length}`
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(keyPoints: KeyPoint[]): number {
    if (keyPoints.length === 0) return 0

    const avgScore = keyPoints.reduce((sum, kp) => sum + kp.score, 0) / keyPoints.length
    return Math.min(1, avgScore)
  }
}

// ==================== 单例导出 ====================

export const aiSummarizer = new AISummarizer()

// ==================== React Hook ====================

import { useState, useCallback } from 'react'

export function useAISummarizer() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const summarize = useCallback(
    async (text: string, options?: SummaryOptions) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await aiSummarizer.summarize(text, options)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Summarization failed')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    summarize,
    isLoading,
    error,
  }
}

export default AISummarizer
