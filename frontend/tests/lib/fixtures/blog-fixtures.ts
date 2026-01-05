/**
 * Blog Post Test Fixtures
 *
 * Pre-configured blog post scenarios for testing.
 * Provides realistic post data and API response mocks.
 */

import { TestPost } from '../factories'
import { PostPresets } from '../factories/PostFactory'
import { createCommentThreadFactory } from '../factories/CommentFactory'

/**
 * Blog API response fixture
 */
export interface BlogResponseFixture {
  success: boolean
  data?: TestPost | TestPost[]
  pagination?: {
    total: number
    page: number
    pageSize: number
  }
  error?: {
    message: string
    code?: string
  }
}

/**
 * Blog state fixture with posts and filters
 */
export interface BlogStateFixture {
  posts: TestPost[]
  featuredPosts: TestPost[]
  currentPage: number
  totalPages: number
  totalPosts: number
  filters: {
    category?: string
    tags?: string[]
    searchQuery?: string
  }
}

/**
 * Fixtures for blog post scenarios
 */
export const BlogFixtures = {
  /**
   * Collection of published posts
   */
  publishedPosts: (count: number = 10): TestPost[] =>
    Array.from({ length: count }, () => PostPresets.publishedPost()),

  /**
   * Featured posts for homepage
   */
  featuredPosts: (count: number = 3): TestPost[] =>
    Array.from({ length: count }, () => PostPresets.featuredPost()),

  /**
   * Draft posts (unpublished)
   */
  draftPosts: (count: number = 5): TestPost[] =>
    Array.from({ length: count }, () => PostPresets.draftPost()),

  /**
   * Popular posts (high engagement)
   */
  popularPosts: (count: number = 5): TestPost[] =>
    Array.from({ length: count }, () => PostPresets.popularPost()),

  /**
   * Tutorial posts
   */
  tutorialPosts: (count: number = 3): TestPost[] =>
    Array.from({ length: count }, () => PostPresets.tutorialPost()),

  /**
   * Complete blog state with various post types
   */
  completeBlogState: (): BlogStateFixture => ({
    posts: BlogFixtures.publishedPosts(20),
    featuredPosts: BlogFixtures.featuredPosts(3),
    currentPage: 1,
    totalPages: 3,
    totalPosts: 50,
    filters: {
      category: undefined,
      tags: [],
      searchQuery: '',
    },
  }),

  /**
   * Blog state with active filters
   */
  filteredBlogState: (category: string, tags?: string[]): BlogStateFixture => ({
    posts: BlogFixtures.publishedPosts(10).filter(post =>
      (!category || post.category === category) &&
      (!tags || tags.length === 0 || tags.some(tag => post.tags.includes(tag)))
    ),
    featuredPosts: [],
    currentPage: 1,
    totalPages: 1,
    totalPosts: 10,
    filters: { category, tags, searchQuery: '' },
  }),

  /**
   * Blog state with search results
   */
  searchResults: (query: string): BlogStateFixture => ({
    posts: BlogFixtures.publishedPosts(5).map(post => ({
      ...post,
      title: post.title.includes(query) ? post.title : `${query} - ${post.title}`,
    })),
    featuredPosts: [],
    currentPage: 1,
    totalPages: 1,
    totalPosts: 5,
    filters: {
      category: undefined,
      tags: [],
      searchQuery: query,
    },
  }),

  /**
   * Single post with comments
   */
  postWithComments: (commentCount: number = 10): TestPost => {
    const post = PostPresets.publishedPost()
    return {
      ...post,
      commentCount,
      comments: createCommentThreadFactory(commentCount, 3, post.id),
    }
  } as TestPost,
}

/**
 * Blog API response fixtures for different operations
 */
export const BlogResponseFixtures = {
  /**
   * Successful get posts list
   */
  getPostsSuccess: (posts?: TestPost[], pagination?: {
    total: number
    page: number
    pageSize: number
  }): BlogResponseFixture => ({
    success: true,
    data: posts || BlogFixtures.publishedPosts(10),
    pagination: pagination || {
      total: 50,
      page: 1,
      pageSize: 10,
    },
  }),

  /**
   * Successful get single post
   */
  getPostSuccess: (post?: TestPost): BlogResponseFixture => ({
    success: true,
    data: post || PostPresets.publishedPost(),
  }),

  /**
   * Post not found (404)
   */
  postNotFound: (): BlogResponseFixture => ({
    success: false,
    error: {
      message: 'Post not found',
      code: 'NOT_FOUND',
    },
  }),

  /**
   * Successful create post
   */
  createPostSuccess: (post?: TestPost): BlogResponseFixture => ({
    success: true,
    data: post || PostPresets.draftPost(),
  }),

  /**
   * Validation error on create
   */
  createPostFailure: (): BlogResponseFixture => ({
    success: false,
    error: {
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
    },
  }),

  /**
   * Successful update post
   */
  updatePostSuccess: (post?: TestPost): BlogResponseFixture => ({
    success: true,
    data: post || PostPresets.publishedPost(),
  }),

  /**
   * Successful delete post
   */
  deletePostSuccess: (): BlogResponseFixture => ({
    success: true,
  }),

  /**
   * Unauthorized to modify post
   */
  unauthorized: (): BlogResponseFixture => ({
    success: false,
    error: {
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    },
  }),
}

