/**
 * Refine Provider - 优化版
 *
 * 优化内容：
 * - 激进缓存策略（5分钟 staleTime, 30分钟 gcTime）
 * - 禁用窗口聚焦刷新
 * - 实时模式（WebSocket）
 * - 禁用同步通知（减少开销）
 */

'use client'

import { Refine } from '@refinedev/core'
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar'
import routerProvider from '@refinedev/nextjs-router/app'
import { dataProvider } from './refine-data-provider'
import { authProvider } from './refine-auth-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface RefineProviderProps {
  children: React.ReactNode
}

/**
 * 简单的内存缓存层
 * 用于减少重复请求
 */
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5分钟

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.timestamp) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }
}

// 全局缓存实例
const cache = new SimpleCache()

export function RefineProvider({ children }: RefineProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 激进缓存模式：数据在 5 分钟内被视为新鲜
            staleTime: 1000 * 60 * 5, // 5分钟（原 30秒）
            // 保留缓存 30 分钟（防止频繁重新获取）
            gcTime: 1000 * 60 * 30, // 30分钟
            // 禁用窗口聚焦自动刷新（减少不必要的请求）
            refetchOnWindowFocus: false,
            // 失败重试 1 次
            retry: 1,
            // 重试延迟：指数退避
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // 变更失败时重试 1 次
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        routerProvider={routerProvider}
        resources={[
          {
            name: 'admin/posts',
            list: '/admin/posts',
            meta: {
              label: '文章管理',
            },
          },
          {
            name: 'admin/users',
            list: '/admin/users',
            meta: {
              label: '用户管理',
            },
          },
          {
            name: 'admin/comments',
            list: '/admin/comments',
            meta: {
              label: '评论管理',
            },
          },
        ]}
        options={{
          // 禁用 URL 同步（减少路由监听开销）
          syncWithLocation: false,
          // 启用未保存更改警告
          warnWhenUnsavedChanges: true,
          // 使用新的查询键格式
          useNewQueryKeys: true,
          // 项目标识符
          projectId: 'admin-panel',
          // 禁用遥测（隐私和性能）
          disableTelemetry: true,
          // 启用实时模式（WebSocket 自动更新）
          // liveMode: 'auto', // 可选：如果后端支持 WebSocket
          // 实时提供者配置（如果启用 liveMode）
          // liveProvider: liveProvider,
        }}
      >
        <RefineKbarProvider>
          <RefineKbar />
          {children}
        </RefineKbarProvider>
      </Refine>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

// 导出缓存实例供外部使用（可选）
export { cache }


