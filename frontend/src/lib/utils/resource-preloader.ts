'use client'

/**
 * Resource Preloader - 资源预加载工具
 *
 * 功能：
 * - 智能资源预加载
 * - 优先级队列管理
 * - 带宽感知预加载
 * - 预连接到重要域名
 * - DNS预解析
 */

interface PreloadResource {
  url: string
  type: 'image' | 'script' | 'style' | 'font' | 'document'
  priority?: 'high' | 'low' | 'auto'
  as?: string
  crossorigin?: 'anonymous' | 'use-credentials'
}

interface PreloadQueue {
  high: PreloadResource[]
  low: PreloadResource[]
}

class ResourcePreloader {
  private queue: PreloadQueue = {
    high: [],
    low: [],
  }
  private loaded = new Set<string>()
  private loading = new Set<string>()
  private isIdle = false

  constructor() {
    if (typeof window !== 'undefined') {
      // Monitor for idle time to preload low-priority resources
      this.setupIdleCallback()
    }
  }

  /**
   * Setup idle callback for background preloading
   */
  private setupIdleCallback() {
    if ('requestIdleCallback' in window) {
      const checkIdle = () => {
        this.isIdle = true
        this.processQueue('low')
        ;(window as any).requestIdleCallback(checkIdle)
      }
      checkIdle()
    }
  }

  /**
   * Add resource to preload queue
   */
  add(resource: PreloadResource) {
    if (this.loaded.has(resource.url) || this.loading.has(resource.url)) {
      return
    }

    const priority = resource.priority || 'low'
    this.queue[priority].push(resource)

    if (priority === 'high') {
      this.processQueue('high')
    }
  }

  /**
   * Add multiple resources
   */
  addMultiple(resources: PreloadResource[]) {
    resources.forEach((resource) => this.add(resource))
  }

  /**
   * Process preload queue
   */
  private async processQueue(priority: 'high' | 'low') {
    const queue = this.queue[priority]

    while (queue.length > 0) {
      const resource = queue.shift()
      if (!resource) continue

      // Check connection type
      if (!this.shouldPreload(priority)) {
        // Re-queue for later
        queue.push(resource)
        break
      }

      await this.preload(resource)
    }
  }

  /**
   * Check if we should preload based on network conditions
   */
  private shouldPreload(priority: 'high' | 'low'): boolean {
    if (typeof navigator === 'undefined' || !navigator.connection) return true

    const connection = (navigator as any).connection
    const isSlowConnection = connection.saveData || connection.effectiveType.includes('2g')

    // Only preload high priority on slow connections
    if (isSlowConnection && priority === 'low') return false

    return true
  }

  /**
   * Preload a single resource
   */
  private async preload(resource: PreloadResource): Promise<void> {
    if (this.loaded.has(resource.url) || this.loading.has(resource.url)) {
      return
    }

    this.loading.add(resource.url)

    try {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.url

      // Set 'as' attribute based on type
      const as = resource.as || this.getAsAttribute(resource.type)
      link.as = as

      // Set crossorigin if needed
      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin
      }

      // Append to head
      document.head.appendChild(link)

      // Wait for load
      await new Promise((resolve, reject) => {
        link.onload = resolve
        link.onerror = reject
        setTimeout(resolve, 5000) // Timeout after 5 seconds
      })

      this.loaded.add(resource.url)
    } catch (error) {
      console.warn(`Failed to preload ${resource.url}:`, error)
    } finally {
      this.loading.delete(resource.url)
    }
  }

  /**
   * Get the 'as' attribute for a resource type
   */
  private getAsAttribute(type: PreloadResource['type']): string {
    const asMap = {
      image: 'image',
      script: 'script',
      style: 'style',
      font: 'font',
      document: 'document',
    }
    return asMap[type] || 'fetch'
  }

  /**
   * Preconnect to a domain
   */
  preconnect(href: string, crossorigin?: boolean) {
    if (typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = href

    if (crossorigin) {
      link.crossOrigin = 'anonymous'
    }

    document.head.appendChild(link)
  }

  /**
   * DNS prefetch for a domain
   */
  dnsPrefetch(href: string) {
    if (typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = href

    document.head.appendChild(link)
  }

  /**
   * Preload images in viewport
   */
  preloadImagesInViewport(selectors = 'img') {
    if (typeof window === 'undefined') return

    const images = document.querySelectorAll(selectors)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              this.add({
                url: img.dataset.src,
                type: 'image',
                priority: 'high',
              })
            }
            observer.unobserve(img)
          }
        })
      },
      { rootMargin: '50px' }
    )

    images.forEach((img) => observer.observe(img))
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue.high = []
    this.queue.low = []
  }

  /**
   * Get loaded resources count
   */
  getStats() {
    return {
      loaded: this.loaded.size,
      loading: this.loading.size,
      queued: this.queue.high.length + this.queue.low.length,
    }
  }
}

// Singleton instance
let preloaderInstance: ResourcePreloader | null = null

export function getPreloader(): ResourcePreloader {
  if (!preloaderInstance && typeof window !== 'undefined') {
    preloaderInstance = new ResourcePreloader()
  }
  return preloaderInstance!
}

/**
 * Hook for preloading resources
 */
export function useResourcePreloader() {
  const preload = (resources: PreloadResource[]) => {
    const preloader = getPreloader()
    preloader.addMultiple(resources)
  }

  const preloadImage = (url: string, priority: 'high' | 'low' = 'low') => {
    const preloader = getPreloader()
    preloader.add({ url, type: 'image', priority })
  }

  const preconnect = (href: string, crossorigin?: boolean) => {
    const preloader = getPreloader()
    preloader.preconnect(href, crossorigin)
  }

  return { preload, preloadImage, preconnect }
}

export default ResourcePreloader
