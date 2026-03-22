import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { resolveBackendApiBaseUrl } from '@/lib/api/resolveBackendApiBaseUrl'

const BACKEND_API_URL = resolveBackendApiBaseUrl()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  revalidatePath(request.nextUrl.pathname)

  const url = new URL(request.url)
  const searchParams = url.searchParams.toString()

  try {
    const backendUrl = `${BACKEND_API_URL}/posts${searchParams ? '?' + searchParams : ''}`

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
      method: 'GET',
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
    console.error('Posts proxy error:', error)
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to fetch from backend',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    )
  }
}
