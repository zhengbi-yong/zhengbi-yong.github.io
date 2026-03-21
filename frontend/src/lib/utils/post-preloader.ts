/**
 * 文章预加载管理器
 * 统一管理文章预加载任务，智能调度，实现瞬间打开
 */

'use client'

import blogDB from '@/lib/db/blog-db'
import type { Blog } from 'contentlayer/generated'
import { logger } from './logger'

// Re-export Blog type for consumers
export type { Blog }

type Priority = 'high' | 'medium' | 'low'

interface PreloadTask {
  slug: string
  priority: Priority
  timestamp: number
}

class PostPreloader {
  private queue: PreloadTask[] = []
  private activePreloads = new Set<string>()
  private preloadedSlugs = new Set<string>()
  private maxConcurrent = 5 // 最大并发预加载数量
  private isProcessing = false

  /**
   * 添加预加载任务
   */
  preloadPost(slug: string, priority: Priority = 'medium'): void {
    // 如果已经预加载过，跳过
    if (this.preloadedSlugs.has(slug)) {
      return
    }

    // 如果正在预加载，跳过
    if (this.activePreloads.has(slug)) {
      return
    }

    // 添加到队列
    const task: PreloadTask = {
      slug,
      priority,
      timestamp: Date.now(),
    }

    // 根据优先级插入队列
    if (priority === 'high') {
      this.queue.unshift(task)
    } else {
      this.queue.push(task)
    }

    // 如果是高优先级，立即处理
    if (priority === 'high') {
      this.processQueue()
    }
  }

  /**
   * 批量预加载文章
   */
  preloadPosts(slugs: string[], priority: Priority = 'low'): void {
    slugs.forEach((slug) => {
      this.preloadPost(slug, priority)
    })
  }

  /**
   * 取消预加载任务
   */
  cancelPreload(slug: string): void {
    this.queue = this.queue.filter((task) => task.slug !== slug)
    this.activePreloads.delete(slug)
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.queue = []
    this.activePreloads.clear()
  }

  /**
   * 处理预加载队列（公共方法，允许外部触发）
   */
  async processQueue(): Promise<void> {
    // 如果正在处理，跳过
    if (this.isProcessing) {
      return
    }

    // 如果已达到最大并发数，等待
    if (this.activePreloads.size >= this.maxConcurrent) {
      return
    }

    // 如果没有待处理任务，返回
    if (this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    // 处理队列中的任务
    while (this.queue.length > 0 && this.activePreloads.size < this.maxConcurrent) {
      const task = this.queue.shift()
      if (!task) {
        break
      }

      // 执行预加载
      this.executePreload(task)
    }

    this.isProcessing = false
  }

  /**
   * 执行预加载
   */
  private async executePreload(task: PreloadTask): Promise<void> {
    const { slug } = task

    // 标记为正在预加载
    this.activePreloads.add(slug)

    try {
      // 检查 IndexedDB 缓存是否已存在
      const cached = await blogDB.getPostFull(slug)
      if (cached) {
        // 缓存已存在，标记为已预加载
        this.preloadedSlugs.add(slug)
        this.activePreloads.delete(slug)
        this.processQueue() // 继续处理队列
        return
      }

      // 预加载文章页面 URL（让 Service Worker 缓存 HTML）
      // 使用 link prefetch 或 fetch，Service Worker 会自动缓存
      const url = `/blog/${slug}`

      // 创建 link 元素进行预取
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      link.as = 'document'
      document.head.appendChild(link)

      // 同时尝试从 IndexedDB 检查（可能已被 CachedPostContent 缓存）
      // 延迟检查，给 CachedPostContent 时间缓存
      setTimeout(async () => {
        const cachedPost = await blogDB.getPostFull(slug)
        if (cachedPost) {
          this.preloadedSlugs.add(slug)
        }
      }, 500)

      // 标记为已预加载（HTML 已预取）
      this.preloadedSlugs.add(slug)
      logger.log(`[PostPreloader] Preloaded: ${slug}`)

      // 延迟移除 link 元素
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      }, 1000)
    } catch (error) {
      logger.debug(`[PostPreloader] Failed to preload post: ${slug}`, error)
    } finally {
      // 从活动列表中移除
      this.activePreloads.delete(slug)
      // 继续处理队列
      this.processQueue()
    }
  }

  /**
   * 使用 requestIdleCallback 批量处理队列
   */
  processQueueIdle(): void {
    if (typeof window === 'undefined') {
      return
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          this.processQueue()
        },
        { timeout: 5000 }
      )
    } else {
      setTimeout(() => {
        this.processQueue()
      }, 100)
    }
  }

  /**
   * 检查文章是否已预加载
   */
  hasPreloaded(slug: string): boolean {
    return this.preloadedSlugs.has(slug)
  }

  /**
   * 获取队列状态
   */
  getStatus(): {
    queueLength: number
    activeCount: number
    preloadedCount: number
  } {
    return {
      queueLength: this.queue.length,
      activeCount: this.activePreloads.size,
      preloadedCount: this.preloadedSlugs.size,
    }
  }
}

// 单例模式
const postPreloader = new PostPreloader()

export default postPreloader
