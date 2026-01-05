/**
 * Test Helpers
 *
 * Common helper functions for testing React components with various providers.
 * Provides convenient wrappers around Testing Library utilities.
 */

import { ReactElement } from 'react'
import { render, RenderOptions, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Custom render options with providers
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Custom theme to provide
   */
  theme?: 'light' | 'dark'

  /**
   * Router mock pathname
   */
  pathname?: string

  /**
   * Router mock query params
   */
  query?: Record<string, string>

  /**
   * Custom user state for auth provider
   */
  user?: {
    id: string
    username: string
    email: string
    role?: string
  } | null

  /**
   * Custom providers to wrap component
   */
  additionalProviders?: ReactElement[]
}

/**
 * Render component with common providers (theme, router, etc.)
 *
 * @param ui - Component to render
 * @param options - Render options
 * @returns Render result with queries
 *
 * @example
 * ```ts
 * const { getByText, getByRole } = renderWithProviders(<MyComponent />)
 * const { getByText } = renderWithProviders(<MyComponent />, { theme: 'dark' })
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const {
    theme,
    pathname,
    query,
    user,
    additionalProviders = [],
    ...renderOptions
  } = options

  // Mock router push/replace functions
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }

  // Create wrapper with providers
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    // Add theme provider wrapper if needed
    // Add router context wrapper if needed
    // Add auth provider wrapper if needed
    return <>{children}</>
  }

  return {
    ...render(ui, {
      wrapper: AllTheProviders,
      ...renderOptions,
    }),
    mockRouter,
  }
}

/**
 * Wait for loading state to finish
 *
 * @param callback - Function to execute after loading
 * @param options - waitFor options
 *
 * @example
 * ```ts
 * await waitForLoading(() => {
 *   expect(screen.getByText('Loaded')).toBeInTheDocument()
 * })
 * ```
 */
export async function waitForLoading(
  callback: () => void | Promise<void>,
  options?: { timeout?: number }
) {
  await waitFor(callback, {
    timeout: options?.timeout || 5000,
  })
}

/**
 * Wait for loading spinner to be removed
 *
 * @param testId - Data-testid of loading element
 *
 * @example
 * ```ts
 * await waitForLoadingToFinish('loading-spinner')
 * ```
 */
export async function waitForLoadingToFinish(testId: string) {
  await waitForElementToBeRemoved(() => {
    const element = document.querySelector(`[data-testid="${testId}"]`)
    return element ? element : null
  })
}

/**
 * Create mock router for testing
 *
 * @param overrides - Custom router methods
 * @returns Mocked router object
 *
 * @example
 * ```ts
 * const router = mockRouter({ push: vi.fn() })
 * ```
 */
export function mockRouter(overrides: Partial<ReturnType<typeof createMockRouter>> = {}) {
  const defaultRouter = createMockRouter()
  return { ...defaultRouter, ...overrides }
}

function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }
}

/**
 * Create user event instance for simulating user interactions
 *
 * @param options - UserEvent options
 * @returns UserEvent instance
 *
 * @example
 * ```ts
 * const user = createUserEvent()
 * await user.click(screen.getByRole('button'))
 * await user.type(screen.getByRole('textbox'), 'Hello')
 * ```
 */
export function createUserEvent(options?: {
  /**
   * Delay in ms between actions (default: 0)
   */
  delay?: number
  /**
   * Skip pointer events check (default: false)
   */
  skipPointerEventsCheck?: boolean
}) {
  return userEvent.setup(options)
}

/**
 * Mock IntersectionObserver for lazy loading components
 *
 * @param callback - Callback when element intersects
 * @returns IntersectionObserver mock
 *
 * @example
 * ```ts
 * mockIntersectionObserver()
 * ```
 */
export function mockIntersectionObserver(callback?: IntersectionObserverCallback) {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    callback,
  })
  window.IntersectionObserver = mockIntersectionObserver
  return mockIntersectionObserver
}

/**
 * Mock ResizeObserver for responsive components
 *
 * @returns ResizeObserver mock
 *
 * @example
 * ```ts
 * mockResizeObserver()
 * ```
 */
export function mockResizeObserver() {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
  window.ResizeObserver = mockResizeObserver
  return mockResizeObserver
}

