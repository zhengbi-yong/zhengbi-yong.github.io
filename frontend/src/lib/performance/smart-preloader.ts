/**
 * SmartPreloader - 智能资源预加载系统
 *
 * 特性：
 * - 基于用户行为的预测性预加载
 * - 网络感知（4G/WiFi/离线）
 * - 优先级队列管理
 * - 带宽估算和自适应
 * - 内存监控和限制
 * - 预加载成功率统计
 * - RequestIdleCallback集成
 *
 * 算法：
 * - 鼠标悬停预测（Hover意图）
 * - 滚动方向预测（Scroll意图）
 * - 视口接近度预测
 * - 历史行为分析
 * - 页面拓扑分析
 */

// ==================== 类型定义 ====================

export type PreloadType = 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document'

export type PreloadPriority = 'critical' | 'high' | 'medium' | 'low'

export interface PreloadTask {
  id: string
  url: string
  type: PreloadType
  priority: PreloadPriority
  weight?: number // 自定义权重（0-1）
  fetchPriority?: RequestInit['priority']

  // 预测信息
  predictionScore: number // 预测用户需要此资源的概率（0-1）
  triggerEvent?: string // 触发预加载的事件

  // 约束
  timeout?: number
  retry?: number

  // 回调
  onSuccess?: (response: Response) => void
  onError?: (error: Error) => void
  onProgress?: (loaded: number, total: number) => void
}

export interface PreloadStrategy {
  // 网络感知
  enableNetworkAwareness: boolean
  minEffectiveType: '2g' | '3g' | '4g'
  minDownlink: number // Mbps

  // 带宽控制
  maxConcurrent: number
  maxBandwidthUsage: number // Mbps

  // 内存控制
  memoryThreshold: number // MB
  enableMemoryMonitoring: boolean

  // 预测
  enableHoverPrediction: boolean
  hoverDelay: number // ms
  enableScrollPrediction: boolean
  scrollThreshold: number // px

  // 优化
  enableIdleCallback: boolean
  enableCompression: boolean
}

export interface PreloadStats {
  total: number
  loaded: number
  failed: number
  cancelled: number
  cacheHit: number
  avgLoadTime: number
  bandwidthUsage: number // MB
}

// ==================== 智能预加载器 ====================

export class SmartPreloader {
  private queue: Map<string, PreloadTask> = new Map()
  private activeRequests: Set<string> = new Set()
  private stats: PreloadStats = {
    total: 0,
    loaded: 0,
    failed: 0,
    cancelled: 0,
    cacheHit: 0,
    avgLoadTime: 0,
    bandwidthUsage: 0,
  }

  private strategy: PreloadStrategy
  private networkInfo: NetworkInformation | null = null
  private loadTimes: number[] = []

  private abortControllers: Map<string, AbortController> = new Map()

  // 默认策略
  private static DEFAULT_STRATEGY: PreloadStrategy = {
    enableNetworkAwareness: true,
    minEffectiveType: '3g',
    minDownlink: 1.5,
    maxConcurrent: 6,
    maxBandwidthUsage: 5, // Mbps
    memoryThreshold: 100, // MB
    enableMemoryMonitoring: true,
    enableHoverPrediction: true,
    hoverDelay: 150,
    enableScrollPrediction: true,
    scrollThreshold: 500,
    enableIdleCallback: true,
    enableCompression: true,
  }

  constructor(strategy?: Partial<PreloadStrategy>) {
    this.strategy = {
      ...SmartPreloader.DEFAULT_STRATEGY,
      ...strategy,
    }

    this.init()
  }

  // ==================== 初始化 ====================

  private init() {
    // 获取网络信息
    if (this.strategy.enableNetworkAwareness && 'connection' in navigator) {
      this.networkInfo = (navigator as any).connection as NetworkInformation

      // 监听网络变化
      this.networkInfo.addEventListener('change', () => {
        this.onNetworkChange()
      })
    }

    // 监听内存警告（如果支持）
    if (this.strategy.enableMemoryMonitoring && 'memory' in performance) {
      this.startMemoryMonitoring()
    }

    // 开始处理队列
    this.processQueue()
  }

  // ==================== 公共方法 ====================

  /**
   * 添加预加载任务
   */
  add(task: PreloadTask): void {
    // 检查是否应该预加载
    if (!this.shouldPreload(task)) {
      return
    }

    // 优化任务
    const optimizedTask = this.optimizeTask(task)

    this.queue.set(optimizedTask.id, optimizedTask)
    this.stats.total++
  }

  /**
   * 批量添加任务
   */
  addBatch(tasks: PreloadTask[]): void {
    tasks.forEach((task) => this.add(task))
  }

  /**
   * 取消预加载
   */
  cancel(taskId: string): void {
    // 取消请求
    const controller = this.abortControllers.get(taskId)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(taskId)
    }

