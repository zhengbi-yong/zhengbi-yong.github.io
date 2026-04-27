'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api/apiClient'

export default function TestPage() {
  const [status, setStatus] = useState('Connecting...')
  const [backendStatus, setBackendStatus] = useState('Testing...')
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    testBackend()
  }, [])

  const testBackend = async () => {
    setStatus('Testing backend connection...')

    try {
      // GOLDEN_RULES §2.1: Client Components must use backend.ts → apiClient.ts
      const response = await api.get<any>('/api/v1/posts?limit=1', {
        cache: false,
      })

      if (response.data) {
        setPosts((response.data as any).results || [])
        setBackendStatus('✅ Connected')
        setStatus('✅ Success!')
      } else {
        setBackendStatus('❌ No data')
        setStatus('❌ Response missing data')
      }
    } catch (error) {
      setBackendStatus('❌ Network Error')
      setStatus(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Backend Connection Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Frontend Status: {status}</h2>
          <p className="text-gray-400">Frontend running on http://localhost:3001</p>
        </div>
        
        <div className="p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Backend Status: {backendStatus}</h2>
          <p className="text-gray-400">Backend API running on http://localhost:3000</p>
        </div>
        
        {posts.length > 0 && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Posts Found: {posts.length}</h2>
            <div className="space-y-2">
              {posts.map((post, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded">
                  <h3 className="font-semibold">{post.title || 'No title'}</h3>
                  <p className="text-gray-400 text-sm">{post.slug || 'No slug'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <button 
        onClick={testBackend}
        className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
      >
        Test Connection Again
      </button>
    </div>
  )
}
