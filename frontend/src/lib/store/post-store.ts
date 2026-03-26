import { create } from './create-store'
import { subscribeWithSelector } from 'zustand/middleware'
import { postService } from '../api/backend'
import type { PostStats } from '../types/backend'
import { logger } from '../utils/logger'

interface PostStatsState {
  // Map of post slug to stats
  stats: Record<string, PostStats>
  // Map of post slug to like status (whether current user liked it)
  likedPosts: Set<string>
  // Loading states
  loading: boolean
  error: string | null

  // Actions
  fetchStats: (slug: string) => Promise<void>
  recordView: (slug: string) => Promise<void>
  likePost: (slug: string) => Promise<void>
  unlikePost: (slug: string) => Promise<void>
  toggleLike: (slug: string) => Promise<void>
  getStats: (slug: string) => PostStats | undefined
  isLiked: (slug: string) => boolean
}

/**
 * Post Stats Store
 * Manages post statistics and like status
 */
export const usePostStore = create<PostStatsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    stats: {},
    likedPosts: new Set<string>(),
    loading: false,
    error: null,

    // Fetch post stats
    fetchStats: async (slug: string) => {
      set({ loading: true, error: null })
      try {
        const stats = await postService.getStats(slug)
        set((state) => ({
          stats: { ...state.stats, [slug]: stats },
          loading: false,
        }))
      } catch (error: any) {
        set({ error: error?.message || 'Failed to fetch stats', loading: false })
      }
    },

    // Record post view
    recordView: async (slug: string) => {
      try {
        await postService.recordView(slug)
        // Optionally update stats after recording view
        get().fetchStats(slug)
      } catch (error) {
        // Silently fail for view tracking
        logger.error('Failed to record view:', error)
      }
    },

    // Like a post
    likePost: async (slug: string) => {
      const { isAuthenticated } = await import('./auth-store').then((m) => ({
        isAuthenticated: m.useAuthStore.getState().isAuthenticated,
      }))

      if (!isAuthenticated) {
        set({ error: '请先登录' })
        return
      }

      set({ loading: true, error: null })
      try {
        await postService.likePost(slug)
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts)
          newLikedPosts.add(slug)
          const updatedStats = { ...state.stats[slug], like_count: (state.stats[slug]?.like_count || 0) + 1 }
          return {
            likedPosts: newLikedPosts,
            stats: { ...state.stats, [slug]: updatedStats },
            loading: false,
          }
        })
      } catch (error: any) {
        set({ error: error?.message || 'Failed to like post', loading: false })
        throw error
      }
    },

    // Unlike a post
    unlikePost: async (slug: string) => {
      const { isAuthenticated } = await import('./auth-store').then((m) => ({
        isAuthenticated: m.useAuthStore.getState().isAuthenticated,
      }))

      if (!isAuthenticated) {
        set({ error: '请先登录' })
        return
      }

      set({ loading: true, error: null })
      try {
        await postService.unlikePost(slug)
        set((state) => {
          const newLikedPosts = new Set(state.likedPosts)
          newLikedPosts.delete(slug)
          const updatedStats = { ...state.stats[slug], like_count: Math.max((state.stats[slug]?.like_count || 0) - 1, 0) }
          return {
            likedPosts: newLikedPosts,
            stats: { ...state.stats, [slug]: updatedStats },
            loading: false,
          }
        })
      } catch (error: any) {
        set({ error: error?.message || 'Failed to unlike post', loading: false })
        throw error
      }
    },

    // Toggle like status
    toggleLike: async (slug: string) => {
      const { isLiked } = get()
      if (isLiked(slug)) {
        await get().unlikePost(slug)
      } else {
        await get().likePost(slug)
      }
    },

    // Get stats for a post
    getStats: (slug: string) => {
      return get().stats[slug]
    },

    // Check if post is liked
    isLiked: (slug: string) => {
      return get().likedPosts.has(slug)
    },
  }))
)
