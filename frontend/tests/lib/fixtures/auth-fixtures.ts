/**
 * Authentication Test Fixtures
 *
 * Pre-configured authentication scenarios for testing.
 * Provides realistic auth state and API response mocks.
 */

import { TestUser } from '../factories'
import { UserPresets } from '../factories/UserFactory'

/**
 * Auth state fixture for different authentication scenarios
 */
export interface AuthStateFixture {
  user: TestUser | null
  token: string | null
  isAuthenticated: boolean
  tokenExpiry: string | null
}

/**
 * Auth API response fixture
 */
export interface AuthResponseFixture {
  success: boolean
  data?: {
    access_token: string
    refresh_token: string
    user: TestUser
  }
  error?: {
    message: string
    code?: string
  }
}

/**
 * Fixtures for authenticated user scenarios
 */
export const AuthFixtures = {
  /**
   * Regular authenticated user
   */
  authenticatedUser: (): AuthStateFixture => ({
    user: UserPresets.verifiedUser(),
    token: faker.string.alphanumeric({ length: 64 }),
    isAuthenticated: true,
    tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
  }),

  /**
   * Admin user with elevated privileges
   */
  adminSession: (): AuthStateFixture => ({
    user: UserPresets.adminUser(),
    token: faker.string.alphanumeric({ length: 64 }),
    isAuthenticated: true,
    tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
  }),

  /**
   * Moderator user
   */
  moderatorSession: (): AuthStateFixture => ({
    user: UserPresets.moderatorUser(),
    token: faker.string.alphanumeric({ length: 64 }),
    isAuthenticated: true,
    tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
  }),

  /**
   * Unauthenticated user (logged out)
   */
  unauthenticatedUser: (): AuthStateFixture => ({
    user: null,
    token: null,
    isAuthenticated: false,
    tokenExpiry: null,
  }),

  /**
   * Unverified user (pending email verification)
   */
  unverifiedUser: (): AuthStateFixture => ({
    user: UserPresets.unverifiedUser(),
    token: faker.string.alphanumeric({ length: 64 }),
    isAuthenticated: true,
    tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
  }),

  /**
   * Expired token scenario
   */
  expiredToken: (): AuthStateFixture => ({
    user: UserPresets.verifiedUser(),
    token: faker.string.alphanumeric({ length: 64 }),
    isAuthenticated: false,
    tokenExpiry: new Date(Date.now() - 3600000).toISOString(),
  }),
}

/**
 * Auth API response fixtures for different auth operations
 */
export const AuthResponseFixtures = {
  /**
   * Successful login response
   */
  loginSuccess: (user?: TestUser): AuthResponseFixture => ({
    success: true,
    data: {
      access_token: faker.string.alphanumeric({ length: 64 }),
      refresh_token: faker.string.alphanumeric({ length: 64 }),
      user: user || UserPresets.verifiedUser(),
    },
  }),

  /**
   * Failed login response
   */
  loginFailure: (message = 'Invalid credentials'): AuthResponseFixture => ({
    success: false,
    error: {
      message,
      code: 'INVALID_CREDENTIALS',
    },
  }),

  /**
   * Registration success response
   */
  registerSuccess: (user?: TestUser): AuthResponseFixture => ({
    success: true,
    data: {
      access_token: faker.string.alphanumeric({ length: 64 }),
      refresh_token: faker.string.alphanumeric({ length: 64 }),
      user: user || UserPresets.unverifiedUser(),
    },
  }),

  /**
   * Registration failure (email already exists)
   */
  registerFailure: (): AuthResponseFixture => ({
    success: false,
    error: {
      message: 'Email already exists',
      code: 'EMAIL_EXISTS',
    },
  }),

  /**
   * Logout success response
   */
  logoutSuccess: (): AuthResponseFixture => ({
    success: true,
  }),

  /**
   * Token refresh success response
   */
  refreshSuccess: (newToken?: string): AuthResponseFixture => ({
    success: true,
    data: {
      access_token: newToken || faker.string.alphanumeric({ length: 64 }),
      refresh_token: faker.string.alphanumeric({ length: 64 }),
      user: UserPresets.verifiedUser(),
    },
  }),

  /**
   * Unauthorized error (401)
   */
  unauthorized: (): AuthResponseFixture => ({
    success: false,
    error: {
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    },
  }),

  /**
   * Network error
   */
  networkError: (): AuthResponseFixture => ({
    success: false,
    error: {
      message: 'Network error',
      code: 'NETWORK_ERROR',
    },
  }),
}

