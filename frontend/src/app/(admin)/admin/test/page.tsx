
import { useState, useEffect } from 'react'
import { useList, useLogout, useApiUrl } from '@refinedev/core'
import { logger } from '@/lib/utils/logger'
import { resolveBackendApiBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

export default function AdminTestPage() {
  const [directApiData, setDirectApiData] = useState<any>(null)
  const [refineContextTest, setRefineContextTest] = useState<any>(null)

  // 获取 apiUrl 来测试 Refine context
  const apiUrl = useApiUrl()

  logger.log('[AdminTest] Refine Context Test:', {
    hasApiUrl: !!apiUrl,
    apiUrl,
    contextTest: refineContextTest,
  })

  // 测试 useList
  const queryResult = useList({
    resource: 'admin/posts',
    pagination: {
      current: 1,
      pageSize: 20,
    } as any,
  })

  const query = queryResult.query
  const result = queryResult.result
  const data = result?.data as any
  const isLoading = query?.isPending
  const error = query?.isError ? query.error : undefined

  const { mutate: logout } = useLogout()
  const backendApiUrl = resolveBackendApiBaseUrl()

  // 直接调用 API 测试
  // GOLDEN_RULES 1.1: 使用 credentials: 'include' 发送 HttpOnly Cookie，不读取 localStorage
  useEffect(() => {
    const fetchDirect = async () => {
      try {
        const response = await fetch(`${backendApiUrl}/admin/posts?page=1&page_size=20`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
        const result = await response.json()
        logger.log('[Direct API] Result:', result)
        setDirectApiData(result)
      } catch (err) {
        logger.error('[Direct API] Error:', err)
      }
    }

    fetchDirect()
  }, [backendApiUrl])

  // 测试 Refine context
  useEffect(() => {
    setRefineContextTest({
      hasApiUrl: !!apiUrl,
      apiUrl,
    })
  }, [apiUrl])

  logger.log('[AdminTest]', {
    data,
    isLoading,
    error,
    dataKeys: data ? Object.keys(data) : 'no data',
    dataArray: data,
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Admin Refine 测试页面</h1>

        {/* Refine Context 测试 */}
        <div className="space-y-4 rounded-lg bg-blue-50 p-6 shadow">
          <h2 className="text-xl font-semibold">Refine Context 测试</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>
              hasApiUrl: <span className="font-bold">{String(!!apiUrl)}</span>
            </p>
            <p>
              apiUrl: <span className="font-bold">{apiUrl || 'undefined'}</span>
            </p>
          </div>
        </div>

        {/* 直接 API 测试 */}
        <div className="space-y-4 rounded-lg bg-green-50 p-6 shadow">
          <h2 className="text-xl font-semibold">直接 API 调用测试</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>
              hasData: <span className="font-bold">{String(!!directApiData)}</span>
            </p>
            {directApiData && (
              <>
                <p>
                  posts count: <span className="font-bold">{directApiData.posts?.length || 0}</span>
                </p>
                <p>
                  total: <span className="font-bold">{directApiData.total || 0}</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* useList 测试 */}
        <div className="space-y-4 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">useList 状态</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>
              isLoading: <span className="font-bold">{String(isLoading)}</span>
            </p>
            <p>
              hasError: <span className="font-bold">{String(!!error)}</span>
            </p>
            <p>
              hasData: <span className="font-bold">{String(!!data)}</span>
            </p>
            {data && (
              <>
                <p>
                  dataKeys: <span className="font-bold">{JSON.stringify(Object.keys(data))}</span>
                </p>
                <p>
                  data.data:{' '}
                  <span className="font-bold">
                    {Array.isArray(data.data) ? `Array(${data.data.length})` : typeof data.data}
                  </span>
                </p>
                <p>
                  data.total: <span className="font-bold">{data.total}</span>
                </p>
              </>
            )}
            {error && (
              <p className="text-red-600">
                error: <span className="font-bold">{String(error)}</span>
              </p>
            )}
          </div>
        </div>

        {data?.data && Array.isArray(data.data) && data.data.length > 0 ? (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">前3篇文章 (useList)</h2>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(data.data.slice(0, 3), null, 2)}
            </pre>
          </div>
        ) : null}

        {directApiData?.posts && directApiData.posts.length > 0 ? (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">前3篇文章 (Direct API)</h2>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(directApiData.posts.slice(0, 3), null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="rounded-lg bg-white p-6 shadow">
          <button
            onClick={() => logout()}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
