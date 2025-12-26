/**
 * Refine Data Provider
 * 适配现有的后端 API 结构
 */

import { DataProvider } from '@refinedev/core'
import { api } from '@/lib/api/apiClient'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1'

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    // 特殊处理 admin/stats - 返回单个对象而不是列表
    if (resource === 'admin/stats') {
      try {
        const response = await api.get(`${BACKEND_API_URL}/admin/stats`, { cache: false })
        return {
          data: [response.data], // 包装成数组以符合列表格式
          total: 1,
        }
      } catch (error: any) {
        throw new Error(error?.message || 'Failed to fetch stats')
      }
    }

    const { current = 1, pageSize = 10 } = pagination ?? {}
    
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('page', current.toString())
    params.append('page_size', pageSize.toString())
    
    // 处理筛选
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        if ('field' in filter && 'value' in filter && filter.value !== undefined && filter.value !== null) {
          // 对于 status 筛选，直接添加到查询参数
          if (filter.field === 'status') {
            params.append('status', String(filter.value))
          } else {
            params.append(filter.field, String(filter.value))
          }
        }
      })
    }
    
    // 处理排序
    if (sorters && sorters.length > 0) {
      const sorter = sorters[0]
      if (sorter.order) {
        params.append('sort', sorter.order === 'asc' ? sorter.field : `-${sorter.field}`)
      }
    }
    
    // 构建 URL - 资源名称直接作为路径（如 admin/users -> /admin/users）
    let url = `${BACKEND_API_URL}/${resource}`
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    try {
      const response = await api.get<{ data?: any[]; users?: any[]; comments?: any[]; total: number }>(url, { cache: false })
      
      // 处理不同的响应格式
      let data: any[] = []
      if (response.data.data) {
        data = response.data.data
      } else if (response.data.users) {
        data = response.data.users
      } else if (response.data.comments) {
        data = response.data.comments
      } else if (Array.isArray(response.data)) {
        data = response.data
      }
      
      return {
        data,
        total: response.data.total || data.length,
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch list')
    }
  },

  getOne: async ({ resource, id, meta }) => {
    try {
      const response = await api.get(`${BACKEND_API_URL}/${resource}/${id}`, { cache: false })
      return {
        data: response.data,
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch resource')
    }
  },

  create: async ({ resource, variables, meta }) => {
    try {
      const response = await api.post(`${BACKEND_API_URL}/${resource}`, variables, { cache: false })
      return {
        data: response.data,
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to create resource')
    }
  },

  update: async ({ resource, id, variables, meta }) => {
    try {
      // 对于 admin/users/{id}/role 这样的特殊端点
      if (resource === 'admin/users' && variables.role) {
        await api.put(`${BACKEND_API_URL}/${resource}/${id}/role`, { role: variables.role }, { cache: false })
        // 获取更新后的用户信息
        const userResponse = await api.get(`${BACKEND_API_URL}/${resource}/${id}`, { cache: false })
        return {
          data: userResponse.data,
        }
      }
      
      // 对于 admin/comments/{id}/status 这样的特殊端点
      if (resource === 'admin/comments' && variables.status) {
        await api.put(`${BACKEND_API_URL}/${resource}/${id}/status`, { status: variables.status }, { cache: false })
        // 获取更新后的评论信息
        const commentResponse = await api.get(`${BACKEND_API_URL}/${resource}/${id}`, { cache: false })
        return {
          data: commentResponse.data,
        }
      }
      
      // 标准更新
      const response = await api.put(`${BACKEND_API_URL}/${resource}/${id}`, variables, { cache: false })
      return {
        data: response.data,
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update resource')
    }
  },

  deleteOne: async ({ resource, id, meta }) => {
    try {
      await api.delete(`${BACKEND_API_URL}/${resource}/${id}`, { cache: false })
      return {
        data: { id },
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to delete resource')
    }
  },

  getApiUrl: () => {
    return BACKEND_API_URL
  },

  // 自定义方法，用于适配特殊的 API 端点
  custom: async ({ url, method, filters, sorters, payload, query, headers, meta }) => {
    let requestUrl = url.startsWith('http') ? url : `${BACKEND_API_URL}${url}`
    
    // 添加查询参数
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
    
    const options: any = {
      cache: false,
      headers: headers || {},
    }
    
    try {
      let response
      switch (method) {
        case 'GET':
          response = await api.get(requestUrl, options)
          break
        case 'POST':
          response = await api.post(requestUrl, payload, options)
          break
        case 'PUT':
          response = await api.put(requestUrl, payload, options)
          break
        case 'PATCH':
          response = await api.patch(requestUrl, payload, options)
          break
        case 'DELETE':
          response = await api.delete(requestUrl, options)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }
      
      return {
        data: response.data,
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Custom request failed')
    }
  },
}

