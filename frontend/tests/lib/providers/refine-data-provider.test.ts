/**
 * Refine Data Provider 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dataProvider } from '@/lib/providers/refine-data-provider'

// Mock axios - 因为 refine-data-provider 直接使用 axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
  },
  create: vi.fn(),
}))

import axios from 'axios'

describe('Refine Data Provider', () => {
  let mockAxiosInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:3000/v1'
    // Mock localStorage to return null (no token)
    if (global.localStorage) {
      global.localStorage.getItem.mockReturnValue(null)
    }

    // Create a fresh mock instance for each test
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }

    vi.mocked(axios.default).create.mockReturnValue(mockAxiosInstance)
    vi.mocked(axios).create.mockReturnValue(mockAxiosInstance)
  })

  describe('getList', () => {
    it('should fetch list of users with pagination', async () => {
      const mockResponse = {
        data: {
          users: [
            { id: '1', username: 'user1', email: 'user1@test.com' },
            { id: '2', username: 'user2', email: 'user2@test.com' },
          ],
          total: 2,
        },
        success: true,
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
      })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/admin/users',
        { params: { page: 1, page_size: 20 } }
      )
    })

    it('should handle comments list with status filter', async () => {
      const mockResponse = {
        data: {
          comments: [
            { id: '1', content: 'Comment 1', status: 'pending' },
            { id: '2', content: 'Comment 2', status: 'approved' },
          ],
          total: 2,
        },
        success: true,
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/comments',
        pagination: { current: 1, pageSize: 10 },
        filters: [{ field: 'status', operator: 'eq', value: 'pending' }],
      })

      expect(result.data).toHaveLength(2)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/admin/comments',
        { params: { page: 1, page_size: 10, status: 'pending' } }
      )
    })

    it('should handle admin/stats resource', async () => {
      const mockResponse = {
        data: {
          total_users: 100,
          total_comments: 500,
          pending_comments: 10,
          approved_comments: 490,
        },
        success: true,
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/stats',
        pagination: { current: 1, pageSize: 1 },
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(mockResponse.data)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/stats')
    })

    it('should handle empty list', async () => {
      const mockResponse = {
        data: { users: [], total: 0 },
        success: true,
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
      })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle errors', async () => {
      const error = new Error('Network error')
      mockAxiosInstance.get.mockRejectedValue(error)

      await expect(
        dataProvider.getList({
          resource: 'admin/users',
          pagination: { current: 1, pageSize: 20 },
        })
      ).rejects.toThrow('Network error')
    })

    it('should handle sorting', async () => {
      const mockResponse = {
        data: { users: [], total: 0 },
        success: true,
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
        sorters: [{ field: 'username', order: 'asc' }],
      })

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/admin/users',
        { params: { page: 1, page_size: 20, sort: 'username' } }
      )
    })
  })

  describe('getOne', () => {
    it('should fetch single user', async () => {
      const mockResponse = {
        data: { id: '1', username: 'user1', email: 'user1@test.com' },
        success: true,
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await dataProvider.getOne({
        resource: 'admin/users',
        id: '1',
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/users/1')
    })

    it('should handle errors', async () => {
      const error = new Error('User not found')
      mockAxiosInstance.get.mockRejectedValue(error)

      await expect(
        dataProvider.getOne({
          resource: 'admin/users',
          id: '999',
        })
      ).rejects.toThrow('User not found')
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const newUser = { username: 'newuser', email: 'newuser@test.com' }
      const mockResponse = {
        data: { id: '3', ...newUser },
        success: true,
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await dataProvider.create({
        resource: 'admin/users',
        variables: newUser,
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/admin/users',
        newUser
      )
    })
  })

  describe('update', () => {
    it('should update user role', async () => {
      const mockRoleResponse = {
        data: { id: '1', username: 'user1', role: 'admin' },
        success: true,
      }

      mockAxiosInstance.put.mockResolvedValue({ data: {}, success: true })
      mockAxiosInstance.get.mockResolvedValue(mockRoleResponse)

      const result = await dataProvider.update({
        resource: 'admin/users',
        id: '1',
        variables: { role: 'admin' },
      })

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/admin/users/1/role',
        { role: 'admin' }
      )
      expect(result.data).toEqual(mockRoleResponse.data)
    })

    it('should update comment status', async () => {
      const mockStatusResponse = {
        data: { id: '1', content: 'Comment', status: 'approved' },
        success: true,
      }

      mockAxiosInstance.put.mockResolvedValue({ data: {}, success: true })
      mockAxiosInstance.get.mockResolvedValue(mockStatusResponse)

      const result = await dataProvider.update({
        resource: 'admin/comments',
        id: '1',
        variables: { status: 'approved' },
      })

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/admin/comments/1/status',
        { status: 'approved' }
      )
      expect(result.data).toEqual(mockStatusResponse.data)
    })

    it('should handle standard update', async () => {
      const updateData = { username: 'updateduser' }
      const mockResponse = {
        data: { id: '1', ...updateData },
        success: true,
      }

      mockAxiosInstance.put.mockResolvedValue(mockResponse)

      const result = await dataProvider.update({
        resource: 'admin/users',
        id: '1',
        variables: updateData,
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/admin/users/1',
        updateData
      )
    })
  })

  describe('deleteOne', () => {
    it('should delete a user', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {}, success: true })

      const result = await dataProvider.deleteOne({
        resource: 'admin/users',
        id: '1',
      })

      expect(result.data).toEqual({ id: '1' })
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/admin/users/1')
    })

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed')
      mockAxiosInstance.delete.mockRejectedValue(error)

      await expect(
        dataProvider.deleteOne({
          resource: 'admin/users',
          id: '1',
        })
      ).rejects.toThrow('Delete failed')
    })
  })

  describe('custom', () => {
    it('should handle custom GET request', async () => {
      const mockResponse = {
        data: { custom: 'data' },
        success: true,
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await dataProvider.custom({
        url: '/custom/endpoint',
        method: 'GET',
        query: { param: 'value' },
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/custom/endpoint',
        { headers: {} }
      )
    })

    it('should handle custom POST request', async () => {
      const payload = { action: 'custom' }
      const mockResponse = {
        data: { result: 'success' },
        success: true,
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await dataProvider.custom({
        url: '/custom/action',
        method: 'POST',
        payload,
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/custom/action',
        payload,
        { headers: {} }
      )
    })
  })

  describe('getApiUrl', () => {
    it('should return correct API URL', () => {
      const url = dataProvider.getApiUrl()
      expect(url).toBe('http://localhost:3000/v1')
    })
  })
})
