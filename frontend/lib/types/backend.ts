// Backend API Type Definitions

// ==================== Auth Types ====================
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: UserInfo
}

export interface UserInfo {
  id: string
  email: string
  username: string
  profile: Record<string, any> | null
  email_verified: boolean
}

// ==================== Post Types ====================
export interface PostStats {
  slug: string
  view_count: number
  like_count: number
  comment_count: number
  updated_at: string
}

// ==================== Comment Types ====================
export interface CommentResponse {
  id: string
  content: string
  html_sanitized: string
  user: CommentUser
  created_at: string
  like_count: number
  replies: CommentResponse[]
}

export interface CommentUser {
  username: string
  profile: Record<string, any> | null
}

export interface CommentListResponse {
  comments: CommentResponse[]
  next_cursor: string | null
}

export interface CreateCommentRequest {
  content: string
  parent_id?: string | null
}

// ==================== API Error Types ====================
export interface ApiError {
  code: number
  message: string
}
