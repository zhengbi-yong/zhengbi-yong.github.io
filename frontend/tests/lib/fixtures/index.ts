/**
 * Test Fixtures
 *
 * Centralized exports for all test fixtures.
 * Provides pre-configured scenarios for common test cases.
 *
 * @example
 * ```ts
 * import { AuthFixtures, BlogFixtures } from '@/tests/lib/fixtures'
 *
 * const authState = AuthFixtures.authenticatedUser()
 * const blogState = BlogFixtures.completeBlogState()
 * ```
 */

// Auth fixtures
export {
  AuthFixtures,
  AuthResponseFixtures,
  mockAuthStateInStorage,
  mockAuthService,
  setupAuthContext,
  type AuthStateFixture,
  type AuthResponseFixture,
} from './auth-fixtures'

// Blog fixtures
export {
  BlogFixtures,
  BlogResponseFixtures,
  mockBlogService,
  setupBlogContext,
  generatePostsByTags,
  type BlogResponseFixture,
  type BlogStateFixture,
} from './blog-fixtures'
