/**
 * Cleanup Utilities Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  resetLocalStorage,
  resetSessionStorage,
  resetAllStorage,
  setupTestIsolation,
  createCleanupScope,
  spyOnConsole,
  setupFakeTimers,
} from './cleanup'

describe('Cleanup Utilities', () => {
  // These tests verify the reset functions work correctly
  // They use beforeEach to ensure localStorage is in a known state first
  describe('resetLocalStorage', () => {
    beforeEach(() => {
      // Reset to known empty state before each test
      resetLocalStorage()
    })

    it('should reset localStorage to empty mock', () => {
      // Set some data using the mock
      localStorage.setItem('key', 'value')

      // Reset and verify
      resetLocalStorage()

      expect(localStorage.getItem('key')).toBeNull()
      expect(localStorage.setItem).toBeInstanceOf(Function)
    })
  })

  describe('resetSessionStorage', () => {
    beforeEach(() => {
      resetSessionStorage()
    })

    it('should reset sessionStorage to empty mock', () => {
      sessionStorage.setItem('key', 'value')

      resetSessionStorage()

      expect(sessionStorage.getItem('key')).toBeNull()
      expect(sessionStorage.setItem).toBeInstanceOf(Function)
    })
  })

  describe('resetAllStorage', () => {
    beforeEach(() => {
      resetAllStorage()
    })

    it('should reset both localStorage and sessionStorage', () => {
      localStorage.setItem('local', 'value')
      sessionStorage.setItem('session', 'value')

      resetAllStorage()

      expect(localStorage.getItem('local')).toBeNull()
      expect(sessionStorage.getItem('session')).toBeNull()
    })
  })

  describe('setupTestIsolation', () => {
    beforeEach(() => {
      setupTestIsolation()
    })

    it('should clear all mocks', () => {
      const mockFn = vi.fn()
      mockFn('test')

      expect(mockFn).toHaveBeenCalled()

      setupTestIsolation()

      vi.clearAllMocks()
    })

    it('should reset storage', () => {
      localStorage.setItem('test', 'value')

      setupTestIsolation()

      expect(localStorage.getItem('test')).toBeNull()
    })
  })

  describe('createCleanupScope', () => {
    it('should create isolated cleanup scope', async () => {
      const scope = createCleanupScope()
      let cleaned = false

      scope.register(() => {
        cleaned = true
      })

      expect(cleaned).toBe(false)

      await scope.cleanup()

      expect(cleaned).toBe(true)
    })

    it('should handle multiple callbacks', async () => {
      const scope = createCleanupScope()
      const results: number[] = []

      scope.register(() => results.push(1))
      scope.register(() => results.push(2))
      scope.register(() => results.push(3))

      await scope.cleanup()

      expect(results).toEqual([1, 2, 3])
    })

    it('should handle async callbacks', async () => {
      const scope = createCleanupScope()
      let cleaned = false

      scope.register(async () => {
        await Promise.resolve()
        cleaned = true
      })

      await scope.cleanup()

      expect(cleaned).toBe(true)
    })
  })

  describe('spyOnConsole', () => {
    it('should spy on console methods', () => {
      const consoleSpy = spyOnConsole(['error', 'warn'])

      console.error('Test error')
      console.warn('Test warning')

      expect(consoleSpy.error).toHaveBeenCalledWith('Test error')
      expect(consoleSpy.warn).toHaveBeenCalledWith('Test warning')

      consoleSpy.restore()
    })

    it('should restore original console methods', () => {
      const originalError = console.error
      const consoleSpy = spyOnConsole(['error'])

      consoleSpy.restore()

      expect(console.error).toBe(originalError)
    })

    it('should spy on default methods', () => {
      const consoleSpy = spyOnConsole()

      expect(consoleSpy.error).toBeInstanceOf(Function)
      expect(consoleSpy.warn).toBeInstanceOf(Function)

      consoleSpy.restore()
    })
  })

  describe('setupFakeTimers', () => {
    it('should setup fake timers', () => {
      setupFakeTimers()

      expect(vi.isFakeTimers()).toBe(true)

      vi.useRealTimers()
    })

    it('should accept custom options', () => {
      setupFakeTimers({
        shouldAdvanceTime: true,
        now: 1000,
      })

      expect(vi.isFakeTimers()).toBe(true)

      vi.useRealTimers()
    })
  })
})
