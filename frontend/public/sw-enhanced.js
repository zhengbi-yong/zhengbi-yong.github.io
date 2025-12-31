// Enhanced Service Worker with Stale-While-Revalidate and offline support
// Version: v2.0.0

const CACHE_VERSION = 'v2.0.0'
const CACHE_NAME = `blog-cache-${CACHE_VERSION}`
const RUNTIME_CACHE = 'blog-runtime'
const OFFLINE_CACHE = 'blog-offline'

// 需要立即缓存的关键资源（预缓存清单）
const CRITICAL_CACHE = [
  '/',
  '/blog',
  '/about',
  '/projects',
  '/offline', // 新增：离线页面
]

// 运行时缓存策略配置
const CACHE_STRATEGIES = {
  // API 请求：Network First，失败时返回缓存
  api: {
    pattern: /^\/api\//,
    strategy: 'networkFirst',
    expiration: 300000, // 5分钟
  },
  // 文章内容：Stale-While-Revalidate（快速响应，后台更新）
  articles: {
    pattern: /^\/blog\//,
    strategy: 'staleWhileRevalidate',
    expiration: 3600000, // 1小时
  },
  // 静态资源：Cache First
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$/,
    strategy: 'cacheFirst',
    expiration: 2592000000, // 30天
  },
  // Next.js 静态资源
  nextStatic: {
    pattern: /\/_next\/static\//,
    strategy: 'cacheFirst',
    expiration: 2592000000,
  },
  // 图像资源
  images: {
    pattern: /\.(png|jpg|jpeg|gif|webp|avif|svg)$/,
    strategy: 'cacheFirst',
    expiration: 2592000000,
  },
}

// 离线页面资源
const OFFLINE_PAGE = '/offline'

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION)

  event.waitUntil(
    Promise.all([
      // 预缓存关键资源
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching critical resources')
        return cache.addAll(CRITICAL_CACHE.map((url) => new Request(url, { cache: 'reload' })))
          .catch((error) => {
            console.error('[Service Worker] Failed to cache critical resources:', error)
            // 即使缓存失败也继续安装
            return []
          })
      }),
      // 预缓存离线页面
      caches.open(OFFLINE_CACHE).then((cache) => {
        return cache.add(new Request(OFFLINE_PAGE, { cache: 'reload' }))
          .catch((error) => {
            console.error('[Service Worker] Failed to cache offline page:', error)
          })
      }),
      // 立即激活新的 Service Worker
    ]).then(() => self.skipWaiting())
  )
})

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_VERSION)

  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('blog-cache-') && name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== OFFLINE_CACHE)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      }),
      // 立即控制所有客户端
      self.clients.claim(),
    ])
  )

  // 通知所有客户端 Service Worker 已更新
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: CACHE_VERSION,
        })
      })
    })
  )
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 跳过某些特殊路径
  if (url.pathname.startsWith('/chemistry/') || url.pathname.startsWith('/api/auth/')) {
    return
  }

  // 根据URL模式选择策略
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url.pathname)) {
      switch (config.strategy) {
        case 'networkFirst':
          event.respondWith(networkFirstStrategy(request, config.expiration))
          return
        case 'staleWhileRevalidate':
          event.respondWith(staleWhileRevalidateStrategy(request, config.expiration))
          return
        case 'cacheFirst':
          event.respondWith(cacheFirstStrategy(request, config.expiration))
          return
      }
    }
  }

  // 默认：Stale-While-Revalidate
  event.respondWith(staleWhileRevalidateStrategy(request))
})

// Network First 策略：优先网络，失败时使用缓存
async function networkFirstStrategy(request, expiration) {
  const cache = await caches.open(RUNTIME_CACHE)

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok && networkResponse.status !== 206) {
      // 更新缓存
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.error('[Service Worker] Failed to cache:', request.url, error)
      })
    }

    return networkResponse
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url)

    // 网络失败，尝试从缓存获取
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // 缓存也没有，返回离线页面（仅对导航请求）
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(OFFLINE_CACHE)
      const offlinePage = await offlineCache.match(OFFLINE_PAGE)

      if (offlinePage) {
        return offlinePage
      }
    }

    throw error
  }
}

// Cache First 策略：优先缓存，失败时使用网络
async function cacheFirstStrategy(request, expiration) {
  const cache = await caches.open(RUNTIME_CACHE)

  // 先检查缓存
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    // 检查缓存是否过期
    const cacheDate = cachedResponse.headers.get('date')
    if (cacheDate) {
      const age = Date.now() - new Date(cacheDate).getTime()
      if (age < expiration) {
        return cachedResponse
      }
    }
  }

  // 缓存未命中或已过期，从网络获取
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok && networkResponse.status !== 206) {
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.error('[Service Worker] Failed to cache:', request.url, error)
      })
    }

    return networkResponse
  } catch (error) {
    // 网络失败，返回缓存（即使过期）
    if (cachedResponse) {
      return cachedResponse
    }

    throw error
  }
}

// Stale-While-Revalidate 策略：立即返回缓存，后台更新
async function staleWhileRevalidateStrategy(request, expiration) {
  const cache = await caches.open(RUNTIME_CACHE)

  // 并行执行：获取缓存 + 网络请求
  const [cachedResponse, networkPromise] = await Promise.all([
    cache.match(request),
    fetch(request).catch(() => null), // 网络失败不影响缓存返回
  ])

  // 如果有缓存，立即返回
  if (cachedResponse) {
    // 后台更新缓存（不阻塞响应）
    if (networkPromise && networkPromise.ok && networkPromise.status !== 206) {
      cache.put(request, networkPromise.clone()).catch((error) => {
        console.error('[Service Worker] Failed to update cache:', request.url, error)
      })
    }

    return cachedResponse
  }

  // 没有缓存，等待网络响应
  if (networkPromise && networkPromise.ok) {
    cache.put(request, networkPromise.clone()).catch((error) => {
      console.error('[Service Worker] Failed to cache:', request.url, error)
    })

    return networkPromise
  }

  // 网络失败，返回离线页面（仅对导航请求）
  if (request.mode === 'navigate') {
    const offlineCache = await caches.open(OFFLINE_CACHE)
    const offlinePage = await offlineCache.match(OFFLINE_PAGE)

    if (offlinePage) {
      return offlinePage
    }
  }

  throw new Error('Network request failed and no cache available')
}

// 后台同步（Background Sync）
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag)

  if (event.tag === 'sync-reading-progress') {
    event.waitUntil(syncReadingProgress())
  }
})

// 同步阅读进度
async function syncReadingProgress() {
  // 从IndexedDB读取未同步的阅读进度
  // TODO: 实现阅读进度同步逻辑
  console.log('[Service Worker] Syncing reading progress...')
}

// 推送通知
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  const data = event.data.json()
  const options = {
    body: data.body || '',
    icon: '/static/favicons/android-icon-192x192.png',
    badge: '/static/favicons/android-icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '新通知', options)
  )
})

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  )
})

// 定期清理过期缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(cleanExpiredCache())
  }
})

// 清理过期缓存
async function cleanExpiredCache() {
  const cache = await caches.open(RUNTIME_CACHE)
  const requests = await cache.keys()

  for (const request of requests) {
    const response = await cache.match(request)

    if (response) {
      const cacheDate = response.headers.get('date')

      if (cacheDate) {
        const age = Date.now() - new Date(cacheDate).getTime()

        // 清理超过30天的缓存
        if (age > 2592000000) {
          await cache.delete(request)
          console.log('[Service Worker] Cleaned expired cache:', request.url)
        }
      }
    }
  }
}
