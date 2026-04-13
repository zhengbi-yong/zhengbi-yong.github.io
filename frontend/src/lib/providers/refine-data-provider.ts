/**
 * Refine Data Provider
 * 适配现有的后端 API 结构
 *
 * GOLDEN_RULES 1.1: 认证令牌必须仅存在于 HttpOnly Cookie 中
 * - 不再从 localStorage 读取或存储 token
 * - 使用 withCredentials: true 自动发送 HttpOnly Cookie
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataProvider } from '@refinedev/core'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { resolveBackendApiBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

const BACKEND_API_URL = resolveBackendApiBaseUrl()

// 创建自定义的 axios 实例
// GOLDEN_RULES 1.1: 使用 withCredentials 发送 HttpOnly Cookie
const customAxios = axios.create({
  baseURL: BACKEND_API_URL,
  withCredentials: true,
})

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

// 创建 dataProvider 对象
export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    // 特殊处理 admin/stats
    if (resource === 'admin/stats') {
      const response = await customAxios.get<ApiResponse>('/admin/stats')
      return {
        data: [response.data.data] as any,
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
      const response = await customAxios.get<ApiResponse>(`/${resource}`, { params })

      // 处理不同的响应格式
      let data: unknown[] = []
      if (response.data.data) {
        data = response.data.data as unknown[]
      } else if (response.data.users) {
        data = response.data.users as unknown[]
      } else if (response.data.comments) {
        data = response.data.comments as unknown[]
      } else if (response.data.posts) {
        data = response.data.posts as unknown[]
      } else if (Array.isArray(response.data)) {
        data = response.data as unknown[]
      }

      return {
        data: data as any,
        total: response.data.total ?? data.length,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },

  getOne: async ({ resource, id }) => {
    try {
      const response = await customAxios.get<ApiResponse>(`/${resource}/${id}`)
      return {
        data: response.data as any,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },

  create: async ({ resource, variables }) => {
    try {
      const response = await customAxios.post<ApiResponse>(`/${resource}`, variables as any)
      return {
        data: response.data as any,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },

  update: async ({ resource, id, variables }) => {
    try {
      // 对于 admin/users/{id}/role 这样的特殊端点
      if (resource === 'admin/users' && variables && 'role' in (variables as any)) {
        await customAxios.put(`/${resource}/${id}/role`, { role: (variables as any).role })
        const userResponse = await customAxios.get<ApiResponse>(`/${resource}/${id}`)
        return {
          data: userResponse.data as any,
        }
      }

      // 对于 admin/comments/{id}/status 这样的特殊端点
      if (resource === 'admin/comments' && variables && 'status' in (variables as any)) {
        await customAxios.put(`/${resource}/${id}/status`, { status: (variables as any).status })
        return {
          data: { id, status: (variables as any).status } as any,
        }
      }

      // 标准更新
      const response = await customAxios.put<ApiResponse>(`/${resource}/${id}`, variables as any)
      return {
        data: response.data as any,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },

  deleteOne: async ({ resource, id }) => {
    try {
      await customAxios.delete(`/${resource}/${id}`)
      return {
        data: { id } as any,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },

  updateMany: async ({ resource, ids, variables }) => {
    try {
      await Promise.all(ids.map((id) => customAxios.put(`/${resource}/${id}`, variables as any)))
      return {
        data: ids as any,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },

  deleteMany: async ({ resource, ids }) => {
    try {
      await Promise.all(ids.map((id) => customAxios.delete(`/${resource}/${id}`)))
      return {
        data: ids as any,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },

  getApiUrl: () => {
    return BACKEND_API_URL
  },

  custom: async ({ url, method, payload, query, headers }) => {
    let requestUrl = url.startsWith('http') ? url : `${BACKEND_API_URL}${url}`

    if (query) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      if (params.toString()) {
        requestUrl += `?${params.toString()}`
      }
    }

    try {
      let response: AxiosResponse<ApiResponse>
      switch (method?.toLowerCase()) {
        case 'get':
          response = await customAxios.get<ApiResponse>(requestUrl, {
            headers,
          } as AxiosRequestConfig)
          break
        case 'post':
          response = await customAxios.post<ApiResponse>(requestUrl, payload, {
            headers,
          } as AxiosRequestConfig)
          break
        case 'put':
          response = await customAxios.put<ApiResponse>(requestUrl, payload, {
            headers,
          } as AxiosRequestConfig)
          break
        case 'patch':
          response = await customAxios.patch<ApiResponse>(requestUrl, payload, {
            headers,
          } as AxiosRequestConfig)
          break
        case 'delete':
          response = await customAxios.delete<ApiResponse>(requestUrl, {
            headers,
          } as AxiosRequestConfig)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      return {
        data: response.data as any,
      }
    } catch (error) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } }
      throw createHttpError(
        err.response?.status || 500,
        err.response?.statusText || 'Unknown Error',
        err.response?.data as Record<string, unknown>
      )
    }
  },
}
