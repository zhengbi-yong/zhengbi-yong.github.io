import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { commentService } from '../api/backend'
import type { CommentResponse, CommentListResponse, CreateCommentRequest } from '../types/backend'

interface CommentsState {
  // Map of post slug to comments
  comments: Record<string, CommentResponse[]>
  // Map of post slug to pagination cursor
  cursors: Record<string, string | null>
  // Map of post slug to loading state
  loading: Record<string, boolean>
  // Map of post slug to error state
  errors: Record<string, string | null>
  // Map of comment ID to like status
  likedComments: Set<string>

  // Actions
  fetchComments: (slug: string, cursor?: string) => Promise<void>
  createComment: (slug: string, data: CreateCommentRequest) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
  getComments: (slug: string) => CommentResponse[]
  getCommentsLoading: (slug: string) => boolean
  getCommentsError: (slug: string) => string | null
  hasMore: (slug: string) => boolean
  isCommentLiked: (commentId: string) => boolean
}

/**
 * Comments Store
 * Manages comments for posts
 */
export const useCommentStore = create<CommentsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    comments: {},
    cursors: {},
    loading: {},
    errors: {},
    likedComments: new Set<string>(),

    // Fetch comments for a post
    fetchComments: async (slug: string, cursor?: string) => {
      set((state) => ({
        loading: { ...state.loading, [slug]: true },
        errors: { ...state.errors, [slug]: null },
      }))
      try {
        const response = await commentService.getComments(slug, cursor)
        set((state) => {
          // If cursor is provided, append to existing comments
          // Otherwise replace them
          const existingComments = state.comments[slug] || []
          const newComments = cursor
            ? [...existingComments, ...response.comments]
            : response.comments

          return {
            comments: { ...state.comments, [slug]: newComments },
            cursors: { ...state.cursors, [slug]: response.next_cursor },
            loading: { ...state.loading, [slug]: false },
          }
        })
      } catch (error: any) {
        set((state) => ({
          errors: { ...state.errors, [slug]: error?.message || 'Failed to fetch comments' },
          loading: { ...state.loading, [slug]: false },
        }))
      }
    },

    // Create a new comment
    createComment: async (slug: string, data: CreateCommentRequest) => {
      const { isAuthenticated } = await import('./auth-store').then((m) => ({
        isAuthenticated: m.useAuthStore.getState().isAuthenticated,
      }))

      if (!isAuthenticated) {
        set((state) => ({
          errors: { ...state.errors, [slug]: '请先登录' },
        }))
        return
      }

      set((state) => ({
        loading: { ...state.loading, [slug]: true },
        errors: { ...state.errors, [slug]: null },
      }))
      try {
        const comment = await commentService.createComment(slug, data)
        // Note: Comments are created with status 'pending' and won't appear in list until approved
        // But we show success to the user
        set((state) => ({
          loading: { ...state.loading, [slug]: false },
        }))
      } catch (error: any) {
        set((state) => ({
          errors: { ...state.errors, [slug]: error?.message || 'Failed to create comment' },
          loading: { ...state.loading, [slug]: false },
        }))
        throw error
      }
    },

    // Like a comment
    likeComment: async (commentId: string) => {
      const { isAuthenticated } = await import('./auth-store').then((m) => ({
        isAuthenticated: m.useAuthStore.getState().isAuthenticated,
      }))

      if (!isAuthenticated) {
        return
      }

      try {
        await commentService.likeComment(commentId)
        set((state) => {
          const newLikedComments = new Set(state.likedComments)
          if (state.likedComments.has(commentId)) {
            newLikedComments.delete(commentId)
          } else {
            newLikedComments.add(commentId)
          }
          // Update like count in the comment
          const updatedComments: Record<string, CommentResponse[]> = {}
          Object.entries(state.comments).forEach(([postSlug, comments]) => {
            updatedComments[postSlug] = comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  like_count: state.likedComments.has(commentId)
                    ? comment.like_count - 1
                    : comment.like_count + 1,
                }
              }
              return comment
            })
          })
          return {
            likedComments: newLikedComments,
            comments: { ...state.comments, ...updatedComments },
          }
        })
      } catch (error) {
        console.error('Failed to like comment:', error)
      }
    },

    // Get comments for a post
    getComments: (slug: string) => {
      return get().comments[slug] || []
    },

    // Get loading state for a post's comments
    getCommentsLoading: (slug: string) => {
      return get().loading[slug] || false
    },

    // Get error for a post's comments
    getCommentsError: (slug: string) => {
      return get().errors[slug] || null
    },

    // Check if there are more comments to load
    hasMore: (slug: string) => {
      return get().cursors[slug] !== null
    },

    // Check if a comment is liked
    isCommentLiked: (commentId: string) => {
      return get().likedComments.has(commentId)
    },
  }))
)
