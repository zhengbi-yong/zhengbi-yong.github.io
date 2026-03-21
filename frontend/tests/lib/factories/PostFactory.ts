/**
 * Post Factory
 *
 * Generates test blog post data with realistic content using Faker.js
 */

import { faker } from '@faker-js/faker'

/**
 * Post interface matching backend API response
 */
export interface TestPost {
  id: string
  slug: string
  title: string
  summary?: string | null
  excerpt?: string | null
  content: string
  author: {
    id: string
    username: string
    email: string
    profile?: { avatar?: string | null } | null
  }
  coverImage?: string | null
  tags: string[]
  category?: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  readingTime: number
  viewCount: number
  likeCount: number
  commentCount: number
  featured: boolean
  status: 'draft' | 'published' | 'archived'
}

/**
 * Factory options for customizing generated posts
 */
export interface PostFactoryOptions {
  id?: string
  slug?: string
  title?: string
  excerpt?: string | null
  content?: string
  authorId?: string
  authorName?: string
  authorEmail?: string
  coverImage?: string | null
  tags?: string[]
  category?: string | null
  published?: boolean
  publishedAt?: Date | string | null
  createdAt?: Date | string
  featured?: boolean
  status?: 'draft' | 'published' | 'archived'
  readingTime?: number
  viewCount?: number
  likeCount?: number
  commentCount?: number
}

// Common categories for realistic blog posts
const BLOG_CATEGORIES = [
  'Technology',
  'Web Development',
  'React',
  'Next.js',
  'TypeScript',
  'Tutorial',
  'Best Practices',
  'Career',
  'Programming',
  'Frontend',
  'Backend',
  'DevOps',
  'Design',
  'Performance',
  'Security',
]

// Common tags for blog posts
const COMMON_TAGS = [
  'react',
  'nextjs',
  'typescript',
  'javascript',
  'webdev',
  'frontend',
  'tutorial',
  'programming',
  'best-practices',
  'performance',
  'testing',
  'accessibility',
  'css',
  'tailwind',
  'ui/ux',
  'career',
  'learning',
  'tips',
  'tricks',
]

/**
 * Generate a single test blog post
 *
 * @param options - Partial post data to override random values
 * @returns TestPost object with realistic content
 *
 * @example
 * ```ts
 * const post = createPostFactory()
 * const publishedPost = createPostFactory({ status: 'published', featured: true })
 * const draftPost = createPostFactory({ status: 'draft' })
 * ```
 */
export function createPostFactory(options: PostFactoryOptions = {}): TestPost {
  const title = options.title || faker.lorem.sentence({ min: 4, max: 12 })
  const published = options.published ?? (options.status === 'published' || faker.datatype.boolean({ probability: 0.8 }))
  const createdAt = options.createdAt
    ? new Date(options.createdAt)
    : faker.date.past({ years: 2 })

  // Generate slug from title
  const slug = options.slug || title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  // Generate content with realistic structure
  const paragraphs = faker.number.int({ min: 3, max: 10 })
  const content = options.content || Array.from({ length: paragraphs }, () =>
    faker.lorem.paragraph({ min: 3, max: 8 })
  ).join('\n\n')

  // Generate tags
  const tagCount = faker.number.int({ min: 1, max: 5 })
  const tags = options.tags || faker.helpers.arrayElements(COMMON_TAGS, tagCount)

  // Generate excerpt if not provided
  const excerpt = options.excerpt !== undefined
    ? options.excerpt
    : faker.datatype.boolean({ probability: 0.7 })
      ? faker.lorem.paragraph({ min: 1, max: 3 })
      : null

  // Generate cover image
  const coverImage = options.coverImage !== undefined
    ? options.coverImage
    : faker.datatype.boolean({ probability: 0.6 })
      ? faker.image.urlLoremFlickr({ width: 1200, height: 630, category: 'technology' })
      : null

  const post: TestPost = {
    id: options.id || faker.string.uuid(),
    slug,
    title,
    excerpt,
    content,
    author: {
      id: options.authorId || faker.string.uuid(),
      username: options.authorName || faker.internet.username(),
      email: options.authorEmail || faker.internet.email(),
      profile: {
        avatar: faker.datatype.boolean() ? faker.image.avatar() : null,
      },
    },
    coverImage,
    tags,
    category: options.category || faker.helpers.arrayElement(BLOG_CATEGORIES),
    publishedAt: (published && (options.publishedAt !== undefined || options.status === 'published'))
      ? new Date(options.publishedAt || faker.date.between({ from: createdAt, to: new Date() })).toISOString()
      : null,
    createdAt: createdAt.toISOString(),
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
    readingTime: options.readingTime || faker.number.int({ min: 3, max: 20 }),
    viewCount: options.viewCount || faker.number.int({ min: 0, max: 10000 }),
    likeCount: options.likeCount || faker.number.int({ min: 0, max: 500 }),
    commentCount: options.commentCount || faker.number.int({ min: 0, max: 100 }),
    featured: options.featured ?? faker.datatype.boolean({ probability: 0.1 }),
    status: options.status || (published ? 'published' : 'draft'),
  }

  return post
}

