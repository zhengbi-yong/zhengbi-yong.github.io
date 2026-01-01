// MSW (Mock Service Worker) browser setup
import { setupWorker } from 'msw'
import { handlers } from './handlers'

// 创建 Mock Service Worker
export const worker = setupWorker(...handlers)

// 开发环境自动启动
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })
    console.log('🎭 MSW Mock Service Worker started')
  }
}
