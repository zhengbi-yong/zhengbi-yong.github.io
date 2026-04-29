 
// Contentlayer removed - migrated to velite for content processing
// const { withContentlayer } = require('next-contentlayer2')
const { withSentryConfig } = require('@sentry/nextjs')

const ignoreBuildErrors = process.env.NEXT_IGNORE_BUILD_ERRORS === '1'
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN
const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT
const enableSentryClientDebug = process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true'
const enableSentryBuildArtifacts = Boolean(sentryAuthToken && sentryOrg && sentryProject)

const sentryBuildOptions = {
  authToken: sentryAuthToken,
  org: sentryOrg,
  project: sentryProject,
  telemetry: false,
  silent: !enableSentryBuildArtifacts,
  sourcemaps: {
    disable: !enableSentryBuildArtifacts,
    deleteSourcemapsAfterUpload: enableSentryBuildArtifacts,
  },
  release: enableSentryBuildArtifacts
    ? undefined
    : {
        create: false,
        finalize: false,
      },
  webpack: {
    treeshake: {
      removeDebugLogging: !enableSentryClientDebug,
    },
  },
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许局域网其他机器访问开发服务器
  allowedDevOrigins: ['192.168.0.161', '192.168.0.100'],
  // 解决 workspace 多个 lockfile 的警告 — 注释掉以强制使用 Webpack（Turbopack 对 reactjs-tiptap-editor 有 bug）
  // turbopack: {
  //   root: __dirname,
  // },
  // 输出模式：standalone用于Docker，export用于静态导出
  output: process.env.EXPORT === '1' ? 'export' : 'standalone',
  // 静态导出时的基础路径
  basePath: process.env.BASE_PATH,
  // 图片优化配置：仅在静态导出时禁用
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 仅在静态导出时禁用优化，其他情况下启用
    unoptimized: process.env.EXPORT === '1',
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 其他配置
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // 禁用生产环境的浏览器 source map
  productionBrowserSourceMaps: false,
  // 压缩配置 - 使用 SWC 压缩（比 Terser 快）
  compress: true,
  // 实验性功能
  experimental: {
    // 优化 CSS 处理
    optimizeCss: true,
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
      'lucide-react',
    ],
  },
  // Webpack 配置：代码分割和 Bundle 优化
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@excalidraw[\\/]excalidraw/,
        message:
          /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ]

    // 仅在客户端构建时优化

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
            // reactjs-tiptap-editor — keep ALL imports in ONE chunk to avoid void 0
            rte: {
              name: 'rte',
              test: /[\\/]node_modules[\\/]reactjs-tiptap-editor[\\/]/,
              priority: 60,
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
        // 生产环境：允许 unsafe-inline 用于 Next.js 内联脚本
        // 化学可视化需要的外部CDN: cdn.jsdelivr.net (KaTeX/mhchem), unpkg.com (3Dmol), rdkit.org (RDKit)
        // WebAssembly需要 'wasm-unsafe-eval' 和 'unsafe-eval' 才能运行
        'default-src': "'self'",
        'script-src':
          "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' giscus.app analytics.umami.is https://cloud.umami.is",
        'script-src-elem':
          "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' giscus.app analytics.umami.is https://cloud.umami.is",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'style-src-elem': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'img-src': "'self' data: https: avatars.githubusercontent.com picsum.photos",
        'font-src': "'self' data: blob: https://fonts.gstatic.com https:",
        'connect-src':
          "'self' https: http://localhost:3000 http://192.168.0.161:3000 https://api.github.com https://github.com https://avatars.githubusercontent.com https://analytics.umami.is https://cloud.umami.is https://o1046881.ingest.sentry.io",
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
        // 化学可视化需要的外部CDN: cdn.jsdelivr.net (KaTeX/mhchem), unpkg.com (3Dmol), rdkit.org (RDKit)
        // WebAssembly需要 'wasm-unsafe-eval' 或 'unsafe-eval' 才能运行
        // 评论系统需要 giscus.app
        'default-src': "'self'",
        'script-src':
          "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' blob: giscus.app https://cloud.umami.is",
        'script-src-elem':
          "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' blob: giscus.app https://cloud.umami.is",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'style-src-elem': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'img-src': "'self' data: https: avatars.githubusercontent.com",
        'font-src': "'self' data: blob: https://fonts.gstatic.com https:",
        'worker-src': "'self' blob:",
        'connect-src':
          "'self' data: https: http://localhost:3000 http://192.168.0.161:3000 ws://localhost:3000 ws://localhost:3001 ws://192.168.0.161:3001 https://api.github.com https://github.com https://avatars.githubusercontent.com https://cloud.umami.is",
        'frame-src': 'giscus.app excalidraw.com',
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
    ...(isProduction
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ]
      : []),
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

module.exports = withSentryConfig(finalConfig, sentryBuildOptions)
