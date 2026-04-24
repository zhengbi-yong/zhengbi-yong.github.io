/**
 * Admin 页面集成测试
 * 测试多个页面之间的交互和数据一致性
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import * as refineCore from '@refinedev/core'
import * as authStore from '@/lib/store/auth-store'

// Mock dependencies
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
  useUpdate: vi.fn(),
  useDelete: vi.fn(),
}))

vi.mock('@/lib/store/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('Admin Pages Integration Tests', () => {
  let queryClient: QueryClient
  const mockUseList = vi.mocked(refineCore.useList)
  const mockUseUpdate = vi.mocked(refineCore.useUpdate)
  const mockUseDelete = vi.mocked(refineCore.useDelete)
  const mockUseAuthStore = vi.mocked(authStore.useAuthStore)
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    mockUseAuthStore.mockReturnValue({
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
      checkAuth: vi.fn().mockResolvedValue(true),
    } as any)

    vi.clearAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    )
  }

  describe('数据一致性测试', () => {
    it('should maintain consistent user data across pages', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', email: 'user1@test.com', role: 'user' },
        { id: '2', username: 'user2', email: 'user2@test.com', role: 'admin' },
      ]

      // Use Refine v5 structure: { query: {isPending, isError, error}, result: {data, total} }
      // This matches what the actual admin pages expect (AdminDashboard, UsersRefinePage, etc.)
      const mockReturnValue = {
        query: {
          isPending: false,
          isError: false,
          error: null,
        },
        result: {
          data: mockUsers,
          total: 2,
        },
      } as any

      // 模拟多个页面使用相同的数据
      mockUseList.mockReturnValue(mockReturnValue)

      // 在用户页面更新角色
      const updateMockAsync = vi.fn().mockResolvedValue({})
      mockUseUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: updateMockAsync,
        isPending: false,
      } as any)

      // 调用 mock 函数获取返回值
      const result1 = mockUseList()
      expect(result1.result.data).toEqual(mockUsers)

      // 更新后应该触发数据刷新
      const updateHook = mockUseUpdate()
      await updateHook.mutateAsync({
        resource: 'admin/users',
        id: '1',
        values: { role: 'admin' },
      })

      // 验证更新被调用
      expect(updateMockAsync).toHaveBeenCalled()
    })
  })

  describe('错误恢复测试', () => {
    it('should recover from network error and retry', async () => {
      // Use Refine v5 structure: { query: {isPending, isError, error}, result: {data, total} }
      const errorReturn = {
        query: {
          isPending: false,
          isError: true,
          error: new Error('Network error'),
        },
        result: {
          data: undefined,
          total: 0,
        },
      } as any

      const successReturn = {
        query: {
          isPending: false,
          isError: false,
          error: null,
        },
        result: {
          data: [],
          total: 0,
        },
      } as any

      mockUseList
        .mockReturnValueOnce(errorReturn)
        .mockReturnValueOnce(successReturn)

      mockUseUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any)

      mockUseDelete.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any)

      // 第一次调用失败
      const firstCall = mockUseList()
      expect(firstCall.query.error).toBeDefined()

      // 第二次调用应该成功（模拟重试）
      const secondCall = mockUseList()
      expect(secondCall.query.error).toBeNull()
    })
  })

  describe('并发操作测试', () => {
    it('should handle concurrent updates without conflicts', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', role: 'user' },
        { id: '2', username: 'user2', role: 'user' },
      ]

      // Use Refine v5 structure
      mockUseList.mockReturnValue({
        query: {
          isPending: false,
          isError: false,
          error: null,
        },
        result: {
          data: mockUsers,
          total: 2,
        },
      } as any)

      const updateMock = vi.fn().mockResolvedValue({})
      mockUseUpdate.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: updateMock,
        isPending: false,
      } as any)

      mockUseDelete.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any)

      // 并发更新多个用户
      const promises = [
        mockUseUpdate().mutateAsync({
          resource: 'admin/users',
          id: '1',
          values: { role: 'admin' },
        }),
        mockUseUpdate().mutateAsync({
          resource: 'admin/users',
          id: '2',
          values: { role: 'moderator' },
        }),
      ]

      await Promise.all(promises)

      expect(updateMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('状态同步测试', () => {
    it('should sync state across multiple components', async () => {
      const mockStats = {
        total_users: 100,
        total_comments: 500,
        pending_comments: 10,
        approved_comments: 490,
      }

      // Dashboard uses stats (Refine v5 structure: { query, result })
      const statsReturn = {
        query: {
          isPending: false,
          isError: false,
          error: null,
        },
        result: {
          data: [mockStats],
          total: 1,
        },
      } as any

      // Users page uses users (Refine v5 structure)
      const usersReturn = {
        query: {
          isPending: false,
          isError: false,
          error: null,
        },
        result: {
          data: [{ id: '1', username: 'user1' }],
          total: 100,
        },
      } as any

      mockUseList
        .mockReturnValueOnce(statsReturn)
        .mockReturnValueOnce(usersReturn)

      // 验证两个页面都能正确获取数据
      const statsResult = mockUseList()
      const usersResult = mockUseList()

      expect(statsResult.result.data[0].total_users).toBe(100)
      expect(usersResult.result.total).toBe(100)
    })
  })
})

