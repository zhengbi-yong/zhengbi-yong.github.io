import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Environment
    environment: process.env.NODE_ENV,
    // Release
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
    // Dist
    dist: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
    // User Feedback
    beforeSend(event, hint) {
      // Check if it is an error that should be filtered out
      if (event.exception) {
        const error = hint.originalException
        // Filter out certain errors
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string' &&
          // Ignore Chrome extension errors
          error.message.includes('Non-Error promise rejection captured')
        ) {
          return null
        }
      }
      return event
    },
    // Integrations
    integrations: [
      // Add browser profiling integration
      new Sentry.BrowserProfilingIntegration(),
      // Add session replay
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Before Send Transaction
    beforeTransaction(transaction) {
      // Filter out certain transactions
      if (transaction.name === '/_next/static/chunks/webpack') {
        return null
      }
      return transaction
    },
    // Initial Scope
    initialScope: {
      tags: {
        section: 'blog',
      },
    },
    // Contexts
    contexts: {
      os: {
        name: 'Web Browser',
      },
      device: {
        type: 'Desktop',
      },
    },
    // Breadcrumbs
    beforeSendBreadcrumb(breadcrumb) {
      // Filter out certain breadcrumbs
      if (breadcrumb.category === 'fetch' && breadcrumb.data?.url?.includes('/api/analytics')) {
        return null
      }
      return breadcrumb
    },
  })
} else {
  console.warn('Sentry DSN not configured, error monitoring disabled')
}