// Backend API Type Definitions

// ==================== Blog Types ====================
export interface PostListItem {
  id: string
  slug: string
  title: string
  summary: string | null
  cover_image_url: string | null
  status: 'Draft' | 'Published' | 'Archived'
  published_at: string | null
  category_name: string | null
  category_slug: string | null
  author_name: string | null
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  reading_time: number | null
  tag_count: number
  is_featured?: boolean
}

export interface PostDetail {
  id: string
  slug: string
  title: string
  content: string
  content_html: string | null
  summary: string | null
  cover_image_id: string | null
  cover_image_url: string | null
  status: 'Draft' | 'Published' | 'Archived'
  published_at: string | null
  scheduled_at: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  category_id: string | null
  category_name: string | null
  category_slug: string | null
  author_id: string | null
  author_name: string | null
  show_toc: boolean
  layout: string
  is_featured?: boolean
  content_format?: string
  language?: string
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  tags: TagBasic[]
  // Phase 3: 双轨存储
  content_json?: Record<string, unknown> | null
  content_mdx?: string | null
}

export interface PostListResponse {
  posts: PostListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  parent_id: string | null
  icon: string | null
  color: string | null
  display_order: number
  post_count: number
  created_at: string
  updated_at: string
}

export interface CategoryBasic {
  id: string
  slug: string
  name: string
  icon: string | null
  color: string | null
  post_count: number
}

export interface Tag {
  id: string
  slug: string
  name: string
  description: string | null
  post_count: number
  created_at: string
}

export interface TagBasic {
  id: string
  slug: string
  name: string
}

export interface SearchResult {
  id: string
  slug: string
  title: string
  summary: string | null
  published_at: string | null
  rank: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

export interface PostListParams {
  page?: number
  limit?: number
  status?: 'Published' | 'Draft' | 'Archived'
  category_slug?: string
  tag_slug?: string
  sort_by?: 'published_at' | 'created_at' | 'view_count' | 'like_count'
  sort_order?: 'asc' | 'desc'
}

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
  profile: Record<string, unknown> | null
  email_verified: boolean
  role?: 'user' | 'admin' | 'moderator'
}

// ==================== Post Stats ====================
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

// ==================== User Types ====================
export type UserStatus = 'active' | 'suspended' | 'banned'

export interface UserListItem {
  id: string
  email: string
  username: string
  role: string
  email_verified: boolean
  status?: UserStatus
  created_at: string
}

export interface UserDetail {
  id: string
  email: string
  username: string
  role: string
  email_verified: boolean
  status: UserStatus
  profile: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface UserListResponse {
  users: UserListItem[]
  total: number
  page: number
  page_size: number
}

export interface UserListParams {
  page?: number
  page_size?: number
  search?: string
  status?: UserStatus | ''
  role?: string | ''
}

export interface CreateUserRequest {
  email: string
  username: string
  password: string
  role?: string
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  role?: string
  email_verified?: boolean
  status?: UserStatus
}

export interface UpdateUserRoleRequest {
  role: string
}

export interface BatchUpdateRoleRequest {
  user_ids: string[]
  role: string
}

export interface BatchDeleteUsersRequest {
  user_ids: string[]
}

// ==================== Comment Admin Types ====================
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
  response_time_ms?: number
  last_check?: string
  details?: Record<string, any>
}

export interface DetailedHealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime_seconds: number
  version: string
  environment: string
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    jwt: ServiceHealth
    email: ServiceHealth
  }
  metrics: SystemMetrics
}

export interface SystemMetrics {
  memory_usage: {
    used_mb: number
    total_mb: number
    percentage: number
  }
  cpu_usage?: number
  active_connections: number
  database_pool: {
    size: number
    idle: number
    active: number
  }
  redis_status: ServiceHealth
}

