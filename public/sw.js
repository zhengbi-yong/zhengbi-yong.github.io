// Service Worker 版本号，用于缓存更新
const CACHE_VERSION = 'v1.0.0'
const CACHE_NAME = `blog-cache-${CACHE_VERSION}`

// 需要缓存的资源类型
const CACHE_PATTERNS = {
  // HTML 页面：Network First，失败时使用缓存
  html: /\.html$|^\/[^.]*$/,
  // 静态资源：Cache First
  static: /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
  // Next.js 静态资源
  nextStatic: /\/_next\/static\//,
}

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION)
  // 立即激活新的 Service Worker
  self.skipWaiting()
})

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_VERSION)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('blog-cache-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // 立即控制所有客户端
  return self.clients.claim()
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

  // HTML 页面：Network First 策略
  // 特别处理文章页面，实现更激进的缓存
  if (CACHE_PATTERNS.html.test(url.pathname)) {
    // 文章页面使用增强的 Network First 策略
    if (url.pathname.startsWith('/blog/') && url.pathname !== '/blog') {
      event.respondWith(enhancedNetworkFirstStrategy(request))
    } else {
      event.respondWith(networkFirstStrategy(request))
    }
    return
  }

  // 静态资源：Cache First 策略
  if (
    CACHE_PATTERNS.static.test(url.pathname) ||
    CACHE_PATTERNS.nextStatic.test(url.pathname)
  ) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // 其他请求：Network First
  event.respondWith(networkFirstStrategy(request))
})

// Network First 策略：优先网络，失败时使用缓存
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    // 如果响应成功，更新缓存
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    // 缓存也没有，返回错误
    throw error
  }
}

// Cache First 策略：优先缓存，失败时使用网络
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    // 如果响应成功，更新缓存
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // 网络失败，返回错误
    throw error
  }
}

// 增强的 Network First 策略：针对文章页面
// 优先网络，但缓存响应更快，后台更新缓存
async function enhancedNetworkFirstStrategy(request) {
  // 先检查缓存
  const cachedResponse = await caches.match(request)
  
  // 如果有缓存，立即返回缓存（不启动后台更新，避免 Response 克隆问题）
  if (cachedResponse) {
    return cachedResponse
  }

  // 没有缓存，从网络获取
  try {
    const networkResponse = await fetch(request)
    
    // 如果响应成功，更新缓存
    // 关键：在返回之前先克隆 Response，确保可以安全缓存
    if (networkResponse.ok) {
      // 先克隆 Response 用于缓存（在返回之前）
      const responseClone = networkResponse.clone()
      // 异步更新缓存，不阻塞响应返回
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone).catch((error) => {
          // 缓存失败不影响响应返回
          console.error('[Service Worker] Failed to cache:', request.url, error)
        })
      }).catch(() => {
        // 缓存打开失败不影响响应返回
      })
    }
    
    return networkResponse
  } catch (error) {
    // 网络失败，返回错误
    throw error
  }
}

