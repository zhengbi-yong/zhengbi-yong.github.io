/**
 * Refine Data Provider 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dataProvider } from '@/lib/providers/refine-data-provider'
import { api } from '@/lib/api/apiClient'

// Mock API client
vi.mock('@/lib/api/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('Refine Data Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 设置默认环境变量
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:3000/v1'
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
      })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(api.get).toHaveBeenCalledWith(
        'http://localhost:3000/v1/admin/users?page=1&page_size=20',
        { cache: false }
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

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/comments',
        pagination: { current: 1, pageSize: 10 },
        filters: [{ field: 'status', operator: 'eq', value: 'pending' }],
      })

      expect(result.data).toHaveLength(2)
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('status=pending'),
        { cache: false }
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

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/stats',
        pagination: { current: 1, pageSize: 1 },
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(mockResponse.data)
      expect(api.get).toHaveBeenCalledWith('http://localhost:3000/v1/admin/stats', { cache: false })
    })

    it('should handle empty list', async () => {
      const mockResponse = {
        data: { users: [], total: 0 },
        success: true,
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
      })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle errors', async () => {
      const error = new Error('Network error')
      vi.mocked(api.get).mockRejectedValue(error)

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

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
        sorters: [{ field: 'username', order: 'asc' }],
      })

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('sort=username'),
        { cache: false }
      )
    })
  })

  describe('getOne', () => {
    it('should fetch single user', async () => {
      const mockResponse = {
        data: { id: '1', username: 'user1', email: 'user1@test.com' },
        success: true,
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await dataProvider.getOne({
        resource: 'admin/users',
        id: '1',
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(api.get).toHaveBeenCalledWith(
        'http://localhost:3000/v1/admin/users/1',
        { cache: false }
      )
    })

    it('should handle errors', async () => {
      const error = new Error('User not found')
      vi.mocked(api.get).mockRejectedValue(error)

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

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await dataProvider.create({
        resource: 'admin/users',
        variables: newUser,
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(api.post).toHaveBeenCalledWith(
        'http://localhost:3000/v1/admin/users',
        newUser,
        { cache: false }
      )
    })
  })

  describe('update', () => {
    it('should update user role', async () => {
      const mockRoleResponse = {
        data: { id: '1', username: 'user1', role: 'admin' },
        success: true,
      }

      vi.mocked(api.put).mockResolvedValue({ data: {}, success: true })
      vi.mocked(api.get).mockResolvedValue(mockRoleResponse)

      const result = await dataProvider.update({
        resource: 'admin/users',
        id: '1',
        variables: { role: 'admin' },
      })

      expect(api.put).toHaveBeenCalledWith(
        'http://localhost:3000/v1/admin/users/1/role',
        { role: 'admin' },
        { cache: false }
      )
      expect(result.data).toEqual(mockRoleResponse.data)
    })

    it('should update comment status', async () => {
      const mockStatusResponse = {
        data: { id: '1', content: 'Comment', status: 'approved' },
        success: true,
      }

      vi.mocked(api.put).mockResolvedValue({ data: {}, success: true })
      vi.mocked(api.get).mockResolvedValue(mockStatusResponse)

      const result = await dataProvider.update({
        resource: 'admin/comments',
        id: '1',
        variables: { status: 'approved' },
      })

      expect(api.put).toHaveBeenCalledWith(
        'http://localhost:3000/v1/admin/comments/1/status',
        { status: 'approved' },
        { cache: false }
      )
      expect(result.data).toEqual(mockStatusResponse.data)
    })

    it('should handle standard update', async () => {
      const updateData = { username: 'updateduser' }
      const mockResponse = {
        data: { id: '1', ...updateData },
        success: true,
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const result = await dataProvider.update({
        resource: 'admin/users',
        id: '1',
        variables: updateData,
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(api.put).toHaveBeenCalledWith(
        'http://localhost:3000/v1/admin/users/1',
        updateData,
        { cache: false }
      )
    })
  })

  describe('deleteOne', () => {
    it('should delete a user', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: {}, success: true })

      const result = await dataProvider.deleteOne({
        resource: 'admin/users',
        id: '1',
      })

      expect(result.data).toEqual({ id: '1' })
      expect(api.delete).toHaveBeenCalledWith(
        'http://localhost:3000/v1/admin/users/1',
        { cache: false }
      )
    })

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed')
      vi.mocked(api.delete).mockRejectedValue(error)

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

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await dataProvider.custom({
        url: '/custom/endpoint',
        method: 'GET',
        query: { param: 'value' },
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(api.get).toHaveBeenCalledWith(
        'http://localhost:3000/v1/custom/endpoint?param=value',
        { cache: false, headers: {} }
      )
    })

    it('should handle custom POST request', async () => {
      const payload = { action: 'custom' }
      const mockResponse = {
        data: { result: 'success' },
        success: true,
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await dataProvider.custom({
        url: '/custom/action',
        method: 'POST',
        payload,
      })

      expect(result.data).toEqual(mockResponse.data)
      expect(api.post).toHaveBeenCalledWith(
        'http://localhost:3000/v1/custom/action',
        payload,
        { cache: false, headers: {} }
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

