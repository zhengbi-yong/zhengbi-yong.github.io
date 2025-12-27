'use client'

import { useList, useLogout } from '@refinedev/core'

export default function TestRefinePage() {
  // 测试 useList
  const { data, isLoading, error } = useList({
    resource: 'admin/posts',
    pagination: {
      current: 1,
      pageSize: 20,
    },
  })

  const { mutate: logout } = useLogout()

  console.log('[TestRefine]', {
    data,
    isLoading,
    error,
    dataKeys: data ? Object.keys(data) : 'no data',
    dataArray: data?.data,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Refine 测试页面</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">useList 状态</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>isLoading: <span className="font-bold">{String(isLoading)}</span></p>
            <p>hasError: <span className="font-bold">{String(!!error)}</span></p>
            <p>hasData: <span className="font-bold">{String(!!data)}</span></p>
            {data && (
              <>
                <p>dataKeys: <span className="font-bold">{JSON.stringify(Object.keys(data))}</span></p>
                <p>data.data: <span className="font-bold">{Array.isArray(data.data) ? `Array(${data.data.length})` : typeof data.data}</span></p>
                <p>data.total: <span className="font-bold">{data.total}</span></p>
              </>
            )}
            {error && (
              <p className="text-red-600">error: <span className="font-bold">{String(error)}</span></p>
            )}
          </div>
        </div>

        {data?.data && Array.isArray(data.data) && data.data.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">前3篇文章</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(data.data.slice(0, 3), null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-lg p-6">
            <p className="text-yellow-800">没有数据或加载中</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
