// MSW (Mock Service Worker) handlers
// 用于前端独立开发和测试

import { authHandlers } from './handlers/auth'
import { blogHandlers } from './handlers/blog'

// Combine all handlers
export const handlers = [...authHandlers, ...blogHandlers]

// Export individual handler groups for selective use
export { authHandlers, blogHandlers }
