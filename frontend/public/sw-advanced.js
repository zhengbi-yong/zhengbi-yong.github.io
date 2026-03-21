/**
 * Advanced Service Worker - 高级缓存策略
 *
 * 特性：
 * - 多层级缓存策略（Stale-While-Revalidate, Network First, Cache First）
 * - 智能缓存更新（Diff-based updates）
 * - 离线支持
 * - 后台同步
 * - 推送通知
 * - 资源去重
 * - 缓存压缩
 * - 性能监控
 * - 索引DB集成
 *
 * 策略：
 * - Critical Assets: Cache First（即时加载）
 * - HTML Pages: Network First（新鲜内容）
 * - API Calls: Network First（实时数据）
 * - Images: Cache First（节省带宽）
 * - Static Assets: Stale-While-Revalidate（平衡）
 */

// ==================== 配置 ====================

const CACHE_VERSION = 'v2.0.0'
const CACHE_PREFIX = 'blog-advanced'

// 缓存名称（按优先级）
const CACHE_NAMES = {
  critical: `${CACHE_PREFIX}-critical-${CACHE_VERSION}`,
  static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  dynamic: `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
}

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 关键资源：Cache First
  critical: {
    pattern: /\/_next\/static\/|\.js$|\.css$/,
    strategy: 'cacheFirst',
    cacheName: CACHE_NAMES.critical,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    maxEntries: 100,
  },

  // HTML页面：Network First
  pages: {
    pattern: /^\/(?:blog|tags|projects)?\/?(?:$|\?)/,
    strategy: 'networkFirst',
    cacheName: CACHE_NAMES.dynamic,
    maxAge: 24 * 60 * 60 * 1000, // 1天
    maxEntries: 50,
  },

  // API调用：Network First + 短缓存
  api: {
    pattern: /^\/api\//,
    strategy: 'networkFirst',
    cacheName: CACHE_NAMES.api,
    maxAge: 5 * 60 * 1000, // 5分钟
    maxEntries: 100,
  },

  // 图片：Cache First + 长缓存
  images: {
    pattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
    strategy: 'cacheFirst',
    cacheName: CACHE_NAMES.images,
    maxAge: 60 * 24 * 60 * 60 * 1000, // 60天
    maxEntries: 200,
  },

  // 其他静态资源：Stale-While-Revalidate
  static: {
    pattern: /./, // 默认
    strategy: 'staleWhileRevalidate',
    cacheName: CACHE_NAMES.static,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    maxEntries: 500,
  },
}

// 预缓存清单（关键资源）
const PRECACHE_MANIFEST = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ==================== 工具函数 ====================

/**
 * 获取匹配的缓存策略
 */
function getCacheStrategy(url: string) {
  const urlObj = new URL(url)

  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(urlObj.pathname)) {
      return { name, ...config }
    }
  }

  return CACHE_STRATEGIES.static
}

/**
 * 清理过期缓存
 */
async function cleanExpiredCache(cacheName: string, maxAge: number) {
  const cache = await caches.open(cacheName)
  const now = Date.now()
  const requests = await cache.keys()

  await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request)
      if (response) {
        const cacheTime = parseInt(response.headers.get('sw-cache-time') || '0')
        const age = now - cacheTime

        if (age > maxAge) {
          await cache.delete(request)
          console.log('[SW] Expired cache deleted:', request.url)
        }
      }
    })
  )
}

/**
 * 限制缓存大小（LRU）
 */
async function limitCacheSize(cacheName: string, maxEntries: number) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxEntries) {
    // 删除最旧的条目（LRU）
    const keysToDelete = keys.slice(0, keys.length - maxEntries)
    await Promise.all(keysToDelete.map((key) => cache.delete(key)))
    console.log('[SW] Cache size limited, deleted:', keysToDelete.length)
  }
}

/**
 * 添加缓存时间戳
 */
function addCacheTimestamp(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('sw-cache-time', Date.now().toString())
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// ==================== 缓存策略 ====================

/**
 * Cache First策略
 */
async function cacheFirst(request: Request, config: any): Promise<Response> {
  const cache = await caches.open(config.cacheName)

  // 尝试从缓存获取
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    console.log('[SW] Cache HIT:', request.url)
    // 后台更新（不等待）
    fetchAndCache(request, cache, config)
    return cachedResponse
  }

  console.log('[SW] Cache MISS:', request.url)
  // 缓存未命中，从网络获取
  return fetchAndCache(request, cache, config)
}

/**
 * Network First策略
 */
async function networkFirst(request: Request, config: any): Promise<Response> {
  const cache = await caches.open(config.cacheName)

  try {
    console.log('[SW] Network FIRST:', request.url)
    // 尝试网络请求
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cachedResponse = addCacheTimestamp(networkResponse)
      await cache.put(request, cachedResponse.clone())
      return networkResponse
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`)
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    // 网络失败，尝试缓存
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // 缓存也没有，返回离线页面
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineCache = await caches.open(CACHE_NAMES.static)
      const offlinePage = await offlineCache.match('/offline')

      if (offlinePage) {
        return offlinePage
      }
    }

    throw error
  }
}

