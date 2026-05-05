function runtimeBackendOrigin(configuredUrl?: string) {
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl
  }

  // 服务端：使用 Docker 内部地址直连 backend
  if (typeof window === 'undefined') {
    const envUrl = process.env.BACKEND_INTERNAL_URL
    if (envUrl) return envUrl
  }

  // 客户端：始终返回空字符串 → resolveBackendApiBaseUrl 返回 '/api/v1'
  // 所有请求走 BFF 代理（同源），Cookie 自动携带。
  // 如果直连 backend (不同端口)，Cookie 无法跨端口传递，
  // 导致 middleware 检测不到会话 → 无限重定向循环。
  return ''
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
