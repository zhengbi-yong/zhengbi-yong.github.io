/**
 * OpenTelemetry Instrumentation for Next.js
 *
 * This file initializes OpenTelemetry tracing for the application.
 * It's automatically loaded by Next.js at startup.
 *
 * Export configuration is intentionally environment-variable driven so it stays
 * aligned with `@vercel/otel` and OTLP defaults instead of hand-building an
 * exporter shape in userland.
 */

import { registerOTel } from '@vercel/otel'

const DEFAULT_SERVICE_NAME = 'blog-frontend'
const DEFAULT_SERVICE_NAMESPACE = 'frontend'

function shouldRegisterOTel() {
  if (process.env.OTEL_ENABLED === 'true') {
    return true
  }

  if (process.env.OTEL_ENABLED === 'false') {
    return false
  }

  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT) ||
    Boolean(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT)
  )
}

export function register() {
  if (!shouldRegisterOTel()) {
    return
  }

  const serviceName =
    process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || DEFAULT_SERVICE_NAME
  const serviceVersion = process.env.OTEL_SERVICE_VERSION || process.env.npm_package_version
  const serviceNamespace = process.env.OTEL_SERVICE_NAMESPACE || DEFAULT_SERVICE_NAMESPACE

  registerOTel({
    serviceName,
    attributes: {
      'deployment.environment': process.env.NODE_ENV || 'development',
      'service.namespace': serviceNamespace,
      ...(serviceVersion ? { 'service.version': serviceVersion } : {}),
    },
  })
}
