// Backend API Service
// This service handles all communication with the backend API

import { api, apiClient } from './apiClient'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserInfo,
  PostStats,
  CommentResponse,
  CommentListResponse,
  CreateCommentRequest,
  AdminStats,
  UserListResponse,
  UpdateUserRoleRequest,
  CommentAdminListResponse,
  UpdateCommentStatusRequest,
  PostDetail,
  PostListResponse,
  PostListParams,
  Category,
  Tag,
  SearchResponse,
  ReadingProgress,
  ReadingHistoryResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserReadingStats,
  CommentNotificationSubscription,
  CommentNotificationPreferences,
} from '../types/backend'

// Backend API base URL - adjust based on your environment
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1'

// Token refresh state management
let refreshPromise: Promise<string> | null = null

/**
 * Refresh access token using refresh token from cookie
 */
export const refreshAccessToken = async (): Promise<string> => {
  // Prevent multiple simultaneous refresh attempts
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const response = await api.post<{ access_token: string }>(
        `${BACKEND_API_URL}/auth/refresh`,
        undefined,
        { cache: false }
      )
      const newToken = response.data.access_token

      // Update the default header
      apiClient.setDefaultHeader('Authorization', `Bearer ${newToken}`)

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', newToken)
      }

      return newToken
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ==================== Helper Functions ====================
/**
 * Encode slug for URL - handles slashes and special characters
 * Example: "chemistry/tutorial" -> "chemistry%2Ftutorial"
 */
function encodeSlug(slug: string): string {
  return encodeURIComponent(slug)
}

// ==================== Auth Service ====================
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      `${BACKEND_API_URL}/auth/login`,
      credentials,
      { cache: false }
    )
    if (response.success && response.data.access_token) {
      // Store token for future requests
      apiClient.setDefaultHeader('Authorization', `Bearer ${response.data.access_token}`)
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
      }
    }
    return response.data
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      `${BACKEND_API_URL}/auth/register`,
      data,
      { cache: false }
    )
    if (response.success && response.data.access_token) {
      apiClient.setDefaultHeader('Authorization', `Bearer ${response.data.access_token}`)
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user_info', JSON.stringify(response.data.user))
      }
    }
    return response.data
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserInfo> {
    const response = await api.get<UserInfo>(`${BACKEND_API_URL}/auth/me`, { cache: false })
    return response.data
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await api.post(`${BACKEND_API_URL}/auth/logout`, undefined, { cache: false })
    // Clear auth data
    apiClient.removeDefaultHeader('Authorization')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_info')
    }
  },

  /**
   * Initialize auth from localStorage
   */
  initAuth(): { token: string | null; user: UserInfo | null } {
    if (typeof window === 'undefined') {
      return { token: null, user: null }
    }
    const token = localStorage.getItem('access_token')
    const userInfo = localStorage.getItem('user_info')
    if (token) {
      apiClient.setDefaultHeader('Authorization', `Bearer ${token}`)
    }
    return {
      token,
      user: userInfo ? JSON.parse(userInfo) : null,
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('access_token')
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ access_token: string }> {
    const newToken = await refreshAccessToken()
    return { access_token: newToken }
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserInfo> {
    const response = await api.put<UserInfo>(`${BACKEND_API_URL}/auth/profile`, data, { cache: false })
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_info', JSON.stringify(response.data))
    }
    return response.data
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post(`${BACKEND_API_URL}/auth/change-password`, data, { cache: false })
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await api.post<{ avatar_url: string }>(
      `${BACKEND_API_URL}/auth/avatar`,
      formData,
      {
        cache: false,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Get user reading statistics
   */
  async getReadingStats(): Promise<UserReadingStats> {
    const response = await api.get<UserReadingStats>(`${BACKEND_API_URL}/auth/reading-stats`, { cache: 60 * 1000 })
    return response.data
  },
}

// ==================== Post Service ====================
export const postService = {
  /**
   * Get list of posts with pagination and filtering
   */
  async getPosts(params?: PostListParams): Promise<PostListResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.category_slug) queryParams.append('category_slug', params.category_slug)
    if (params?.tag_slug) queryParams.append('tag_slug', params.tag_slug)
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    const url = `${BACKEND_API_URL}/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await api.get<PostListResponse>(url, { cache: 60 * 1000 }) // 1 minute cache
    return response.data
  },

  /**
   * Get post detail by slug
   */
  async getPost(slug: string): Promise<PostDetail> {
    const response = await api.get<PostDetail>(`${BACKEND_API_URL}/posts/${encodeSlug(slug)}`, {
      cache: 5 * 60 * 1000, // 5 minute cache
    })
    return response.data
  },

  /**
   * Get post detail by ID (UUID)
   */
  async getPostById(id: string): Promise<PostDetail> {
    const response = await api.get<PostDetail>(`${BACKEND_API_URL}/posts/id/${id}`, {
      cache: 5 * 60 * 1000, // 5 minute cache
    })
    return response.data
  },

  /**
   * Get post statistics (views, likes, comments count)
   */
  async getStats(slug: string): Promise<PostStats> {
    const response = await api.get<PostStats>(`${BACKEND_API_URL}/posts/${encodeSlug(slug)}/stats`)
    return response.data
  },

  /**
   * Record a post view
   */
  async recordView(slug: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/posts/${encodeSlug(slug)}/view`, undefined, { cache: false })
  },

  /**
   * Like a post
   */
  async likePost(slug: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/posts/${encodeSlug(slug)}/like`, undefined, { cache: false })
  },

  /**
   * Unlike a post
   */
  async unlikePost(slug: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/posts/${encodeSlug(slug)}/like`, { cache: false })
  },
}

