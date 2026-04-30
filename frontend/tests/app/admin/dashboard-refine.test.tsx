/**
 * Dashboard Refine Page 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdminDashboard from '../../../src/app/(admin)/admin/page'
import * as refineCore from '@refinedev/core'
import * as authStore from '@/lib/store/auth-store'

// Mock Refine hooks
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
}))

// Mock auth store
vi.mock('@/lib/store/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('AdminDashboard', () => {
  let queryClient: QueryClient
  const mockUseList = vi.mocked(refineCore.useList)
  const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    vi.clearAllMocks()

    // Default auth store mock
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
      },
      isAuthenticated: true,
      checkAuth: vi.fn().mockResolvedValue(true),
    } as any)
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    )
  }

  const mockStats = {
    total_users: 100,
    total_comments: 500,
    pending_comments: 10,
    approved_comments: 490,
    rejected_comments: 5,
  }

  it('should render loading state', () => {
    mockUseList.mockReturnValue({
      query: {
        isPending: true,
        isError: false,
      },
      result: {
        data: undefined,
      },
    } as any)

    renderWithProviders(<AdminDashboard />)

    expect(screen.getByText('加载仪表板数据...')).toBeInTheDocument()
  })

  it('should render dashboard with stats', async () => {
    mockUseList.mockReturnValue({
      query: {
        isPending: false,
        isError: false,
      },
      result: {
        data: [mockStats],
      },
    } as any)

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('仪表板')).toBeInTheDocument()
      expect(screen.getByText('欢迎回来，admin')).toBeInTheDocument()
      expect(screen.getByText('总用户数')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('总评论数')).toBeInTheDocument()
      expect(screen.getAllByText('500')).toHaveLength(2)
    })
  })

  it('should render error state', () => {
    mockUseList.mockReturnValue({
      query: {
        isPending: false,
        isError: true,
        error: new Error('Failed to load stats'),
      },
      result: {
        data: undefined,
      },
    } as any)

    renderWithProviders(<AdminDashboard />)

    expect(screen.getByText('加载失败')).toBeInTheDocument()
    expect(screen.getByText('Failed to load stats')).toBeInTheDocument()
  })

  it('should display all stat cards', async () => {
    mockUseList.mockReturnValue({
      query: {
        isPending: false,
        isError: false,
      },
      result: {
        data: [mockStats],
      },
    } as any)

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('总用户数')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('总评论数')).toBeInTheDocument()
      expect(screen.getAllByText('500')).toHaveLength(2)
      expect(screen.getAllByText('待审核')).toHaveLength(2)
      expect(screen.getAllByText('10')).toHaveLength(2)
      expect(screen.getAllByText('已通过')).toHaveLength(2)
      expect(screen.getAllByText('490')).toHaveLength(2)
      expect(screen.getAllByText('已拒绝')).toHaveLength(2)
      expect(screen.getAllByText('5')).toHaveLength(2)
    })
  })

  it('should display quick actions', async () => {
    mockUseList.mockReturnValue({
      query: {
        isPending: false,
        isError: false,
      },
      result: {
        data: [mockStats],
      },
    } as any)

    renderWithProviders(<AdminDashboard />)

    // Quick actions section was removed during admin refactoring
    // Test that dashboard renders without errors instead
    await waitFor(() => {
      expect(screen.getByText('仪表板')).toBeInTheDocument()
    })
  })
})

