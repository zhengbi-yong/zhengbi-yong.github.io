import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin 路由服务端中间件
 * 
 * 防止未认证用户访问管理页面的 HTML/JS 资源。
 * 实际的 API 鉴权由后端独立完成——此中间件仅限管理页面渲染。
 * 
 * 检查 csrf_token (HttpOnly cookie) 存在性作为登录状态代理。
 * 因为 access_token 是通过后端 Set-Cookie 写入的 HttpOnly cookie，
 * 只有成功登录后浏览器才会携带。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 仅保护 /admin 路径
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // 登录页本身不需要保护（避免重定向循环）
  if (pathname === '/admin/login' || pathname.startsWith('/admin/auth')) {
    return NextResponse.next()
  }

  // 检查登录会话 cookie
  const csrfToken = request.cookies.get('csrf_token')
  const hasSession = request.cookies.get('access_token') || csrfToken

  if (!hasSession) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

/**
 * 仅匹配 /admin 下的路径，排除静态资源和 API 调用。
 * API 调用走 /api/v1/* 到后端 BFF，由后端独立鉴权。
 */
export const config = {
  matcher: [
    '/admin/:path*',
    // 排除 Next.js 内部路径和静态资源
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