// ==================== Category Service ====================
export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>(`${BACKEND_API_URL}/categories`, {
      cache: 10 * 60 * 1000, // 10 minute cache
    })
    return response.data
  },

  /**
   * Get category by slug
   */
  async getCategory(slug: string): Promise<Category> {
    const response = await api.get<Category>(`${BACKEND_API_URL}/categories/${slug}`, {
      cache: 10 * 60 * 1000,
    })
    return response.data
  },

  /**
   * Get category tree (with subcategories)
   */
  async getCategoryTree(): Promise<Category[]> {
    const response = await api.get<Category[]>(`${BACKEND_API_URL}/categories/tree`, {
      cache: 10 * 60 * 1000,
    })
    return response.data
  },
}

// ==================== Tag Service ====================
export const tagService = {
  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    const response = await api.get<Tag[]>(`${BACKEND_API_URL}/tags`, {
      cache: 10 * 60 * 1000, // 10 minute cache
    })
    return response.data
  },

  /**
   * Get tag by slug
   */
  async getTag(slug: string): Promise<Tag> {
    const response = await api.get<Tag>(`${BACKEND_API_URL}/tags/${slug}`, {
      cache: 10 * 60 * 1000,
    })
    return response.data
  },

  /**
   * Get popular tags
   */
  async getPopularTags(limit = 20): Promise<Tag[]> {
    const response = await api.get<Tag[]>(`${BACKEND_API_URL}/tags/popular?limit=${limit}`, {
      cache: 5 * 60 * 1000, // 5 minute cache
    })
    return response.data
  },
}

// ==================== Search Service ====================
export const searchService = {
  /**
   * Search posts
   */
  async search(query: string, filters?: {
    category_slug?: string
    tag_slug?: string
    limit?: number
    offset?: number
  }): Promise<SearchResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('q', query)

    if (filters?.category_slug) queryParams.append('category_slug', filters.category_slug)
    if (filters?.tag_slug) queryParams.append('tag_slug', filters.tag_slug)
    if (filters?.limit) queryParams.append('limit', filters.limit.toString())
    if (filters?.offset) queryParams.append('offset', filters.offset.toString())

    const response = await api.get<SearchResponse>(
      `${BACKEND_API_URL}/search?${queryParams.toString()}`,
      { cache: 2 * 60 * 1000 } // 2 minute cache
    )
    return response.data
  },

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, limit = 5): Promise<string[]> {
    if (query.length < 2) return []

    const response = await api.get<string[]>(
      `${BACKEND_API_URL}/search/suggest?q=${encodeURIComponent(query)}&limit=${limit}`,
      { cache: 5 * 60 * 1000 }
    )
    return response.data
  },
}