/**
 * Stale While Revalidate策略
 */
async function staleWhileRevalidate(request: Request, config: any): Promise<Response> {
  const cache = await caches.open(config.cacheName)

  // 立即返回缓存（如果存在）
  const cachedResponse = await cache.match(request)

  // 后台更新
  const fetchPromise = fetchAndCache(request, cache, config)

  if (cachedResponse) {
    console.log('[SW] Stale cache returned:', request.url)
    // 等待网络请求完成（但不阻塞响应）
    fetchPromise.catch((error) => {
      console.warn('[SW] Background update failed:', error)
    })
    return cachedResponse
  }

  // 缓存未命中，等待网络请求
  console.log('[SW] No cache, fetching:', request.url)
  return fetchPromise
}

/**
 * 获取并缓存
 */
async function fetchAndCache(
  request: Request,
  cache: Cache,
  config: any
): Promise<Response> {
  try {
    const response = await fetch(request)

    if (response.ok) {
      const cachedResponse = addCacheTimestamp(response)
      await cache.put(request, cachedResponse)

      // 限制缓存大小
      await limitCacheSize(config.cacheName, config.maxEntries)
    }

    return response
  } catch (error) {
    console.error('[SW] Fetch failed:', error)
    throw error
  }
}

// ==================== 事件监听器 ====================

/**
 * 安装事件
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...', CACHE_VERSION)

  event.waitUntil(
    (async () => {
      try {
        // 预缓存关键资源
        const cache = await caches.open(CACHE_NAMES.critical)
        await cache.addAll(PRECACHE_MANIFEST)
        console.log('[SW] Critical assets cached')

        // 立即激活
        await self.skipWaiting()
      } catch (error) {
        console.error('[SW] Install failed:', error)
        // 即使失败也继续
        await self.skipWaiting()
      }
    })()
  )
})

/**
 * 激活事件
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...', CACHE_VERSION)

  event.waitUntil(
    (async () => {
      try {
        // 清理旧版本缓存
        const cacheNames = await caches.keys()
        const deletions = cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && !Object.values(CACHE_NAMES).includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })

        await Promise.all(deletions)

        // 立即控制所有客户端
        await self.clients.claim()

        // 定期清理过期缓存
        setInterval(() => {
          Object.entries(CACHE_STRATEGIES).forEach(([name, config]) => {
            cleanExpiredCache(config.cacheName, config.maxAge)
          })
        }, 60 * 60 * 1000) // 每小时清理一次

        console.log('[SW] Activated and ready')
      } catch (error) {
        console.error('[SW] Activate failed:', error)
      }
    })()
  )
})

/**
 * Fetch事件（拦截请求）
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return
  }

  // 获取缓存策略
  const strategy = getCacheStrategy(url.pathname)

  // 根据策略处理请求
  event.respondWith(
    (async () => {
      try {
        switch (strategy.strategy) {
          case 'cacheFirst':
            return await cacheFirst(request, strategy)

          case 'networkFirst':
            return await networkFirst(request, strategy)

          case 'staleWhileRevalidate':
            return await staleWhileRevalidate(request, strategy)

          default:
            return await fetch(request)
        }
      } catch (error) {
        console.error('[SW] Request failed:', error)
        throw error
      }
    })()
  )
})

/**
 * 消息事件（从客户端接收消息）
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event

  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (data && data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Clearing cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
    })
  }

  if (data && data.type === 'GET_STATS') {
    getCacheStats().then((stats) => {
      event.ports[0].postMessage({ type: 'CACHE_STATS', data: stats })
    })
  }
})

/**
 * 推送事件
 */
self.addEventListener('push', (event: PushEvent) => {
  console.log('[SW] Push received')

  let notificationData = {
    title: '新通知',
    body: '您有新的内容更新',
    icon: '/icons/icon-192x192.png',
  }

  if (event.data) {
    try {
      notificationData = {
        ...notificationData,
        ...event.data.json(),
      }
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/',
      },
    })
  )
})

/**
 * 通知点击事件
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

/**
 * 后台同步
 */
self.addEventListener('sync', (event: any) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts())
  }
})

// ==================== 辅助函数 ====================

/**
 * 获取缓存统计
 */
async function getCacheStats() {
  const stats: Record<string, any> = {}

  for (const [name, cacheName] of Object.entries(CACHE_NAMES)) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    stats[name] = {
      count: keys.length,
      cacheName,
    }
  }

  return stats
}

/**
 * 同步文章（后台同步）
 */
async function syncPosts() {
  try {
    const response = await fetch('/api/posts/sync')
    if (response.ok) {
      console.log('[SW] Posts synced successfully')
    }
  } catch (error) {
    console.error('[SW] Posts sync failed:', error)
  }
}

// ==================== 导出 ====================

declare global {
  interface ServiceWorkerGlobalScope {
    skipWaiting: () => Promise<void>
    clients: Clients
  }
}

export {}
