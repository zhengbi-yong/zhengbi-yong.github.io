import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'

interface BlogStore {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredPosts: CoreContent<Blog>[]
  setFilteredPosts: (posts: CoreContent<Blog>[]) => void
}

/**
 * 博客相关状态管理
 * 使用 Zustand 实现轻量级全局状态管理
 */
export const useBlogStore = create<BlogStore>()(
  persist(
    (set) => ({
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      filteredPosts: [],
      setFilteredPosts: (posts) => set({ filteredPosts: posts }),
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({ searchQuery: state.searchQuery }),
    }
  )
)

