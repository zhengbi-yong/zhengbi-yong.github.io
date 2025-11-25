export { MemoryCache } from './memory-cache'

// 导出类型
export interface CacheEntry<T = unknown> {
  value: T
  timestamp: number
  ttl?: number
}

