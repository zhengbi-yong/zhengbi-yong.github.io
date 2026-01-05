/**
 * Test Helpers Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockRouter,
  mockLocalStorage,
  mockMatchMedia,
  sleep,
  suppressConsoleErrors,
  mockFetch,
  createUserEvent,
} from './test-helpers'

describe('Test Helpers', () => {
  describe('mockRouter', () => {
    it('should create router with default methods', () => {
      const router = mockRouter()

      expect(router).toHaveProperty('push')
      expect(router).toHaveProperty('replace')
      expect(router).toHaveProperty('prefetch')
      expect(router).toHaveProperty('back')
      expect(router).toHaveProperty('forward')
      expect(router.push).toBeInstanceOf(Function)
    })

    it('should accept custom overrides', () => {
      const customPush = vi.fn()
      const router = mockRouter({ push: customPush })

      expect(router.push).toBe(customPush)
    })
  })

  describe('mockLocalStorage', () => {
    it('should create working localStorage mock', () => {
      const storage = mockLocalStorage()

      storage.setItem('key', 'value')
      expect(storage.getItem('key')).toBe('value')
    })

    it('should return null for non-existent keys', () => {
      const storage = mockLocalStorage()

      expect(storage.getItem('nonexistent')).toBeNull()
    })

    it('should remove items', () => {
      const storage = mockLocalStorage()

      storage.setItem('key', 'value')
      storage.removeItem('key')
      expect(storage.getItem('key')).toBeNull()
    })

    it('should clear all items', () => {
      const storage = mockLocalStorage()

      storage.setItem('key1', 'value1')
      storage.setItem('key2', 'value2')
      storage.clear()

      expect(storage.getItem('key1')).toBeNull()
      expect(storage.getItem('key2')).toBeNull()
    })

    it('should return correct length', () => {
      const storage = mockLocalStorage()

      expect(storage.length).toBe(0)

      storage.setItem('key1', 'value1')
      storage.setItem('key2', 'value2')

      expect(storage.length).toBe(2)
    })

    it('should return key by index', () => {
      const storage = mockLocalStorage()

      storage.setItem('key1', 'value1')
      storage.setItem('key2', 'value2')

      expect(storage.key(0)).toBe('key1')
      expect(storage.key(1)).toBe('key2')
    })
  })

  describe('mockMatchMedia', () => {
    it('should create matchMedia mock', () => {
      mockMatchMedia(true)

      const mq = window.matchMedia('(max-width: 768px)')

      expect(mq.matches).toBe(true)
      expect(mq.media).toBe('(max-width: 768px)')
    })

    it('should return false matches when specified', () => {
      mockMatchMedia(false)

      const mq = window.matchMedia('(max-width: 768px)')

      expect(mq.matches).toBe(false)
    })
  })

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(100)
    })
  })

  describe('suppressConsoleErrors', () => {
    it('should suppress console errors', () => {
      const originalError = console.error
      const restore = suppressConsoleErrors()

      console.error('Test error')
      expect(console.error).not.toHaveBeenCalledWith('Test error')

      restore()
      expect(console.error).toBe(originalError)
    })
  })

  describe('mockFetch', () => {
    it('should mock fetch with default options', async () => {
      const mockData = { id: 1, name: 'Test' }
      const fetchMock = mockFetch(mockData)

      const response = await fetch('https://api.example.com/data')
      const data = await response.json()

      expect(data).toEqual(mockData)
      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(fetchMock).toHaveBeenCalled()
    })

    it('should mock fetch with custom status', async () => {
      const mockError = { message: 'Not found' }
      mockFetch(mockError, { status: 404, ok: false })

      const response = await fetch('https://api.example.com/data')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should return text response', async () => {
      const mockData = { id: 1 }
      mockFetch(mockData)

      const response = await fetch('https://api.example.com/data')
      const text = await response.text()

      expect(text).toBe(JSON.stringify(mockData))
    })
  })

  describe('createUserEvent', () => {
    it('should create user event instance', () => {
      const user = createUserEvent()

      expect(user).toHaveProperty('click')
      expect(user).toHaveProperty('type')
      expect(user.click).toBeInstanceOf(Function)
    })

    it('should accept custom options', () => {
      const user = createUserEvent({ delay: 100 })

      expect(user).toHaveProperty('click')
    })
  })
})
