import { test, expect } from '@playwright/test'

const MOCK_API_URL = 'http://localhost:4010'

test.describe('API Contract Tests', () => {
  test('GET /v1/posts should return valid response structure', async ({ request }) => {
    const response = await request.get(`${MOCK_API_URL}/posts?page=1&limit=20`)

    expect(response.status()).toBe(200)

    const data = await response.json()

    // 验证响应结构
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')

    // 验证分页元数据
    if (data.data?.meta) {
      expect(data.data.meta).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
      })
    }
  })

  test.skip('404 error should have correct format', async ({ request }) => {
    // NOTE: Prism Mock Server doesn't support returning 404s for specific parameter values
    // This test would need to run against a real backend or use MSW custom handlers
    const response = await request.get(`${MOCK_API_URL}/posts/nonexistent`)

    expect(response.status()).toBe(404)

    const data = await response.json()

    // 验证错误格式
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe('POST_NOT_FOUND')
    expect(data.error.message).toBeTruthy()
  })

  test('POST /v1/auth/login should return tokens', async ({ request }) => {
    const response = await request.post(`${MOCK_API_URL}/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('access_token')
    expect(data.data).toHaveProperty('user')
  })
})