// ==================== Prometheus Metrics Types ====================
export interface PrometheusMetrics {
  http_requests_total: Metric[]
  http_request_duration_seconds: HistogramMetric[]
  db_connections: GaugeMetric
  redis_connections: GaugeMetric
  active_sessions: GaugeMetric
  [key: string]: any
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

// ==================== Reading Progress Types ====================
export interface ReadingProgress {
  user_id: string
  post_id: string
  post_slug: string
  post_title: string
  progress: number
  last_read_at: string
  completed_at?: string
}

export interface ReadingHistoryResponse {
  history: ReadingProgress[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ==================== Version Control Types ====================
export interface PostVersion {
  id: string
  post_id: string
  version_number: number
  title: string
  content: string
  summary?: string
  created_at: string
  created_by: string
  created_by_username?: string
  comment?: string
}

export interface PostVersionsResponse {
  versions: PostVersion[]
  total: number
}

export interface VersionComparison {
  version1: PostVersion
  version2: PostVersion
  changes: {
    title: { old: string; new: string } | null
    content: { old: string; new: string } | null
    summary: { old: string; new: string } | null
  }
}

// ==================== Media Types ====================
export type MediaType = 'image' | 'video' | 'document' | 'chemistry' | '3d-model' | 'music-score' | 'other'

export interface MediaItem {
  id: string
  filename: string
  original_filename: string
  mime_type: string
  size_bytes: number
  width?: number | null
  height?: number | null
  url: string
  media_type: MediaType
  usage_count: number
  created_at: string
}

export interface MediaDetail {
  id: string
  filename: string
  original_filename: string
  mime_type: string
  size_bytes: number
  width?: number | null
  height?: number | null
  storage_path: string
  cdn_url?: string | null
  alt_text?: string | null
  caption?: string | null
  uploaded_by?: string | null
  media_type: MediaType
  usage_count: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface MediaListResponse {
  media: MediaItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface MediaListParams {
  page?: number
  limit?: number
  media_type?: MediaType | ''
  search?: string
}

export interface MediaPresignUploadRequest {
  filename: string
  content_type?: string
  expires_secs?: number
}

export interface MediaPresignUploadResponse {
  object_key: string
  upload_url: string
  asset_url: string
  upload_method: string
  content_type: string
  expires_in_secs: number
  required_headers: Record<string, string>
}

export interface FinalizeMediaUploadRequest {
  object_key: string
  original_filename: string
  alt_text?: string
  caption?: string
}

export interface UpdateMediaRequest {
  alt_text?: string
  caption?: string
}

export interface MediaDownloadUrlResponse {
  url: string
  expires_in_secs?: number | null
}

// ==================== Bookmark Types ====================
export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  post_slug: string
  post_title: string
  post_excerpt?: string
  post_image?: string
  note?: string
  created_at: string
  updated_at: string
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface CreateBookmarkRequest {
  post_id: string
  post_slug: string
  post_title: string
  note?: string
}

export interface UpdateBookmarkRequest {
  note?: string
}

// ==================== User Profile Types ====================
export interface UpdateProfileRequest {
  username?: string
  email?: string
  bio?: string
  location?: string
  website?: string
  twitter?: string
  github?: string
  avatar_url?: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface UserReadingStats {
  total_posts_read: number
  total_reading_time: number
  posts_completed: number
  posts_in_progress: number
  favorite_tags: string[]
  reading_streak: number
  this_week_posts: number
  this_month_posts: number
}

export interface UserProfile extends UserInfo {
  bio?: string
  location?: string
  website?: string
  twitter?: string
  github?: string
  avatar_url?: string
  reading_stats?: UserReadingStats
}

// ==================== Comment Notification Types ====================
export interface CommentNotificationSubscription {
  id: string
  user_id: string
  post_id: string
  post_title: string
  post_slug: string
  subscribed_at: string
}

export interface CommentNotificationPreferences {
  email_notifications: boolean
  reply_notifications: boolean
  mention_notifications: boolean
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  unsubscribe_from_all: boolean
}

export interface CommentNotification {
  id: string
  user_id: string
  post_id: string
  post_title: string
  post_slug: string
  comment_id: string
  commenter_username: string
  comment_content: string
  notification_type: 'reply' | 'mention' | 'new_comment'
  is_read: boolean
  created_at: string
}

export interface CommentNotificationListResponse {
  notifications: CommentNotification[]
  total: number
  unread_count: number
  page: number
  per_page: number
  total_pages: number
}

// ==================== Team Member Types ====================
export type TeamRole = 'advisor' | 'lead' | 'member'

export interface TeamMemberListItem {
  id: string
  name: string
  name_en?: string
  team_role: TeamRole
  title?: string
  affiliation?: string
  avatar_media_id?: string
  display_order: number
}

export interface TeamMemberDetail {
  id: string
  user_id?: string
  name: string
  name_en?: string
  team_role: TeamRole
  display_order: number
  is_active: boolean
  title?: string
  bio?: string
  affiliation?: string
  research_tags?: string[]
  email?: string
  github?: string
  website?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface TeamMemberListResponse {
  data: TeamMemberListItem[]
  total: number
  page: number
  page_size: number
}

export interface TeamMemberListParams {
  page?: number
  page_size?: number
  team_role?: TeamRole
  is_active?: boolean
  search?: string
}

export interface CreateTeamMemberRequest {
  user_id?: string
  name: string
  name_en?: string
  team_role?: TeamRole
  display_order?: number
  title?: string
  bio?: string
  affiliation?: string
  research_tags?: string[]
  email?: string
  github?: string
  website?: string
  avatar_media_id?: string
}

export interface UpdateTeamMemberRequest {
  user_id?: string
  name?: string
  name_en?: string
  team_role?: TeamRole
  display_order?: number
  is_active?: boolean
  title?: string
  bio?: string
  affiliation?: string
  research_tags?: string[]
  email?: string
  github?: string
  website?: string
  avatar_media_id?: string
}

export interface BatchDeleteTeamMembersRequest {
  member_ids: string[]
}
