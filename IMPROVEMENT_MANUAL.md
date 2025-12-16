# Zhengbi Yong's Blog - 网站优化改进手册

## 目录

1. [立即修复项目](#立即修复项目)
2. [性能优化指南](#性能优化指南)
3. [用户体验增强](#用户体验增强)
4. [可访问性改进](#可访问性改进)
5. [代码质量提升](#代码质量提升)
6. [SEO 优化策略](#seo-优化策略)
7. [安全加固措施](#安全加固措施)
8. [测试体系建设](#测试体系建设)
9. [监控和分析](#监控和分析)
10. [长期发展计划](#长期发展计划)

---

## 立即修复项目

### 1. 更新安全依赖

```bash
# 更新 Next.js 到安全版本
pnpm update next@16.0.9

# 更新 js-yaml 到安全版本
pnpm update js-yaml@4.1.1

# 检查其他安全漏洞
pnpm audit
```

### 2. 修复测试依赖

```bash
# 安装缺失的测试依赖
pnpm add -D isomorphic-dompurify
pnpm add -D @testing-library/react @testing-library/jest-dom
```

### 3. 修复关键错误

创建 `scripts/fix-security.sh`:

```bash
#!/bin/bash
echo "🔧 开始修复安全问题..."

# 1. 更新依赖
echo "📦 更新依赖..."
pnpm update next@16.0.9
pnpm update js-yaml@4.1.1

# 2. 清理 node_modules
echo "🧹 清理依赖缓存..."
rm -rf node_modules
pnpm install

# 3. 运行安全检查
echo "🔒 运行安全检查..."
pnpm audit --fix

echo "✅ 安全修复完成！"
```

---

## 性能优化指南

### Phase 1: Bundle 优化

#### 1.1 分析当前 Bundle

创建 `scripts/analyze-bundle.js`:

```javascript
const { execSync } = require('child_process')

console.log('📊 分析 Bundle 大小...\n')

// 运行 bundle analyzer
execSync('cross-env ANALYZE=true pnpm build', { stdio: 'inherit' })

// 输出优化建议
console.log('\n💡 优化建议：')
console.log('1. 检查超过 100KB 的 chunks')
console.log('2. 识别未使用的依赖')
console.log('3. 实施代码分割')
```

运行分析：

```bash
pnpm analyze
```

#### 1.2 实施 Code Splitting

修改 `app/layout.tsx`:

```tsx
import dynamic from 'next/dynamic'

// 动态导入重型组件
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
  ssr: false,
  loading: () => null,
})

const ThreeViewer = dynamic(() => import('@/components/ThreeViewer'), {
  ssr: false,
  loading: () => <div className="loading-placeholder">加载 3D 内容...</div>,
})

const MusicPlayer = dynamic(() => import('@/components/MusicPlayer'), {
  ssr: false,
  loading: () => <div className="loading-placeholder">加载音乐播放器...</div>,
})
```

#### 1.3 优化 Next.js 配置

更新 `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 实验性功能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@headlessui/react',
      '@radix-ui/react-*',
    ],
  },

  // 优化包导入
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // 优化 Three.js
    config.resolve.alias = {
      ...config.resolve.alias,
      three: 'three/src/Three',
    }

    return config
  },

  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // 启用 ISR
  async rewrites() {
    return []
  },
}

module.exports = nextConfig
```

#### 1.4 创建懒加载包装器

创建 `components/LazyWrapper.tsx`:

```tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const LazyWrapper = ({
  children,
  fallback = <Skeleton className="h-32 w-full" />,
}: LazyWrapperProps) => {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

export default LazyWrapper
```

### Phase 2: 资源优化

#### 2.1 图片优化策略

更新 `components/OptimizedImage.tsx`:

```tsx
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={cn('overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'
        )}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  )
}
```

#### 2.2 字体优化

创建 `components/OptimizedFont.tsx`:

```tsx
import { Inter, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google'
import { cn } from '@/lib/utils'

// 配置字体
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: true,
})

export const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: true,
})
```

### Phase 3: 缓存策略

#### 3.1 Service Worker 配置

创建 `public/sw.js`:

```javascript
const CACHE_NAME = 'zhengbi-blog-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  // 关键路由和资源
]

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 缓存命中 - 返回缓存
      if (response) {
        return response
      }

      // 克隆请求
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // 检查是否有效响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // 克隆响应
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

// 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
```

---

## 用户体验增强

### 1. 动画系统优化

#### 1.1 创建动画令牌

创建 `styles/animations.css`:

```css
/* 动画系统令牌 */
:root {
  /* 动画持续时间 */
  --duration-instant: 0ms;
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  --duration-slowest: 800ms;

  /* 缓动函数 */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* 高级缓动 */
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-out-circ: cubic-bezier(0.33, 0, 0.67, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-back: cubic-bezier(0.36, 0, 0.66, -0.56);
  --ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);
  --ease-in-out-expo: cubic-bezier(0.87, 0, 0.13, 1);

  /* 物理动画参数 */
  --spring-stiffness: 100;
  --spring-damping: 10;
  --spring-mass: 1;
}

/* Reduced Motion 支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 1.2 创建动画组件

创建 `components/animations/MotionWrapper.tsx`:

```tsx
import { motion, AnimatePresence, MotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionWrapperProps extends MotionProps {
  children: ReactNode
  as?: keyof JSX.IntrinsicElements
}

export const FadeIn = ({ children, ...props }: MotionWrapperProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    {...props}
  >
    {children}
  </motion.div>
)

export const SlideUp = ({ children, ...props }: MotionWrapperProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{
      duration: 0.3,
      ease: [0.19, 1, 0.22, 1],
    }}
    {...props}
  >
    {children}
  </motion.div>
)

export const ScaleIn = ({ children, ...props }: MotionWrapperProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      duration: 0.2,
      ease: [0.34, 1.56, 0.64, 1],
    }}
    {...props}
  >
    {children}
  </motion.div>
)

export const StaggerContainer = ({ children, ...props }: MotionWrapperProps) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={{
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
      exit: { opacity: 0 },
    }}
    {...props}
  >
    {children}
  </motion.div>
)

export const StaggerItem = ({ children, ...props }: MotionWrapperProps) => (
  <motion.div
    variants={{
      initial: { opacity: 0, y: 20 },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: [0.19, 1, 0.22, 1],
        },
      },
      exit: {
        opacity: 0,
        y: -20,
        transition: {
          duration: 0.2,
        },
      },
    }}
    {...props}
  >
    {children}
  </motion.div>
)
```

### 2. 响应式设计改进

#### 2.1 扩展断点系统

更新 `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1600px',
        '4xl': '1920px',
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: '500',
            },
          },
        },
      },
    },
  },
  plugins: [],
}
```

#### 2.2 创建响应式容器

创建 `components/ResponsiveContainer.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export const ResponsiveContainer = ({
  children,
  className,
  size = 'lg',
}: ResponsiveContainerProps) => {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl',
  }

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  )
}
```

### 3. 加载状态优化

#### 3.1 骨架屏组件

创建 `components/skeleton/SkeletonCard.tsx`:

```tsx
import { Skeleton } from '@/components/ui/Skeleton'

