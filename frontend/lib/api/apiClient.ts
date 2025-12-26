import { caches } from '../cache/CacheManager'
import { AppError, ErrorType } from '../error-handler'
import { refreshAccessToken } from './backend'

interface RequestOptions extends Omit<RequestInit, 'cache'> {
  cache?: boolean | number // false = 不缓存, true = 使用默认缓存, number = 缓存时间（毫秒）
  retries?: number // 重试次数
  retryDelay?: number // 重试延迟（毫秒）
  timeout?: number // 超时时间（毫秒）
  skipAuthRefresh?: boolean // 跳过自动刷新token
}

interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
  error?: string
}

class APIClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private isRefreshing: boolean = false
  private refreshSubscribers: Array<(token: string) => void> = []

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  // 获取当前的请求头（动态添加 Authorization）
  private getRequestHeaders(): Record<string, string> {
    const headers = { ...this.defaultHeaders }

    // 动态从 localStorage 获取 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  // 翻译后端错误消息为中文
  private translateErrorMessage(message: string): string {
    const errorMap: Record<string, string> = {
      'Invalid credentials': '邮箱或密码错误',
      'Invalid token': '登录已过期，请重新登录',
      'Token expired': '登录已过期，请重新登录',
      'Missing refresh token': '请先登录',
      'Email already exists': '该邮箱已被注册',
      'Username already exists': '该用户名已被使用',
      'User not found': '用户不存在',
      'Post not found': '文章不存在',
      'Comment not found': '评论不存在',
      'Empty comment': '评论内容不能为空',
      'Comment too long': '评论内容过长',
      'Comment too deep': '评论层级过深',
      'Invalid input': '输入内容无效',
      'Rate limit exceeded': '请求过于频繁，请稍后再试',
      'Internal server error': '服务器错误，请稍后重试',
    }

    return errorMap[message] || message
  }

  // 订阅token刷新事件
  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback)
  }

  // 取消订阅并通知所有订阅者
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token))
    this.refreshSubscribers = []
  }

  // 生成缓存键
  private getCacheKey(url: string, options?: RequestOptions): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  // 创建超时控制器
  private createTimeoutController(timeout: number): {
    controller: AbortController
    timeoutId: NodeJS.Timeout
  } {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    return { controller, timeoutId }
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // 处理401错误，尝试刷新token
  private async handle401Error(): Promise<boolean> {
    // 如果正在刷新token，等待刷新完成
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.subscribeTokenRefresh((token) => {
          this.setDefaultHeader('Authorization', `Bearer ${token}`)
          resolve(true)
        })
      })
    }

    // 开始刷新token
    this.isRefreshing = true
    try {
      const newToken = await refreshAccessToken()
      this.setDefaultHeader('Authorization', `Bearer ${newToken}`)
      this.onTokenRefreshed(newToken)
      return true
    } catch (error) {
      // 刷新失败，清除认证信息
      this.removeDefaultHeader('Authorization')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_info')
      }
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  // 核心请求方法
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = true,
      retries = 0,
      retryDelay = 1000,
      timeout = 30000, // 增加到30秒
      skipAuthRefresh = false,
      headers = {},
      ...fetchOptions
    } = options

    const url = `${this.baseURL}${endpoint}`
    const method = fetchOptions.method || 'GET'

    // 检查缓存（仅对 GET 请求）
    if (method === 'GET' && cache) {
      const cacheKey = this.getCacheKey(url, options)
      const cachedData = caches.api.get(cacheKey)
      if (cachedData) {
        return cachedData
      }
    }

    let lastError: Error | null = null
    let attempt401Handled = false

    // 重试逻辑
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 创建超时控制器
        const { controller, timeoutId } = this.createTimeoutController(timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...this.getRequestHeaders(),
            ...headers,
          },
          signal: controller.signal,
          credentials: 'include', // 发送 cookie
        })

        // 清除超时
        clearTimeout(timeoutId)

        // 检查响应状态
        if (!response.ok) {
          // 尝试读取响应体中的错误信息
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            } else if (errorData.message) {
              errorMessage = this.translateErrorMessage(errorData.message)
            }
          } catch {
            // 如果无法解析 JSON，使用默认错误消息
          }

          // 处理401未授权错误 - 但跳过登录/注册接口的401（这些表示凭证错误，不是token过期）
          const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
          if (response.status === 401 && !skipAuthRefresh && !attempt401Handled && !isAuthEndpoint) {
            const refreshSuccess = await this.handle401Error()
            if (refreshSuccess) {
              attempt401Handled = true
              // 用新token重试请求
              continue
            }
          }

          throw new AppError(
            errorMessage,
            this.getErrorType(response.status),
            'HIGH' as any,
            {
              status: response.status,
              statusText: response.statusText,
              url,
              attempt: attempt + 1,
            }
          )
        }

        // 解析响应
        // 对于 204 No Content，响应体为空，直接返回 undefined
        const data = response.status === 204 ? undefined : await response.json()
        const result: ApiResponse<T> = {
          data,
          success: true,
        }

        // 缓存成功的响应（仅对 GET 请求）
        if (method === 'GET' && cache) {
          const cacheKey = this.getCacheKey(url, options)
          const ttl = typeof cache === 'number' ? cache : undefined
          caches.api.set(cacheKey, result, ttl)
        }

        return result
      } catch (error) {
        lastError = error as Error

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === retries) {
          throw lastError
        }

        // 某些错误不应该重试
        if (error instanceof AppError) {
          if (error.type === ErrorType.VALIDATION) {
            throw error
          }
          // 401错误已经处理过，不再重试
          if (error.statusCode === 401) {
            throw error
          }
        }

        // 如果是中止错误（超时），准备重试
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`Request timeout (attempt ${attempt + 1}/${retries + 1})`)
        }

        // 等待后重试
        await this.delay(retryDelay * Math.pow(2, attempt))
      }
    }

    // 理论上不会执行到这里
    throw lastError
  }

  // 根据状态码获取错误类型
  private getErrorType(status: number): ErrorType {
    if (status >= 400 && status < 500) {
      switch (status) {
        case 400:
          return ErrorType.VALIDATION
        case 401:
          return ErrorType.AUTHENTICATION
        case 403:
          return ErrorType.AUTHORIZATION
        case 404:
          return ErrorType.NOT_FOUND
        default:
          return ErrorType.CLIENT
      }
    } else if (status >= 500) {
      return ErrorType.SERVER
    }
    return ErrorType.UNKNOWN
  }

  // HTTP 方法包装器
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // 设置默认请求头
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value
  }

  // 移除默认请求头
  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key]
  }

  // 清除所有缓存
  clearCache(): void {
    caches.api.clear()
  }
}

// 创建默认实例
export const apiClient = new APIClient()

// 便捷方法
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => apiClient.get<T>(endpoint, options),
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient.post<T>(endpoint, data, options),
  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient.put<T>(endpoint, data, options),
  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient.patch<T>(endpoint, data, options),
  delete: <T>(endpoint: string, options?: RequestOptions) => apiClient.delete<T>(endpoint, options),
}
