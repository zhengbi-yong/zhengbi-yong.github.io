import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

interface BlogStore {
  // 搜索相关
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredPosts: CoreContent<Blog>[]
  setFilteredPosts: (posts: CoreContent<Blog>[]) => void

  // 完整博客列表缓存
  allPosts: CoreContent<Blog>[]
  setAllPosts: (posts: CoreContent<Blog>[]) => void

  // 缓存元数据
  cachedAt: number | null
  cacheExpiry: number // 缓存过期时间（毫秒），默认1小时
  setCachedAt: (timestamp: number) => void

  // 缓存管理
  isCacheValid: () => boolean
  clearCache: () => void
}

const DEFAULT_CACHE_EXPIRY = 60 * 60 * 1000 // 1小时

/**
 * 博客相关状态管理
 * 使用 Zustand 实现轻量级全局状态管理
 * 支持完整博客列表缓存，提升后续访问速度
 */
export const useBlogStore = create<BlogStore>()(
  persist(
    (set, get) => ({
      // 搜索相关
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      filteredPosts: [],
      setFilteredPosts: (posts) => set({ filteredPosts: posts }),

      // 完整博客列表缓存
      allPosts: [],
      setAllPosts: (posts) => {
        set({
          allPosts: posts,
          cachedAt: Date.now(),
        })
      },

      // 缓存元数据
      cachedAt: null,
      cacheExpiry: DEFAULT_CACHE_EXPIRY,
      setCachedAt: (timestamp) => set({ cachedAt: timestamp }),

      // 缓存管理
      isCacheValid: () => {
        const state = get()
        if (!state.cachedAt || state.allPosts.length === 0) {
          return false
        }
        const now = Date.now()
        return now - state.cachedAt < state.cacheExpiry
      },

      clearCache: () => {
        set({
          allPosts: [],
          cachedAt: null,
          filteredPosts: [],
          searchQuery: '',
        })
      },
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        allPosts: state.allPosts,
        cachedAt: state.cachedAt,
        cacheExpiry: state.cacheExpiry,
      }),
    }
  )
)
