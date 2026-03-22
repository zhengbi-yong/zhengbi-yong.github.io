import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

function resolveBackendApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
  const trimmedUrl = configuredUrl.replace(/\/$/, '')

  if (trimmedUrl.endsWith('/api/v1')) {
    return trimmedUrl
  }

  if (trimmedUrl.endsWith('/v1')) {
    return trimmedUrl.replace(/\/v1$/, '/api/v1')
  }

  return `${trimmedUrl}/api/v1`
}

const BACKEND_API_URL = resolveBackendApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function proxyRequest(request: NextRequest, path: string): Promise<NextResponse> {
  revalidatePath(request.nextUrl.pathname)

  const url = new URL(request.url)
  const searchParams = url.searchParams.toString()

  try {
    const backendUrl = `${BACKEND_API_URL}/${path}${searchParams ? '?' + searchParams : ''}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const cookieHeader = request.headers.get('Cookie')
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      cache: 'no-store',
    })

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to fetch from backend',
        message: error instanceof Error ? error.message : 'Unknown error',
        path,
      }),
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest(request, path.join('/'))
}