export const ArticleCardSkeleton = () => (
  <div className="animate-pulse rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="mt-4 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
    <div className="mt-4 flex items-center justify-between">
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
)

export const PostDetailSkeleton = () => (
  <article className="mx-auto max-w-4xl">
    <div className="mb-8">
      <Skeleton className="mb-4 h-12 w-3/4" />
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
    <div className="prose prose-lg dark:prose-invert">
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  </article>
)
```

#### 3.2 进度条组件

创建 `components/progress/ProgressBar.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const PageProgressBar = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrolled = window.scrollY
      const progress = (scrolled / documentHeight) * 100
      setProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.div
      className="bg-primary/20 fixed left-0 right-0 top-0 z-50 h-1"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      style={{ transformOrigin: 'left' }}
    >
      <div className="bg-primary h-full" />
    </motion.div>
  )
}
```

### 4. 错误处理增强

#### 4.1 错误边界组件

更新 `components/ErrorBoundaryV2.tsx`:

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

export class ErrorBoundaryV2 extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 发送错误到监控服务
    console.error('Error caught by boundary:', error, errorInfo)

    // 这里可以集成 Sentry
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }))
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                哎呀，出错了
              </h1>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {this.state.retryCount === 0
                  ? '抱歉，页面遇到了意外错误。'
                  : `已经重试 ${this.state.retryCount} 次，仍然存在问题。`}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 rounded-lg bg-gray-100 p-4 text-left dark:bg-gray-800">
                  <summary className="cursor-pointer font-mono text-sm">错误详情</summary>
                  <pre className="mt-2 overflow-auto text-xs">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="space-y-3">
                {this.state.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    icon={<RefreshCw className="h-4 w-4" />}
                  >
                    重试 ({this.maxRetries - this.state.retryCount} 次机会)
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="w-full"
                  icon={<Home className="h-4 w-4" />}
                >
                  返回首页
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 可访问性改进

### 1. ARIA 标签增强

#### 1.1 创建可访问的按钮组件

更新 `components/ui/Button.tsx`:

```tsx
import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
      outline:
        'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground focus:ring-primary',
      ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-primary',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    }

    const sizes = {
      sm: 'h-9 px-3 text-sm min-h-[36px]',
      md: 'h-10 px-4 text-base min-h-[44px]',
      lg: 'h-12 px-6 text-lg min-h-[48px]',
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          disabled || loading ? 'cursor-not-allowed opacity-50' : '',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-describedby={loading ? 'loading-description' : undefined}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span id="loading-description" className="sr-only">
              正在加载，请稍候
            </span>
          </>
        )}

        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2" aria-hidden="true">
            {icon}
          </span>
        )}

        <span className={loading ? 'ml-2' : ''}>{children}</span>

        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
