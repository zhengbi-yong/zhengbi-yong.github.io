// MSW handlers for Authentication API
import { http, HttpResponse } from 'msw'
import { createUserFactory, createAuthToken } from '../../../tests/lib/factories'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4010'

// Mock user database (in-memory)
let mockUsers = [
  createUserFactory({
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
  }),
  createUserFactory({
    id: '2',
    username: 'author',
    email: 'author@example.com',
    role: 'author',
  }),
  createUserFactory({
    id: '3',
    username: 'user',
    email: 'user@example.com',
    role: 'user',
  }),
]

export const authHandlers = [
  // POST /v1/auth/login - Login
  http.post(`${API_BASE}/v1/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Validate credentials
    const user = mockUsers.find(u => u.email === email)

    if (!user || password !== 'password123') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
            type: '401',
          },
        },
        { status: 401 },
      )
    }

    // Generate token
    const token = createAuthToken()

    return HttpResponse.json(
      {
        success: true,
        data: {
          access_token: token,
          refresh_token: `refresh-${token}`,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      },
      { status: 200 },
    )
  }),

  // POST /v1/auth/register - Register
  http.post(`${API_BASE}/v1/auth/register`, async ({ request }) => {
    const { username, email, password } = await request.json() as { username: string; email: string; password: string }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email || u.username === username)

    if (existingUser) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: '用户名或邮箱已存在',
            type: '400',
          },
        },
        { status: 400 },
      )
    }

    // Create new user
    const newUser = createUserFactory({
      username,
      email,
      role: 'user',
    })

    mockUsers.push(newUser)

    const token = createAuthToken()

    return HttpResponse.json(
      {
        success: true,
        data: {
          access_token: token,
          refresh_token: `refresh-${token}`,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
          },
        },
      },
      { status: 201 },
    )
  }),

  // POST /v1/auth/logout - Logout
  http.post(`${API_BASE}/v1/auth/logout`, async () => {
    await new Promise(resolve => setTimeout(resolve, 50))

    return HttpResponse.json({
      success: true,
      data: {
        message: '登出成功',
      },
    })
  }),

  // POST /v1/auth/refresh - Refresh token
  http.post(`${API_BASE}/v1/auth/refresh`, async ({ request }) => {
    const { refresh_token } = await request.json() as { refresh_token: string }

    await new Promise(resolve => setTimeout(resolve, 50))

    if (!refresh_token || !refresh_token.startsWith('refresh-')) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: '无效的刷新令牌',
            type: '401',
          },
        },
        { status: 401 },
      )
    }

    // Generate new tokens
    const newToken = createAuthToken()

    return HttpResponse.json({
      success: true,
      data: {
        access_token: newToken,
        refresh_token: `refresh-${newToken}`,
      },
    })
  }),

  // GET /v1/auth/me - Get current user
  http.get(`${API_BASE}/v1/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未授权访问',
            type: '401',
          },
        },
        { status: 401 },
      )
    }

    // Return mock user (in real scenario, decode token and find user)
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      },
    })
  }),

  // POST /v1/auth/forgot-password - Forgot password
  http.post(`${API_BASE}/v1/auth/forgot-password`, async ({ request }) => {
    const { email } = await request.json() as { email: string }

    await new Promise(resolve => setTimeout(resolve, 100))

    const user = mockUsers.find(u => u.email === email)

    // Always return success for security reasons
    return HttpResponse.json({
      success: true,
      data: {
        message: '如果邮箱存在,密码重置邮件已发送',
      },
    })
  }),

  // POST /v1/auth/reset-password - Reset password
  http.post(`${API_BASE}/v1/auth/reset-password`, async ({ request }) => {
    const { token, password } = await request.json() as { token: string; password: string }

    await new Promise(resolve => setTimeout(resolve, 100))

    if (!token || !password) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '无效的请求',
            type: '400',
          },
        },
        { status: 400 },
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        message: '密码重置成功',
      },
    })
  }),
]

// Helper function to reset mock users (for testing)
export const resetMockUsers = () => {
  mockUsers.length = 0
  mockUsers.push(
    createUserFactory({
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    }),
    createUserFactory({
      id: '2',
      username: 'author',
      email: 'author@example.com',
      role: 'author',
    }),
    createUserFactory({
      id: '3',
      username: 'user',
      email: 'user@example.com',
      role: 'user',
    }),
  )
}
