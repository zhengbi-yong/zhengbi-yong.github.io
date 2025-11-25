/**
 * 内存缓存实现
 * 提供简单的内存缓存功能，支持 TTL（Time To Live）
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl?: number
}

/**
 * MemoryCache - 内存缓存类
 * @template T 缓存值的类型
 */
export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private defaultTTL: number

  /**
   * 创建内存缓存实例
   * @param defaultTTL 默认 TTL（毫秒），默认 5 分钟
   */
  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl TTL（毫秒），可选，使用默认值如果不提供
   */
  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回 null
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (entry.ttl && now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 删除指定键的缓存
   * @param key 缓存键
   * @returns 是否成功删除
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 检查缓存是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在且有效
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (entry.ttl && now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

