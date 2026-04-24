/**
 * Test Isolation & Browser State Cleanup Utilities
 *
 * Provides jsdom-compatible localStorage/sessionStorage reset for tests.
 * Uses a SINGLE shared mock storage so setItem/getItem remain consistent
 * across multiple resetLocalStorage() calls within the same test run.
 */

// Single shared mock storage — survives across resetLocalStorage() calls
// so setItem() in test code is visible to subsequent getItem() calls
const MOCK_STORAGE: Record<string, string> = {}

function makeMockStorage() {
  return {
    getItem: (key: string) => MOCK_STORAGE[key] ?? null,
    setItem: (key: string, value: string) => { MOCK_STORAGE[key] = value },
    removeItem: (key: string) => { delete MOCK_STORAGE[key] },
    clear: () => { Object.keys(MOCK_STORAGE).forEach(k => delete MOCK_STORAGE[k]) },
    key: (i: number) => Object.keys(MOCK_STORAGE)[i] ?? null,
    get length() { return Object.keys(MOCK_STORAGE).length },
  }
}

function applyMock(mock: ReturnType<typeof makeMockStorage>) {
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
    configurable: true, // allows re-definition
    enumerable: true,
  })
}

function applySessionMock(mock: ReturnType<typeof makeMockStorage>) {
  Object.defineProperty(window, 'sessionStorage', {
    value: mock,
    writable: true,
    configurable: true,
    enumerable: true,
  })
}

export function resetLocalStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    // Clear the shared backing store
    Object.keys(MOCK_STORAGE).forEach(k => delete MOCK_STORAGE[k])
    applyMock(makeMockStorage())
  } catch {
    // If we can't access/modify localStorage, silently skip
  }
}

export function resetSessionStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    Object.keys(MOCK_STORAGE).forEach(k => delete MOCK_STORAGE[k])
    applySessionMock(makeMockStorage())
  } catch {
    // If we can't access/modify sessionStorage, silently skip
  }
}

/**
 * Suppress console.error output during a callback.
 * Useful for testing error-handling code that logs errors.
 */
export function suppressConsoleErrors<T>(fn: () => T): T {
  const orig = console.error
  console.error = (..._args: unknown[]) => { /* suppressed */ }
  try {
    return fn()
  } finally {
    console.error = orig
  }
}
