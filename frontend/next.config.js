/* eslint-disable @typescript-eslint/no-require-imports */
const { withContentlayer } = require('next-contentlayer2')
const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 解决 workspace 多个 lockfile 的警告
  turbopack: {
    // 指定项目根目录
    root: __dirname,
  },
  // 其他配置
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // 禁用生产环境的浏览器 source map
  productionBrowserSourceMaps: false,
  // 压缩配置
  compress: true,
  // 图片配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
  },
  // 实验性功能
  experimental: {
    optimizePackageImports: [
      'lodash',
      'date-fns',
      'react-icons',
    ],
  },
}

// 动态生成安全头
const generateSecurityHeaders = () => {
  const isProduction = process.env.NODE_ENV === 'production'

  const headers = [
    // Content-Security-Policy
    {
      key: 'Content-Security-Policy',
      value: isProduction
        ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' giscus.app analytics.umami.is unpkg.com; style-src 'self' 'unsafe-inline' unpkg.com cdn.jsdelivr.net; img-src 'self' data: https: avatars.githubusercontent.com picsum.photos; font-src 'self' data: blob: https: unpkg.com cdn.jsdelivr.net; connect-src 'self' https: https://api.github.com https://github.com https://avatars.githubusercontent.com https://analytics.umami.is https://o1046881.ingest.sentry.io unpkg.com cdn.jsdelivr.net; frame-src giscus.app excalidraw.com; worker-src 'self' blob:; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' unpkg.com; style-src 'self' 'unsafe-inline' unpkg.com cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: blob: https: unpkg.com cdn.jsdelivr.net; connect-src 'self' https: unpkg.com cdn.jsdelivr.net; frame-src excalidraw.com;",
    },
    // Referrer-Policy
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    // X-Frame-Options
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
    // X-Content-Type-Options
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    // X-DNS-Prefetch-Control
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
  ]

  return headers
}

module.exports = withContentlayer(
  withSentryConfig({
    ...nextConfig,
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: generateSecurityHeaders(),
        },
      ]
    },
    // 解决外部包问题
    serverExternalPackages: ['@opentelemetry/api'],
  })
)