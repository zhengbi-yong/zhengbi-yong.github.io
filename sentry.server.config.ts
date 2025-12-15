import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Environment
    environment: process.env.NODE_ENV,
    // Release
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
    // Dist
    dist: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
    // Server-side specific integrations
    integrations: [
      // Add Node.js profiling integration
      new Sentry.NodeProfilingIntegration(),
      // Add HTTP request details
      new Sentry.HttpIntegration({
        tracing: true,
      }),
    ],
    // Before Send
    beforeSend(event, hint) {
      // Add server-specific context
      if (event.exception) {
        const error = hint.originalException
        // Add stack trace context if available
        if (error && error instanceof Error && error.stack) {
          event.contexts = {
            ...event.contexts,
            stack_trace: {
              stack: error.stack,
            },
          }
        }
      }
      return event
    },
    // Debug
    debug: process.env.NODE_ENV === 'development',
  })
} else {
  console.warn('Sentry DSN not configured, server-side error monitoring disabled')
}