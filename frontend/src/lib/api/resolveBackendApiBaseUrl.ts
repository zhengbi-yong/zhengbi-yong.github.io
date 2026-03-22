function runtimeBackendOrigin(configuredUrl?: string) {
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
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
