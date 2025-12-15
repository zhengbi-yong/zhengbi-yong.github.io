// 服务端兼容的分析数据处理
// 这些函数可以在服务端环境中安全使用

interface ArticleAnalytics {
  viewCount: number
  totalReadingTime: number
  averageReadingTime: number
  scrollDepth: number
  lastVisited: Date | null
  engagementScore: number
}

// 获取热门文章（服务端版本）
export function getPopularArticlesServer(limit = 5): Array<{
  articleId: string
  analytics: ArticleAnalytics
}> {
  // 在服务端环境，我们无法访问 localStorage
  // 返回空数组，实际数据将在客户端加载
  return []
}

// 检查是否为客户端环境
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

// 安全的 localStorage 访问
export function safeLocalStorageGet(key: string): string | null {
  if (!isClient()) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// 安全的 localStorage 设置
export function safeLocalStorageSet(key: string, value: string): void {
  if (!isClient()) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // 静默失败
  }
}