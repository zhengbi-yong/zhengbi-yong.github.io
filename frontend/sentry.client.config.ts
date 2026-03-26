import * as Sentry from '@sentry/nextjs'

const isProduction = process.env.NODE_ENV === 'production'
const sentryEnabled =
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) &&
  (isProduction || process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true')
const sentryDebugEnabled =
  sentryEnabled && process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true'
const tracesSampleRate = parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'
)

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: sentryEnabled,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
  debug: sentryDebugEnabled,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.npm_package_version,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
      delete event.request.headers['x-api-key']
    }

    if (event.request?.url) {
      try {
        const url = new URL(event.request.url)
        url.searchParams.delete('token')
        url.searchParams.delete('password')
        url.searchParams.delete('secret')
        event.request.url = url.toString()
      } catch {
        return event
      }
    }

    return event
  },
  integrations: sentryEnabled
    ? [
        Sentry.captureConsoleIntegration(),
      ]
    : [],
  ignoreErrors: [
    /chrome-extension/i,
    /extensions\//i,
    /Network Error/i,
    /Failed to fetch/i,
    /Script error/i,
  ],
})
