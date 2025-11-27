const { withContentlayer } = require('next-contentlayer2')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// You might need to insert additional domains in script-src if you are using external services
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src *.s3.amazonaws.com;
  connect-src *;
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
const unoptimized = process.env.UNOPTIMIZED ? true : undefined

/**
 * @type {import('next/dist/next-server/server/config').NextConfig}
 **/
module.exports = () => {
  const plugins = [withContentlayer, withBundleAnalyzer]
  const isStaticExport = output === 'export'
  
  return plugins.reduce((acc, next) => next(acc), {
    output,
    basePath,
    reactStrictMode: true,
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    // Note: eslint configuration moved to eslint.config.mjs in Next.js 16
    // Use `next lint --dir app --dir components --dir layouts --dir scripts` instead
    turbopack: {}, // Empty config to allow webpack config to work with Turbopack
    // 禁用生产环境的浏览器 source map，减少构建大小和警告
    productionBrowserSourceMaps: false,
    // 性能优化：使用 SWC 压缩（Next.js 16 默认启用，显式设置以确保）
    swcMinify: true,
    // 性能优化：压缩配置（Next.js 16 默认启用 gzip）
    compress: true,
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },
      ],
      // 注意：静态导出模式下 Next.js 图片优化器不可用
      // 如需图片优化，建议使用 CDN 服务（如 Cloudinary、ImageKit）或构建时预处理
      unoptimized,
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
    webpack: (config, options) => {
      const { isServer, dev } = options

      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      })

      // Add alias for contentlayer/generated to fix Windows path resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        'contentlayer/generated': require('path').resolve(__dirname, '.contentlayer/generated'),
      }

      // 性能优化：生产环境下的 webpack 优化配置
      if (!dev && !isServer) {
        // 优化代码分割策略
        config.optimization = {
          ...config.optimization,
          // 启用 tree shaking（移除未使用的代码）
          usedExports: true,
          // 优化代码分割
          splitChunks: {
            ...config.optimization.splitChunks,
            chunks: 'all',
            cacheGroups: {
              // 分离框架代码（React、Next.js 等）
              framework: {
                name: 'framework',
                chunks: 'all',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
                priority: 40,
                enforce: true,
              },
              // 分离大型库（如 Three.js、GSAP 等）
              lib: {
                test: /[\\/]node_modules[\\/]/,
                name(module) {
                  const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1]
                  return packageName ? `lib-${packageName.replace('@', '')}` : null
                },
                priority: 30,
                minChunks: 1,
                reuseExistingChunk: true,
              },
              // 分离公共代码
              commons: {
                name: 'commons',
                minChunks: 2,
                priority: 20,
                reuseExistingChunk: true,
              },
            },
          },
          // 启用模块连接（Module Concatenation）以提升运行时性能
          concatenateModules: true,
        }
      }

      return config
    },
  })
}
