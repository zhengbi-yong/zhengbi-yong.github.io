/**
 * Post Factory Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  createPostFactory,
  createPostsFactory,
  PostPresets,
  type TestPost,
} from './PostFactory'

describe('PostFactory', () => {
  describe('createPostFactory', () => {
    it('should generate a valid post with all required fields', () => {
      const post = createPostFactory()

      expect(post).toHaveProperty('id')
      expect(post).toHaveProperty('slug')
      expect(post).toHaveProperty('title')
      expect(post).toHaveProperty('content')
      expect(post).toHaveProperty('author')
      expect(post).toHaveProperty('tags')
      expect(post).toHaveProperty('category')
      expect(post).toHaveProperty('createdAt')
      expect(post).toHaveProperty('updatedAt')
    })

    it('should generate valid UUID for post ID', () => {
      const post = createPostFactory()

      expect(post.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should generate slug from title', () => {
      const post = createPostFactory({ title: 'My Test Post Title' })

      expect(post.slug).toBe('my-test-post-title')
    })

    it('should accept custom slug', () => {
      const post = createPostFactory({ slug: 'custom-slug' })

      expect(post.slug).toBe('custom-slug')
    })

    it('should accept custom options', () => {
      const customPost = createPostFactory({
        title: 'Custom Title',
        status: 'published',
        featured: true,
        readingTime: 10,
      })

      expect(customPost.title).toBe('Custom Title')
      expect(customPost.status).toBe('published')
      expect(customPost.featured).toBe(true)
      expect(customPost.readingTime).toBe(10)
    })

    it('should generate published post with publishedAt when status is published', () => {
      const post = createPostFactory({ status: 'published' })

      expect(post.publishedAt).not.toBeNull()
    })

    it('should generate draft post without publishedAt', () => {
      const post = createPostFactory({ status: 'draft' })

      expect(post.publishedAt).toBeNull()
    })

    it('should include author object', () => {
      const post = createPostFactory()

      expect(post.author).toHaveProperty('id')
      expect(post.author).toHaveProperty('username')
      expect(post.author).toHaveProperty('email')
      expect(post.author).toHaveProperty('profile')
    })

    it('should generate tags array', () => {
      const post = createPostFactory()

      expect(Array.isArray(post.tags)).toBe(true)
      expect(post.tags.length).toBeGreaterThan(0)
      expect(post.tags.length).toBeLessThanOrEqual(20) // Faker may generate more tags
    })

    it('should accept custom tags', () => {
      const post = createPostFactory({ tags: ['react', 'nextjs'] })

      expect(post.tags).toEqual(['react', 'nextjs'])
    })

    it('should include cover image when specified', () => {
      const post = createPostFactory({ coverImage: 'https://example.com/image.jpg' })

      expect(post.coverImage).toBe('https://example.com/image.jpg')
    })
  })

  describe('createPostsFactory', () => {
    it('should generate multiple posts', () => {
      const posts = createPostsFactory(5)

      expect(posts).toHaveLength(5)
      posts.forEach(post => {
        expect(post).toHaveProperty('id')
        expect(post).toHaveProperty('title')
        expect(post).toHaveProperty('slug')
      })
    })

    it('should generate unique IDs for each post', () => {
      const posts = createPostsFactory(10)

      const ids = posts.map(post => post.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(10)
    })

    it('should generate unique slugs for each post', () => {
      const posts = createPostsFactory(10)

      const slugs = posts.map(post => post.slug)
      const uniqueSlugs = new Set(slugs)

      expect(uniqueSlugs.size).toBe(10)
    })

    it('should apply custom options to all posts', () => {
      const posts = createPostsFactory(3, { status: 'published' })

      posts.forEach(post => {
        expect(post.status).toBe('published')
      })
    })
  })

  describe('PostPresets', () => {
    it('should create published post preset', () => {
      const post = PostPresets.publishedPost()

      expect(post.status).toBe('published')
      expect(post.publishedAt).not.toBeNull()
    })

    it('should create featured post preset', () => {
      const post = PostPresets.featuredPost()

      expect(post.featured).toBe(true)
      expect(post.status).toBe('published')
      expect(post.coverImage).not.toBeNull()
    })

    it('should create draft post preset', () => {
      const post = PostPresets.draftPost()

      expect(post.status).toBe('draft')
      expect(post.publishedAt).toBeNull()
    })

    it('should create popular post preset', () => {
      const post = PostPresets.popularPost()

      expect(post.status).toBe('published')
      expect(post.viewCount).toBeGreaterThanOrEqual(10000)
      expect(post.likeCount).toBeGreaterThanOrEqual(500)
    })

    it('should create tutorial post preset', () => {
      const post = PostPresets.tutorialPost()

      expect(post.status).toBe('published')
      expect(post.tags).toContain('tutorial')
      expect(post.category).toBe('Tutorial')
    })

    it('should create quick tip post preset', () => {
      const post = PostPresets.quickTipPost()

      expect(post.status).toBe('published')
      expect(post.readingTime).toBeLessThanOrEqual(5)
      expect(post.tags).toContain('tips')
    })
  })
})
