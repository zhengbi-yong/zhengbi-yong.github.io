const { withContentlayer } = require('next-contentlayer2')
const { withSentryConfig } = require('@sentry/nextjs')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// You might need to insert additional domains in script-src if you are using external services
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is;
  style-src 'self' 'unsafe-inline' unpkg.com;
  img-src * blob: data:;
  media-src 'self' *.s3.amazonaws.com;
  connect-src 'self' https://api.github.com https://github.com https://avatars.githubusercontent.com;
  font-src 'self';
  frame-src giscus.app;
  worker-src 'self' blob:
`

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const output = process.env.EXPORT ? 'export' : undefined
const basePath = process.env.BASE_PATH || undefined
// 静态导出模式下必须禁用图片优化
// 如果设置了 EXPORT 或 UNOPTIMIZED 环境变量，则禁用图片优化
const unoptimized = process.env.EXPORT === '1' || process.env.UNOPTIMIZED === '1' ? true : undefined

/**
 * @type {import('next/dist/next-server/server/config').NextConfig}
 **/
module.exports = () => {
  // Windows 文件监听配置：通过环境变量启用轮询模式
  // 如果环境变量未设置，在Windows上自动启用
  if (process.platform === 'win32' && !process.env.CHOKIDAR_USEPOLLING) {
    process.env.CHOKIDAR_USEPOLLING = 'true'
  }

  const plugins = [withContentlayer, withBundleAnalyzer]
  const isStaticExport = output === 'export'

  // Wrap with Sentry config
  const configWithSentry = withSentryConfig({
    output,
    basePath,
    reactStrictMode: true,
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    // 配置服务器外部包，解决 Sentry/OpenTelemetry 警告
    serverExternalPackages: [
      'import-in-the-middle',
      'require-in-the-middle',
      '@opentelemetry/instrumentation',
      '@sentry/node-core',
    ],
    // Note: eslint configuration moved to eslint.config.mjs in Next.js 16
    // Use `next lint --dir app --dir components --dir layouts --dir scripts` instead
    // 配置 Turbopack（Next.js 16 默认使用 Turbopack）
    turbopack: {
      resolveAlias: {
        // 配置 contentlayer/generated 别名
        // 注意：Turbopack 不支持 Windows 绝对路径，必须使用相对路径
        'contentlayer/generated': './.contentlayer/generated',
      },
      // 配置 SVG 处理（Turbopack 内置支持，无需额外配置）
      // SVG 可以通过 next/image 或直接导入使用
    },
    // 禁用生产环境的浏览器 source map，减少构建大小和警告
    productionBrowserSourceMaps: false,
    // 性能优化：压缩配置（Next.js 16 默认启用 gzip）
    // 注意：Next.js 16 默认使用 SWC 压缩，无需显式设置 swcMinify
    compress: true,
    // 注意：CSS预加载警告在静态导出中是正常的，不影响功能
    // Next.js会自动预加载动态导入的CSS chunk，即使组件尚未渲染
    // 这是Next.js的优化策略，有助于在用户展开模块时更快加载CSS
    // 如果希望减少警告，可以考虑将更多CSS内联或使用更细粒度的代码分割
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },
      ],
      // 注意：静态导出模式下 Next.js 图片优化器不可用
      // 必须设置 unoptimized: true，否则会尝试使用 /_next/image 路由（静态导出模式下不存在）
      // 如需图片优化，建议使用 CDN 服务（如 Cloudinary、ImageKit）或构建时预处理
      unoptimized: unoptimized !== undefined ? unoptimized : isStaticExport ? true : false,
      // 性能优化：即使静态导出，也配置图片格式优先级
      formats: ['image/avif', 'image/webp'],
      // 性能优化：配置图片尺寸，减少不必要的加载
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    // 兼容性处理：静态导出模式下 headers 不生效，避免警告
    // 静态导出时需要在服务器层（如 Nginx、Apache）配置安全头
    // 动态部署模式下保留完整的 headers 配置
    ...(isStaticExport
      ? {}
      : {
          async headers() {
            return [
              {
                source: '/(.*)',
                headers: securityHeaders,
              },
            ]
          },
        }),
    // 添加 webpack 配置用于 bundle 优化
    webpack: (config, { isServer, dev, nextRuntime }) => {
      // 避免在服务端运行时优化（Edge Runtime）
      if (nextRuntime === 'edge' || isServer) {
        return config
      }

      // 生产环境优化
      if (!dev) {
        // 代码分割优化
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              // 排除已经单独分割的包
              exclude: /framer-motion|three|gsap|leaflet|tone/,
            },
            // 动画库单独分包
            animations: {
              test: /[\\/]node_modules[\\/](framer-motion|gsap|@gsap)[\\/]/,
              name: 'animations',
              chunks: 'all',
              priority: 20,
            },
            // Three.js 单独分包
            three: {
              test: /[\\/]node_modules[\\/](three|@tresjs)[\\/]/,
              name: 'three',
              chunks: 'all',
              priority: 20,
            },
            // 地图库单独分包
            maps: {
              test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
              name: 'maps',
              chunks: 'all',
              priority: 20,
            },
            // 音频库单独分包
            audio: {
              test: /[\\/]node_modules[\\/](tone|opensheetmusicdisplay)[\\/]/,
              name: 'audio',
              chunks: 'all',
              priority: 20,
            },
          },
        }
      }

      // 解析优化
      config.resolve.alias = {
        ...config.resolve.alias,
        // 减少重复依赖
        '@react-three/fiber': 'react-three-fiber',
        '@react-three/drei': 'react-three-drei',
      }

      // 外部化开发依赖（生产环境）
      if (!dev) {
        // 将开发工具从生产 bundle 中排除
        const devDependencies = [
          '@storybook',
          '@testing-library',
          '@types/jest',
          'eslint',
          'prettier',
          'tailwindcss',
          'vitest',
        ]

        config.externals = config.externals || []
        config.externals.push(function (context, request, callback) {
          if (devDependencies.some((dep) => request.includes(dep))) {
            return callback(null, 'commonjs ' + request)
          }
          callback()
        })
      }

      return config
    },
    // 实验性功能
    experimental: {
      optimizePackageImports: ['lucide-react', 'date-fns', 'clsx'],
      scrollRestoration: true,
      largePageDataBytes: 128 * 1000, // 128KB
    },
    // 模块追踪（有助于调试 bundle 大小）
    modularizeImports: {
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
        skipDefaultConversion: true,
      },
      'date-fns': {
        transform: 'date-fns/{{member}}',
        preventFullImport: true,
      },
    },
  })

  return plugins.reduce((acc, plugin) => plugin(acc), configWithSentry)
}
