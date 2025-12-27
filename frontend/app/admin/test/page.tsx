'use client'

import { useState, useEffect } from 'react'
import { useList, useLogout, useApiUrl } from '@refinedev/core'

export default function AdminTestPage() {
  const [directApiData, setDirectApiData] = useState<any>(null)
  const [refineContextTest, setRefineContextTest] = useState<any>(null)

  // 获取 apiUrl 来测试 Refine context
  const apiUrl = useApiUrl()

  console.log('[AdminTest] Refine Context Test:', {
    hasApiUrl: !!apiUrl,
    apiUrl,
    contextTest: refineContextTest,
  })

  // 测试 useList
  const { data, isLoading, error } = useList({
    resource: 'admin/posts',
    pagination: {
      current: 1,
      pageSize: 20,
    },
  })

  const { mutate: logout } = useLogout()

  // 直接调用 API 测试
  useEffect(() => {
    const fetchDirect = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch('http://localhost:3000/v1/admin/posts?page=1&page_size=20', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        const result = await response.json()
        console.log('[Direct API] Result:', result)
        setDirectApiData(result)
      } catch (err) {
        console.error('[Direct API] Error:', err)
      }
    }

    fetchDirect()
  }, [])

  // 测试 Refine context
  useEffect(() => {
    setRefineContextTest({
      hasApiUrl: !!apiUrl,
      apiUrl,
    })
  }, [apiUrl])

  console.log('[AdminTest]', {
    data,
    isLoading,
    error,
    dataKeys: data ? Object.keys(data) : 'no data',
    dataArray: data?.data,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Admin Refine 测试页面</h1>

        {/* Refine Context 测试 */}
        <div className="bg-blue-50 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Refine Context 测试</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>hasApiUrl: <span className="font-bold">{String(!!apiUrl)}</span></p>
            <p>apiUrl: <span className="font-bold">{apiUrl || 'undefined'}</span></p>
          </div>
        </div>

        {/* 直接 API 测试 */}
        <div className="bg-green-50 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">直接 API 调用测试</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>hasData: <span className="font-bold">{String(!!directApiData)}</span></p>
            {directApiData && (
              <>
                <p>posts count: <span className="font-bold">{directApiData.posts?.length || 0}</span></p>
                <p>total: <span className="font-bold">{directApiData.total || 0}</span></p>
              </>
            )}
          </div>
        </div>

        {/* useList 测试 */}
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
            <h2 className="text-xl font-semibold mb-4">前3篇文章 (useList)</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(data.data.slice(0, 3), null, 2)}
            </pre>
          </div>
        ) : null}

        {directApiData?.posts && directApiData.posts.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">前3篇文章 (Direct API)</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(directApiData.posts.slice(0, 3), null, 2)}
            </pre>
          </div>
        ) : null}

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
