/**
 * PrefetchManager - 预取队列管理器
 * 管理页面预取任务，限制并发数量，优化预取策略
 */

'use client'

import { logger } from './logger'

interface PrefetchTask {
  url: string
  priority: 'high' | 'medium' | 'low'
  timestamp: number
}

class PrefetchManager {
  private queue: PrefetchTask[] = []
  private activePrefetches = new Set<string>()
  private maxConcurrent = 3 // 最大并发预取数量
  private prefetchedUrls = new Set<string>()

  /**
   * 添加预取任务
   */
  prefetch(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    // 如果已经预取过，跳过
    if (this.prefetchedUrls.has(url)) {
      return
    }

    // 如果正在预取，跳过
    if (this.activePrefetches.has(url)) {
      return
    }

    // 添加到队列
    const task: PrefetchTask = {
      url,
      priority,
      timestamp: Date.now(),
    }

    // 根据优先级插入队列
    if (priority === 'high') {
      this.queue.unshift(task)
    } else {
      this.queue.push(task)
    }

    // 处理队列
    this.processQueue()
  }

  /**
   * 取消预取任务
   */
  cancelPrefetch(url: string): void {
    this.queue = this.queue.filter((task) => task.url !== url)
    this.activePrefetches.delete(url)
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.queue = []
    this.activePrefetches.clear()
  }

  /**
   * 处理预取队列
   */
  private processQueue(): void {
    // 如果已达到最大并发数，等待
    if (this.activePrefetches.size >= this.maxConcurrent) {
      return
    }

    // 如果没有待处理任务，返回
    if (this.queue.length === 0) {
      return
    }

    // 获取下一个任务
    const task = this.queue.shift()
    if (!task) {
      return
    }

    // 执行预取
    this.executePrefetch(task)
  }

  /**
   * 执行预取
   */
  private executePrefetch(task: PrefetchTask): void {
    const { url } = task

    // 标记为正在预取
    this.activePrefetches.add(url)

    // 使用 link 预取（Next.js 会自动处理）
    if (typeof window !== 'undefined') {
      try {
        // 创建 link 元素进行预取
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = url
        link.as = 'document'
        document.head.appendChild(link)

        // 标记为已预取
        this.prefetchedUrls.add(url)

        // 延迟移除 link 元素（保持一段时间以便浏览器处理）
        setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link)
          }
        }, 1000)
      } catch (error) {
        logger.debug('[PrefetchManager] Prefetch failed:', url, error)
      } finally {
        // 从活动列表中移除
        this.activePrefetches.delete(url)
        // 继续处理队列
        this.processQueue()
      }
    }
  }

  /**
   * 检查 URL 是否已预取
   */
  hasPrefetched(url: string): boolean {
    return this.prefetchedUrls.has(url)
  }

  /**
   * 获取队列状态
   */
  getStatus(): {
    queueLength: number
    activeCount: number
    prefetchedCount: number
  } {
    return {
      queueLength: this.queue.length,
      activeCount: this.activePrefetches.size,
      prefetchedCount: this.prefetchedUrls.size,
    }
  }
}

// 单例模式
const prefetchManager = new PrefetchManager()

export default prefetchManager
