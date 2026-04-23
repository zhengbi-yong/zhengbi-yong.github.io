import { CACHE_REGISTRY as caches } from '../cache/CacheManager'
import { AppError, ErrorType, ErrorSeverity } from '../error-handler'
import { logger } from '../utils/logger'
import { CSRFTokenManager } from '../security'

// GOLDEN_RULES 1.1: 认证令牌必须仅存在于 HttpOnly Cookie 中
// 前端不存储、不读取、不操作任何认证令牌
// 所有请求通过 credentials: 'include' 自动携带 Cookie

interface RequestOptions extends Omit<RequestInit, 'cache'> {
  cache?: boolean | number // false = 不缓存, true = 使用默认缓存, number = 缓存时间（毫秒）
  retries?: number // 重试次数
  retryDelay?: number // 重试延迟（毫秒）
  timeout?: number // 超时时间（毫秒）
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

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  // GOLDEN_RULES 1.1: 不再从 localStorage 读取令牌
  // 所有认证通过 HttpOnly Cookie 自动发送
  private getRequestHeaders(): Record<string, string> {
    return { ...this.defaultHeaders }
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

  // 核心请求方法
  // GOLDEN_RULES 1.1: 不再处理 token 刷新，401 错误直接抛出
  // HttpOnly Cookie 的刷新由后端处理
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = true,
      retries = 0,
      retryDelay = 1000,
      timeout = 30000,
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
            // GOLDEN_RULES 1.2: CSRF 双重提交 Cookie - 写操作必须带 X-CSRF-Token
            ...(['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
              ? CSRFTokenManager.getHeaders()
              : {}),
          },
          signal: controller.signal,
          credentials: 'include', // GOLDEN_RULES: 自动发送 HttpOnly Cookie
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
              // errorData.error 可以是对象 { code, message, type } 或字符串
              errorMessage =
                typeof errorData.error === 'string'
                  ? errorData.error
                  : errorData.error.message ||
                    errorData.error.code ||
                    JSON.stringify(errorData.error)
            } else if (errorData.message) {
              errorMessage = this.translateErrorMessage(errorData.message)
            }
          } catch {
            // 如果无法解析 JSON，使用默认错误消息
          }

          // 401 错误直接抛出，让调用方处理登录跳转
          // 不再尝试刷新 token (GOLDEN_RULES 1.1)
          throw new AppError(
            errorMessage,
            this.getErrorType(response.status),
            ErrorSeverity.HIGH,
            {
              status: response.status,
              statusText: response.statusText,
              url,
              attempt: attempt + 1,
            },
            response.status
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
          // 401 错误不再重试
          if (error.statusCode === 401) {
            throw error
          }
        }

        // 如果是中止错误（超时），准备重试
        if (error instanceof Error && error.name === 'AbortError') {
          logger.warn(`Request timeout (attempt ${attempt + 1}/${retries + 1})`)
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