/**
 * Mock localStorage with auth state
 *
 * @param fixture - Auth state fixture
 *
 * @example
 * ```ts
 * mockAuthStateInStorage(AuthFixtures.authenticatedUser())
 * ```
 */
export function mockAuthStateInStorage(fixture: AuthStateFixture) {
  const storageMock = {
    getItem: vi.fn((key: string) => {
      switch (key) {
        case 'access_token':
          return fixture.token
        case 'user_info':
          return fixture.user ? JSON.stringify(fixture.user) : null
        case 'token_expiry':
          return fixture.tokenExpiry
        default:
          return null
      }
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }

  Object.defineProperty(window, 'localStorage', {
    value: storageMock,
  })

  return storageMock
}

/**
 * Mock auth service with predefined responses
 *
 * @param fixtures - Map of method names to responses
 *
 * @example
 * ```ts
 * mockAuthService({
 *   login: AuthResponseFixtures.loginSuccess(),
 *   getCurrentUser: { data: UserPresets.adminUser() },
 * })
 * ```
 */
export function mockAuthService(fixtures: {
  login?: AuthResponseFixture | (() => AuthResponseFixture)
  logout?: AuthResponseFixture | (() => AuthResponseFixture)
  getCurrentUser?: { data: TestUser } | (() => { data: TestUser })
  refreshToken?: AuthResponseFixture | (() => AuthResponseFixture)
  register?: AuthResponseFixture | (() => AuthResponseFixture)
}) {
  const authService = {
    login: vi.fn(async () => {
      const fixture = typeof fixtures.login === 'function'
        ? (fixtures.login as () => AuthResponseFixture)()
        : fixtures.login
      if (fixture?.success) {
        return fixture.data
      }
      throw new Error(fixture?.error?.message || 'Login failed')
    }),

    logout: vi.fn(async () => {
      const fixture = typeof fixtures.logout === 'function'
        ? (fixtures.logout as () => AuthResponseFixture)()
        : fixtures.logout
      if (fixture?.success) {
        return
      }
      throw new Error(fixture?.error?.message || 'Logout failed')
    }),

    getCurrentUser: vi.fn(async () => {
      const fixture = typeof fixtures.getCurrentUser === 'function'
        ? (fixtures.getCurrentUser as () => { data: TestUser })()
        : fixtures.getCurrentUser
      if (fixture) {
        return fixture.data
      }
      throw new Error('Failed to get user')
    }),

    refreshToken: vi.fn(async () => {
      const fixture = typeof fixtures.refreshToken === 'function'
        ? (fixtures.refreshToken as () => AuthResponseFixture)()
        : fixtures.refreshToken
      if (fixture?.success) {
        return fixture.data
      }
      throw new Error(fixture?.error?.message || 'Refresh failed')
    }),

    register: vi.fn(async () => {
      const fixture = typeof fixtures.register === 'function'
        ? (fixtures.register as () => AuthResponseFixture)()
        : fixtures.register
      if (fixture?.success) {
        return fixture.data
      }
      throw new Error(fixture?.error?.message || 'Registration failed')
    }),
  }

  return authService
}

/**
 * Setup complete auth context for testing
 *
 * @param authState - Auth state fixture
 * @returns Object with mocked storage and auth service
 *
 * @example
 * ```ts
 * const { storage, service } = setupAuthContext(AuthFixtures.adminSession())
 * ```
 */
export function setupAuthContext(authState: AuthStateFixture) {
  const storage = mockAuthStateInStorage(authState)
  const service = mockAuthService({
    getCurrentUser: { data: authState.user! },
  })

  return {
    storage,
    service,
    user: authState.user,
    token: authState.token,
  }
}