// ==================== Comment Service ====================
export const commentService = {
  /**
   * Get comments for a post
   */
  async getComments(slug: string, cursor?: string, limit = 20): Promise<CommentListResponse> {
    const params = new URLSearchParams()
    if (cursor) params.append('cursor', cursor)
    if (limit !== 20) params.append('limit', limit.toString())

    const url = `${BACKEND_API_URL}/posts/${encodeSlug(slug)}/comments${params.toString() ? '?' + params.toString() : ''}`
    const response = await api.get<CommentListResponse>(url)
    return response.data
  },

  /**
   * Create a new comment
   */
  async createComment(slug: string, data: CreateCommentRequest): Promise<CommentResponse> {
    const response = await api.post<CommentResponse>(
      `${BACKEND_API_URL}/posts/${encodeSlug(slug)}/comments`,
      data,
      { cache: false }
    )
    return response.data
  },

  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/comments/${commentId}/like`, undefined, { cache: false })
  },
}

// ==================== Admin Service ====================
export const adminService = {
  /**
   * Get admin statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>(`${BACKEND_API_URL}/admin/stats`, { cache: false })
    return response.data
  },

  /**
   * Get list of users
   */
  async getUsers(page = 1, pageSize = 20): Promise<UserListResponse> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    const response = await api.get<UserListResponse>(
      `${BACKEND_API_URL}/admin/users?${params.toString()}`,
      { cache: false }
    )
    return response.data
  },

  /**
   * Update user role
   */
  async updateUserRole(userId: string, data: UpdateUserRoleRequest): Promise<void> {
    await api.put(`${BACKEND_API_URL}/admin/users/${userId}/role`, data, { cache: false })
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/admin/users/${userId}`, { cache: false })
  },

  /**
   * Get list of comments
   */
  async getComments(page = 1, pageSize = 20, status?: string): Promise<CommentAdminListResponse> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())
    if (status) params.append('status', status)

    const response = await api.get<CommentAdminListResponse>(
      `${BACKEND_API_URL}/admin/comments?${params.toString()}`,
      { cache: false }
    )
    return response.data
  },

  /**
   * Update comment status
   */
  async updateCommentStatus(commentId: string, data: UpdateCommentStatusRequest): Promise<void> {
    await api.put(`${BACKEND_API_URL}/admin/comments/${commentId}/status`, data, { cache: false })
  },

  /**
   * Delete comment
   */
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/admin/comments/${commentId}`, { cache: false })
  },

  /**
   * Delete post
   */
  async deletePost(slug: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/admin/posts/${slug}`, { cache: false })
  },

  /**
   * Get post versions
   */
  async getPostVersions(postId: string): Promise<any> {
    const response = await api.get(`${BACKEND_API_URL}/admin/posts/${postId}/versions`)
    return response.data
  },

  /**
   * Restore post version
   */
  async restorePostVersion(postId: string, versionNumber: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/admin/posts/${postId}/versions/${versionNumber}/restore`, undefined)
  },

  /**
   * Compare post versions
   */
  async comparePostVersions(postId: string, version1: string, version2: string): Promise<any> {
    const response = await api.get(`${BACKEND_API_URL}/admin/posts/${postId}/versions/compare?v1=${version1}&v2=${version2}`)
    return response.data
  },

  /**
   * Get all media
   */
  async getMedia(page = 1, pageSize = 20): Promise<any> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    const response = await api.get(`${BACKEND_API_URL}/admin/media?${params.toString()}`)
    return response.data
  },

  /**
   * Get unused media
   */
  async getUnusedMedia(): Promise<any> {
    const response = await api.get(`${BACKEND_API_URL}/admin/media/unused`)
    return response.data
  },

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/admin/media/${mediaId}`)
  },
}

