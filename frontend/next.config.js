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
  // GitHub Pages 静态导出配置
  output: process.env.EXPORT === '1' ? 'export' : undefined,
  // 静态导出时的基础路径
  basePath: process.env.BASE_PATH,
  // 禁用图片优化以支持静态导出
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
  },
  // 其他配置
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // 禁用生产环境的浏览器 source map
  productionBrowserSourceMaps: false,
  // 压缩配置
  compress: true,
  // 实验性功能
  experimental: {
    optimizePackageImports: [
      'lodash',
      'date-fns',
      'react-icons',
      'echarts',
      '@nivo/core',
      '@nivo/bar',
      '@nivo/line',
      '@nivo/pie',
      '@nivo/radar',
      '@nivo/scatterplot',
      'three',
      'leaflet',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-accordion',
    ],
  },
  // Webpack 配置：代码分割和 Bundle 优化
  webpack: (config, { isServer }) => {
    // 仅在客户端构建时优化
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 默认 vendor 组（所有 node_modules）
            default: false,
            vendors: false,
            // React 核心库
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 50,
              reuseExistingChunk: true,
            },
            // UI 组件库（Radix UI）
            radix: {
              name: 'radix-ui',
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
            },
            // 可视化库（ECharts, Nivo, Three.js, Leaflet）
            visualization: {
              name: 'visualization',
              test: /[\\/]node_modules[\\/](echarts|@echarts|@nivo|three|@tresjs|leaflet)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // RDKit WASM 单独分离（非常大）
            rdkit: {
              name: 'rdkit',
              test: /[\\/]node_modules[\\/]@rdkit[\\/]/,
              priority: 35,
              reuseExistingChunk: true,
            },
            // 动画库（GSAP, Framer Motion）
            animation: {
              name: 'animation',
              test: /[\\/]node_modules[\\/](gsap|@gsap|framer-motion)[\\/]/,
              priority: 25,
              reuseExistingChunk: true,
            },
            // 工具库（Lodash, date-fns 等）
            utils: {
              name: 'utils',
              test: /[\\/]node_modules[\\/](lodash|date-fns|clsx|class-variance-authority)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // 其他大型依赖
            large: {
              name: 'large',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    return config
  },
}

// 动态生成安全头
const generateSecurityHeaders = () => {
  const isProduction = process.env.NODE_ENV === 'production'

  // 生产环境移除 unsafe-inline 和 unsafe-eval
  const cspValue = isProduction
    ? {
        // 生产环境：更严格的 CSP，不使用 unsafe-inline
        'default-src': "'self'",
        'script-src': "'self' giscus.app analytics.umami.is unpkg.com",
        'style-src': "'self' unpkg.com cdn.jsdelivr.net",
        'img-src': "'self' data: https: avatars.githubusercontent.com picsum.photos",
        'font-src': "'self' data: blob: https: unpkg.com cdn.jsdelivr.net",
        'connect-src': "'self' https: https://api.github.com https://github.com https://avatars.githubusercontent.com https://analytics.umami.is https://o1046881.ingest.sentry.io unpkg.com cdn.jsdelivr.net",
        'frame-src': 'giscus.app excalidraw.com',
        'worker-src': "'self' blob:",
        'media-src': "'self'",
        'object-src': "'none'",
        'base-uri': "'self'",
        'form-action': "'self'",
        'frame-ancestors': "'none'",
        'upgrade-insecure-requests': '',
      }
    : {
        // 开发环境：允许 unsafe-inline 和 unsafe-eval 用于开发工具
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-eval' 'unsafe-inline' unpkg.com",
        'style-src': "'self' 'unsafe-inline' unpkg.com cdn.jsdelivr.net",
        'img-src': "'self' data: https:",
        'font-src': "'self' data: blob: https: unpkg.com cdn.jsdelivr.net",
        'connect-src': "'self' https: http://localhost:3000 ws://localhost:3000 ws://localhost:3001 unpkg.com cdn.jsdelivr.net",
        'frame-src': 'excalidraw.com',
      }

  // 将 CSP 对象转换为字符串
  const cspString = Object.entries(cspValue)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ')

  const headers = [
    // Content-Security-Policy
    {
      key: 'Content-Security-Policy',
      value: cspString,
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
    // Permissions-Policy (新增)
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
    // Strict-Transport-Security (仅生产环境)
    ...(isProduction ? [{
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    }] : []),
  ]

  return headers
}

const finalConfig = {
  ...nextConfig,
  // 解决外部包问题
  serverExternalPackages: ['@opentelemetry/api'],
}

// 只在非静态导出时添加 headers
if (process.env.EXPORT !== '1') {
  finalConfig.headers = async () => {
    return [
      {
        source: '/(.*)',
        headers: generateSecurityHeaders(),
      },
    ]
  }
}

module.exports = withContentlayer(
  withSentryConfig(finalConfig)
)