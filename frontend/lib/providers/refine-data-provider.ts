/**
 * Refine Data Provider
 * 适配现有的后端 API 结构
 */

import { DataProvider } from '@refinedev/core'
import axios from 'axios'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1'

// 创建自定义的 axios 实例，添加拦截器来处理认证
const customAxios = axios.create({
  baseURL: BACKEND_API_URL,
})

// 辅助函数：创建符合 Refine HttpError 接口的错误对象
const createHttpError = (
  statusCode: number,
  message: string,
  errors?: any
): { message: string; statusCode: number; errors?: any } => {
  const error: any = new Error(message)
  error.statusCode = statusCode
  if (errors) {
    error.errors = errors
  }
  return error
}

// 请求拦截器 - 添加 Authorization header
customAxios.interceptors.request.use(
  (config: any) => {
    // 从 localStorage 获取 token
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 创建 dataProvider 对象
export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    // 特殊处理 admin/stats
    if (resource === 'admin/stats') {
      const response = await customAxios.get(`/admin/stats`)
      return {
        data: [response.data],
        total: 1,
      }
    }

    const { current = 1, pageSize = 10 } = pagination ?? {}

    const params: any = {}
    params.page = current
    params.page_size = pageSize

    // 处理筛选
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        if ('field' in filter && 'value' in filter && filter.value !== undefined && filter.value !== null) {
          if (filter.field === 'status') {
            params.status = String(filter.value)
          } else {
            params[filter.field] = String(filter.value)
          }
        }
      })
    }

    // 处理排序
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0]
      if (sorter.order) {
        params.sort = sorter.order === 'asc' ? sorter.field : `-${sorter.field}`
      }
    }

    try {
      console.log('[DataProvider] getList called:', { resource, pagination: { current, pageSize }})
      const response = await customAxios.get(`/${resource}`, { params })
      console.log('[DataProvider] Response status:', response.status)

      // 处理不同的响应格式
      let data: any[] = []
      if (response.data.data) {
        data = response.data.data
      } else if (response.data.users) {
        data = response.data.users
      } else if (response.data.comments) {
        data = response.data.comments
      } else if (response.data.posts) {
        data = response.data.posts
      } else if (Array.isArray(response.data)) {
        data = response.data
      }

      const result = {
        data,
        total: response.data.total || data.length,
      }

      console.log('[DataProvider] Returning:', { dataCount: data.length, total: result.total })

      return result
    } catch (error: any) {
      console.error('[DataProvider] Error:', error)
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },

  getOne: async ({ resource, id, meta }) => {
    try {
      const response = await customAxios.get(`/${resource}/${id}`)
      return {
        data: response.data,
      }
    } catch (error: any) {
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },

  create: async ({ resource, variables, meta }) => {
    try {
      const response = await customAxios.post(`/${resource}`, variables)
      return {
        data: response.data,
      }
    } catch (error: any) {
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },

  update: async ({ resource, id, variables, meta }) => {
    try {
      // 对于 admin/users/{id}/role 这样的特殊端点
      if (resource === 'admin/users' && variables.role) {
        await customAxios.put(`/${resource}/${id}/role`, { role: variables.role })
        const userResponse = await customAxios.get(`/${resource}/${id}`)
        return {
          data: userResponse.data,
        }
      }

      // 对于 admin/comments/{id}/status 这样的特殊端点
      if (resource === 'admin/comments' && variables.status) {
        // 调用更新状态 API
        await customAxios.put(`/${resource}/${id}/status`, { status: variables.status })
        // 返回更新的数据（因为后端没有 GET /admin/comments/{id} 端点，我们手动构造返回数据）
        return {
          data: {
            id,
            status: variables.status,
          },
        }
      }

      // 标准更新
      const response = await customAxios.put(`/${resource}/${id}`, variables)
      return {
        data: response.data,
      }
    } catch (error: any) {
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },

  deleteOne: async ({ resource, id, meta }) => {
    try {
      await customAxios.delete(`/${resource}/${id}`)
      return {
        data: { id },
      }
    } catch (error: any) {
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },

  updateMany: async ({ resource, ids, variables, meta }) => {
    try {
      await Promise.all(
        ids.map((id) => customAxios.put(`/${resource}/${id}`, variables))
      )
      return {
        data: ids,
      }
    } catch (error: any) {
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },

  deleteMany: async ({ resource, ids, meta }) => {
    try {
      await Promise.all(
        ids.map((id) => customAxios.delete(`/${resource}/${id}`))
      )
      return {
        data: ids,
      }
    } catch (error: any) {
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },

  getApiUrl: () => {
    return BACKEND_API_URL
  },

  custom: async ({ url, method, payload, query, headers, meta }) => {
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
      let response
      switch (method) {
        case 'GET':
          response = await customAxios.get(requestUrl, { headers })
          break
        case 'POST':
          response = await customAxios.post(requestUrl, payload, { headers })
          break
        case 'PUT':
          response = await customAxios.put(requestUrl, payload, { headers })
          break
        case 'PATCH':
          response = await customAxios.patch(requestUrl, payload, { headers })
          break
        case 'DELETE':
          response = await customAxios.delete(requestUrl, { headers })
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      return {
        data: response.data,
      }
    } catch (error: any) {
      throw createHttpError(
        error?.response?.status || 500,
        error?.response?.statusText || 'Unknown Error',
        error?.response?.data
      )
    }
  },
}


