'use client'

import { useEffect, useState } from 'react'

export default function TestAPIPage() {
  const [token, setToken] = useState<string>('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [postsResult, setPostsResult] = useState<any>(null)
  const [usersResult, setUsersResult] = useState<any>(null)
  const [commentsResult, setCommentsResult] = useState<any>(null)

  useEffect(() => {
    // 获取token
    const storedToken = localStorage.getItem('access_token')
    setToken(storedToken || '')

    // 获取用户信息
    const storedUser = localStorage.getItem('user_info')
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser))
    }

    // 测试API调用
    const testAPIs = async () => {
      if (!storedToken) {
        alert('没有找到token，请先登录')
        return
      }

      try {
        // 测试Posts API
        const postsRes = await fetch('http://localhost:3000/v1/admin/posts', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        })
        const postsData = await postsRes.json()
        setPostsResult({
          status: postsRes.status,
          ok: postsRes.ok,
          data: postsData,
        })
      } catch (error: any) {
        setPostsResult({ error: error.message })
      }

      try {
        // 测试Users API
        const usersRes = await fetch('http://localhost:3000/v1/admin/users', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        })
        const usersData = await usersRes.json()
        setUsersResult({
          status: usersRes.status,
          ok: usersRes.ok,
          data: usersData,
        })
      } catch (error: any) {
        setUsersResult({ error: error.message })
      }

      try {
        // 测试Comments API
        const commentsRes = await fetch('http://localhost:3000/v1/admin/comments', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        })
        const commentsData = await commentsRes.json()
        setCommentsResult({
          status: commentsRes.status,
          ok: commentsRes.ok,
          data: commentsData,
        })
      } catch (error: any) {
        setCommentsResult({ error: error.message })
      }
    }

    testAPIs()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">API 测试页面</h1>

        {/* Token Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">认证信息</h2>
          <div className="space-y-2">
            <p><strong>Token存在:</strong> {token ? '是' : '否'}</p>
            <p><strong>Token长度:</strong> {token.length}</p>
            {userInfo && (
              <>
                <p><strong>用户ID:</strong> {userInfo.id}</p>
                <p><strong>邮箱:</strong> {userInfo.email}</p>
                <p><strong>用户名:</strong> {userInfo.username}</p>
                <p><strong>角色:</strong> {userInfo.role}</p>
              </>
            )}
          </div>
        </div>

        {/* Posts API Result */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Posts API</h2>
          {postsResult ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {postsResult.status}</p>
              <p><strong>成功:</strong> {postsResult.ok ? '是' : '否'}</p>
              {postsResult.error ? (
                <p className="text-red-600"><strong>错误:</strong> {postsResult.error}</p>
              ) : (
                <div>
                  <p><strong>Total:</strong> {postsResult.data?.total}</p>
                  <p><strong>文章数量:</strong> {postsResult.data?.posts?.length || 0}</p>
                  {postsResult.data?.posts && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600">查看文章列表</summary>
                      <pre className="mt-2 bg-gray-100 p-4 rounded overflow-auto max-h-96">
                        {JSON.stringify(postsResult.data.posts, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p>加载中...</p>
          )}
        </div>

        {/* Users API Result */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Users API</h2>
          {usersResult ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {usersResult.status}</p>
              <p><strong>成功:</strong> {usersResult.ok ? '是' : '否'}</p>
              {usersResult.error ? (
                <p className="text-red-600"><strong>错误:</strong> {usersResult.error}</p>
              ) : (
                <div>
                  <p><strong>Total:</strong> {usersResult.data?.total}</p>
                  <p><strong>用户数量:</strong> {usersResult.data?.users?.length || 0}</p>
                </div>
              )}
            </div>
          ) : (
            <p>加载中...</p>
          )}
        </div>

        {/* Comments API Result */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Comments API</h2>
          {commentsResult ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {commentsResult.status}</p>
              <p><strong>成功:</strong> {commentsResult.ok ? '是' : '否'}</p>
              {commentsResult.error ? (
                <p className="text-red-600"><strong>错误:</strong> {commentsResult.error}</p>
              ) : (
                <div>
                  <p><strong>Total:</strong> {commentsResult.data?.total}</p>
                  <p><strong>评论数量:</strong> {commentsResult.data?.comments?.length || 0}</p>
                </div>
              )}
            </div>
          ) : (
            <p>加载中...</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">操作</h2>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              前往管理面板
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              前往登录
            </button>
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              清除缓存并刷新
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