```

#### 1.2 跳转链接组件

创建 `components/SkipLink.tsx`:

```tsx
import { useEffect, useState } from 'react'

export const SkipLink = () => {
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocused(true)
      }
    }

    const handleMouseDown = () => {
      setIsFocused(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return (
    <a
      href="#main-content"
      className={`bg-primary fixed left-0 top-0 z-50 -translate-y-full p-4 text-white transition-transform duration-200 focus:translate-y-0 ${isFocused ? '' : 'focus:translate-y-0'} `}
    >
      跳转到主要内容
    </a>
  )
}
```

### 2. 键盘导航优化

#### 2.1 焦点管理

创建 `hooks/useFocusTrap.ts`:

```typescript
import { useEffect, useRef } from 'react'

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return containerRef
}
```

### 3. 颜色对比度检查

创建 `scripts/check-contrast.js`:

```javascript
const { execSync } = require('child_process')

console.log('🎨 检查颜色对比度...\n')

// 使用 color-checker 或类似工具
execSync('pnpm add -D color-contrast-checker', { stdio: 'inherit' })

// 创建对比度检查脚本
const fs = require('fs')
const path = require('path')

const contrastChecker = `
const { ColorContrastChecker } = require('color-contrast-checker');
const ccc = new ColorContrastChecker();

// 定义颜色对
const colorPairs = [
  { foreground: '#ffffff', background: '#1f2937' }, // light on dark
  { foreground: '#000000', background: '#ffffff' }, // dark on light
  { foreground: '#6b7280', background: '#ffffff' }, // gray on light
  { foreground: '#d1d5db', background: '#1f2937' }, // light gray on dark
];

console.log('🔍 颜色对比度检查结果：\\n');

colorPairs.forEach((pair, index) => {
  const ratio = ccc.contrastRatio(
    pair.foreground,
    pair.background
  );

  const aa = ccc.isLevelAA(pair.foreground, pair.background);
  const aaa = ccc.isLevelAAA(pair.foreground, pair.background);

  console.log(\`颜色对 \${index + 1}:\`);
  console.log(\`前景色: \${pair.foreground}\`);
  console.log(\`背景色: \${pair.background}\`);
  console.log(\`对比度: \${ratio.toFixed(2)}:1\`);
  console.log(\`WCAG AA: \${aa ? '✅' : '❌'}\`);
  console.log(\`WCAG AAA: \${aaa ? '✅' : '❌'}\`);
  console.log('---');
});
`

