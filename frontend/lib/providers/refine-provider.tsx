/**
 * Refine Provider
 * 整合所有 Refine 提供者
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

export function RefineProvider({ children }: RefineProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30秒
            refetchOnWindowFocus: false,
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
          syncWithLocation: false,
          warnWhenUnsavedChanges: true,
          useNewQueryKeys: true,
          projectId: 'admin-panel',
          disableTelemetry: true,
        }}
      >
        {children}
      </Refine>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={true} />}
    </QueryClientProvider>
  )
}

