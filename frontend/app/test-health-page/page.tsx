'use client'

import { useEffect, useState } from 'react'

export default function TestHealthPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/v1').replace('/v1', '')
    const url = `${backendBaseUrl}/healthz/detailed`

    console.log('Testing health endpoint:', url)

    fetch(url)
      .then(response => {
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)
        return response.json()
      })
      .then(json => {
        console.log('Received JSON:', json)
        setData(json)
      })
      .catch(err => {
        console.error('Error:', err)
        setError(err.message)
      })
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Health Check Test Page</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h2>Error:</h2>
          <pre>{error}</pre>
        </div>
      )}

      {data && (
        <>
          <h2>Received Data:</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>

          <h2>Analysis:</h2>
          <ul>
            <li>Status: <strong>{data.status}</strong></li>
            <li>Database: <strong>{data.services?.database?.status}</strong></li>
            <li>Redis: <strong>{data.services?.redis?.status}</strong></li>
            <li>JWT: <strong>{data.services?.jwt?.status}</strong></li>
            <li>Email: <strong>{data.services?.email?.status}</strong></li>
          </ul>
        </>
      )}

      {!data && !error && <p>Loading...</p>}
    </div>
  )
}