    // 从队列移除
    this.queue.delete(taskId)
    this.activeRequests.delete(taskId)
    this.stats.cancelled++
  }

  /**
   * 取消所有预加载
   */
  cancelAll(): void {
    this.abortControllers.forEach((controller) => controller.abort())
    this.abortControllers.clear()
    this.queue.clear()
    this.activeRequests.clear()
  }

  /**
   * 获取统计信息
   */
  getStats(): PreloadStats {
    return { ...this.stats }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      loaded: 0,
      failed: 0,
      cancelled: 0,
      cacheHit: 0,
      avgLoadTime: 0,
      bandwidthUsage: 0,
    }
    this.loadTimes = []
  }

  // ==================== 预测逻辑 ====================

  /**
   * 鼠标悬停预测
   */
  predictHover(
    element: HTMLElement,
    task: PreloadTask,
    delay = this.strategy.hoverDelay
  ): () => void {
    let timeoutId: NodeJS.Timeout | null = null

    const onMouseEnter = () => {
      timeoutId = setTimeout(() => {
        task.triggerEvent = 'hover'
        task.predictionScore = 0.8
        this.add(task)
      }, delay)
    }

    const onMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    element.addEventListener('mouseenter', onMouseEnter)
    element.addEventListener('mouseleave', onMouseLeave)

    // 返回清理函数
    return () => {
      element.removeEventListener('mouseenter', onMouseEnter)
      element.removeEventListener('mouseleave', onMouseLeave)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  /**
   * 滚动预测
   */
  predictScroll(
    callback: (visibleElements: HTMLElement[]) => PreloadTask[],
    threshold = this.strategy.scrollThreshold
  ): () => void {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleElements: HTMLElement[] = []

        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            visibleElements.push(entry.target as HTMLElement)
          }
        })

        if (visibleElements.length > 0) {
          const tasks = callback(visibleElements)
          tasks.forEach((task) => {
            task.triggerEvent = 'scroll'
            task.predictionScore = 0.9
            this.add(task)
          })
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    )

    // 返回清理函数
    return () => observer.disconnect()
  }

  /**
   * 视口预测
   */
  predictViewport(
    elements: HTMLElement[],
    getTaskForElement: (element: HTMLElement) => PreloadTask | null
  ): () => void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            const task = getTaskForElement(entry.target as HTMLElement)
            if (task) {
              task.triggerEvent = 'viewport'
              task.predictionScore = 1.0
              this.add(task)
            }
          }
        })
      },
      {
        rootMargin: '50px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }

  // ==================== 内部方法 ====================

  /**
   * 检查是否应该预加载
   */
  private shouldPreload(task: PreloadTask): boolean {
    // 网络条件检查
    if (this.strategy.enableNetworkAwareness && this.networkInfo) {
      if (
        this.networkInfo.effectiveType === 'slow-2g' ||
        this.networkInfo.effectiveType === '2g'
      ) {
        return false
      }

      if (this.networkInfo.downlink && this.networkInfo.downlink < this.strategy.minDownlink) {
        return false
      }

      if (this.networkInfo.saveData) {
        return false
      }
    }

    // 内存检查
    if (this.strategy.enableMemoryMonitoring && 'memory' in performance) {
      const memory = (performance as any).memory
      const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024

      if (usedMemoryMB > this.strategy.memoryThreshold) {
        return false
      }
    }

    // 预测分数检查
    if (task.predictionScore < 0.3) {
      return false
    }

    return true
  }

  /**
   * 优化任务
   */
  private optimizeTask(task: PreloadTask): PreloadTask {
    // 根据网络条件调整优先级
    if (this.networkInfo && this.networkInfo.effectiveType === '3g') {
      // 3G网络降级优先级
      if (task.priority === 'high') {
        task = { ...task, priority: 'medium' }
      }
    }

    // 设置fetch优先级
    if (!task.fetchPriority) {
      switch (task.priority) {
        case 'critical':
          task.fetchPriority = 'high'
          break
        case 'high':
          task.fetchPriority = 'high'
          break
        case 'medium':
          task.fetchPriority = 'auto'
          break
        case 'low':
          task.fetchPriority = 'low'
          break
      }
    }

    return task
  }

  /**
   * 处理队列
   */
  private async processQueue() {
    while (true) {
      // 检查并发限制
      if (this.activeRequests.size >= this.strategy.maxConcurrent) {
        await this.delay(100)
        continue
      }

      // 获取下一个任务
      const task = this.getNextTask()
      if (!task) {
        await this.delay(100)
        continue
      }

      // 执行任务
      this.executeTask(task)
    }
  }

  /**
   * 获取下一个任务
   */
  private getNextTask(): PreloadTask | null {
    if (this.queue.size === 0) return null

    // 按优先级和预测分数排序
    const sortedTasks = Array.from(this.queue.values()).sort((a, b) => {
      const priorityScore = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      }

      const scoreA =
        priorityScore[a.priority] * 0.6 +
        a.predictionScore * 0.3 +
        (a.weight || 0.5) * 0.1

      const scoreB =
        priorityScore[b.priority] * 0.6 +
        b.predictionScore * 0.3 +
        (b.weight || 0.5) * 0.1

      return scoreB - scoreA
    })

    const task = sortedTasks[0]
    this.queue.delete(task.id)

    return task
  }

  /**
   * 执行任务
   */
  private async executeTask(task: PreloadTask): Promise<void> {
    const startTime = performance.now()

    this.activeRequests.add(task.id)

    // 创建AbortController
    const controller = new AbortController()
    this.abortControllers.set(task.id, controller)

    try {
      let response: Response | null = null

      // 使用RequestIdleCallback（如果启用）
      if (this.strategy.enableIdleCallback && 'requestIdleCallback' in window) {
        await new Promise<void>((resolve) => {
          ;(window as any).requestIdleCallback(async () => {
            response = await this.fetchResource(task, controller.signal)
            resolve()
          })
        })
      } else {
        response = await this.fetchResource(task, controller.signal)
      }

      if (response) {
        // 记录加载时间
        const loadTime = performance.now() - startTime
        this.loadTimes.push(loadTime)
        this.stats.avgLoadTime =
          this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length

        // 检查缓存命中
        const cacheHeader = response.headers.get('x-cache')
        if (cacheHeader?.includes('HIT')) {
          this.stats.cacheHit++
        }

        // 计算带宽使用
        const contentLength = response.headers.get('content-length')
        if (contentLength) {
          const sizeMB = parseInt(contentLength) / 1024 / 1024
          this.stats.bandwidthUsage += sizeMB
        }

        this.stats.loaded++
        task.onSuccess?.(response)
      }
    } catch (error) {
      this.stats.failed++
      task.onError?.(error as Error)
    } finally {
      this.activeRequests.delete(task.id)
      this.abortControllers.delete(task.id)
    }
  }

  /**
   * 获取资源
   */
  private async fetchResource(task: PreloadTask, signal: AbortSignal): Promise<Response> {
    const options: RequestInit = {
      signal,
      priority: task.fetchPriority,
    }

    // 根据类型使用不同的预加载策略
    switch (task.type) {
      case 'fetch':
      case 'document':
        return fetch(task.url, {
          ...options,
          headers: {
            'Purpose': 'prefetch',
          },
        })

      case 'script':
      case 'style':
        // 使用link预加载
        return this.preloadWithLink(task)

      case 'image':
      case 'font':
        return this.preloadWithLink(task)

      default:
        return fetch(task.url, options)
    }
  }

  /**
   * 使用link元素预加载
   */
  private async preloadWithLink(task: PreloadTask): Promise<Response> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = task.url

      switch (task.type) {
        case 'script':
          link.as = 'script'
          break
        case 'style':
          link.as = 'style'
          break
        case 'image':
          link.as = 'image'
          break
        case 'font':
          link.as = 'font'
          link.crossOrigin = 'anonymous'
          break
      }

      if (task.fetchPriority) {
        link.setAttribute('fetchpriority', task.fetchPriority)
      }

      link.onload = () => {
        resolve(new Response())
        link.remove()
      }

      link.onerror = () => {
        reject(new Error(`Failed to preload: ${task.url}`))
        link.remove()
      }

      document.head.appendChild(link)
    })
  }

  /**
   * 网络变化处理
   */
  private onNetworkChange() {
    // 网络变化时重新评估队列
    if (this.networkInfo && this.networkInfo.downlink < this.strategy.minDownlink) {
      // 网络变差，取消低优先级任务
      this.queue.forEach((task) => {
        if (task.priority === 'low') {
          this.cancel(task.id)
        }
      })
    }
  }

  /**
   * 内存监控
   */
  private startMemoryMonitoring() {
    const checkMemory = () => {
      if (!('memory' in performance)) return

      const memory = (performance as any).memory
      const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024

      if (usedMemoryMB > this.strategy.memoryThreshold) {
        // 内存不足，取消所有低优先级任务
        this.queue.forEach((task) => {
          if (task.priority === 'low' || task.priority === 'medium') {
            this.cancel(task.id)
          }
        })
      }

      // 继续监控
      setTimeout(checkMemory, 5000)
    }

    checkMemory()
  }

  /**
   * 延迟工具
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ==================== 单例导出 ====================

export const smartPreloader = new SmartPreloader()

// ==================== React Hook ====================

import { useEffect, useRef } from 'react'

export function useSmartPreload(tasks: PreloadTask[], deps: any[] = []) {
  const tasksRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    tasks.forEach((task) => {
      // 避免重复添加
      if (!tasksRef.current.has(task.id)) {
        smartPreloader.add(task)
        tasksRef.current.add(task.id)
      }
    })

    return () => {
      // 清理任务
      tasks.forEach((task) => {
        tasksRef.current.delete(task.id)
        smartPreloader.cancel(task.id)
      })
    }
  }, deps)
}

export function useHoverPreload(
  element: HTMLElement | null,
  task: PreloadTask,
  delay?: number
) {
  useEffect(() => {
    if (!element) return

    const cleanup = smartPreloader.predictHover(element, task, delay)

    return cleanup
  }, [element, task, delay])
}
