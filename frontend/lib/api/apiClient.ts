import { caches } from '../cache/CacheManager'
import { AppError, ErrorType } from '../error-handler'

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
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = true,
      retries = 0,
      retryDelay = 1000,
      timeout = 10000,
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
            ...this.defaultHeaders,
            ...headers,
          },
          signal: controller.signal,
        })

        // 清除超时
        clearTimeout(timeoutId)

        // 检查响应状态
        if (!response.ok) {
          throw new AppError(
            `HTTP ${response.status}: ${response.statusText}`,
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
        const data = await response.json()
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
          if (error.type === ErrorType.VALIDATION || error.statusCode === 401) {
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
