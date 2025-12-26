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
  UserListItem,
  UserListResponse,
  UpdateUserRoleRequest,
  CommentAdminItem,
  CommentListResponse as CommentAdminListResponse,
  UpdateCommentStatusRequest,
} from '../types/backend'

// Backend API base URL - adjust based on your environment
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1'

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
}

// ==================== Post Service ====================
export const postService = {
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
}

// Export all services
export const backendApi = {
  auth: authService,
  post: postService,
  comment: commentService,
  admin: adminService,
}
