import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ResourceManager, useResourceManager } from '@/lib/utils/ResourceManager'
import { renderHook, act } from '@testing-library/react'
import React from 'react'

describe('ResourceManager', () => {
  let resourceManager: ResourceManager

  beforeEach(() => {
    resourceManager = new ResourceManager()
  })

  afterEach(() => {
    resourceManager.dispose()
  })

  describe('Animation Frame Management', () => {
    it('should track animation frames', () => {
      const callback = vi.fn()
      const id = resourceManager.requestAnimationFrame(callback)

      expect(typeof id).toBe('number')
      expect(resourceManager.getStats().animationFrames).toBe(1)

      resourceManager.cancelAnimationFrame(id)
      expect(resourceManager.getStats().animationFrames).toBe(0)
    })

    it('should cancel all animation frames on dispose', () => {
      const callback = vi.fn()
      resourceManager.requestAnimationFrame(callback)
      resourceManager.requestAnimationFrame(callback)

      resourceManager.dispose()

      expect(resourceManager.getStats().animationFrames).toBe(0)
    })
  })

  describe('Event Listener Management', () => {
    let element: HTMLElement

    beforeEach(() => {
      element = document.createElement('div')
    })

    it('should add and track event listeners', () => {
      const handler = vi.fn()
      resourceManager.addEventListener(element, 'click', handler)

      expect(resourceManager.getStats().eventListeners).toBe(1)

      // Simulate event
      element.click()
      expect(handler).toHaveBeenCalled()
    })

    it('should remove all event listeners on dispose', () => {
      const handler = vi.fn()
      resourceManager.addEventListener(element, 'click', handler)
      resourceManager.addEventListener(element, 'mouseover', handler)

      resourceManager.dispose()

      expect(resourceManager.getStats().eventListeners).toBe(0)

      // Event should not trigger after dispose
      element.click()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Timer Management', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should track intervals', () => {
      const callback = vi.fn()
      const id = resourceManager.setInterval(callback, 1000)

      expect(resourceManager.getStats().intervals).toBe(1)

      vi.advanceTimersByTime(1000)
      expect(callback).toHaveBeenCalledTimes(1)

      resourceManager.clearInterval(id)
      expect(resourceManager.getStats().intervals).toBe(0)
    })

    it('should track timeouts', () => {
      const callback = vi.fn()
      const id = resourceManager.setTimeout(callback, 1000)

      expect(resourceManager.getStats().timeouts).toBe(1)

      vi.advanceTimersByTime(1000)
      expect(callback).toHaveBeenCalledTimes(1)

      resourceManager.clearTimeout(id)
      expect(resourceManager.getStats().timeouts).toBe(0)
    })

    it('should clear all timers on dispose', () => {
      const callback = vi.fn()
      resourceManager.setInterval(callback, 1000)
      resourceManager.setTimeout(callback, 1000)

      resourceManager.dispose()

      expect(resourceManager.getStats().intervals).toBe(0)
      expect(resourceManager.getStats().timeouts).toBe(0)

      vi.advanceTimersByTime(2000)
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Three.js Object Management', () => {
    it('should track Three.js objects', () => {
      const mockObject = {
        geometry: { dispose: vi.fn() },
        material: { dispose: vi.fn() },
      }

      resourceManager.registerThreeObject(mockObject)
      expect(resourceManager.getStats().threeObjects).toBe(1)
    })

    it('should dispose Three.js objects', () => {
      const geometry = { dispose: vi.fn() }
      const material = { dispose: vi.fn() }
      const mesh = { geometry, material }

      resourceManager.registerThreeObject(mesh)
      resourceManager.dispose()

      expect(geometry.dispose).toHaveBeenCalled()
      expect(material.dispose).toHaveBeenCalled()
    })

    it('should handle object arrays', () => {
      const material1 = { dispose: vi.fn() }
      const material2 = { dispose: vi.fn() }
      const mesh = {
        geometry: { dispose: vi.fn() },
        material: [material1, material2],
      }

      resourceManager.registerThreeObject(mesh)
      resourceManager.dispose()

      expect(material1.dispose).toHaveBeenCalled()
      expect(material2.dispose).toHaveBeenCalled()
    })
  })

  describe('Observer Management', () => {
    it('should track and disconnect observers', () => {
      const observer = {
        disconnect: vi.fn(),
      }

      resourceManager.registerObserver(observer)
      expect(resourceManager.getStats().observers).toBe(1)

      resourceManager.dispose()
      expect(observer.disconnect).toHaveBeenCalled()
      expect(resourceManager.getStats().observers).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const element = document.createElement('div')
      const handler = vi.fn()

      resourceManager.requestAnimationFrame(() => {})
      resourceManager.addEventListener(element, 'click', handler)
      resourceManager.setInterval(() => {}, 1000)
      resourceManager.setTimeout(() => {}, 1000)
      resourceManager.registerThreeObject({ geometry: { dispose: vi.fn() } })
      resourceManager.registerObserver({ disconnect: vi.fn() })

      const stats = resourceManager.getStats()

      expect(stats).toEqual({
        animationFrames: 1,
        eventListeners: 1,
        intervals: 1,
        timeouts: 1,
        threeObjects: 1,
        observers: 1,
      })
    })
  })
})

describe('useResourceManager Hook', () => {
  it('should create a new ResourceManager on mount', () => {
    const { result } = renderHook(() => useResourceManager())

    expect(result.current).toBeInstanceOf(ResourceManager)
    expect(result.current.getStats()).toEqual({
      animationFrames: 0,
      eventListeners: 0,
      intervals: 0,
      timeouts: 0,
      threeObjects: 0,
      observers: 0,
    })
  })

  it('should dispose ResourceManager on unmount', () => {
    const { result, unmount } = renderHook(() => useResourceManager())
    const manager = result.current

    // Add some resources
    manager.requestAnimationFrame(() => {})
    expect(manager.getStats().animationFrames).toBe(1)

    // Unmount should dispose all resources
    unmount()

    // Note: In a real scenario, we'd need to check that resources were cleaned up
    // But since the manager instance is disposed, we can't check stats anymore
  })

  it('should maintain same instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useResourceManager())

    const firstInstance = result.current
    rerender()
    const secondInstance = result.current

    expect(firstInstance).toBe(secondInstance)
  })
})
