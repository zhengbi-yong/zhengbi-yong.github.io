/**
 * 图片预加载管理器
 * 批量预加载文章中的图片，优化加载体验
 */

'use client'

import { preloadImage } from '@/lib/utils/image-optimization'
import type { Blog } from 'contentlayer/generated'
import { logger } from './logger'

type Priority = 'high' | 'medium' | 'low'

interface ImagePreloadTask {
  url: string
  priority: Priority
  timestamp: number
}

class ImagePreloader {
  private queue: ImagePreloadTask[] = []
  private activePreloads = new Set<string>()
  private preloadedUrls = new Set<string>()
  private maxConcurrent = 3 // 最大并发预加载数量
  private isProcessing = false

  /**
   * 添加图片预加载任务
   */
  preloadImage(url: string, priority: Priority = 'medium'): void {
    // 如果已经预加载过，跳过
    if (this.preloadedUrls.has(url)) {
      return
    }

    // 如果正在预加载，跳过
    if (this.activePreloads.has(url)) {
      return
    }

    // 添加到队列
    const task: ImagePreloadTask = {
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

    // 如果是高优先级，立即处理
    if (priority === 'high') {
      this.processQueue()
    }
  }

  /**
   * 批量预加载图片
   */
  preloadImages(urls: string[], priority: Priority = 'low'): void {
    urls.forEach((url) => {
      this.preloadImage(url, priority)
    })
  }

  /**
   * 从文章内容中提取图片 URL 并预加载
   */
  preloadPostImages(post: Blog, priority: Priority = 'medium'): void {
    const imageUrls: string[] = []

    // 从 images 字段提取
    if (post.images) {
      if (typeof post.images === 'string') {
        imageUrls.push(post.images)
      } else if (Array.isArray(post.images)) {
        imageUrls.push(...post.images)
      }
    }

    // 从 body.raw 中提取图片 URL（简单正则匹配）
    if (post.body?.raw) {
      const imageRegex = /!\[.*?\]\((.*?)\)/g
      let match
      while ((match = imageRegex.exec(post.body.raw)) !== null) {
        const url = match[1]
        if (url && !url.startsWith('http')) {
          // 相对路径，需要转换为绝对路径
          imageUrls.push(url)
        } else if (url && url.startsWith('http')) {
          imageUrls.push(url)
        }
      }
    }

    // 预加载所有图片
    if (imageUrls.length > 0) {
      this.preloadImages(imageUrls, priority)
    }
  }

  /**
   * 取消预加载任务
   */
  cancelPreload(url: string): void {
    this.queue = this.queue.filter((task) => task.url !== url)
    this.activePreloads.delete(url)
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.queue = []
    this.activePreloads.clear()
  }

  /**
   * 处理预加载队列
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
      await this.executePreload(task)
    }

    this.isProcessing = false
  }

  /**
   * 执行预加载
   */
  private async executePreload(task: ImagePreloadTask): Promise<void> {
    const { url } = task

    // 标记为正在预加载
    this.activePreloads.add(url)

    try {
      // 使用 image-optimization 中的 preloadImage 函数
      await preloadImage(url)
      // 标记为已预加载
      this.preloadedUrls.add(url)
      logger.log(`[ImagePreloader] Preloaded: ${url}`)
    } catch (error) {
      logger.debug(`[ImagePreloader] Failed to preload image: ${url}`, error)
    } finally {
      // 从活动列表中移除
      this.activePreloads.delete(url)
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
   * 检查图片是否已预加载
   */
  hasPreloaded(url: string): boolean {
    return this.preloadedUrls.has(url)
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
      preloadedCount: this.preloadedUrls.size,
    }
  }
}

// 单例模式
const imagePreloader = new ImagePreloader()

export default imagePreloader