/**
 * Generate multiple test posts
 *
 * @param count - Number of posts to generate
 * @param options - Factory options to apply to all posts
 * @returns Array of TestPost objects
 *
 * @example
 * ```ts
 * const posts = createPostsFactory(10)
 * const publishedPosts = createPostsFactory(5, { status: 'published' })
 * ```
 */
export function createPostsFactory(count: number, options: PostFactoryOptions = {}): TestPost[] {
  return Array.from({ length: count }, () => createPostFactory(options))
}

/**
 * Preset post configurations for common scenarios
 */
export const PostPresets = {
  /**
   * Published blog post
   */
  publishedPost: (): TestPost =>
    createPostFactory({
      status: 'published',
      published: true,
      excerpt: faker.lorem.paragraph({ min: 1, max: 3 }),
      coverImage: faker.image.urlLoremFlickr({ width: 1200, height: 630, category: 'technology' }),
      featured: false,
    }),

  /**
   * Featured blog post
   */
  featuredPost: (): TestPost =>
    createPostFactory({
      status: 'published',
      published: true,
      featured: true,
      excerpt: faker.lorem.paragraph({ min: 1, max: 3 }),
      coverImage: faker.image.urlLoremFlickr({ width: 1200, height: 630, category: 'technology' }),
      viewCount: faker.number.int({ min: 5000, max: 10000 }),
    }),

  /**
   * Draft post (unpublished)
   */
  draftPost: (): TestPost =>
    createPostFactory({
      status: 'draft',
      published: false,
      excerpt: null,
      coverImage: null,
    }),

  /**
   * Popular post (high engagement)
   */
  popularPost: (): TestPost =>
    createPostFactory({
      status: 'published',
      published: true,
      featured: true,
      viewCount: faker.number.int({ min: 10000, max: 50000 }),
      likeCount: faker.number.int({ min: 500, max: 2000 }),
      commentCount: faker.number.int({ min: 50, max: 200 }),
    }),

  /**
   * Tutorial post
   */
  tutorialPost: (): TestPost =>
    createPostFactory({
      status: 'published',
      published: true,
      tags: ['tutorial', 'webdev', 'frontend'],
      category: 'Tutorial',
      content: Array.from({ length: 10 }, () =>
        faker.lorem.paragraph({ min: 5, max: 10 })
      ).join('\n\n'),
      readingTime: faker.number.int({ min: 10, max: 20 }),
    }),

  /**
   * Quick tip post (short content)
   */
  quickTipPost: (): TestPost =>
    createPostFactory({
      status: 'published',
      published: true,
      content: faker.lorem.paragraphs(2),
      readingTime: faker.number.int({ min: 2, max: 5 }),
      tags: ['tips', 'tricks', 'quick'],
    }),

  /**
   * Old post (created > 1 year ago)
   */
  archivedPost: (): TestPost =>
    createPostFactory({
      status: 'archived',
      createdAt: faker.date.past({ years: 3 }),
      viewCount: faker.number.int({ min: 5000, max: 20000 }),
    }),
}
