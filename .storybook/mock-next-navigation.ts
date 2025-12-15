// Mock Next.js navigation hooks for Storybook
// This file is used to mock next/navigation module in Storybook environment

const mockRouter = {
  push: (href: string) => {
    console.log('[Storybook Mock] Router.push:', href)
  },
  replace: (href: string) => {
    console.log('[Storybook Mock] Router.replace:', href)
  },
  refresh: () => {
    console.log('[Storybook Mock] Router.refresh')
  },
  back: () => {
    console.log('[Storybook Mock] Router.back')
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  },
  forward: () => {
    console.log('[Storybook Mock] Router.forward')
    if (typeof window !== 'undefined') {
      window.history.forward()
    }
  },
  prefetch: (href: string) => {
    console.log('[Storybook Mock] Router.prefetch:', href)
  },
}

let mockPathname = '/'

export const useRouter = () => mockRouter

export const usePathname = () => mockPathname

export const useSearchParams = () => {
  return new URLSearchParams()
}

// Allow setting pathname for testing
export const setMockPathname = (pathname: string) => {
  mockPathname = pathname
}