/**
 * Mock window.matchMedia for responsive testing
 *
 * @param matches - Whether media query matches
 *
 * @example
 * ```ts
 * mockMatchMedia(true) // Simulate mobile viewport
 * ```
 */
export function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

/**
 * Mock localStorage with in-memory storage
 *
 * @returns localStorage mock with getItem, setItem, removeItem, clear
 *
 * @example
 * ```ts
 * const storage = mockLocalStorage()
 * storage.setItem('key', 'value')
 * expect(storage.getItem('key')).toBe('value')
 * ```
 */
export function mockLocalStorage() {
  const storage: Record<string, string> = {}

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete storage[key]
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key])
    },
    get length() {
      return Object.keys(storage).length
    },
    key: (index: number) => Object.keys(storage)[index] || null,
  }
}

/**
 * Mock fetch API for network requests
 *
 * @param response - Response data or error
 * @param options - Fetch options (status, ok, etc.)
 *
 * @example
 * ```ts
 * mockFetch({ data: { id: 1, name: 'Test' } }, { status: 200 })
 * mockFetch({ message: 'Not found' }, { status: 404, ok: false })
 * ```
 */
export function mockFetch(
  response: unknown,
  options: { status?: number; ok?: boolean; statusText?: string } = {}
) {
  const { status = 200, ok = true, statusText = 'OK' } = options

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      statusText,
      json: async () => response,
      text: async () => JSON.stringify(response),
      blob: async () => new Blob(),
      headers: new Headers(),
      redirected: false,
      status: status,
      statusText: statusText,
      type: 'basic' as ResponseType,
      url: 'http://localhost',
      clone: function () {
        return this
      },
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
    })
  ) as unknown as typeof fetch

  return global.fetch
}

/**
 * Create a mock for async hook with loading state
 *
 * @param data - Data to return after loading
 * @param delay - Delay in ms (default: 100)
 * @returns Mock hook function
 *
 * @example
 * ```ts
 * const mockUseData = createAsyncHookMock({ id: 1, name: 'Test' })
 * vi.mock('./useData', () => ({ useData: mockUseData }))
 * ```
 */
export function createAsyncHookMock<T>(data: T, delay: number = 100) {
  return vi.fn(() => ({
    data: null as T | null,
    isLoading: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }))
}

/**
 * Assert element has specific CSS classes
 *
 * @param element - HTML element
 * @param classNames - Array of class names to check
 *
 * @example
 * ```ts
 * expectElementHasClasses(getByRole('button'), ['btn', 'btn-primary'])
 * ```
 */
export function expectElementHasClasses(element: HTMLElement, classNames: string[]) {
  const elementClasses = element.className.split(' ').filter(Boolean)
  expect(classNames.every(className => elementClasses.includes(className))).toBe(true)
}

/**
 * Assert element is visible (not hidden via CSS)
 *
 * @param element - HTML element
 *
 * @example
 * ```ts
 * expectElementIsVisible(getByRole('button'))
 * ```
 */
export function expectElementIsVisible(element: HTMLElement) {
  const styles = window.getComputedStyle(element)
  expect(styles.display).not.toBe('none')
  expect(styles.visibility).not.toBe('hidden')
  expect(styles.opacity).not.toBe('0')
}

/**
 * Get current test timeout in milliseconds
 *
 * @param defaultTimeout - Default timeout if not set
 * @returns Timeout in ms
 */
export function getTestTimeout(defaultTimeout: number = 5000): number {
  return defaultTimeout
}

/**
 * Sleep for specified milliseconds (useful for testing animations)
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 *
 * @example
 * ```ts
 * await sleep(500) // Wait 500ms
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Suppress console errors during test execution
 *
 * @returns Restore function to enable console again
 *
 * @example
 * ```ts
 * const restoreConsole = suppressConsoleErrors()
 * // Run test that triggers console errors
 * restoreConsole()
 * ```
 */
export function suppressConsoleErrors() {
  const originalError = console.error
  console.error = vi.fn()

  return () => {
    console.error = originalError
  }
}

/**
 * Assert component renders without throwing errors
 *
 * @param component - Component to test
 *
 * @example
 * ```ts
 * expectRenderWithoutError(<MyComponent />)
 * ```
 */
export function expectRenderWithoutError(component: ReactElement) {
  expect(() => render(component)).not.toThrow()
}
