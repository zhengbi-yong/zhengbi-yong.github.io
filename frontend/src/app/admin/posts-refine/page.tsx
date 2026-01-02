// @ts-nocheck
'use client'

import { useList } from '@refinedev/core'
import { FileText, Eye, Heart, MessageSquare } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

export default function PostsRefinePage() {
  logger.log('[PostsRefine] Component rendering')

  const queryResult = useList({
    resource: 'admin/posts',
    pagination: {
      current: 1,
      pageSize: 20,
    } as any,
    queryOptions: {
      enabled: true,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  })

  const query = queryResult.query
  const result = queryResult.result
  const data = result?.data
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  logger.log('[PostsRefine] useList result:', {
    data,
    isLoading,
    error,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : 'no data',
    dataData: data,
    dataLength: data?.length,
    total: result?.total,
  })

  // 尝试直接访问可能的其他属性
  logger.log('[PostsRefine] All useList properties:', Object.keys({ data, isLoading, error }))

  const posts = data || []
  const total = result?.total || 0

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {String(error)}</div>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">文章管理 (Refine)</h1>

      <div className="bg-blue-50 p-4 rounded">
        <p>Total: {total}</p>
        <p>Posts count: {posts.length}</p>
        <p>isLoading: {String(isLoading)}</p>
        <p>hasData: {String(!!data)}</p>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Slug</th>
              <th className="px-4 py-2 text-left">Views</th>
              <th className="px-4 py-2 text-left">Likes</th>
              <th className="px-4 py-2 text-left">Comments</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post: any) => (
              <tr key={post.slug} className="border-t">
                <td className="px-4 py-2">{post.slug}</td>
                <td className="px-4 py-2">{post.view_count}</td>
                <td className="px-4 py-2">{post.like_count}</td>
                <td className="px-4 py-2">{post.comment_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
