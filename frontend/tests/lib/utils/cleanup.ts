/**
 * Test Isolation Utilities
 *
 * Utilities for ensuring test isolation and cleanup.
 * Prevents state leakage between tests and provides cleanup hooks.
 */

import { vi, afterEach, beforeEach, afterAll, beforeAll } from 'vitest'

/**
 * Cleanup callback function type
 */
type CleanupCallback = () => void | Promise<void>

/**
 * Registry of cleanup callbacks
 */
const cleanupCallbacks: CleanupCallback[] = []

/**
 * Register a cleanup callback to be executed after each test
 *
 * @param callback - Cleanup function to register
 *
 * @example
 * ```ts
 * registerCleanup(() => {
 *   localStorage.clear()
 *   vi.clearAllMocks()
 * })
 * ```
 */
export function registerCleanup(callback: CleanupCallback) {
  cleanupCallbacks.push(callback)
}

/**
 * Execute all registered cleanup callbacks
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   runAllCleanups()
 * })
 * ```
 */
export async function runAllCleanups() {
  for (const callback of cleanupCallbacks) {
    await callback()
  }
  cleanupCallbacks.length = 0
}

/**
 * Clear all mocks and reset modules
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   clearAllMocksAndReset()
 * })
 * ```
 */
export function clearAllMocksAndReset() {
  vi.clearAllMocks()
  vi.resetAllMocks()
  vi.restoreAllMocks()
}

/**
 * Reset localStorage to empty state
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   resetLocalStorage()
 * })
 * ```
 */
export function resetLocalStorage() {
  const storage: Record<string, string> = {}
  // Delete existing localStorage first — jsdom's native localStorage has
  // non-configurable properties (e.g. clear), so delete before reassigning
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).localStorage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach(k => delete storage[k])
    },
    get length() {
      return Object.keys(storage).length
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
  }
}

/**
 * Reset sessionStorage to empty state
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   resetSessionStorage()
 * })
 * ```
 */
export function resetSessionStorage() {
  const storage: Record<string, string> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).sessionStorage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).sessionStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach(k => delete storage[k])
    },
    get length() {
      return Object.keys(storage).length
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
  }
}

/**
 * Reset all browser storage APIs
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   resetAllStorage()
 * })
 * ```
 */
export function resetAllStorage() {
  resetLocalStorage()
  resetSessionStorage()
}

/**
 * Clear all timers (setTimeout, setInterval)
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   clearAllTimers()
 * })
 * ```
 */
export function clearAllTimers() {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
}

/**
 * Setup fake timers for testing
 *
 * @param options - Timer options
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   setupFakeTimers()
 * })
 *
 * afterEach(() => {
 *   clearAllTimers()
 * })
 * ```
 */
export function setupFakeTimers(options?: {
  /**
   * Should advance time automatically (default: false)
   */
  shouldAdvanceTime?: boolean
  /**
   * Start timestamp (default: current time)
   */
  now?: number | Date
}) {
  vi.useFakeTimers(options)
}

/**
 * Reset window location to default state
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   resetWindowLocation()
 * })
 * ```
 */
export function resetWindowLocation() {
  delete (window as any).location
  window.location = new URL('http://localhost:3000/')
}

/**
 * Reset fetch API to native implementation
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   resetFetch()
 * })
 * ```
 */
export function resetFetch() {
  // @ts-ignore - Reset to native fetch
  global.fetch = undefined
}

/**
 * Reset all browser APIs to their default state
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   resetAllBrowserAPIs()
 * })
 * ```
 */
export function resetAllBrowserAPIs() {
  resetAllStorage()
  resetWindowLocation()
  resetFetch()

  // Reset IntersectionObserver
  // @ts-ignore
  delete window.IntersectionObserver

  // Reset ResizeObserver
  // @ts-ignore
  delete window.ResizeObserver

  // Reset matchMedia
  // @ts-ignore
  delete window.matchMedia
}

/**
 * Cleanup function for component unmounting
 *
 * @param component - Component root element to unmount
 *
 * @example
 * ```ts
 * const { unmount } = render(<Component />)
 * afterEach(() => {
 *   cleanupComponent(unmount)
 * })
 * ```
 */
export function cleanupComponent(unmount: () => void) {
  unmount()
}

/**
 * Setup comprehensive test isolation
 * Call this in beforeEach to ensure clean test environment
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   setupTestIsolation()
 * })
 * ```
 */
export function setupTestIsolation() {
  clearAllMocksAndReset()
  resetAllStorage()
  resetAllBrowserAPIs()
}

