import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 只在生产环境或明确启用时上报
  enabled:
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true',

  // 采样率配置
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

  // 调试模式（开发环境）
  debug: process.env.NODE_ENV === 'development',

  // 发布版本标记
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.npm_package_version,

  // 环境标记
  environment: process.env.NODE_ENV,

  // 在发送前过滤掉敏感信息
  beforeSend(event) {
    // 过滤掉可能包含敏感信息的请求头
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
      delete event.request.headers['x-api-key']
    }

    // 过滤掉 URL 中的敏感参数
    if (event.request?.url) {
      try {
        const url = new URL(event.request.url)
        url.searchParams.delete('token')
        url.searchParams.delete('password')
        url.searchParams.delete('secret')
        event.request.url = url.toString()
      } catch {
        // URL 解析失败，保留原样
      }
    }

    return event
  },

  // 集成配置
  integrations: [
    // 自动捕获 console 错误
    Sentry.captureConsoleIntegration(),
  ],

  // 忽略常见噪声错误
  ignoreErrors: [
    // 浏览器扩展相关
    /chrome-extension/i,
    /extensions\//i,
    // 网络相关（通常是用户网络问题）
    /Network Error/i,
    /Failed to fetch/i,
    // 第三方脚本
    /Script error/i,
  ],
})
