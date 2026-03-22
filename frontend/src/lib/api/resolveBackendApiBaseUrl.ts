export function resolveBackendApiBaseUrl(
  configuredUrl: string | undefined = process.env.NEXT_PUBLIC_BACKEND_URL
) {
  const baseUrl = configuredUrl || 'http://localhost:3000'
  const trimmedUrl = baseUrl.replace(/\/$/, '')

  if (trimmedUrl.endsWith('/api/v1')) {
    return trimmedUrl
  }

  if (trimmedUrl.endsWith('/v1')) {
    return trimmedUrl.replace(/\/v1$/, '/api/v1')
  }

  return `${trimmedUrl}/api/v1`
}
