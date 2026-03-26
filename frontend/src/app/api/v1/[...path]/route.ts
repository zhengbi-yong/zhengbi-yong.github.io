import { NextRequest, NextResponse } from 'next/server'
import { resolveBackendApiBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

const BACKEND_API_URL = resolveBackendApiBaseUrl()

export const dynamic = 'force-dynamic'

function getBackendUrl(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const rawPath = requestUrl.pathname.replace(/^\/api\/v1\//, '')
  const search = requestUrl.search
  return `${BACKEND_API_URL}/${rawPath}${search}`
}

function createProxyHeaders(request: NextRequest) {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase()

    if (['host', 'connection', 'content-length'].includes(normalizedKey)) {
      return
    }

    headers.set(key, value)
  })

  return headers
}

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const backendUrl = getBackendUrl(request)
    const headers = createProxyHeaders(request)
    const body =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text()

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    })

    const responseHeaders = new Headers(response.headers)

    ;['content-encoding', 'content-length', 'transfer-encoding'].forEach((header) => {
      responseHeaders.delete(header)
    })

    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')

    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, {
        status: response.status,
        headers: responseHeaders,
      })
    }

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to fetch from backend',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request)
}

export async function POST(request: NextRequest) {
  return proxyRequest(request)
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request)
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request)
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request)
}
