/**
 * User Factory Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  createUserFactory,
  createUsersFactory,
  createAuthResponseFactory,
  UserPresets,
  type TestUser,
} from './UserFactory'

describe('UserFactory', () => {
  describe('createUserFactory', () => {
    it('should generate a valid user with all required fields', () => {
      const user = createUserFactory()

      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('username')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('password')
      expect(user).toHaveProperty('email_verified')
      expect(user).toHaveProperty('role')
      expect(user).toHaveProperty('created_at')
      expect(user).toHaveProperty('updated_at')
    })

    it('should generate valid UUID for user ID', () => {
      const user = createUserFactory()

      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should generate valid email format', () => {
      const user = createUserFactory()

      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    })

    it('should accept custom options', () => {
      const customUser = createUserFactory({
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        emailVerified: true,
      })

      expect(customUser.username).toBe('testuser')
      expect(customUser.email).toBe('test@example.com')
      expect(customUser.role).toBe('admin')
      expect(customUser.email_verified).toBe(true)
    })

    it('should include profile when withProfile is true', () => {
      const user = createUserFactory({ withProfile: true })

      expect(user.profile).not.toBeNull()
      expect(user.profile).toHaveProperty('avatar')
      expect(user.profile).toHaveProperty('bio')
      expect(user.profile).toHaveProperty('location')
      expect(user.profile).toHaveProperty('website')
    })

    it('should exclude profile when withProfile is false', () => {
      const user = createUserFactory({ withProfile: false })

      expect(user.profile).toBeNull()
    })

    it('should accept null avatar', () => {
      const user = createUserFactory({ avatar: null })

      expect(user.profile?.avatar).toBeNull()
    })

    it('should generate created_at before updated_at', () => {
      const user = createUserFactory()

      const createdAt = new Date(user.created_at)
      const updatedAt = new Date(user.updated_at)

      expect(createdAt.getTime()).toBeLessThanOrEqual(updatedAt.getTime())
    })
  })

  describe('createUsersFactory', () => {
    it('should generate multiple users', () => {
      const users = createUsersFactory(5)

      expect(users).toHaveLength(5)
      users.forEach(user => {
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('username')
        expect(user).toHaveProperty('email')
      })
    })

    it('should generate unique IDs for each user', () => {
      const users = createUsersFactory(10)

      const ids = users.map(user => user.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(10)
    })

    it('should apply custom options to all users', () => {
      const users = createUsersFactory(3, { role: 'admin' })

      users.forEach(user => {
        expect(user.role).toBe('admin')
      })
    })
  })

  describe('createAuthResponseFactory', () => {
    it('should generate auth response with token and user', () => {
      const response = createAuthResponseFactory()

      expect(response).toHaveProperty('access_token')
      expect(response).toHaveProperty('refresh_token')
      expect(response).toHaveProperty('user')
    })

    it('should generate tokens with correct length', () => {
      const response = createAuthResponseFactory()

      expect(response.access_token).toHaveLength(64)
      expect(response.refresh_token).toHaveLength(64)
    })

    it('should pass custom options to user factory', () => {
      const response = createAuthResponseFactory({ role: 'admin' })

      expect(response.user.role).toBe('admin')
    })
  })

  describe('UserPresets', () => {
    it('should create verified user preset', () => {
      const user = UserPresets.verifiedUser()

      expect(user.email_verified).toBe(true)
      expect(user.profile).not.toBeNull()
      expect(user.role).toBe('user')
    })

    it('should create admin user preset', () => {
      const user = UserPresets.adminUser()

      expect(user.role).toBe('admin')
      expect(user.email_verified).toBe(true)
      expect(user.profile).not.toBeNull()
    })

    it('should create moderator user preset', () => {
      const user = UserPresets.moderatorUser()

      expect(user.role).toBe('moderator')
      expect(user.email_verified).toBe(true)
    })

    it('should create unverified user preset', () => {
      const user = UserPresets.unverifiedUser()

      expect(user.email_verified).toBe(false)
      expect(user.profile).toBeNull()
    })

    it('should create user without avatar preset', () => {
      const user = UserPresets.userWithoutAvatar()

      expect(user.email_verified).toBe(true)
      expect(user.profile?.avatar).toBeNull()
    })

    it('should create long-term user preset', () => {
      const user = UserPresets.longTermUser()

      expect(user.email_verified).toBe(true)
      expect(user.profile).not.toBeNull()

      const createdAt = new Date(user.created_at)
      const now = new Date()

      // User should be created at least 1 year ago
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      expect(createdAt.getTime()).toBeLessThan(oneYearAgo.getTime())
    })
  })
})
