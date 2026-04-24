/**
 * Refine Data Provider
 * 适配现有的后端 API 结构
 *
 * GOLDEN_RULES 2.1: Client Components 必须走 /api/v1/* Route Handler (BFF)
 * - 不再直接调用后端 (http://192.168.0.161:3000)
 * - 所有请求走 BFF 代理，由 Next.js Route Handler 转发
 * - credentials: 'include' 自动携带浏览器 Cookie 到同源 BFF
 *
 * GOLDEN_RULES 1.1: 认证令牌必须仅存在于 HttpOnly Cookie 中
 * - 不再从 localStorage 读取或存储 token
 * - 浏览器自动发送 HttpOnly Cookie 到 BFF，BFF 透传 Cookie 到后端
 */
 

import { DataProvider } from '@refinedev/core'
import { resolveBackendApiBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

// GOLDEN_RULES 2.1: 使用 /api/v1 BFF 路径，而非直接调后端
// resolveBackendApiBaseUrl() 在客户端环境返回 '/api/v1'
const BFF_API_URL = resolveBackendApiBaseUrl()

async function bffFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BFF_API_URL}${path}`
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // GOLDEN_RULES 1.1: 自动发送 HttpOnly Cookie 到同源 BFF
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
      statusCode: number
    }
    error.statusCode = response.status
    try {
      const data = await response.json()
      error.message = data.error?.message || data.message || error.message
    } catch {
      // use default message
    }
    throw error
  }

  return response.json()
}

// 辅助函数：创建符合 Refine HttpError 接口的错误对象
const createHttpError = (
  statusCode: number,
  message: string,
  errors?: Record<string, unknown>
): { message: string; statusCode: number; errors?: Record<string, unknown> } => {
  const error = new Error(message) as Error & {
    statusCode: number
    errors?: Record<string, unknown>
  }
  error.statusCode = statusCode
  if (errors) {
    error.errors = errors
  }
  return error
}

// API 响应数据接口
interface ApiResponse {
  data?: unknown
  users?: unknown[]
  comments?: unknown[]
  posts?: unknown[]
  total?: number
  [key: string]: unknown
}

// 构建带查询参数的路径
function buildPath(resource: string, params?: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) return `/${resource}`
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }
  const query = searchParams.toString()
  return query ? `/${resource}?${query}` : `/${resource}`
}

// 创建 dataProvider 对象
export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    // 特殊处理 admin/stats
    if (resource === 'admin/stats') {
      const data = await bffFetch<ApiResponse>('/admin/stats')
      return {
        data: [data.data] as any,
        total: 1,
      }
    }

    const current = (pagination as any)?.current ?? 1
    const pageSize = (pagination as any)?.pageSize ?? 10

    const params: Record<string, string | number> = {
      page: current,
      page_size: pageSize,
    }

    // 处理筛选
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        if (
          'field' in filter &&
          'value' in filter &&
          filter.value !== undefined &&
          filter.value !== null
        ) {
          if (filter.field === 'status') {
            params.status = String(filter.value)
          } else {
            params[filter.field] = String(filter.value)
          }
        }
      }
    }

    // 处理排序
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0]
      if (sorter.order) {
        params.sort = sorter.order === 'asc' ? sorter.field : `-${sorter.field}`
      }
    }

    try {
      const response = await bffFetch<ApiResponse>(buildPath(resource, params))

      // 处理不同的响应格式
      let data: unknown[] = []
      if (response.data) {
        data = response.data as unknown[]
      } else if (response.users) {
        data = response.users as unknown[]
      } else if (response.comments) {
        data = response.comments as unknown[]
      } else if (response.posts) {
        data = response.posts as unknown[]
      } else if (Array.isArray(response)) {
        data = response as unknown[]
      }

      return {
        data: data as any,
        total: response.total ?? data.length,
      }
    } catch (error) {
      const err = error as { statusCode?: number; message?: string }
      throw createHttpError(
        err.statusCode || 500,
        err.message || 'Unknown Error'
      )
    }
  },

  getOne: async ({ resource, id }) => {
    try {
      const data = await bffFetch<ApiResponse>(`/${resource}/${id}`)
      return {
        data: data as any,
      }
    } catch (error) {
      const err = error as { statusCode?: number; message?: string }
      throw createHttpError(
        err.statusCode || 500,
        err.message || 'Unknown Error'
      )
    }
  },

  create: async ({ resource, variables }) => {
    try {
      const data = await bffFetch<ApiResponse>(`/${resource}`, {
        method: 'POST',
        body: JSON.stringify(variables),
      })
      return {
        data: data as any,
      }
    } catch (error) {
      const err = error as { statusCode?: number; message?: string }
      throw createHttpError(
        err.statusCode || 500,
        err.message || 'Unknown Error'
      )
    }
  },

  update: async ({ resource, id, variables }) => {
    try {
      // 对于 admin/users/{id}/role 这样的特殊端点
      if (resource === 'admin/users' && variables && 'role' in (variables as any)) {
        await bffFetch(`/${resource}/${id}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role: (variables as any).role }),
        })
        const userResponse = await bffFetch<ApiResponse>(`/${resource}/${id}`)
        return {
          data: userResponse as any,
        }
      }

      // 对于 admin/comments/{id}/status 这样的特殊端点
      if (resource === 'admin/comments' && variables && 'status' in (variables as any)) {
        await bffFetch(`/${resource}/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: (variables as any).status }),
        })
        return {
          data: { id, status: (variables as any).status } as any,
        }
      }

      // 标准更新
      const data = await bffFetch<ApiResponse>(`/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(variables),
      })
      return {
        data: data as any,
      }
    } catch (error) {
      const err = error as { statusCode?: number; message?: string }
      throw createHttpError(
        err.statusCode || 500,
        err.message || 'Unknown Error'
      )
    }
  },

  deleteOne: async ({ resource, id }) => {
    try {
      await bffFetch(`/${resource}/${id}`, { method: 'DELETE' })
      return {
        data: { id } as any,
      }
    } catch (error) {
      const err = error as { statusCode?: number; message?: string }
      throw createHttpError(
        err.statusCode || 500,
        err.message || 'Unknown Error'
      )
    }
  },

  updateMany: async ({ resource, ids, variables }) => {
    try {
      await Promise.all(
        ids.map((id) =>
          bffFetch(`/${resource}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(variables),
          })
        )
      )
      return {
        data: ids as any,
      }
    } catch (error) {
      const err = error as { statusCode?: number; message?: string }
      throw createHttpError(
        err.statusCode || 500,
        err.message || 'Unknown Error'
      )
    }
  },

  deleteMany: async ({ resource, ids }) => {
    try {
      await Promise.all(
        ids.map((id) => bffFetch(`/${resource}/${id}`, { method: 'DELETE' }))
      )
      return {
        data: ids as any,
      }
    } catch (error) {
      const err = error as { statusCode?: number; message?: string }
      throw createHttpError(
        err.statusCode || 500,
        err.message || 'Unknown Error'
      )
    }
  },

  getApiUrl: () => BFF_API_URL,

  custom: async ({ url, method, payload, query, headers }) => {
    // GOLDEN_RULES 2.1: 必须走 /api/v1 BFF
    // 禁止使用完整 URL 直接调后端
    let requestPath = url.startsWith('/') ? url : `/${url}`

    if (query) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const queryStr = params.toString()
      if (queryStr) {
        requestPath += `?${queryStr}`
      }
    }

    const response = await bffFetch<ApiResponse>(requestPath, {
      method: method?.toUpperCase() || 'GET',
      body: payload ? JSON.stringify(payload) : undefined,
      headers,
    })

    return {
      data: response as any,
    }
  },
}
