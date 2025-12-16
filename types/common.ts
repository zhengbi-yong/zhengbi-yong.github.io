// 通用类型定义

// 响应式断点
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

// 语言类型
export type Language = 'en' | 'zh-CN'

// 文章相关类型
export interface ArticleMeta {
  id: string
  title: string
  description: string
  date: string
  modified?: string
  image?: string
  tags: string[]
  category: string
  author: string
  status: 'draft' | 'published'
  featured?: boolean
  readingTime: number
  wordCount: number
  path: string
}

export interface Article extends ArticleMeta {
  content: string
  toc?: TableOfContentsItem[]
}

export interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

// 分析数据类型
export interface PageView {
  path: string
  title: string
  timestamp: number
  referrer?: string
  userAgent?: string
  sessionId: string
}

export interface ArticleAnalytics {
  articleId: string
  views: number
  uniqueViews: number
  totalReadingTime: number
  averageReadingTime: number
  scrollDepth: {
    25: number
    50: number
    75: number
    100: number
  }
  engagementScore: number
  lastUpdated: number
}

// 搜索相关类型
export interface SearchResult {
  id: string
  title: string
  description: string
  url: string
  category: string
  tags: string[]
  score: number
}

export interface SearchOptions {
  query: string
  category?: string
  tags?: string[]
  limit?: number
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 表单类型
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  options?: Array<{
    label: string
    value: string
  }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}

// 动画相关类型
export interface AnimationConfig {
  duration: number
  delay?: number
  easing?: string
  repeat?: number | 'infinite'
  direction?: 'normal' | 'reverse' | 'alternate'
}

// 性能监控类型
export interface PerformanceMetrics {
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  timeToInteractive?: number
}

// 事件类型
export interface BaseEvent {
  type: string
  timestamp: number
  data?: Record<string, any>
}

// 位置相关类型
export interface Coordinates {
  lat: number
  lng: number
}

export interface MapMarker {
  id: string
  position: Coordinates
  title?: string
  description?: string
  icon?: string
}

// 音频相关类型
export interface AudioTrack {
  id: string
  title: string
  artist?: string
  album?: string
  duration: number
  src: string
  cover?: string
}

export interface Playlist {
  id: string
  name: string
  tracks: AudioTrack[]
  cover?: string
}

// 通知类型
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    callback: () => void
  }
}

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
