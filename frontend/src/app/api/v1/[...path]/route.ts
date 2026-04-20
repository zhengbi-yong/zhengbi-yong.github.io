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
 * GOLDEN_RULES 1.1: Fix Set-Cookie header for cross-origin development
 *
 * Key insight: Do NOT set Domain=. Instead, let cookies be "host-only" (no Domain attribute).
 * Host-only cookies are only sent to the exact same host:port.
 *
 * Flow:
 * 1. Browser → BFF (localhost:3001) - browser stores cookie with no Domain
 * 2. Browser → BFF again - browser sends cookie (same origin)
 * 3. BFF forwards cookie to backend - BFF acts as cookie forwarder
 *
 * Why not set Domain:
 * - Domain=0.0.0.0 is INVALID and browsers reject it
 * - Domain=localhost breaks when user accesses via IP (192.168.0.161:3001)
 * - Host-only cookies avoid all these issues
 *
 * What we DO fix:
 * - Strip invalid Domain=0.0.0.0 from backend-set cookies
 * - Strip Domain=localhost if it would cause issues (same logic)
 * - Keep all other Domain values intact
 */
function fixSetCookieHeader(cookieValue: string): string {
  // ✨ DEBUG MARKER - look for this in logs
  console.error('[COOKIE_FIX] INVOKED:', cookieValue.substring(0, 80))
  const parts = cookieValue.split(';').map((p) => p.trim())

  const domainIndex = parts.findIndex((p) => p.toLowerCase().startsWith('domain='))
  if (domainIndex !== -1) {
    const domainValue = parts[domainIndex].substring('domain='.length)
    // Strip invalid Domain values - let cookie be host-only instead
    if (domainValue === '0.0.0.0' || domainValue === 'localhost') {
      parts.splice(domainIndex, 1)
      return parts.join('; ')
    }
  }
  // No Domain set, or valid Domain - pass through unchanged
  return cookieValue
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
      // GOLDEN_RULES 1.1 + 2.1: 必须携带浏览器 Cookie 转发到后端
      // 同源请求（localhost→localhost）默认不发送 credentials，
      // 必须显式声明才能把 HttpOnly Cookie 传递给后端
      credentials: 'include',
    })

    const responseHeaders = new Headers()

    // Apply cookie fix for cross-port development (GOLDEN_RULES 1.1)
    // Backend sets cookies for localhost:3000, but we need them for localhost:3001
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        // Strip invalid Domain=0.0.0.0 and Domain=localhost, let cookie be host-only
        responseHeaders.append(key, fixSetCookieHeader(value))
      } else if (
        !['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())
      ) {
        responseHeaders.append(key, value)
      }
    })

    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    // credentials: 'include' requires specific origin, not '*'
    responseHeaders.set('Access-Control-Allow-Origin', frontendOrigin)
    responseHeaders.set('Access-Control-Allow-Credentials', 'true')
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