fs.writeFileSync('scripts/check-contrast-ratio.js', contrastChecker)

// 运行检查
execSync('node scripts/check-contrast-ratio.js', { stdio: 'inherit' })

console.log('\n💡 建议：')
console.log('1. 确保所有文本对比度至少达到 4.5:1 (AA 标准)')
console.log('2. 重要内容应达到 7:1 (AAA 标准)')
console.log('3. 大文本可适当降低要求')
```

---

## SEO 优化策略

### 1. 动态 Sitemap 生成

创建 `app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import { siteMetadata } from '@/data/siteMetadata'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl

  // 获取所有博客文章
  const blogUrls = allBlogs.map((post) => ({
    url: `${siteUrl}/blog/${post.path}`,
    lastModified: post.lastmod || post.date,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // 获取所有标签页
  const tags = [...new Set(allBlogs.flatMap((post) => post.tags))]
  const tagUrls = tags.map((tag) => ({
    url: `${siteUrl}/tags/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // 主要页面
  const staticUrls = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  return [...staticUrls, ...blogUrls, ...tagUrls]
}
```

### 2. 结构化数据

创建 `components/seo/StructuredData.tsx`:

```tsx
interface StructuredDataProps {
  type: 'Article' | 'Blog' | 'WebPage' | 'Person' | 'Organization'
  data: Record<string, any>
}

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    }

    // 根据类型添加特定字段
    switch (type) {
      case 'Article':
      case 'Blog':
        return {
          ...baseData,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url,
          },
          author: {
            '@type': 'Person',
            name: data.author,
            url: data.authorUrl,
          },
          publisher: {
            '@type': 'Organization',
            name: data.publisher,
            logo: {
              '@type': 'ImageObject',
              url: data.logoUrl,
            },
          },
        }

      case 'Person':
        return {
          ...baseData,
          url: data.url,
          jobTitle: data.jobTitle,
          worksFor: {
            '@type': 'Organization',
            name: data.company,
          },
          sameAs: data.socialLinks,
        }

      default:
        return baseData
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  )
}
```

### 3. Open Graph 优化

创建 `lib/seo.ts`:

```typescript
import { siteMetadata } from '@/data/siteMetadata'

export interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
}

export const generateSEOMetadata = ({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  tags,
}: SEOProps) => {
  const metaTitle = title ? `${title} | ${siteMetadata.title}` : siteMetadata.title

  const metaDescription = description || siteMetadata.description
  const metaImage = image || siteMetadata.socialBanner
  const metaUrl = url || siteMetadata.siteUrl

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: metaUrl,
      siteName: siteMetadata.title,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      locale: 'zh_CN',
      type,
      publishedTime,
      modifiedTime,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
    },
    alternates: {
      canonical: metaUrl,
      types: {
        'application/rss+xml': [
          {
            title: 'RSS',
            url: `${siteMetadata.siteUrl}/feed.xml`,
          },
        ],
      },
    },
  }
}
```

---

## 测试体系建设

### 1. 配置测试环境

更新 `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 2. 创建测试用例

创建 `tests/components/Button.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'
import { vi } from 'vitest'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('正在加载，请稍候')).toBeInTheDocument()
  })

  it('is accessible', () => {
    render(<Button>Accessible button</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('aria-disabled', 'false')
    expect(button).toHaveAttribute('type', 'button')
  })
})
```

### 3. E2E 测试配置

安装 Playwright：

```bash
pnpm add -D @playwright/test
```

创建 `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 监控和分析

### 1. 性能监控

创建 `lib/analytics.ts`:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function reportWebVitals() {
  getCLS(console.log)
  getFID(console.log)
  getFCP(console.log)
  getLCP(console.log)
  getTTFB(console.log)

  // 发送到分析服务
  getCLS((metric) => {
    // gtag('event', metric.name, { value: metric.value });
  })
}

// 性能指标收集
export const collectPerformanceMetrics = () => {
  if (typeof window === 'undefined') return

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  const metrics = {
    // DNS 查询时间
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP 连接时间
    tcp: navigation.connectEnd - navigation.connectStart,
    // 请求响应时间
    request: navigation.responseEnd - navigation.requestStart,
    // DOM 解析时间
    domParse: navigation.domContentLoadedEventEnd - navigation.domLoading,
    // 页面加载完成时间
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    // 首字节时间
    ttfb: navigation.responseStart - navigation.requestStart,
  }

  return metrics
}
```

### 2. 错误监控集成

创建 `lib/error-monitoring.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

export const initErrorMonitoring = () => {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    beforeSend(event) {
      // 过滤敏感信息
      if (event.exception) {
        const error = event.exception.values?.[0]
        if (error?.value?.includes('password')) {
          return null
        }
      }
      return event
    },
  })
}

