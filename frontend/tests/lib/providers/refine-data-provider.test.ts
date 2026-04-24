/**
 * Refine Data Provider 测试
 * Uses bffFetch (native fetch), not axios
 */

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import { dataProvider } from '@/lib/providers/refine-data-provider'

// Mock globalThis.fetch - data provider uses bffFetch which calls fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Suppress console.error noise in tests
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Refine Data Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:3000/v1'
    // Default: network error (no mock set up)
    mockFetch.mockReset()
    mockFetch.mockImplementation(() => Promise.reject(new Error('Not mocked - set up mockFetch in test')))
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  afterAll(() => {
    consoleError.mockRestore()
  })

  // Helper: create a successful fetch Response
  const mockFetchResponse = (data: unknown, ok = true, status = 200) => {
    return Promise.resolve({
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
    })
  }

  describe('getList', () => {
    it('should fetch list of users with pagination', async () => {
      const mockResponse = {
        users: [
          { id: '1', username: 'user1', email: 'user1@test.com' },
          { id: '2', username: 'user2', email: 'user2@test.com' },
        ],
        total: 2,
      }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
      })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle comments list with status filter', async () => {
      const mockResponse = {
        comments: [
          { id: '1', content: 'Comment 1', status: 'pending' },
          { id: '2', content: 'Comment 2', status: 'approved' },
        ],
        total: 2,
      }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.getList({
        resource: 'admin/comments',
        pagination: { current: 1, pageSize: 10 },
        filters: [{ field: 'status', operator: 'eq', value: 'pending' }],
      })

      expect(result.data).toHaveLength(2)
      expect(result.data[0].status).toBe('pending')
    })

    it('should handle admin/stats resource', async () => {
      const mockResponse = {
        total_users: 100,
        total_comments: 500,
        pending_comments: 10,
        approved_comments: 490,
      }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.getList({
        resource: 'admin/stats',
        pagination: { current: 1, pageSize: 1 },
      })

      expect(result.data).toHaveLength(1)
    })

    it('should handle empty list', async () => {
      const mockResponse = { users: [], total: 0 }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
      })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle errors', async () => {
      const error = new Error('HTTP 500: Internal Server Error') as Error & { statusCode: number }
      error.statusCode = 500
      mockFetch.mockRejectedValue(error)

      await expect(
        dataProvider.getList({
          resource: 'admin/users',
          pagination: { current: 1, pageSize: 20 },
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('should handle sorting', async () => {
      const mockResponse = { users: [], total: 0 }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      await dataProvider.getList({
        resource: 'admin/users',
        pagination: { current: 1, pageSize: 20 },
        sorters: [{ field: 'username', order: 'asc' }],
      })

      expect(mockFetch).toHaveBeenCalled()
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('/admin/users')
      expect(url).toContain('sort=username') // Verifies sort param is actually sent
    })
  })

  describe('getOne', () => {
    it('should fetch single user', async () => {
      const mockResponse = { id: '1', username: 'user1', email: 'user1@test.com' }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.getOne({
        resource: 'admin/users',
        id: '1',
      })

      expect(result.data).toEqual(mockResponse)
    })

    it('should handle errors', async () => {
      const error = new Error('HTTP 404: Not Found') as Error & { statusCode: number }
      error.statusCode = 404
      mockFetch.mockRejectedValue(error)

      await expect(
        dataProvider.getOne({
          resource: 'admin/users',
          id: '999',
        })
      ).rejects.toThrow('HTTP 404: Not Found')
    })
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const newUser = { username: 'newuser', email: 'newuser@test.com' }
      const mockResponse = { id: '3', ...newUser }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.create({
        resource: 'admin/users',
        variables: newUser,
      })

      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('update', () => {
    it('should update user role', async () => {
      const mockRoleResponse = { id: '1', username: 'user1', role: 'admin' }
      // PUT /admin/users/1/role then GET /admin/users/1
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse({}))
        .mockResolvedValueOnce(mockFetchResponse(mockRoleResponse))

      const result = await dataProvider.update({
        resource: 'admin/users',
        id: '1',
        variables: { role: 'admin' },
      })

      expect(result.data).toEqual(mockRoleResponse)
      // Check PUT was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/1/role'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('should update comment status', async () => {
      const mockStatusResponse = { id: '1', content: 'Comment', status: 'approved' }
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse({}))
        .mockResolvedValueOnce(mockFetchResponse(mockStatusResponse))

      const result = await dataProvider.update({
        resource: 'admin/comments',
        id: '1',
        variables: { status: 'approved' },
      })

      expect(result.data).toMatchObject({ id: '1', status: 'approved' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/comments/1/status'),
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('should handle standard update', async () => {
      const updateData = { username: 'updateduser' }
      const mockResponse = { id: '1', ...updateData }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.update({
        resource: 'admin/users',
        id: '1',
        variables: updateData,
      })

      expect(result.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/1'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  describe('deleteOne', () => {
    it('should delete a user', async () => {
      mockFetch.mockResolvedValue(mockFetchResponse({}))

      const result = await dataProvider.deleteOne({
        resource: 'admin/users',
        id: '1',
      })

      expect(result.data).toEqual({ id: '1' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should handle delete errors', async () => {
      const error = new Error('HTTP 500: Delete failed') as Error & { statusCode: number }
      error.statusCode = 500
      mockFetch.mockRejectedValue(error)

      await expect(
        dataProvider.deleteOne({
          resource: 'admin/users',
          id: '1',
        })
      ).rejects.toThrow('HTTP 500: Delete failed')
    })
  })

  describe('custom', () => {
    it('should handle custom GET request', async () => {
      const mockResponse = { custom: 'data' }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.custom({
        url: '/custom/endpoint',
        method: 'GET',
        query: { param: 'value' },
      })

      expect(result.data).toEqual(mockResponse)
    })

    it('should handle custom POST request', async () => {
      const payload = { action: 'custom' }
      const mockResponse = { result: 'success' }
      mockFetch.mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await dataProvider.custom({
        url: '/custom/action',
        method: 'POST',
        payload,
      })

      expect(result.data).toEqual(mockResponse)
    })
  })

  describe('getApiUrl', () => {
    it('should return correct API URL', () => {
      const url = dataProvider.getApiUrl()
      expect(url).toContain('localhost:3000')
    })
  })
})
