const CACHE_VERSION = 'v1.1.0'
const CACHE_NAME = `blog-cache-${CACHE_VERSION}`

const CRITICAL_CACHE = [
  '/',
  '/blog',
  '/about',
  '/projects',
  '/music',
]

const CACHE_PATTERNS = {
  html: /\.html$|^\/[^.]*$/,
  static: /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|mp4)$/,
  nextStatic: /\/_next\/static\//,
  assets: /\/assets\//,
}

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION)

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching critical resources')
        return cache.addAll(CRITICAL_CACHE)
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache critical resources:', error)
      })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_VERSION)

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith('blog-cache-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== location.origin) {
    return
  }

  if (request.method !== 'GET') {
    return
  }

  if (url.pathname.startsWith('/chemistry/')) {
    return
  }

  if (CACHE_PATTERNS.html.test(url.pathname)) {
    if (url.pathname.startsWith('/blog/') && url.pathname !== '/blog') {
      event.respondWith(enhancedNetworkFirstStrategy(request))
    } else {
      event.respondWith(networkFirstStrategy(request))
    }
    return
  }

  if (
    CACHE_PATTERNS.static.test(url.pathname) ||
    CACHE_PATTERNS.nextStatic.test(url.pathname) ||
    CACHE_PATTERNS.assets.test(url.pathname)
  ) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  event.respondWith(networkFirstStrategy(request))
})

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.error('[Service Worker] Failed to cache:', request.url, error)
      })
    }

    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    throw error
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.error('[Service Worker] Failed to cache:', request.url, error)
      })
    }

    return networkResponse
  } catch (error) {
    throw error
  }
}

async function enhancedNetworkFirstStrategy(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok && networkResponse.status !== 206) {
      const responseClone = networkResponse.clone()

      caches
        .open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseClone).catch((error) => {
            console.error('[Service Worker] Failed to cache:', request.url, error)
          })
        })
        .catch(() => {})
    }

    return networkResponse
  } catch (error) {
    throw error
  }
}
