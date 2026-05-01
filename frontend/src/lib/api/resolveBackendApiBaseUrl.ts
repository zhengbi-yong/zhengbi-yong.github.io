function runtimeBackendOrigin(configuredUrl?: string) {
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl
  }

  // 优先使用环境变量中的后端地址（SSR 和客户端都适用）
  const envUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL

  if (envUrl) {
    return envUrl
  }

  // 仅在没有配置时才回退到浏览器 origin（开发环境 localhost）
  if (typeof window !== 'undefined') {
    // 开发环境下 frontend 和 backend 可能同端口（通过 docker-compose 端口映射）
    const isLocalDev = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1'
    if (isLocalDev) {
      // 开发环境：frontend 3001，backend 3000
      return window.location.protocol + '//' + window.location.hostname + ':3000'
    }
  }

  return (
    envUrl ||
    'http://localhost:3000'
  )
}

export function resolveBackendApiBaseUrl(configuredUrl?: string) {
  const baseUrl = runtimeBackendOrigin(configuredUrl)
  const trimmedUrl = baseUrl.replace(/\/$/, '')

  if (trimmedUrl === '') {
    return '/api/v1'
  }

  if (trimmedUrl.endsWith('/api/v1')) {
    return trimmedUrl
  }

  if (trimmedUrl.endsWith('/api')) {
    return `${trimmedUrl}/v1`
  }

  if (trimmedUrl.endsWith('/v1')) {
    return trimmedUrl.replace(/\/v1$/, '/api/v1')
  }

  return `${trimmedUrl}/api/v1`
}

export function resolveBackendBaseUrl(configuredUrl?: string) {
  return resolveBackendApiBaseUrl(configuredUrl).replace(/\/api\/v1$/, '')
}
