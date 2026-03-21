/**
 * User Factory
 *
 * Generates test user data with realistic values using Faker.js
 */

import { faker } from '@faker-js/faker'

/**
 * User interface matching backend API response
 */
export interface TestUser {
  id: string
  username: string
  email: string
  password?: string
  profile: {
    avatar?: string | null
    bio?: string | null
    location?: string | null
    website?: string | null
  } | null
  email_verified: boolean
  role: 'user' | 'admin' | 'moderator'
  created_at: string
  updated_at: string
}

/**
 * Factory options for customizing generated users
 */
export interface UserFactoryOptions {
  id?: string
  username?: string
  email?: string
  password?: string
  emailVerified?: boolean
  role?: 'user' | 'admin' | 'moderator'
  withProfile?: boolean
  avatar?: string | null
  createdAt?: Date | string
}

/**
 * Generate a single test user
 *
 * @param options - Partial user data to override random values
 * @returns TestUser object with realistic data
 *
 * @example
 * ```ts
 * const user = createUserFactory()
 * const admin = createUserFactory({ role: 'admin' })
 * const verifiedUser = createUserFactory({ emailVerified: true, withProfile: true })
 * ```
 */
export function createUserFactory(options: UserFactoryOptions = {}): TestUser {
  const username = options.username || faker.internet.username()
  const email = options.email || faker.internet.email()
  const createdAt = options.createdAt
    ? new Date(options.createdAt)
    : faker.date.past({ years: 2 })

  const user: TestUser = {
    id: options.id || faker.string.uuid(),
    username,
    email,
    password: options.password || faker.internet.password({ length: 12 }),
    email_verified: options.emailVerified ?? faker.datatype.boolean({ probability: 0.3 }),
    role: options.role || 'user',
    created_at: createdAt.toISOString(),
    updated_at: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
    profile: { avatar: null } as any,
  }

  // Add profile if requested or randomly (30% chance)
  if (options.withProfile || options.avatar !== undefined || (options.withProfile === undefined && faker.datatype.boolean({ probability: 0.3 }))) {
    user.profile = {
      avatar: options.avatar !== undefined ? options.avatar : (faker.datatype.boolean() ? faker.image.avatar() : null),
      bio: faker.lorem.sentence({ min: 5, max: 20 }),
      location: faker.location.city() + ', ' + faker.location.countryCode('alpha-2'),
      website: faker.datatype.boolean() ? faker.internet.url() : null,
    }
  } else {
    user.profile = null
  }

  return user
}

/**
 * Generate multiple test users
 *
 * @param count - Number of users to generate
 * @param options - Factory options to apply to all users
 * @returns Array of TestUser objects
 *
 * @example
 * ```ts
 * const users = createUsersFactory(5)
 * const admins = createUsersFactory(3, { role: 'admin', emailVerified: true })
 * ```
 */
export function createUsersFactory(count: number, options: UserFactoryOptions = {}): TestUser[] {
  return Array.from({ length: count }, () => createUserFactory(options))
}

/**
 * Generate authenticated user response (API login response format)
 *
 * @param options - User factory options
 * @returns Login response with access token and user data
 *
 * @example
 * ```ts
 * const loginResponse = createAuthResponseFactory({ role: 'admin' })
 * ```
 */
export function createAuthResponseFactory(options: UserFactoryOptions = {}): {
  access_token: string
  refresh_token: string
  user: TestUser
} {
  return {
    access_token: faker.string.alphanumeric({ length: 64 }),
    refresh_token: faker.string.alphanumeric({ length: 64 }),
    user: createUserFactory(options),
  }
}

/**
 * Preset user configurations for common scenarios
 */
export const UserPresets = {
  /**
   * Regular verified user
   */
  verifiedUser: (): TestUser =>
    createUserFactory({
      emailVerified: true,
      withProfile: true,
      role: 'user',
    }),

  /**
   * Admin user with verified email
   */
  adminUser: (): TestUser =>
    createUserFactory({
      emailVerified: true,
      withProfile: true,
      role: 'admin',
    }),

  /**
   * Moderator user
   */
  moderatorUser: (): TestUser =>
    createUserFactory({
      emailVerified: true,
      role: 'moderator',
    }),

  /**
   * Unverified user (new registration)
   */
  unverifiedUser: (): TestUser =>
    createUserFactory({
      emailVerified: false,
      withProfile: false,
    }),

  /**
   * User without avatar
   */
  userWithoutAvatar: (): TestUser =>
    createUserFactory({
      emailVerified: true,
      withProfile: true,
      avatar: null,
    }),

  /**
   * Old user (created > 1 year ago)
   */
  longTermUser: (): TestUser =>
    createUserFactory({
      emailVerified: true,
      withProfile: true,
      createdAt: faker.date.past({ years: 3 }),
    }),
}

/**
 * Generate a mock JWT token
 *
 * @returns Mock JWT token string
 *
 * @example
 * ```ts
 * const token = createAuthToken()
 * ```
 */
export function createAuthToken(): string {
  return faker.string.alphanumeric({ length: 64 })
}
