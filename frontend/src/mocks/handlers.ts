// MSW (Mock Service Worker) handlers
// 用于前端独立开发和测试

import { rest } from 'msw'

// 模拟文章列表
export const postsHandlers = [
  rest.get('http://localhost:4010/v1/posts', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page') || '1')
    const limit = Number(req.url.searchParams.get('limit') || '20')

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: Array.from({ length: Math.min(limit, 20) }, (_, index) => ({
            id: `post-${page}-${index}`,
            slug: `post-${page}-${index}`,
            title: `Sample Post ${page}-${index + 1}`,
            summary: 'This is a sample post summary',
            status: 'published',
            created_at: new Date().toISOString(),
          })),
          meta: {
            page,
            limit,
            total: 100,
            total_pages: 5,
            has_next: page < 5,
            has_prev: page > 1,
          },
        },
      }),
    )
  }),

  // 模拟文章详情
  rest.get('http://localhost:4010/v1/posts/:slug', (req, res, ctx) => {
    const { slug } = req.params

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          id: '1',
          slug,
          title: `Post: ${slug}`,
          summary: 'This is a sample post',
          content: 'Full content here...',
          status: 'published',
          created_at: new Date().toISOString(),
        },
      }),
    )
  }),

  // 模拟认证
  rest.post('http://localhost:4010/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          access_token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            username: 'testuser',
          },
        },
      }),
    )
  }),

  // 模拟错误响应
  rest.get('http://localhost:4010/v1/posts/nonexistent', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: '文章不存在',
          type: '404',
        },
      }),
    )
  }),
]

export const handlers = [...postsHandlers]