/**
 * Mock blog service with predefined responses
 *
 * @param fixtures - Map of method names to responses
 *
 * @example
 * ```ts
 * mockBlogService({
 *   getList: BlogResponseFixtures.getPostsSuccess(),
 *   getOne: BlogResponseFixtures.getPostSuccess(),
 * })
 * ```
 */
export function mockBlogService(fixtures: {
  getList?: BlogResponseFixture | (() => BlogResponseFixture)
  getOne?: BlogResponseFixture | (() => BlogResponseFixture)
  create?: BlogResponseFixture | (() => BlogResponseFixture)
  update?: BlogResponseFixture | (() => BlogResponseFixture)
  deleteOne?: BlogResponseFixture | (() => BlogResponseFixture)
}) {
  const blogService = {
    getList: vi.fn(async () => {
      const fixture = typeof fixtures.getList === 'function'
        ? (fixtures.getList as () => BlogResponseFixture)()
        : fixtures.getList
      if (fixture?.success) {
        return {
          data: fixture.data as TestPost[],
          total: fixture.pagination?.total || (fixture.data as TestPost[]).length,
        }
      }
      throw new Error(fixture?.error?.message || 'Failed to fetch posts')
    }),

    getOne: vi.fn(async () => {
      const fixture = typeof fixtures.getOne === 'function'
        ? (fixtures.getOne as () => BlogResponseFixture)()
        : fixtures.getOne
      if (fixture?.success) {
        return { data: fixture.data as TestPost }
      }
      throw new Error(fixture?.error?.message || 'Failed to fetch post')
    }),

    create: vi.fn(async () => {
      const fixture = typeof fixtures.create === 'function'
        ? (fixtures.create as () => BlogResponseFixture)()
        : fixtures.create
      if (fixture?.success) {
        return { data: fixture.data as TestPost }
      }
      throw new Error(fixture?.error?.message || 'Failed to create post')
    }),

    update: vi.fn(async () => {
      const fixture = typeof fixtures.update === 'function'
        ? (fixtures.update as () => BlogResponseFixture)()
        : fixtures.update
      if (fixture?.success) {
        return { data: fixture.data as TestPost }
      }
      throw new Error(fixture?.error?.message || 'Failed to update post')
    }),

    deleteOne: vi.fn(async () => {
      const fixture = typeof fixtures.deleteOne === 'function'
        ? (fixtures.deleteOne as () => BlogResponseFixture)()
        : fixtures.deleteOne
      if (fixture?.success) {
        return { data: {} }
      }
      throw new Error(fixture?.error?.message || 'Failed to delete post')
    }),
  }

  return blogService
}

/**
 * Setup complete blog context for testing
 *
 * @param blogState - Blog state fixture
 * @returns Object with mocked service and blog data
 *
 * @example
 * ```ts
 * const { service, posts } = setupBlogContext(BlogFixtures.completeBlogState())
 * ```
 */
export function setupBlogContext(blogState: BlogStateFixture) {
  const service = mockBlogService({
    getList: BlogResponseFixtures.getPostsSuccess(
      blogState.posts,
      {
        total: blogState.totalPosts,
        page: blogState.currentPage,
        pageSize: Math.ceil(blogState.totalPosts / blogState.totalPages),
      }
    ),
  })

  return {
    service,
    posts: blogState.posts,
    featuredPosts: blogState.featuredPosts,
    filters: blogState.filters,
  }
}

/**
 * Generate posts with specific tags for testing filters
 *
 * @param tags - Tags to include in posts
 * @param count - Number of posts per tag
 *
 * @example
 * ```ts
 * const posts = generatePostsByTags(['react', 'nextjs'], 3)
 * // Returns 6 posts (3 for 'react', 3 for 'nextjs')
 * ```
 */
export function generatePostsByTags(tags: string[], count: number = 5): TestPost[] {
  const posts: TestPost[] = []

  tags.forEach(tag => {
    Array.from({ length: count }, () => {
      posts.push(createPostFactory({
        tags: [tag, ...faker.helpers.arrayElements(COMMON_TAGS.filter(t => t !== tag), { count: 2 })],
      }))
    })
  })

  return posts
}

// Import from PostFactory
import { createPostFactory } from '../factories/PostFactory'
import { faker } from '@faker-js/faker'
import { COMMON_TAGS } from '../factories/PostFactory'