// ==================== Reading Progress Service ====================
export const readingProgressService = {
  /**
   * Get reading progress for a post
   */
  async getProgress(slug: string): Promise<ReadingProgress> {
    const response = await api.get<ReadingProgress>(`${BACKEND_API_URL}/posts/${slug}/reading-progress`)
    return response.data
  },

  /**
   * Update reading progress
   */
  async updateProgress(slug: string, progress: number, completed = false): Promise<void> {
    await api.post(`${BACKEND_API_URL}/posts/${slug}/reading-progress`, {
      progress,
      completed,
    })
  },

  /**
   * Reset reading progress
   */
  async resetProgress(slug: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/posts/${slug}/reading-progress`)
  },

  /**
   * Get reading history
   */
  async getHistory(page = 1, pageSize = 20): Promise<ReadingHistoryResponse> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    const response = await api.get<ReadingHistoryResponse>(`${BACKEND_API_URL}/reading-progress/history?${params.toString()}`)
    return response.data
  },
}

// ==================== Bookmark Service ====================
export const bookmarkService = {
  /**
   * Add bookmark
   */
  async addBookmark(postId: string, postSlug: string, postTitle: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/bookmarks`, {
      post_id: postId,
      post_slug: postSlug,
      post_title: postTitle,
    })
  },

  /**
   * Remove bookmark
   */
  async removeBookmark(postId: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/bookmarks/${postId}`)
  },

  /**
   * Check if post is bookmarked
   */
  async isBookmarked(postId: string): Promise<boolean> {
    try {
      const response = await api.get<{ bookmarked: boolean }>(`${BACKEND_API_URL}/bookmarks/${postId}/check`)
      return response.data.bookmarked
    } catch (error) {
      return false
    }
  },

  /**
   * Get all bookmarks
   */
  async getBookmarks(page = 1, pageSize = 20): Promise<any> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    const response = await api.get(`${BACKEND_API_URL}/bookmarks?${params.toString()}`)
    return response.data
  },

  /**
   * Update bookmark note
   */
  async updateBookmarkNote(postId: string, note: string): Promise<void> {
    await api.put(`${BACKEND_API_URL}/bookmarks/${postId}`, { note })
  },
}

// ==================== Comment Notification Service ====================
export const commentNotificationService = {
  /**
   * Subscribe to comment notifications for a post
   */
  async subscribeToPost(postId: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/notifications/comments/subscribe`, { post_id: postId })
  },

  /**
   * Unsubscribe from comment notifications for a post
   */
  async unsubscribeFromPost(postId: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/notifications/comments/unsubscribe`, { post_id: postId })
  },

  /**
   * Check if subscribed to post comments
   */
  async isSubscribedToPost(postId: string): Promise<boolean> {
    try {
      const response = await api.get<{ subscribed: boolean }>(
        `${BACKEND_API_URL}/notifications/comments/check?post_id=${postId}`
      )
      return response.data.subscribed
    } catch {
      return false
    }
  },

  /**
   * Get all notification subscriptions
   */
  async getSubscriptions(): Promise<CommentNotificationSubscription[]> {
    const response = await api.get<{ subscriptions: CommentNotificationSubscription[] }>(
      `${BACKEND_API_URL}/notifications/comments/subscriptions`
    )
    return response.data.subscriptions
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: CommentNotificationPreferences): Promise<void> {
    await api.put(`${BACKEND_API_URL}/notifications/comments/preferences`, preferences)
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<CommentNotificationPreferences> {
    const response = await api.get<CommentNotificationPreferences>(
      `${BACKEND_API_URL}/notifications/comments/preferences`
    )
    return response.data
  },
}

// Export all services
export const backendApi = {
  auth: authService,
  post: postService,
  comment: commentService,
  admin: adminService,
  category: categoryService,
  tag: tagService,
  search: searchService,
  readingProgress: readingProgressService,
  bookmark: bookmarkService,
  commentNotification: commentNotificationService,
}
