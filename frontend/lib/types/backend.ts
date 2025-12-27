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

// ==================== Admin Types ====================
export interface AdminStats {
  total_users: number
  total_comments: number
  pending_comments: number
  approved_comments: number
  rejected_comments: number
}

export interface UserListItem {
  id: string
  email: string
  username: string
  role: string
  email_verified: boolean
  created_at: string
}

export interface UserListResponse {
  users: UserListItem[]
  total: number
  page: number
  page_size: number
}

export interface UpdateUserRoleRequest {
  role: string
}

export interface CommentAdminItem {
  id: string
  slug: string
  user_id: string | null
  username: string | null
  content: string
  status: string
  created_at: string
}

export interface CommentAdminListResponse {
  comments: CommentAdminItem[]
  total: number
  page: number
  page_size: number
}

export interface UpdateCommentStatusRequest {
  status: string
  reason?: string
}

// ==================== Health Check Types ====================
export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  services?: Record<string, ServiceHealth>
  details?: Record<string, any>
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy'
  message?: string
  details?: Record<string, any>
}

export interface DetailedHealthStatus extends HealthStatus {
  database: ServiceHealth
  redis: ServiceHealth
  jwt: ServiceHealth
  email?: ServiceHealth
}

// ==================== Prometheus Metrics Types ====================
export interface PrometheusMetrics {
  http_requests_total: Metric[]
  http_request_duration_seconds: HistogramMetric[]
  db_connections: GaugeMetric
  redis_connections: GaugeMetric
  active_sessions: GaugeMetric
  [key: string]: any // Allow additional metrics
}

export interface Metric {
  name: string
  value: number
  labels?: Record<string, string>
  timestamp?: number
}

export interface HistogramMetric {
  name: string
  count: number
  sum: number
  buckets: HistogramBucket[]
}

export interface HistogramBucket {
  le: string
  count: number
}

export interface GaugeMetric {
  name: string
  value: number
  labels?: Record<string, string>
}

// ==================== Analytics Types ====================
export interface AnalyticsData {
  userGrowth: UserGrowthPoint[]
  commentActivity: CommentActivityPoint[]
  topPosts: TopPost[]
  realtimeStats: RealtimeStats
}

export interface UserGrowthPoint {
  date: string
  count: number
  cumulative: number
}

export interface CommentActivityPoint {
  date: string
  count: number
  approved: number
  pending: number
  rejected: number
}

export interface TopPost {
  slug: string
  title: string
  views: number
  likes: number
  comments: number
}

export interface RealtimeStats {
  activeUsers: number
  onlineCount: number
  requestRate: number
}

// ==================== Notification Types ====================
export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
  category?: 'comment' | 'user' | 'system' | 'security'
}

export interface NotificationListResponse {
  notifications: Notification[]
  unreadCount: number
  total: number
}

// ==================== System Settings Types ====================
export interface SystemSettings {
  site: SiteSettings
  email: EmailSettings
  security: SecuritySettings
  performance: PerformanceSettings
}

export interface SiteSettings {
  name: string
  description: string
  url: string
  logo?: string
  favicon?: string
}

export interface EmailSettings {
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_from: string
  smtp_use_tls: boolean
}

export interface SecuritySettings {
  password_min_length: number
  require_email_verification: boolean
  session_timeout_minutes: number
  max_login_attempts: number
}

export interface PerformanceSettings {
  cache_ttl: number
  enable_compression: boolean
  enable_prometheus: boolean
  log_level: 'debug' | 'info' | 'warn' | 'error'
}

// ==================== Post Management Types ====================
export interface PostListItem {
  slug: string
  title: string
  status: 'published' | 'draft' | 'archived'
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
}

export interface PostListResponse {
  posts: PostListItem[]
  total: number
  page: number
  page_size: number
}

export interface PostDetail extends PostListItem {
  content: string
  excerpt?: string
  author: {
    id: string
    username: string
  }
  tags?: string[]
  category?: string
}
