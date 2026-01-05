/**
 * Comment Factory
 *
 * Generates test comment data with realistic content using Faker.js
 */

import { faker } from '@faker-js/faker'

/**
 * Comment interface matching backend API response
 */
export interface TestComment {
  id: string
  post_id: string
  author: {
    id: string
    username: string
    email: string
    profile?: { avatar?: string | null } | null
  }
  content: string
  parent_id?: string | null
  replies?: TestComment[] | null
  created_at: string
  updated_at: string
  like_count: number
  is_edited: boolean
}

/**
 * Factory options for customizing generated comments
 */
export interface CommentFactoryOptions {
  id?: string
  postId?: string
  authorId?: string
  authorName?: string
  authorEmail?: string
  content?: string
  parentId?: string | null
  createdAt?: Date | string
  likeCount?: number
  isEdited?: boolean
  withReplies?: boolean
  replyCount?: number
}

/**
 * Generate a single test comment
 *
 * @param options - Partial comment data to override random values
 * @returns TestComment object with realistic content
 *
 * @example
 * ```ts
 * const comment = createCommentFactory({ postId: 'post-123' })
 * const reply = createCommentFactory({ parentId: 'comment-123' })
 * const editedComment = createCommentFactory({ isEdited: true })
 * ```
 */
export function createCommentFactory(options: CommentFactoryOptions = {}): TestComment {
  const createdAt = options.createdAt
    ? new Date(options.createdAt)
    : faker.date.past({ years: 1 })

  const comment: TestComment = {
    id: options.id || faker.string.uuid(),
    post_id: options.postId || faker.string.uuid(),
    author: {
      id: options.authorId || faker.string.uuid(),
      username: options.authorName || faker.internet.username(),
      email: options.authorEmail || faker.internet.email(),
      profile: {
        avatar: faker.datatype.boolean() ? faker.image.avatar() : null,
      },
    },
    content: options.content || faker.lorem.paragraph({ min: 1, max: 5 }),
    parent_id: options.parentId || null,
    created_at: createdAt.toISOString(),
    updated_at: options.isEdited
      ? faker.date.between({ from: createdAt, to: new Date() }).toISOString()
      : createdAt.toISOString(),
    like_count: options.likeCount || faker.number.int({ min: 0, max: 50 }),
    is_edited: options.isEdited ?? faker.datatype.boolean({ probability: 0.2 }),
  }

  // Add nested replies if requested
  if (options.withReplies && !options.parentId) {
    const replyCount = options.replyCount || faker.number.int({ min: 0, max: 5 })
    comment.replies = Array.from({ length: replyCount }, () =>
      createCommentFactory({
        postId: comment.post_id,
        parentId: comment.id,
        createdAt: faker.date.between({ from: createdAt, to: new Date() }),
      })
    )
  } else {
    comment.replies = null
  }

  return comment
}

/**
 * Generate multiple test comments
 *
 * @param count - Number of comments to generate
 * @param options - Factory options to apply to all comments
 * @returns Array of TestComment objects
 *
 * @example
 * ```ts
 * const comments = createCommentsFactory(10, { postId: 'post-123' })
 * ```
 */
export function createCommentsFactory(count: number, options: CommentFactoryOptions = {}): TestComment[] {
  return Array.from({ length: count }, () => createCommentFactory(options))
}

/**
 * Generate a comment thread with replies
 *
 * @param topLevelCount - Number of top-level comments
 * @param maxReplies - Maximum number of replies per comment
 * @param postId - Post ID for the comments
 * @returns Array of TestComment objects with nested replies
 *
 * @example
 * ```ts
 * const thread = createCommentThreadFactory(5, 3, 'post-123')
 * ```
 */
export function createCommentThreadFactory(
  topLevelCount: number,
  maxReplies: number = 3,
  postId?: string
): TestComment[] {
  return Array.from({ length: topLevelCount }, () =>
    createCommentFactory({
      postId,
      withReplies: true,
      replyCount: faker.number.int({ min: 0, max: maxReplies }),
    })
  )
}

/**
 * Preset comment configurations for common scenarios
 */
export const CommentPresets = {
  /**
   * Regular comment
   */
  regularComment: (): TestComment =>
    createCommentFactory({
      content: faker.lorem.paragraph({ min: 1, max: 3 }),
      isEdited: false,
    }),

  /**
   * Long comment (detailed feedback)
   */
  longComment: (): TestComment =>
    createCommentFactory({
      content: faker.lorem.paragraphs({ min: 3, max: 6 }),
      likeCount: faker.number.int({ min: 10, max: 50 }),
    }),

  /**
   * Popular comment (many likes)
   */
  popularComment: (): TestComment =>
    createCommentFactory({
      content: faker.lorem.sentence({ min: 5, max: 15 }),
      likeCount: faker.number.int({ min: 50, max: 200 }),
    }),

  /**
   * Edited comment
   */
  editedComment: (): TestComment =>
    createCommentFactory({
      content: faker.lorem.paragraph(),
      isEdited: true,
    }),

  /**
   * Comment with replies
   */
  commentWithReplies: (): TestComment =>
    createCommentFactory({
      content: faker.lorem.paragraph(),
      withReplies: true,
      replyCount: faker.number.int({ min: 2, max: 5 }),
    }),

  /**
   * Reply comment
   */
  replyComment: (parentId: string): TestComment =>
    createCommentFactory({
      parentId,
      content: faker.lorem.paragraph({ min: 1, max: 2 }),
    }),

  /**
   * Recent comment (created within last hour)
   */
  recentComment: (): TestComment =>
    createCommentFactory({
      content: faker.lorem.paragraph(),
      createdAt: faker.date.recent({ days: 1 }),
    }),

  /**
   * Old comment (created > 6 months ago)
   */
  oldComment: (): TestComment =>
    createCommentFactory({
      content: faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 1 }),
      likeCount: faker.number.int({ min: 20, max: 100 }),
    }),
}
