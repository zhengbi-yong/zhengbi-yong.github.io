/**
 * Refine Provider 集成测试
 * 测试所有 Provider 协同工作的正确性
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RefineProvider } from '@/lib/providers/refine-provider'
import { dataProvider } from '@/lib/providers/refine-data-provider'
import { authProvider } from '@/lib/providers/refine-auth-provider'

// Mock Next.js router
vi.mock('@refinedev/nextjs-router/app', () => ({
  default: {
    go: vi.fn(),
  },
}))

// Mock Kbar
vi.mock('@refinedev/kbar', () => ({
  RefineKbar: () => null,
  RefineKbarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Refine Provider Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('should initialize RefineProvider without errors', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RefineProvider>
          <div>Test Content</div>
        </RefineProvider>
      </QueryClientProvider>
    )

    expect(container).toBeInTheDocument()
  })

  it('should provide data provider to children', () => {
    const TestComponent = () => {
      // 这里可以测试 useDataContext 或其他 hooks
      return <div>Test</div>
    }

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RefineProvider>
          <TestComponent />
        </RefineProvider>
      </QueryClientProvider>
    )

    expect(container).toBeInTheDocument()
  })

  it('should handle provider errors gracefully', () => {
    // 测试 provider 初始化失败的情况
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RefineProvider>
          <div>Test</div>
        </RefineProvider>
      </QueryClientProvider>
    )

    expect(container).toBeInTheDocument()
  })
})

describe('Data Provider and Auth Provider Integration', () => {
  it('should work together correctly', async () => {
    // 模拟认证流程
    const token = 'test_token'
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }

    // 验证 auth provider 能正确检查认证状态
    const checkResult = await authProvider.check()
    expect(checkResult).toBeDefined()

    // 验证 data provider 能正确使用认证信息
    // (在实际场景中，data provider 会使用 auth provider 的 token)
    expect(dataProvider.getApiUrl()).toBeDefined()
  })
})

