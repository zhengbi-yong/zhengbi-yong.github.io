// 统一的缓存管理器
import { logger } from '../utils/logger'

interface CacheOptions {
  ttl?: number // 生存时间（毫秒）
  maxSize?: number // 最大缓存条目数
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
}

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>>
  private maxSize: number
  private storage: 'memory' | 'localStorage' | 'sessionStorage'
  private storageKey: string

  constructor(
    storageKey: string,
    options: CacheOptions = {},
    private defaultTTL: number = 60 * 60 * 1000 // 默认 1 小时
  ) {
    this.cache = new Map()
    this.maxSize = options.maxSize || 100
    this.storage = options.storage || 'memory'
    this.storageKey = storageKey

    // 从持久化存储恢复缓存
    if (this.storage !== 'memory') {
      this.loadFromStorage()
    }
  }

  // 设置缓存
  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    }

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest()
    }

    this.cache.set(key, entry)

    // 持久化到存储
    if (this.storage !== 'memory') {
      this.saveToStorage()
    }
  }

  // 获取缓存
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    return entry.value
  }

  // 删除缓存
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted && this.storage !== 'memory') {
      this.saveToStorage()
    }
    return deleted
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
    if (this.storage !== 'memory') {
      this.removeFromStorage()
    }
  }

  // 检查是否存在且未过期
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return false
    }

    return true
  }

  // 获取所有键
  keys(): string[] {
    return Array.from(this.cache.keys()).filter((key) => this.has(key))
  }

  // 获取缓存大小
  size(): number {
    return this.keys().length
  }

  // 删除最旧的条目
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  // 从存储加载
  private loadFromStorage(): void {
    // 只在客户端环境中加载
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storage = (window as any)[this.storage] as Storage
      const data = storage.getItem(this.storageKey)

      if (data) {
        const parsed = JSON.parse(data)
        this.cache = new Map(Object.entries(parsed))
      }
    } catch (error) {
      logger.warn('Failed to load cache from storage:', error)
    }
  }

  // 保存到存储
  private saveToStorage(): void {
    // 只在客户端环境中保存
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storage = (window as any)[this.storage] as Storage
      const data = JSON.stringify(Object.fromEntries(this.cache))
      storage.setItem(this.storageKey, data)
    } catch (error) {
      logger.warn('Failed to save cache to storage:', error)
    }
  }

  // 从存储删除
  private removeFromStorage(): void {
    // 只在客户端环境中删除
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storage = (window as any)[this.storage] as Storage
      storage.removeItem(this.storageKey)
    } catch (error) {
      logger.warn('Failed to remove cache from storage:', error)
    }
  }

  // 清理过期条目
  cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach((key) => this.delete(key))
  }

  // 获取缓存统计
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    memoryUsage: number
  } {
    return {
      size: this.size(),
      maxSize: this.maxSize,
      hitRate: 0, // 需要额外的统计
      memoryUsage: JSON.stringify(Object.fromEntries(this.cache)).length,
    }
  }
}

// 全局缓存实例
export const caches = {
  api: new CacheManager('api-cache', { storage: 'sessionStorage', ttl: 5 * 60 * 1000 }), // 5 分钟
  images: new CacheManager('image-cache', { storage: 'localStorage', ttl: 24 * 60 * 60 * 1000 }), // 24 小时
  articles: new CacheManager('article-cache', { storage: 'localStorage', ttl: 30 * 60 * 1000 }), // 30 分钟
  search: new CacheManager('search-cache', { storage: 'sessionStorage', ttl: 10 * 60 * 1000 }), // 10 分钟
}

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      Object.values(caches).forEach((cache) => cache.cleanup())
    },
    5 * 60 * 1000
  ) // 每 5 分钟清理一次
}