/**
 * Cleanup after test suite
 * Call this in afterAll to clean up any remaining resources
 *
 * @example
 * ```ts
 * afterAll(() => {
 *   cleanupTestSuite()
 * })
 * ```
 */
export function cleanupTestSuite() {
  runAllCleanups()
  clearAllMocksAndReset()
  resetAllStorage()
  resetAllBrowserAPIs()
  clearAllTimers()
}

/**
 * Setup global test hooks for automatic cleanup
 * Call this once in your test setup file (setup.ts)
 *
 * @example
 * ```ts
 * // tests/setup.ts
 * import { setupGlobalTestHooks } from '@/tests/lib/utils/cleanup'
 *
 * setupGlobalTestHooks()
 * ```
 */
export function setupGlobalTestHooks() {
  beforeEach(() => {
    setupTestIsolation()
  })

  afterEach(async () => {
    await runAllCleanups()
  })

  afterAll(() => {
    cleanupTestSuite()
  })
}

/**
 * Create a test-specific cleanup scope
 * Useful for cleanup within a test block
 *
 * @example
 * ```ts
 * it('should handle scoped cleanup', async () => {
 *   const scope = createCleanupScope()
 *
 *   scope.register(() => {
 *     // Cleanup specific resource
 *   })
 *
 *   // ... test code ...
 *
 *   await scope.cleanup()
 * })
 * ```
 */
export function createCleanupScope() {
  const callbacks: CleanupCallback[] = []

  return {
    /**
     * Register cleanup callback within this scope
     */
    register: (callback: CleanupCallback) => {
      callbacks.push(callback)
    },

    /**
     * Execute all callbacks in this scope
     */
    cleanup: async () => {
      for (const callback of callbacks) {
        await callback()
      }
      callbacks.length = 0
    },
  }
}

/**
 * Spy on console methods to detect unexpected calls
 *
 * @param methods - Console methods to spy on (default: ['error', 'warn'])
 *
 * @example
 * ```ts
 * let consoleSpy: ReturnType<typeof spyOnConsole>
 *
 * beforeEach(() => {
 *   consoleSpy = spyOnConsole(['error', 'warn'])
 * })
 *
 * afterEach(() => {
 *   expect(consoleSpy.error).not.toHaveBeenCalled()
 *   consoleSpy.restore()
 * })
 * ```
 */
export function spyOnConsole(methods: (keyof Console)[] = ['error', 'warn']) {
  const spies: Record<string, ReturnType<typeof vi.spyOn>> = {}

  methods.forEach(method => {
    spies[method] = vi.spyOn(console, method).mockImplementation(() => {})
  })

  return {
    ...spies,
    /**
     * Restore all console spies
     */
    restore: () => {
      Object.values(spies).forEach(spy => spy.mockRestore())
    },
  }
}

/**
 * Suppress specific console output during test
 *
 * @param methods - Console methods to suppress
 * @returns Restore function
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   const restore = suppressConsoleOutput(['error', 'warn'])
 *   registerCleanup(restore)
 * })
 * ```
 */
export function suppressConsoleOutput(methods: (keyof Console)[] = ['error', 'warn']) {
  const originalMethods: Partial<Console> = {}

  methods.forEach(method => {
    // @ts-ignore
    originalMethods[method] = console[method]
    // @ts-ignore
    console[method] = vi.fn()
  })

  return () => {
    methods.forEach(method => {
      // @ts-ignore
      console[method] = originalMethods[method]
    })
  }
}

/**
 * Assert that no unexpected console calls occurred
 *
 * @param consoleSpy - Console spy from spyOnConsole
 * @param allowedCalls - Array of allowed error/warning messages
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   assertNoConsoleErrors(consoleSpy, ['Expected warning message'])
 * })
 * ```
 */
export function assertNoConsoleErrors(
  consoleSpy: ReturnType<typeof spyOnConsole>,
  allowedCalls: string[] = []
) {
  const errorCalls = (consoleSpy.error as ReturnType<typeof vi.spyOn>).mock.calls
  const warnCalls = (consoleSpy.warn as ReturnType<typeof vi.spyOn>).mock.calls

  const unexpectedErrors = errorCalls.filter(([message]) =>
    !allowedCalls.some(allowed => String(message).includes(allowed))
  )

  const unexpectedWarnings = warnCalls.filter(([message]) =>
    !allowedCalls.some(allowed => String(message).includes(allowed))
  )

  expect(unexpectedErrors).toHaveLength(0)
  expect(unexpectedWarnings).toHaveLength(0)
}
