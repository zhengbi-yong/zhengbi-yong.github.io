// MSW handlers for Blog API
import { http } from 'msw'
import { createPostFactory, createCommentFactory } from '../../../tests/lib/factories'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4010'

// Mock posts database
let mockPosts = Array.from({ length: 50 }, (_, i) =>
  createPostFactory({
    id: `post-${i + 1}`,
    title: `Test Post ${i + 1}`,
    slug: `test-post-${i + 1}`,
    status: i % 5 === 0 ? 'draft' : 'published', // 20% draft
  }),
)

// Mock comments database
const mockComments: Record<string, any[]> = {}

export const blogHandlers = [
  // GET /v1/posts - List posts with pagination
  http.get(`${API_BASE}/v1/posts`, async ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') || '1')
    const limit = Number(new URL(request.url).searchParams.get('limit') || '20')
    const status = new URL(request.url).searchParams.get('status') || 'published'
    const tag = new URL(request.url).searchParams.get('tag')
    const search = new URL(request.url).searchParams.get('search')

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Filter posts
    let filteredPosts = mockPosts.filter(post => post.status === status)

    if (tag) {
      filteredPosts = filteredPosts.filter(post => post.tags?.includes(tag))
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredPosts = filteredPosts.filter(
        post =>
          post.title.toLowerCase().includes(searchLower) ||
          post.summary.toLowerCase().includes(searchLower),
      )
    }

    // Paginate
    const total = filteredPosts.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedPosts = filteredPosts.slice(start, end)

    return HttpResponse.json(
      ctx.status(200),
      HttpResponse.json({
        success: true,
        data: {
          items: paginatedPosts,
          meta: {
            page,
            limit,
            total,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      }),
      // delay removed: 50),
    )
  }),

  // GET /v1/posts/:slug - Get single post
  http.get(`${API_BASE}/v1/posts/:slug`, async ({ request }) => {
    const { slug } = params

    await new Promise(resolve => setTimeout(resolve, 100))

    const post = mockPosts.find(p => p.slug === slug)

    if (!post) {
      return HttpResponse.json(
        ctx.status(404),
        HttpResponse.json({
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: '文章不存在',
            type: '404',
          },
        }),
      )
    }

    return HttpResponse.json(
      ctx.status(200),
      HttpResponse.json({
        success: true,
        data: post,
      }),
      // delay removed: 50),
    )
  }),

  // POST /v1/posts - Create post
  http.post(`${API_BASE}/v1/posts`, async ({ request }) => {
    const postData = await request.json()

    await new Promise(resolve => setTimeout(resolve, 100))

    const newPost = createPostFactory({
      ...postData,
      id: `post-${mockPosts.length + 1}`,
      slug: postData.slug || `new-post-${Date.now()}`,
    })

    mockPosts.unshift(newPost)

    return HttpResponse.json(
      ctx.status(201),
      HttpResponse.json({
        success: true,
        data: newPost,
      }),
      // delay removed: 50),
    )
  }),

  // PUT /v1/posts/:id - Update post
  http.put(`${API_BASE}/v1/posts/:id`, async ({ request }) => {
    const { id } = params
    const updateData = await request.json()

    await new Promise(resolve => setTimeout(resolve, 100))

    const postIndex = mockPosts.findIndex(p => p.id === id)

    if (postIndex === -1) {
      return HttpResponse.json(
        ctx.status(404),
        HttpResponse.json({
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: '文章不存在',
            type: '404',
          },
        }),
      )
    }

    // Update post
    mockPosts[postIndex] = {
      ...mockPosts[postIndex],
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json(
      ctx.status(200),
      HttpResponse.json({
        success: true,
        data: mockPosts[postIndex],
      }),
      // delay removed: 50),
    )
  }),

  // DELETE /v1/posts/:id - Delete post
  http.delete(`${API_BASE}/v1/posts/:id`, async ({ request }) => {
    const { id } = params

    await new Promise(resolve => setTimeout(resolve, 100))

    const postIndex = mockPosts.findIndex(p => p.id === id)

    if (postIndex === -1) {
      return HttpResponse.json(
        ctx.status(404),
        HttpResponse.json({
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: '文章不存在',
            type: '404',
          },
        }),
      )
    }

    mockPosts.splice(postIndex, 1)

    return HttpResponse.json(
      ctx.status(200),
      HttpResponse.json({
        success: true,
        data: {
          message: '文章已删除',
        },
      }),
      // delay removed: 50),
    )
  }),

  // GET /v1/posts/:slug/comments - Get post comments
  http.get(`${API_BASE}/v1/posts/:slug/comments`, async ({ request }) => {
    const { slug } = params
    const page = Number(new URL(request.url).searchParams.get('page') || '1')
    const limit = Number(new URL(request.url).searchParams.get('limit') || '20')

    await new Promise(resolve => setTimeout(resolve, 50))

    // Get or create comments for this post
    if (!mockComments[slug]) {
      mockComments[slug] = Array.from({ length: 5 }, (_, i) =>
        createCommentFactory({
          id: `comment-${slug}-${i + 1}`,
          post_slug: slug,
        }),
      )
    }

    const comments = mockComments[slug]
    const total = comments.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedComments = comments.slice(start, end)

    return HttpResponse.json(
      ctx.status(200),
      HttpResponse.json({
        success: true,
        data: {
          items: paginatedComments,
          meta: {
            page,
            limit,
            total,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      }),
    )
  }),

  // POST /v1/posts/:slug/comments - Create comment
  http.post(`${API_BASE}/v1/posts/:slug/comments`, async ({ request }) => {
    const { slug } = params
    const commentData = await request.json()

    await new Promise(resolve => setTimeout(resolve, 100))

    if (!commentData.content || commentData.content.trim().length === 0) {
      return HttpResponse.json(
        ctx.status(400),
        HttpResponse.json({
          success: false,
          error: {
            code: 'INVALID_COMMENT',
            message: '评论内容不能为空',
            type: '400',
          },
        }),
      )
    }

    // Initialize comments array if needed
    if (!mockComments[slug]) {
      mockComments[slug] = []
    }

    const newComment = createCommentFactory({
      post_slug: slug,
      ...commentData,
    })

    mockComments[slug].push(newComment)

    return HttpResponse.json(
      ctx.status(201),
      HttpResponse.json({
        success: true,
        data: newComment,
      }),
      // delay removed: 50),
    )
  }),

  // DELETE /v1/comments/:id - Delete comment
  http.delete(`${API_BASE}/v1/comments/:id`, async ({ request }) => {
    const { id } = params

    await new Promise(resolve => setTimeout(resolve, 50))

    // Find and delete comment
    for (const slug in mockComments) {
      const commentIndex = mockComments[slug].findIndex(c => c.id === id)
      if (commentIndex !== -1) {
        mockComments[slug].splice(commentIndex, 1)
        return HttpResponse.json(
          ctx.status(200),
          HttpResponse.json({
            success: true,
            data: {
              message: '评论已删除',
            },
          }),
        )
      }
    }

    return HttpResponse.json(
      ctx.status(404),
      HttpResponse.json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: '评论不存在',
          type: '404',
        },
      }),
    )
  }),

  // GET /v1/tags - Get all tags
  http.get(`${API_BASE}/v1/tags`, async ({ request }) => {
    await new Promise(resolve => setTimeout(resolve, 50))

    const tags = ['React', 'Next.js', 'TypeScript', 'Testing', 'Performance', 'CSS', 'JavaScript']

    return HttpResponse.json(
      ctx.status(200),
      HttpResponse.json({
        success: true,
        data: {
          items: tags.map((tag, index) => ({
            id: `tag-${index + 1}`,
            name: tag,
            slug: tag.toLowerCase(),
            count: Math.floor(Math.random() * 50) + 1,
          })),
        },
      }),
    )
  }),
]

// Helper function to reset mock posts
export const resetMockPosts = () => {
  mockPosts.length = 0
  mockPosts.push(
    ...Array.from({ length: 50 }, (_, i) =>
      createPostFactory({
        id: `post-${i + 1}`,
        title: `Test Post ${i + 1}`,
        slug: `test-post-${i + 1}`,
        status: i % 5 === 0 ? 'draft' : 'published',
      }),
    ),
  )
}