export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error(error)
  Sentry.captureException(error, { extra: context })
}

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level)
}
```

---

## 长期发展计划

### 1. 微前端架构考虑

创建 `docs/microfrontend-architecture.md`:

```markdown
# 微前端架构规划

## 目标

将当前单体应用拆分为可独立部署的微前端模块

## 模块划分

1. **Core Module** - 核心功能和路由
2. **Blog Module** - 博客相关功能
3. **Music Module** - 音乐播放器功能
4. **3D Module** - Three.js 3D 可视化
5. **Analytics Module** - 数据统计功能

## 技术选型

- Module Federation (Webpack 5)
- Single-SPA 或 qiankun
- 独立的 CI/CD 流水线

## 实施步骤

1. 分析依赖关系
2. 设计模块边界
3. 实施模块化拆分
4. 建立共享组件库
5. 配置独立部署
```

### 2. AI 功能集成规划

创建 `docs/ai-features.md`:

```markdown
# AI 功能集成计划

## Phase 1: 内容推荐

- 基于阅读历史的文章推荐
- 相关内容自动关联
- 个性化内容排序

## Phase 2: 智能搜索

- 自然语言搜索
- 语义搜索
- 搜索结果优化

## Phase 3: 内容生成

- AI 辅助写作
- 自动摘要生成
- 标签自动提取

## 技术实现

- OpenAI API 集成
- 向量数据库 (Pinecone/Weaviate)
- 机器学习模型部署
```

---

## 实施时间表

### Week 1-2: 紧急修复

- [ ] 更新所有安全依赖
- [ ] 修复关键性能问题
- [ ] 实施基础的错误处理

### Week 3-4: 性能优化

- [ ] Bundle 分割和优化
- [ ] 图片和资源优化
- [ ] 缓存策略实施

### Month 2: 用户体验提升

- [ ] 动画系统优化
- [ ] 响应式设计改进
- [ ] 加载状态优化

### Month 3: 可访问性和 SEO

- [ ] ARIA 标签完善
- [ ] 键盘导航优化
- [ ] SEO 策略实施

### Month 4-6: 测试和监控

- [ ] 测试体系建立
- [ ] 监控系统部署
- [ ] 性能持续优化

### Month 7+: 高级功能

- [ ] PWA 功能完善
- [ ] AI 功能集成
- [ ] 微前端架构迁移

---

## 资源链接

### 工具和服务

- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Sentry](https://sentry.io/)
- [Playwright](https://playwright.dev/)

### 学习资源

- [Next.js Performance Guide](https://nextjs.org/docs/going-to-production)
- [Web Performance Checklist](https://web.dev/performance-checklist/)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [SEO Best Practices](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

---

## 总结

这份改进手册提供了一个全面的优化路线图，从紧急修复到长期战略规划。建议按照优先级逐步实施，每次改动后进行充分测试和监控。记住，优化是一个持续的过程，需要定期评估和调整。

通过遵循这个手册，您的博客网站将逐步达到世界顶级网站的标准，为用户提供卓越的体验。
