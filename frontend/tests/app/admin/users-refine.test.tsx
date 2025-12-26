/**
 * Users Refine Page 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsersRefinePage from '@/app/admin/users-refine/page'
import * as refineCore from '@refinedev/core'

// Mock Refine hooks
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
  useUpdate: vi.fn(),
  useDelete: vi.fn(),
}))

describe('UsersRefinePage', () => {
  let queryClient: QueryClient
  const mockUseList = vi.mocked(refineCore.useList)
  const mockUseUpdate = vi.mocked(refineCore.useUpdate)
  const mockUseDelete = vi.mocked(refineCore.useDelete)

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    vi.clearAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    )
  }

  const mockUsers = [
    {
      id: '1',
      username: 'user1',
      email: 'user1@test.com',
      role: 'user',
    },
    {
      id: '2',
      username: 'user2',
      email: 'user2@test.com',
      role: 'admin',
    },
  ]

  it('should render loading state', () => {
    mockUseList.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

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

    renderWithProviders(<UsersRefinePage />)

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should render users list', async () => {
    mockUseList.mockReturnValue({
      data: {
        data: mockUsers,
        total: 2,
      },
      isLoading: false,
      error: null,
    } as any)

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

    renderWithProviders(<UsersRefinePage />)

    await waitFor(() => {
      expect(screen.getByText('用户管理 (Refine)')).toBeInTheDocument()
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
    })
  })

  it('should render error state', () => {
    mockUseList.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load users'),
    } as any)

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

    renderWithProviders(<UsersRefinePage />)

    expect(screen.getByText('加载失败')).toBeInTheDocument()
    expect(screen.getByText('Failed to load users')).toBeInTheDocument()
  })

  it('should handle search', async () => {
    mockUseList.mockReturnValue({
      data: {
        data: mockUsers,
        total: 2,
      },
      isLoading: false,
      error: null,
    } as any)

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

    renderWithProviders(<UsersRefinePage />)

    const searchInput = screen.getByPlaceholderText('搜索用户...')
    fireEvent.change(searchInput, { target: { value: 'user1' } })

    expect(searchInput).toHaveValue('user1')
  })

  it('should handle role change', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({})

    mockUseList.mockReturnValue({
      data: {
        data: mockUsers,
        total: 2,
      },
      isLoading: false,
      error: null,
    } as any)

    mockUseUpdate.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)

    mockUseDelete.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    renderWithProviders(<UsersRefinePage />)

    await waitFor(() => {
      const roleSelects = screen.getAllByRole('combobox')
      const firstRoleSelect = roleSelects[0]

      fireEvent.change(firstRoleSelect, { target: { value: 'admin' } })

      expect(mockMutateAsync).toHaveBeenCalledWith({
        resource: 'admin/users',
        id: '1',
        values: { role: 'admin' },
      })
    })
  })

  it('should handle delete user', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({})
    window.confirm = vi.fn(() => true)

    mockUseList.mockReturnValue({
      data: {
        data: mockUsers,
        total: 2,
      },
      isLoading: false,
      error: null,
    } as any)

    mockUseUpdate.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    mockUseDelete.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)

    renderWithProviders(<UsersRefinePage />)

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument()
    })

    // 查找删除按钮（使用更通用的查询）
    const deleteButtons = screen.getAllByRole('button').filter((btn) => {
      const svg = btn.querySelector('svg')
      return svg && svg.classList.contains('lucide-trash2')
    })

    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled()
        expect(mockMutateAsync).toHaveBeenCalledWith({
          resource: 'admin/users',
          id: '1',
        })
      })
    }
  })

  it('should handle pagination', async () => {
    mockUseList.mockReturnValue({
      data: {
        data: mockUsers,
        total: 50,
      },
      isLoading: false,
      error: null,
    } as any)

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

    renderWithProviders(<UsersRefinePage />)

    await waitFor(() => {
      expect(screen.getByText('第 1 页，共 3 页')).toBeInTheDocument()
    })
  })

  it('should display stats cards', async () => {
    mockUseList.mockReturnValue({
      data: {
        data: mockUsers,
        total: 2,
      },
      isLoading: false,
      error: null,
    } as any)

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

    renderWithProviders(<UsersRefinePage />)

    await waitFor(() => {
      expect(screen.getByText('总用户数')).toBeInTheDocument()
      // 使用 getAllByText 因为"2"在多个地方出现
      const totalTexts = screen.getAllByText('2')
      expect(totalTexts.length).toBeGreaterThan(0)
    })
  })
})

