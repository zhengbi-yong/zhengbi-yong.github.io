// 安全相关工具函数

// 内容安全策略配置
export const CSP_CONFIG = {
  // 开发环境 - 较宽松
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'style-src-elem': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'font-src-elem': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
  },
  // 生产环境 - 严格
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'giscus.app'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'unpkg.com'],
    'style-src-elem': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'unpkg.com'],
    'img-src': ["'self'", 'data:', 'https:', 'avatars.githubusercontent.com', 'picsum.photos'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'font-src-elem': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.github.com',
      'https://github.com',
      'https://avatars.githubusercontent.com',
      'https://analytics.umami.is',
      'https://o1046881.ingest.sentry.io',
    ],
    'frame-src': ['giscus.app'],
    'worker-src': ["'self'", 'blob:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  },
}

// 生成 CSP 字符串
export function generateCSP(environment: 'development' | 'production' = 'production'): string {
  const config = CSP_CONFIG[environment]
  return Object.entries(config)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

// XSS 防护
export function sanitizeHtml(html: string): string {
  // 基本的 HTML 清理
  // 在生产环境中建议使用 DOMPurify
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return html.replace(/[&<>"'/]/g, (s) => map[s])
}

// URL 验证
export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsedUrl = new URL(url)

    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false
    }

    // 如果指定了允许的域名，进行验证
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some((domain) => {
        return parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      })
    }

    return true
  } catch {
    return false
  }
}

// 输入验证
export function validateInput(
  input: string,
  options: {
    maxLength?: number
    minLength?: number
    allowedChars?: RegExp
    forbiddenChars?: RegExp
  }
): boolean {
  const { maxLength, minLength, allowedChars, forbiddenChars } = options

  // 长度检查
  if (minLength && input.length < minLength) return false
  if (maxLength && input.length > maxLength) return false

  // 字符检查
  if (allowedChars && !allowedChars.test(input)) return false
  if (forbiddenChars && forbiddenChars.test(input)) return false

  return true
}

// CSRF Token 管理
// GOLDEN_RULES 1.2: 双重提交 Cookie 方案
// - 从 cookie 读取 CSRF token（HttpOnly: false, JavaScript 可读）
// - 验证时同时检查 cookie 和 header（双重提交）
export class CSRFTokenManager {
  private static readonly COOKIE_NAME = 'XSRF-TOKEN'
  private static readonly HEADER_NAME = 'X-CSRF-Token'

  // 生成随机 token (32字节十六进制)
  static generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  // 从 cookie 获取当前 token
  // GOLDEN_RULES 1.2: CSRF token 存储在 cookie 中, JavaScript 可读
  static getToken(): string {
    if (typeof document === 'undefined') return ''

    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === this.COOKIE_NAME) {
        return decodeURIComponent(value)
      }
    }
    return ''
  }

  // 设置 CSRF token 到 cookie
  // HttpOnly: false - JavaScript 需要读取并作为 header 发送
  // SameSite: Strict - 严格同站限制
  static setToken(token: string): void {
    if (typeof document === 'undefined') return

    const expires = new Date()
    expires.setHours(expires.getHours() + 24) // 24小时有效

    document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; samesite=strict`
  }

  // 验证 token
  static validateToken(token: string): boolean {
    const cookieToken = this.getToken()
    return token === cookieToken && token.length > 0
  }

  // 刷新 token
  static refreshToken(): string {
    const newToken = this.generateToken()
    this.setToken(newToken)
    return newToken
  }

  // 获取请求头名称
  static getHeaderName(): string {
    return this.HEADER_NAME
  }

  // 获取带 token 的请求头
  // GOLDEN_RULES 1.2: 从 cookie 读取并设置到 header
  static getHeaders(): Record<string, string> {
    return {
      [this.HEADER_NAME]: this.getToken(),
    }
  }

  // 确保 token 存在（初始化时调用）
  static ensureToken(): string {
    let token = this.getToken()
    if (!token) {
      token = this.generateToken()
      this.setToken(token)
    }
    return token
  }
}

// 速率限制
export class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  // 检查是否允许请求
  isAllowed(): boolean {
    const now = Date.now()
    // 清理过期的请求记录
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      return false
    }

    this.requests.push(now)
    return true
  }

  // 获取剩余请求次数
  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter((time) => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  // 获取重置时间
  getResetTime(): number {
    if (this.requests.length === 0) return 0
    return this.requests[0] + this.windowMs
  }
}

// 内容类型验证
export function validateContentType(contentType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    // 支持通配符，如 'image/*'
    if (type.endsWith('/*')) {
      const baseType = type.slice(0, -2)
      return contentType.startsWith(baseType)
    }
    return contentType === type
  })
}

// 安全的 JSON 解析
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return defaultValue
  }
}

// 密码强度检查
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // 长度检查
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password should be at least 8 characters long')
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain lowercase letters')
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain uppercase letters')
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain numbers')
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain special characters')
  }

  // 额外检查
  if (password.length >= 12) {
    score = Math.min(4, score + 1)
  }

  return { score: Math.min(4, score), feedback }
}

// 创建安全的 iframe URL
export function createSecureIframeUrl(
  url: string,
  options: {
    allow?: string
    sandbox?: string[]
    referrerPolicy?: string
  }
): string {
  const params = new URLSearchParams()

  if (options.allow) {
    params.set('allow', options.allow)
  }

  if (options.sandbox && options.sandbox.length > 0) {
    params.set('sandbox', options.sandbox.join(' '))
  }

  if (options.referrerPolicy) {
    params.set('referrerpolicy', options.referrerPolicy)
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${params.toString()}`
}

// 防止点击劫持
export function preventClickjacking(): string {
  return 'DENY'
}

// 引用策略
export function getReferrerPolicy(): string {
  return 'strict-origin-when-cross-origin'
}

// 权限策略
export function getPermissionsPolicy(): Record<string, string[]> {
  return {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
  }
}
