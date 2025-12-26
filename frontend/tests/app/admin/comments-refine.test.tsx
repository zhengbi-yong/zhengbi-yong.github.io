/**
 * Comments Refine Page 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CommentManagementPage from '@/app/admin/comments/page'
import * as refineCore from '@refinedev/core'

// Mock Refine hooks
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
  useUpdate: vi.fn(),
  useDelete: vi.fn(),
}))

describe('CommentManagementPage', () => {
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

  const mockComments = [
    {
      id: '1',
      content: 'Great article!',
      username: 'user1',
      slug: 'test-article',
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      content: 'Nice post!',
      username: 'user2',
      slug: 'another-article',
      status: 'approved',
      created_at: '2024-01-02T00:00:00Z',
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

    const { container } = renderWithProviders(<CommentManagementPage />)

    // Comments 页面只显示 Loader2 图标，没有文本
    // 检查加载图标是否存在（通过查找包含 animate-spin 的元素）
    const loaderIcon = container.querySelector('[class*="animate-spin"]')
    expect(loaderIcon).toBeInTheDocument()
  })

  it('should render comments list', async () => {
    mockUseList.mockReturnValue({
      data: {
        data: mockComments,
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

    renderWithProviders(<CommentManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('评论审核')).toBeInTheDocument()
      expect(screen.getByText('Great article!')).toBeInTheDocument()
      expect(screen.getByText('Nice post!')).toBeInTheDocument()
    })
  })

  it('should render error state', () => {
    mockUseList.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load comments'),
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

    renderWithProviders(<CommentManagementPage />)

    expect(screen.getByText('加载评论列表失败')).toBeInTheDocument()
  })

  it('should handle status filter change', async () => {
    mockUseList.mockReturnValue({
      data: {
        data: mockComments,
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

    renderWithProviders(<CommentManagementPage />)

    await waitFor(() => {
      const statusFilter = screen.getByDisplayValue('全部状态')
      fireEvent.change(statusFilter, { target: { value: 'pending' } })

      expect(statusFilter).toHaveValue('pending')
    })
  })

  it('should handle status change', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({})

    mockUseList.mockReturnValue({
      data: {
        data: mockComments,
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

    renderWithProviders(<CommentManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('评论审核')).toBeInTheDocument()
    })

    // 查找所有 select 元素，找到第一个评论的状态选择器
    const statusSelects = screen.getAllByRole('combobox')
    // 跳过第一个（筛选器），使用第二个（第一个评论的状态选择器）
    if (statusSelects.length > 1) {
      const firstCommentStatusSelect = statusSelects[1] as HTMLSelectElement
      fireEvent.change(firstCommentStatusSelect, { target: { value: 'approved' } })

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          resource: 'admin/comments',
          id: '1',
          values: { status: 'approved' },
        })
      })
    }
  })

  it('should handle delete comment', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({})
    window.confirm = vi.fn(() => true)

    mockUseList.mockReturnValue({
      data: {
        data: mockComments,
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

    renderWithProviders(<CommentManagementPage />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('删除')
      fireEvent.click(deleteButtons[0])

      expect(window.confirm).toHaveBeenCalled()
      expect(mockMutateAsync).toHaveBeenCalledWith({
        resource: 'admin/comments',
        id: '1',
      })
    })
  })

  it('should display status badges', async () => {
    mockUseList.mockReturnValue({
      data: {
        data: mockComments,
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

    renderWithProviders(<CommentManagementPage />)

    await waitFor(() => {
      // 使用 getAllByText 因为"待审核"在多个地方出现（筛选器和状态徽章）
      const pendingBadges = screen.getAllByText('待审核')
      expect(pendingBadges.length).toBeGreaterThan(0)
      
      const approvedBadges = screen.getAllByText('已通过')
      expect(approvedBadges.length).toBeGreaterThan(0)
    })
  })
})

