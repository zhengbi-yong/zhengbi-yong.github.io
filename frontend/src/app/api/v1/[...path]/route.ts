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

/**
 * GOLDEN_RULES 1.1: Fix Set-Cookie header for cross-port development
 *
 * When running with frontend on port 3001 and backend on port 3000,
 * the backend sets cookies for "localhost:3000" but the browser
 * needs them for "localhost:3001" (the proxy origin).
 *
 * This function ALWAYS sets Domain=localhost (without port) so cookies
 * work across different ports on localhost during development.
 */
function fixSetCookieHeader(cookieValue: string, frontendOrigin: string): string {
  const parts = cookieValue.split(';').map((p) => p.trim())
  const frontendHost = frontendOrigin.replace(/^https?:\/\//, '').split(':')[0]

  const domainIndex = parts.findIndex((p) => p.toLowerCase().startsWith('domain='))
  if (domainIndex !== -1) {
    const domainValue = parts[domainIndex].substring('domain='.length)
    if (domainValue.includes(':')) {
      parts[domainIndex] = `Domain=${frontendHost}`
    }
  }

  const secureIndex = parts.findIndex((p) => p.toLowerCase() === 'secure')
  if (frontendOrigin.startsWith('http://') && secureIndex !== -1) {
    parts.splice(secureIndex, 1)
  }

  return parts.join('; ')
}

/**
 * Extract XSRF-TOKEN from cookies and inject as X-CSRF-TOKEN header
 * For state-changing requests (POST, PUT, PATCH, DELETE)
 */
function injectCsrfToken(request: NextRequest, headers: Headers) {
  const method = request.method.toUpperCase()
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

  if (!stateChangingMethods.includes(method)) {
    return
  }

  // Read XSRF-TOKEN cookie (non-HttpOnly, set by backend for CSRF protection)
  const xsrfToken = request.cookies.get('XSRF-TOKEN')?.value

  if (xsrfToken) {
    headers.set('X-CSRF-Token', xsrfToken)
  }
}

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const backendUrl = getBackendUrl(request)
    const headers = createProxyHeaders(request)

    // Inject CSRF token for state-changing requests
    injectCsrfToken(request, headers)

    // Get frontend origin for cookie fix
    const frontendOrigin = new URL(request.url).origin

    const body =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text()

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    })

    const responseHeaders = new Headers()

    // Apply cookie fix for cross-port development (GOLDEN_RULES 1.1)
    // Backend sets cookies for localhost:3000, but we need them for localhost:3001
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        // Fix the Set-Cookie header - strip port from Domain
        responseHeaders.append(key, fixSetCookieHeader(value, frontendOrigin))
      } else if (
        !['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())
      ) {
        responseHeaders.append(key, value)
      }
    })

    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    responseHeaders.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Cookie, X-CSRF-Token'
    )

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
