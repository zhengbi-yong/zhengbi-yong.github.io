// Backend API Service
// This service handles all communication with the backend API
//
// GOLDEN_RULES 1.1: 认证令牌必须仅存在于 HttpOnly Cookie 中
// - 前端不存储、不读取、不操作任何认证令牌
// - 所有请求通过 credentials: 'include' 自动携带 Cookie
// - 不再使用 Authorization Bearer Token

import { api } from './apiClient'
import { AppError } from '../error-handler'
import { resolveBackendApiBaseUrl } from './resolveBackendApiBaseUrl'
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
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  BatchUpdateRoleRequest,
  BatchDeleteUsersRequest,
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
  CommentNotificationSubscription,
  CommentNotificationPreferences,
  MediaItem,
  MediaDetail,
  MediaListResponse,
  MediaListParams,
  MediaPresignUploadRequest,
  MediaPresignUploadResponse,
  FinalizeMediaUploadRequest,
  UpdateMediaRequest,
  MediaDownloadUrlResponse,
} from '../types/backend'

// Backend API base URL - adjust based on your environment
const BACKEND_API_URL = resolveBackendApiBaseUrl()

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
   * GOLDEN_RULES 1.1: 响应中的 token 被忽略, 只使用 HttpOnly Cookie
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${BACKEND_API_URL}/auth/login`, credentials, {
      cache: false,
    })
    return response.data
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${BACKEND_API_URL}/auth/register`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Get current user info
   * 认证通过 HttpOnly Cookie 自动处理
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
  },

  /**
   * Initialize auth - attempt to restore session using HttpOnly cookie
   * Returns user if session is valid, null if not authenticated
   * GOLDEN_RULES 1.1: 不再返回 token, 只通过 Cookie 自动处理认证
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/auth/forgot-password`, { email }, { cache: false })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post(
      `${BACKEND_API_URL}/auth/reset-password`,
      { token, new_password: newPassword },
      { cache: false }
    )
  },

  async initAuth(): Promise<{ user: UserInfo | null }> {
    try {
      const user = await this.getCurrentUser()
      return { user }
    } catch (_err) {
      if (_err instanceof AppError && _err.statusCode === 401) {
        return { user: null }
      }

      throw _err
    }
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
    const response = await api.get<PostDetail>(
      `${BACKEND_API_URL}/posts/by-slug?slug=${encodeURIComponent(slug)}`,
      {
        cache: 5 * 60 * 1000, // 5 minute cache
      }
    )
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
    await api.post(`${BACKEND_API_URL}/posts/${encodeSlug(slug)}/likes`, undefined, { cache: false })
  },

  /**
   * Unlike a post
   */
  async unlikePost(slug: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/posts/${encodeSlug(slug)}/likes`, { cache: false })
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
  async search(
    query: string,
    filters?: {
      category_slug?: string
      tag_slug?: string
      limit?: number
      offset?: number
    }
  ): Promise<SearchResponse> {
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
    const response = await api.get<CommentListResponse>(url, { cache: false })
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

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string): Promise<void> {
    await api.post(`${BACKEND_API_URL}/comments/${commentId}/unlike`, undefined, { cache: false })
  },
}

// ==================== Team Member Service ====================
export const teamService = {
  /**
   * Get list of public team members (active only)
   */
  async getTeamMembers(): Promise<import('../types/backend').TeamMemberListItem[]> {
    const response = await api.get<import('../types/backend').TeamMemberListItem[]>(
      `${BACKEND_API_URL}/team-members`,
      { cache: 5 * 60 * 1000 } // 5 minute cache
    )
    return response.data
  },

  /**
   * Get single public team member detail
   */
  async getTeamMember(id: string): Promise<import('../types/backend').TeamMemberDetail> {
    const response = await api.get<import('../types/backend').TeamMemberDetail>(
      `${BACKEND_API_URL}/team-members/${id}`,
      { cache: 5 * 60 * 1000 } // 5 minute cache
    )
    return response.data
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
   * Get list of users (with search and filter support)
   */
  async getUsers(params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
    role?: string
  }): Promise<UserListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.role) queryParams.append('role', params.role)

    const response = await api.get<UserListResponse>(
      `${BACKEND_API_URL}/admin/users?${queryParams.toString()}`,
      { cache: false }
    )
    return response.data
  },

  /**
   * Get user detail
   */
  async getUserDetail(userId: string): Promise<UserDetail> {
    const response = await api.get<UserDetail>(`${BACKEND_API_URL}/admin/users/${userId}`, {
      cache: false,
    })
    return response.data
  },

  /**
   * Create a new user
   */
  async createUser(data: CreateUserRequest): Promise<UserDetail> {
    const response = await api.post<UserDetail>(`${BACKEND_API_URL}/admin/users`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Update user (profile, role, status)
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<UserDetail> {
    const response = await api.put<UserDetail>(`${BACKEND_API_URL}/admin/users/${userId}`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Update user role (legacy)
   */
  async updateUserRole(userId: string, data: UpdateUserRoleRequest): Promise<void> {
    await api.put(`${BACKEND_API_URL}/admin/users/${userId}/role`, data, { cache: false })
  },

  /**
   * Suspend user
   */
  async suspendUser(userId: string): Promise<void> {
    await api.put(
      `${BACKEND_API_URL}/admin/users/${userId}`,
      { status: 'suspended' },
      { cache: false }
    )
  },

  /**
   * Ban user
   */
  async banUser(userId: string): Promise<void> {
    await api.put(
      `${BACKEND_API_URL}/admin/users/${userId}`,
      { status: 'banned' },
      { cache: false }
    )
  },

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string): Promise<void> {
    await api.put(
      `${BACKEND_API_URL}/admin/users/${userId}`,
      { status: 'active' },
      { cache: false }
    )
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/admin/users/${userId}`, { cache: false })
  },

  /**
   * Batch update user roles
   */
  async batchUpdateRoles(data: BatchUpdateRoleRequest): Promise<void> {
    await api.post(`${BACKEND_API_URL}/admin/users/batch/role`, data, { cache: false })
  },

  /**
   * Batch delete users
   */
  async batchDeleteUsers(data: BatchDeleteUsersRequest): Promise<void> {
    await api.post(`${BACKEND_API_URL}/admin/users/batch/delete`, data, { cache: false })
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
   * List admin posts (with stats)
   */
  async listAdminPosts(params?: {
    page?: number
    page_size?: number
    status?: string
    search?: string
  }): Promise<PostListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.search) queryParams.append('search', params.search)

    const url = `${BACKEND_API_URL}/admin/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await api.get<PostListResponse>(url, { cache: false })
    return response.data
  },

  /**
   * Create post
   */
  async createPost(data: {
    title: string
    slug: string
    content: string
    status: string
    summary?: string
    cover_image_id?: string | null
    published_at?: string | null
    scheduled_at?: string | null
    meta_title?: string
    meta_description?: string
    canonical_url?: string
    category_id?: string | null
    show_toc?: boolean
    is_featured?: boolean
    layout?: string
    tag_ids?: string[] | null
  }): Promise<PostDetail> {
    const response = await api.post<PostDetail>(`${BACKEND_API_URL}/admin/posts`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Update post
   */
  async updatePost(
    postId: string,
    data: {
      title?: string
      content?: string
      content_format?: 'mdx' | 'html'
      content_html?: string
      summary?: string
      cover_image_id?: string | null
      status?: string
      published_at?: string | null
      scheduled_at?: string | null
      meta_title?: string
      meta_description?: string
      canonical_url?: string
      category_id?: string | null
      show_toc?: boolean
      layout?: string
      is_featured?: boolean
      tag_ids?: string[] | null
      content_json?: Record<string, unknown> | null
      content_mdx?: string | null
    }
  ): Promise<PostDetail> {
    const response = await api.patch<PostDetail>(`${BACKEND_API_URL}/admin/posts/${postId}`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/admin/posts/${postId}`, { cache: false })
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
    await api.post(
      `${BACKEND_API_URL}/admin/posts/${postId}/versions/${versionNumber}/restore`,
      undefined
    )
  },

  /**
   * Compare post versions
   */
  async comparePostVersions(postId: string, version1: string, version2: string): Promise<any> {
    const response = await api.get(
      `${BACKEND_API_URL}/admin/posts/${postId}/versions/compare?v1=${version1}&v2=${version2}`
    )
    return response.data
  },

  /**
   * Get all media (typed, paginated, filterable)
   */
  async getMedia(params?: MediaListParams): Promise<MediaListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.media_type) queryParams.append('media_type', params.media_type)
    if (params?.search) queryParams.append('search', params.search)

    const response = await api.get<MediaListResponse>(
      `${BACKEND_API_URL}/admin/media?${queryParams.toString()}`,
      { cache: false }
    )
    return response.data
  },

  /**
   * Get single media item detail
   */
  async getMediaById(mediaId: string): Promise<MediaDetail> {
    const response = await api.get<MediaDetail>(`${BACKEND_API_URL}/admin/media/${mediaId}`, {
      cache: false,
    })
    return response.data
  },

  /**
   * Upload media file (direct, for files <= 10MB)
   */
  async uploadMedia(file: File, altText?: string, caption?: string): Promise<MediaItem> {
    const formData = new FormData()
    formData.append('file', file)
    if (altText) formData.append('alt_text', altText)
    if (caption) formData.append('caption', caption)

    const response = await api.post<MediaItem>(`${BACKEND_API_URL}/admin/media/upload`, formData, {
      cache: false,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  /**
   * Get presigned upload URL (for large files)
   */
  async presignUpload(data: MediaPresignUploadRequest): Promise<MediaPresignUploadResponse> {
    const response = await api.post<MediaPresignUploadResponse>(
      `${BACKEND_API_URL}/admin/media/presign-upload`,
      data,
      { cache: false }
    )
    return response.data
  },

  /**
   * Finalize presigned upload
   */
  async finalizeUpload(data: FinalizeMediaUploadRequest): Promise<MediaItem> {
    const response = await api.post<MediaItem>(`${BACKEND_API_URL}/admin/media/finalize`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Create chemistry media (SMILES molecule)
   */
  async createChemistry(data: {
    smiles: string
    name: string
    description?: string
  }): Promise<MediaItem> {
    const response = await api.post<MediaItem>(`${BACKEND_API_URL}/admin/media/chemistry`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Update media metadata
   */
  async updateMedia(mediaId: string, data: UpdateMediaRequest): Promise<MediaDetail> {
    const response = await api.patch<MediaDetail>(
      `${BACKEND_API_URL}/admin/media/${mediaId}`,
      data,
      { cache: false }
    )
    return response.data
  },

  /**
   * Get unused media
   */
  async getUnusedMedia(): Promise<MediaItem[]> {
    const response = await api.get<MediaItem[]>(`${BACKEND_API_URL}/admin/media/unused`, {
      cache: false,
    })
    return response.data
  },

  /**
   * Get media download URL
   */
  async getMediaDownloadUrl(
    mediaId: string,
    expiresSecs?: number
  ): Promise<MediaDownloadUrlResponse> {
    const params = new URLSearchParams()
    if (expiresSecs) params.append('expires_secs', expiresSecs.toString())

    const response = await api.get<MediaDownloadUrlResponse>(
      `${BACKEND_API_URL}/admin/media/${mediaId}/download-url?${params.toString()}`,
      { cache: false }
    )
    return response.data
  },

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string): Promise<void> {
    await api.delete(`${BACKEND_API_URL}/admin/media/${mediaId}`, { cache: false })
  },

  // ==================== Team Members ====================

  /**
   * Get list of team members (admin view)
   */
  async getTeamMembers(params?: {
    page?: number
    page_size?: number
    team_role?: string
    is_active?: boolean
    search?: string
  }): Promise<{
    data: import('../types/backend').TeamMemberListItem[]
    total: number
    page: number
    page_size: number
  }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params?.team_role) queryParams.append('team_role', params.team_role)
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active))
    if (params?.search) queryParams.append('search', params.search)

    const response = await api.get<{
      data: import('../types/backend').TeamMemberListItem[]
      total: number
      page: number
      page_size: number
    }>(`${BACKEND_API_URL}/admin/team-members?${queryParams.toString()}`, { cache: false })
    return response.data
  },

  /**
   * Get single team member detail (admin view)
   */
  async getTeamMemberDetail(id: string): Promise<import('../types/backend').TeamMemberDetail> {
    const response = await api.get<import('../types/backend').TeamMemberDetail>(
      `${BACKEND_API_URL}/admin/team-members/${id}`,
      { cache: false }
    )
    return response.data
  },

  /**
   * Create a new team member
   */
  async createTeamMember(
    data: import('../types/backend').CreateTeamMemberRequest
  ): Promise<{ id: string }> {
    const response = await api.post<{ id: string }>(`${BACKEND_API_URL}/admin/team-members`, data, {
      cache: false,
    })
    return response.data
  },

  /**
   * Update team member
   */
  async updateTeamMember(
    id: string,
    data: import('../types/backend').UpdateTeamMemberRequest
  ): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(
      `${BACKEND_API_URL}/admin/team-members/${id}`,
      data,
      { cache: false }
    )
    return response.data
  },

  /**
   * Delete team member (soft delete)
   */
  async deleteTeamMember(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(
      `${BACKEND_API_URL}/admin/team-members/${id}`,
      { cache: false }
    )
    return response.data
  },

  /**
   * Batch delete team members
   */
  async batchDeleteTeamMembers(
    data: import('../types/backend').BatchDeleteTeamMembersRequest
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `${BACKEND_API_URL}/admin/team-members/batch/delete`,
      data,
      { cache: false }
    )
    return response.data
  },
}

// ==================== Reading Progress Service ====================
export const readingProgressService = {
  /**
   * Get reading progress for a post
   */
  async getProgress(slug: string): Promise<ReadingProgress> {
    const response = await api.get<ReadingProgress>(
      `${BACKEND_API_URL}/posts/${slug}/reading-progress`
    )
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

    const response = await api.get<ReadingHistoryResponse>(
      `${BACKEND_API_URL}/reading-progress/history?${params.toString()}`
    )
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
      const response = await api.get<{ bookmarked: boolean }>(
        `${BACKEND_API_URL}/bookmarks/${postId}/check`
      )
      return response.data.bookmarked
    } catch (_) {
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
