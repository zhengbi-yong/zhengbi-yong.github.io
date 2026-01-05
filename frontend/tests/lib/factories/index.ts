/**
 * Test Factories
 *
 * Centralized exports for all test data factories.
 * Provides convenient access to factory functions for generating test data.
 *
 * @example
 * ```ts
 * import { createUserFactory, createPostFactory, createCommentFactory } from '@/tests/lib/factories'
 *
 * const user = createUserFactory({ role: 'admin' })
 * const post = createPostFactory({ status: 'published' })
 * const comment = createCommentFactory({ postId: post.id })
 * ```
 */

// User factories
export {
  createUserFactory,
  createUsersFactory,
  createAuthResponseFactory,
  createAuthToken,
  UserPresets,
  type TestUser,
  type UserFactoryOptions,
} from './UserFactory'

// Post factories
export {
  createPostFactory,
  createPostsFactory,
  PostPresets,
  type TestPost,
  type PostFactoryOptions,
} from './PostFactory'

// Comment factories
export {
  createCommentFactory,
  createCommentsFactory,
  createCommentThreadFactory,
  CommentPresets,
  type TestComment,
  type CommentFactoryOptions,
} from './CommentFactory'
